import os
import base64
import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import timm
from torchvision import transforms

from gradcam import GradCAM, HEALTHY_CLASSES, overlay_heatmap_on_image, image_to_base64


# =========================================================
# CLASS ORDER — must match training order exactly (29 classes)
# =========================================================

CLASS_NAMES = [
    "Grape leaf black rot",         # 0
    "Tomato leaf mosaic virus",     # 1
    "Tomato leaf yellow virus",     # 2
    "apple leaf healthy",           # 3
    "apple leaf rust",              # 4
    "apple leaf scab",              # 5
    "bell pepper leaf spot",        # 6
    "bellpepper leaf healthy",      # 7
    "blueberry leaf",               # 8
    "cherry leaf",                  # 9
    "corn gray leaf spot",          # 10
    "corn leaf",                    # 11
    "corn leaf blight",             # 12
    "corn leaf rust",               # 13
    "grape leaf healthy",           # 14
    "peach leaf",                   # 15
    "potato leaf early blight",     # 16
    "potato leaf late blight",      # 17
    "potato leafroll virus",        # 18
    "soyabean leaf",                # 19
    "squash powedry milddew leaf",  # 20
    "strawberry leaf",              # 21
    "tomato leaf bacterial spot",   # 22
    "tomato leaf early blight",     # 23
    "tomato leaf healthy",          # 24
    "tomato leaf late blight",      # 25
    "tomato leaf mold",             # 26
    "tomato leaf powdery mildew",   # 27
    "tomato septoria leaf spot",    # 28
]

# =========================================================
# TREATMENT MAP (quick single-line summary per class)
# =========================================================

TREATMENT_MAP = {
    "Grape leaf black rot":         "Remove infected leaves and fruit, improve airflow, and apply a copper or mancozeb fungicide.",
    "Tomato leaf mosaic virus":     "Remove infected plants, disinfect tools, and control aphid/thrip vectors.",
    "Tomato leaf yellow virus":     "Remove infected plants immediately and control whitefly vectors with insecticide.",
    "apple leaf healthy":           "Leaf appears healthy. Continue regular care and preventive monitoring.",
    "apple leaf rust":              "Remove infected leaves, improve airflow, and apply a registered fungicide at bud break.",
    "apple leaf scab":              "Prune affected areas, improve ventilation, and apply recommended fungicide.",
    "bell pepper leaf spot":        "Remove infected leaves, avoid leaf wetness, and use a copper-based bactericide or fungicide.",
    "bellpepper leaf healthy":      "Leaf appears healthy. Maintain proper watering, nutrition, and routine monitoring.",
    "blueberry leaf":               "Leaf appears healthy. Maintain soil pH, drainage, and regular inspection.",
    "cherry leaf":                  "Leaf appears healthy. Prune for airflow and monitor for early disease signs.",
    "corn gray leaf spot":          "Use crop rotation, resistant hybrids, and fungicide under high disease pressure.",
    "corn leaf":                    "Leaf appears healthy. Continue proper crop care and regular observation.",
    "corn leaf blight":             "Remove infected debris, rotate crops, and apply a suitable fungicide if necessary.",
    "corn leaf rust":               "Monitor closely, use resistant varieties, and spray fungicide in severe cases.",
    "grape leaf healthy":           "Leaf appears healthy. Maintain vineyard hygiene and disease prevention.",
    "peach leaf":                   "Leaf appears healthy. Prune for open canopy and monitor for early symptoms.",
    "potato leaf early blight":     "Apply chlorothalonil or mancozeb fungicide and remove infected lower leaves.",
    "potato leaf late blight":      "Apply systemic fungicide immediately, remove infected plants, and destroy crop debris.",
    "potato leafroll virus":        "Remove infected plants, control aphid vectors, and use certified seed tubers.",
    "soyabean leaf":                "Leaf appears healthy. Rotate with non-legume crops and scout regularly.",
    "squash powedry milddew leaf":  "Apply sulfur or potassium bicarbonate, remove infected leaves, and improve airflow.",
    "strawberry leaf":              "Leaf appears healthy. Ensure good drainage and replace runners every 2–3 years.",
    "tomato leaf bacterial spot":   "Remove infected foliage, avoid leaf wetness, and apply copper-based spray.",
    "tomato leaf early blight":     "Remove affected leaves, mulch the soil, and apply fungicide to control spread.",
    "tomato leaf healthy":          "Leaf appears healthy. Continue proper irrigation, nutrition, and preventive care.",
    "tomato leaf late blight":      "Remove infected plants immediately and apply recommended systemic fungicide.",
    "tomato leaf mold":             "Reduce humidity, improve ventilation, and apply a suitable fungicide.",
    "tomato leaf powdery mildew":   "Remove infected leaves, improve airflow, and apply sulfur or recommended treatment.",
    "tomato septoria leaf spot":    "Prune infected leaves, improve airflow, and apply fungicide if disease spreads.",
}


