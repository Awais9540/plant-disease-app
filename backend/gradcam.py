import base64
import os

import cv2
import numpy as np
import torch
import torch.nn.functional as F


# ── HEALTHY CLASSES — no heatmap generated for these ──────────────────────────
# (unchanged from your original — same set)

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


# ── GRAD-CAM ───────────────────────────────────────────────────────────────────
# Hooks into backbone.stages[-1] (ConvNeXt-Tiny stage 3: 768ch, 7×7 spatial).
#
# Key fixes vs. your previous version:
#   1. ConvNeXt-Tiny in timm outputs (B, H, W, C) from each stage — NHWC not NCHW.
#      The old heuristic (C > H and C > W) fails at 7×7 because 768 > 7 is always
#      true, so it ALWAYS went into the NCHW branch and averaged over the wrong dims.
#      Fix: always treat stage output as (H, W, C) and pool over spatial dims (0,1).
#
#   2. Two-stage upscale: 7×7 → 14×14 → 224×224 (bilinear both steps).
#      Single-step 7→224 causes blocky artifacts; the intermediate step smooths them.
#
#   3. Percentile clipping changed from p60 → p40. Your p60 was zeroing out too much
#      of the map and collapsing the spread to a small dot.

class GradCAM:
    def __init__(self, model, target_layer):
        self.model       = model
        self.target_layer = target_layer
        self._activations = None
        self._gradients   = None

        self._fwd_hook = target_layer.register_forward_hook(self._save_activations)
        self._bwd_hook = target_layer.register_full_backward_hook(self._save_gradients)

    def _save_activations(self, module, input, output):
        # timm ConvNeXt stage output: (B, H, W, C) = (1, 7, 7, 768)
        self._activations = output.detach()

    def _save_gradients(self, module, grad_input, grad_output):
        self._gradients = grad_output[0].detach()

    def generate(self, input_tensor, class_idx=None):
        self.model.zero_grad()
        logits = self.model(input_tensor)

        if class_idx is None:
            class_idx = torch.argmax(logits, dim=1).item()

        # Backprop on the target class score only
        one_hot = torch.zeros_like(logits)
        one_hot[0, class_idx] = 1.0
        logits.backward(gradient=one_hot)

        # activations / gradients: (B, H, W, C) → remove batch → (H, W, C)
        acts  = self._activations[0]   # (7, 7, 768)
        grads = self._gradients[0]     # (7, 7, 768)

        # Global-average-pool gradients over spatial dims → channel weights (768,)
        weights = grads.mean(dim=(0, 1))   # (768,)

        # Weighted sum of activation channels → (7, 7)
        cam = (weights * acts).sum(dim=-1)  # (7, 7)
        cam = F.relu(cam)

        # ── Two-stage upscale: 7×7 → 14×14 → 224×224 ────────────────────────
        cam_4d = cam.unsqueeze(0).unsqueeze(0)          # (1,1,7,7)
        cam_14 = F.interpolate(cam_4d, size=(14, 14),
                               mode='bilinear', align_corners=False)
        cam_224 = F.interpolate(cam_14, size=(224, 224),
                                mode='bilinear', align_corners=False)
        cam_np = cam_224.squeeze().cpu().numpy()        # (224,224)

        # Normalize to [0, 1]
        c_min, c_max = cam_np.min(), cam_np.max()
        if c_max > c_min:
            cam_np = (cam_np - c_min) / (c_max - c_min)
        else:
            cam_np = np.zeros_like(cam_np)

        return cam_np   # float32, shape (224,224), range [0,1]

    def remove_hooks(self):
        self._fwd_hook.remove()
        self._bwd_hook.remove()


# ── OVERLAY ────────────────────────────────────────────────────────────────────
# Changes vs. your original:
#   • Percentile clip: p60 → p40  (keeps more of the activation spread)
#   • sigmaX: 8 → 6               (slightly sharper edges)
#   • alpha:  kept as passed in   (caller controls blend strength)

def overlay_heatmap_on_image(image_bgr, heatmap, alpha=0.55):
    """
    Blend a float32 [0,1] heatmap onto a BGR image (both 224×224).
    Returns uint8 BGR overlay.
    """
    hm = heatmap.copy().astype(np.float32)

    # Mild smoothing to remove bilinear interpolation grid artifacts
    hm = cv2.GaussianBlur(hm, (0, 0), sigmaX=6)

    # Percentile clip — p40 keeps the top 60% of activations visible
    # (was p60, which kept only top 40% and collapsed the map to a dot)
    p = np.percentile(hm, 40)
    hm[hm < p] = p

    # Re-normalize after clip
    h_min, h_max = hm.min(), hm.max()
    if h_max > h_min:
        hm = (hm - h_min) / (h_max - h_min)
    else:
        hm = np.zeros_like(hm)

    heatmap_color = cv2.applyColorMap(np.uint8(255 * hm), cv2.COLORMAP_JET)

    # Per-pixel alpha mask: background untouched where activation is zero
    alpha_mask = hm[:, :, np.newaxis] * alpha
    overlay = image_bgr * (1 - alpha_mask) + heatmap_color * alpha_mask
    return np.uint8(np.clip(overlay, 0, 255))


