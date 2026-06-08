import base64
import cv2
import numpy as np
import torch


# HEALTHY CLASSES — NO HEATMAP GENERATED FOR THESE

HEALTHY_CLASSES = {
    "apple leaf healthy",
    "bellpepper leaf healthy",
    "cherry leaf",
    "corn leaf",
    "grape leaf healthy",
    "peach leaf",
    "soyabean leaf",
    "strawberry leaf",
    "tomato leaf healthy",
    "blueberry leaf",
}


class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None

        self.forward_hook = target_layer.register_forward_hook(self.save_activations)
        self.backward_hook = target_layer.register_full_backward_hook(self.save_gradients)

    def save_activations(self, module, input, output):
        self.activations = output.detach()

    def save_gradients(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate(self, input_tensor, class_idx=None):
        self.model.zero_grad()

        output = self.model(input_tensor)

        if class_idx is None:
            class_idx = torch.argmax(output, dim=1).item()

        score = output[:, class_idx]
        score.backward()

        gradients = self.gradients[0]
        activations = self.activations[0]

        #  Handle both (C, H, W) and (H, W, C) layouts 
        # ConvNeXt uses NHWC internally; EfficientNet uses NCHW.
        # Detect layout: if C >> H and C >> W, then it is (C, H, W).
        if activations.ndim == 3:
            # Could be (C, H, W) or (H, W, C)
            if activations.shape[0] > activations.shape[1] and activations.shape[0] > activations.shape[2]:
                # (C, H, W)  — standard layout
                weights = torch.mean(gradients, dim=(1, 2))
                cam = torch.zeros(activations.shape[1:], dtype=torch.float32)
                for i, w in enumerate(weights):
                    cam += w * activations[i]
            else:
                # (H, W, C)  — ConvNeXt NHWC layout
                weights = torch.mean(gradients, dim=(0, 1))
                cam = torch.zeros(activations.shape[:2], dtype=torch.float32)
                for i, w in enumerate(weights):
                    cam += w * activations[:, :, i]
        else:
            # Flat token layout — reshape heuristically to square
            c = activations.shape[0]
            side = int(c ** 0.5)
            activations = activations[:side * side].reshape(side, side)
            gradients_flat = gradients[:side * side].reshape(side, side)
            cam = gradients_flat * activations

        cam = torch.relu(cam)
        cam -= cam.min()
        if cam.max() != 0:
            cam /= cam.max()

        return cam.cpu().numpy()

    def remove_hooks(self):
        self.forward_hook.remove()
        self.backward_hook.remove()


def overlay_heatmap_on_image(image_bgr, heatmap, alpha=0.6):
    """
    Resize heatmap to match image, apply percentile clipping to remove background noise,
    and blend using the heatmap intensity as the alpha mask so the background is unaffected.
    """
    heatmap_resized = cv2.resize(heatmap, (image_bgr.shape[1], image_bgr.shape[0]), interpolation=cv2.INTER_CUBIC)
    
    # Mild Gaussian smoothing
    heatmap_resized = cv2.GaussianBlur(heatmap_resized, (0, 0), sigmaX=8)
    
    # Percentile clipping (ignore bottom 60% of activations to remove background noise)
    p = np.percentile(heatmap_resized, 60)
    heatmap_resized[heatmap_resized < p] = p
    
    # Re-normalise to [0, 1]
    h_min, h_max = heatmap_resized.min(), heatmap_resized.max()
    if h_max > h_min:
        heatmap_resized = (heatmap_resized - h_min) / (h_max - h_min)
    else:
        heatmap_resized = np.zeros_like(heatmap_resized)
        
    heatmap_color = cv2.applyColorMap(np.uint8(255 * heatmap_resized), cv2.COLORMAP_JET)
    
    # Create per-pixel alpha mask based on heatmap intensity
    alpha_mask = heatmap_resized[:, :, np.newaxis] * alpha
    
    # Blend: background preserved where alpha_mask is 0
    overlay = image_bgr * (1 - alpha_mask) + heatmap_color * alpha_mask
    return np.uint8(np.clip(overlay, 0, 255))


def image_to_base64(img_bgr):
    """Encode a BGR numpy image to a base64 JPEG string."""
    success, buffer = cv2.imencode(".jpg", img_bgr)
    if not success:
        raise ValueError("Could not encode image to base64")
    return base64.b64encode(buffer).decode("utf-8")


def generate_gradcam(model, image, pred_idx, class_name, output_dir):
    """
    Generate a Grad-CAM heatmap overlay for the given prediction.

    For HEALTHY classes the original resized image is returned unchanged
    (no heatmap is drawn), matching the original algorithm's behaviour of
    only highlighting genuinely diseased tissue.

    Parameters
    ----------
    model       : ConvNeXtTinyClassifier (eval mode)
    image       : PIL.Image  (RGB)
    pred_idx    : int        predicted class index
    class_name  : str        human-readable class name
    output_dir  : str        directory to save latest_gradcam.jpg

    Returns
    -------
    output_path : str  path to the saved overlay image
    """
    import os
    from torchvision import transforms

    os.makedirs(output_dir, exist_ok=True)

    #  Input tensor 
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])
    input_tensor = transform(image).unsqueeze(0)

    #  Base image for overlay (224×224) 
    image_np = np.array(image.resize((224, 224)))
    image_bgr = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)

    output_path = os.path.join(output_dir, "latest_gradcam.jpg")

    #  Skip heatmap for healthy leaves 
    if class_name.lower() in HEALTHY_CLASSES:
        cv2.imwrite(output_path, image_bgr)
        return output_path

    #  Grad-CAM on last ConvNeXt stage 
    target_layer = model.backbone.stages[-1]

    gradcam = GradCAM(model, target_layer)
    cam = gradcam.generate(input_tensor, class_idx=pred_idx)
    gradcam.remove_hooks()

    cam = np.array(cam, dtype=np.float32)
    if cam.ndim == 3:
        cam = cam.squeeze()
    cam = cam - cam.min()
    if cam.max() > 0:
        cam = cam / cam.max()

    overlay = overlay_heatmap_on_image(image_bgr, cam, alpha=0.45)
    cv2.imwrite(output_path, overlay)

    return output_path