# =========================================================
# MODEL — ConvNeXtTinyClassifier
# =========================================================

class ConvNeXtTinyClassifier(nn.Module):
    """
    Mirrors the architecture trained in the ConvNeXt-Tiny notebook.
    Head: LayerNorm → Dropout → Linear(768→512) → GELU →
          LayerNorm → Dropout → Linear(512→num_classes)
    """
    def __init__(self, num_classes: int = 29, dropout: float = 0.35):
        super().__init__()
        self.backbone = timm.create_model(
            "convnext_tiny",
            pretrained=False,
            num_classes=0,
            global_pool="avg",
            drop_path_rate=0.15,
        )
        feat = self.backbone.num_features  # 768

        self.head = nn.Sequential(
            nn.LayerNorm(feat),           # head.0
            nn.Dropout(p=dropout),        # head.1
            nn.Linear(feat, 512),         # head.2
            nn.GELU(),                    # head.3
            nn.LayerNorm(512),            # head.4
            nn.Dropout(p=dropout / 2),    # head.5
            nn.Linear(512, num_classes),  # head.6
        )

    def forward(self, x):
        return self.head(self.backbone(x))


# =========================================================
# PREDICTOR
# =========================================================

class PlantDiseasePredictor:
    def __init__(self, model_path: str):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # ── Load model ────────────────────────────────────────────────────
        raw = torch.load(model_path, map_location=self.device)
        if isinstance(raw, dict):
            if "model_state_dict" in raw:
                state_dict = raw["model_state_dict"]
            elif "state_dict" in raw:
                state_dict = raw["state_dict"]
            else:
                state_dict = raw
        else:
            state_dict = raw

        state_dict = {
            (k[len("module."):] if k.startswith("module.") else k): v
            for k, v in state_dict.items()
        }

        num_classes = state_dict["head.6.weight"].shape[0]  # 29

        self.model = ConvNeXtTinyClassifier(num_classes=num_classes, dropout=0.35)
        self.model.load_state_dict(state_dict, strict=True)
        self.model.to(self.device)
        self.model.eval()

        # ── Transform — 224×224 (ConvNeXt canonical) ─────────────────────
        self.transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ])

        # ── Grad-CAM target: last ConvNeXt stage ──────────────────────────
        self.target_layer = self.model.backbone.stages[-1]

        self.output_dir = "outputs"
        os.makedirs(self.output_dir, exist_ok=True)

    def predict(self, image_bytes: bytes) -> dict:
        # ── Decode image ──────────────────────────────────────────────────
        np_arr  = np.frombuffer(image_bytes, np.uint8)
        img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError("Invalid image — could not decode.")

        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        input_tensor = self.transform(img_rgb).unsqueeze(0).to(self.device)

        # ── Inference ─────────────────────────────────────────────────────
        with torch.no_grad():
            outputs = self.model(input_tensor)
            probs   = F.softmax(outputs, dim=1)

        pred_idx   = torch.argmax(probs, dim=1).item()
        confidence = probs[0][pred_idx].item() * 100
        disease    = CLASS_NAMES[pred_idx]
        is_healthy = disease.lower() in HEALTHY_CLASSES

        # ── Grad-CAM ──────────────────────────────────────────────────────
        img_bgr_224  = cv2.resize(img_bgr, (224, 224))
        latest_path  = os.path.join(self.output_dir, "latest_gradcam.jpg")

        if is_healthy:
            # No heatmap for healthy classes — save the plain image
            cv2.imwrite(latest_path, img_bgr_224)
            gradcam_b64 = image_to_base64(img_bgr_224)
        else:
            gradcam_obj = GradCAM(self.model, self.target_layer)
            cam         = gradcam_obj.generate(input_tensor, class_idx=pred_idx)
            gradcam_obj.remove_hooks()

            cam = np.array(cam, dtype=np.float32)
            if cam.ndim == 3:
                cam = cam.squeeze()

            overlay     = overlay_heatmap_on_image(img_bgr_224, cam, alpha=0.6)
            cv2.imwrite(latest_path, overlay)
            gradcam_b64 = image_to_base64(overlay)

        return {
            "disease":       disease,
            "confidence":    round(float(confidence), 2),
            "gradcam_image": gradcam_b64,
            "treatment":     TREATMENT_MAP.get(disease, "Consult an agriculture expert."),
            "is_healthy":    is_healthy,
        }