# ── SEVERITY % ─────────────────────────────────────────────────────────────────
# New feature: converts the heatmap into a clinical severity score.
# Three components:
#   1. Lesion area  (60%) — fraction of pixels above detection threshold
#   2. Spatial spread (25%) — entropy: concentrated = early, distributed = advanced
#   3. Peak intensity (15%) — how active the worst region is

def compute_severity(cam_224, confidence, pred_class):
    """
    cam_224    : float32 (224,224) range [0,1]  — raw Grad-CAM before overlay
    confidence : float  0–100
    pred_class : str    class name

    Returns dict with severity_pct (0–100) and sub-scores.
    """
    if pred_class.lower() in HEALTHY_CLASSES:
        return {
            "severity_pct":    0.0,
            "severity_label":  "Healthy",
            "severity_color":  "#22C55E",
            "lesion_area_pct": 0.0,
            "spatial_spread":  0.0,
            "peak_intensity":  0.0,
        }

    threshold = 0.25   # pixels above this count as diseased

    # Component 1: lesion area
    lesion_area_pct = float((cam_224 > threshold).sum() / cam_224.size * 100)

    # Component 2: spatial spread via entropy
    flat = cam_224.flatten()
    flat = flat / (flat.sum() + 1e-8)
    entropy = float(-np.sum(flat * np.log(flat + 1e-8)))
    spatial_spread = float(entropy / np.log(flat.size))   # normalized 0→1

    # Component 3: peak intensity in diseased region
    mask = cam_224 > threshold
    peak_intensity = float(cam_224[mask].max()) if mask.any() else 0.0

    # Composite (weights: 60 / 25 / 15)
    area_score   = min(lesion_area_pct / 60.0, 1.0) * 100 * 0.60
    spread_score = spatial_spread * 100 * 0.25
    peak_score   = peak_intensity * 100 * 0.15
    raw = area_score + spread_score + peak_score

    # Temper by model confidence
    conf_weight  = min(confidence / 80.0, 1.0)
    severity_pct = float(np.clip(raw * conf_weight, 0, 95))

    # Label + color
    if severity_pct < 20:
        label, color = "Mild",     "#84CC16"
    elif severity_pct < 45:
        label, color = "Moderate", "#F59E0B"
    elif severity_pct < 70:
        label, color = "Severe",   "#EF4444"
    else:
        label, color = "Critical", "#7C3AED"

    return {
        "severity_pct":    round(severity_pct, 1),
        "severity_label":  label,
        "severity_color":  color,
        "lesion_area_pct": round(lesion_area_pct, 1),
        "spatial_spread":  round(spatial_spread, 3),
        "peak_intensity":  round(peak_intensity, 3),
    }


# ── UTILITIES ──────────────────────────────────────────────────────────────────

def image_to_base64(img_bgr):
    """Encode a BGR numpy image to a base64 JPEG string."""
    success, buffer = cv2.imencode(".jpg", img_bgr)
    if not success:
        raise ValueError("Could not encode image to base64")
    return base64.b64encode(buffer).decode("utf-8")


def generate_gradcam(model, image, pred_idx, class_name, output_dir):
    """
    Compatibility wrapper — same signature as your original function.
    Used if anything calls generate_gradcam() directly.

    Parameters
    ----------
    model      : ConvNeXtTinyClassifier (eval mode)
    image      : PIL.Image (RGB)
    pred_idx   : int   predicted class index
    class_name : str   human-readable class name
    output_dir : str   directory to save latest_gradcam.jpg

    Returns
    -------
    output_path : str  path to saved overlay image
    """
    from torchvision import transforms

    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "latest_gradcam.jpg")

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])
    input_tensor = transform(image).unsqueeze(0)
    image_bgr    = cv2.cvtColor(np.array(image.resize((224, 224))),
                                cv2.COLOR_RGB2BGR)

    if class_name.lower() in HEALTHY_CLASSES:
        cv2.imwrite(output_path, image_bgr)
        return output_path

    gc  = GradCAM(model, model.backbone.stages[-1])
    cam = gc.generate(input_tensor, class_idx=pred_idx)
    gc.remove_hooks()

    overlay = overlay_heatmap_on_image(image_bgr, cam, alpha=0.55)
    cv2.imwrite(output_path, overlay)
    return output_path
