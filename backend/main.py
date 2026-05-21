import os
import io
import base64
import json
import time
import urllib.request
from typing import Dict, List

import cv2
import numpy as np
import torch
import torch.nn as nn
import timm
from PIL import Image
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from torchvision import transforms
from pydantic import BaseModel

from gradcam import GradCAM, HEALTHY_CLASSES, overlay_heatmap_on_image

app = FastAPI(title="LeafDoc API — ConvNeXt-Tiny")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "best_convnext_tiny.pth")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# =========================================================
# CLASS ORDER — must match training order exactly
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
# DISEASE INFO  (29 entries, keyed by lowercase class name)
# =========================================================

DISEASE_INFO: Dict[str, Dict[str, List[str]]] = {

    "grape leaf black rot": {
        "description": "Black rot creates dark circular spots on grape leaves and can spread rapidly to fruit.",
        "treatment": ["Apply copper-based or mancozeb fungicide.", "Remove and destroy infected leaves and mummified fruit.", "Prune infected canes during dormancy."],
        "prevention": ["Improve canopy airflow through regular pruning.", "Collect and dispose of fallen leaves.", "Avoid excess nitrogen fertilisation."],
        "learn_more": ["Black rot is caused by the fungus Guignardia bidwellii and thrives in warm, wet conditions."]
    },

    "tomato leaf mosaic virus": {
        "description": "Tomato mosaic virus causes mottled light and dark green patches on leaves, leaf distortion, and stunted growth.",
        "treatment": ["No chemical cure exists; remove and destroy infected plants.", "Disinfect tools with 10% bleach solution.", "Control thrips and aphid vectors."],
        "prevention": ["Use certified virus-free seed.", "Wash hands before handling plants.", "Control insect vectors with appropriate measures."],
        "learn_more": ["The virus spreads through mechanical contact and sap; avoid working with wet plants."]
    },

    "tomato leaf yellow virus": {
        "description": "Tomato yellow leaf curl virus causes severe leaf curling, yellowing, and drastic yield loss.",
        "treatment": ["Remove and destroy infected plants immediately.", "Apply insecticide to control whitefly vectors.", "There is no direct antiviral treatment."],
        "prevention": ["Use TYLCV-resistant varieties.", "Install insect-proof nets in nurseries.", "Control whitefly populations early in the season."],
        "learn_more": ["The virus is transmitted exclusively by the silverleaf whitefly Bemisia tabaci."]
    },

    "apple leaf healthy": {
        "description": "Apple leaf appears healthy with no visible disease symptoms.",
        "treatment": ["No treatment required."],
        "prevention": ["Maintain balanced nutrition.", "Inspect trees regularly.", "Remove weak or damaged growth."],
        "learn_more": ["Healthy leaves improve photosynthesis and support strong fruit development."]
    },

    "apple leaf rust": {
        "description": "Apple rust produces bright orange or yellow spots on upper leaf surfaces and tube-like structures beneath.",
        "treatment": ["Apply myclobutanil or another registered fungicide at bud break.", "Remove and destroy infected leaves.", "Improve airflow around branches."],
        "prevention": ["Avoid planting near juniper hosts.", "Prune crowded branches.", "Keep orchard floor clear of debris."],
        "learn_more": ["Apple rust requires two hosts — apple and juniper — to complete its life cycle."]
    },

    "apple leaf scab": {
        "description": "Apple scab causes olive-brown velvety spots on leaves and fruit, leading to premature leaf drop.",
        "treatment": ["Apply protectant or systemic fungicide starting at green tip.", "Remove and destroy fallen leaves.", "Prune for better airflow."],
        "prevention": ["Use scab-resistant varieties.", "Avoid overhead irrigation.", "Clean up fallen leaves each autumn."],
        "learn_more": ["Apple scab is caused by Venturia inaequalis and favoured by cool, wet spring conditions."]
    },

    "bell pepper leaf spot": {
        "description": "Bell pepper leaf spot causes small dark water-soaked lesions that enlarge and cause defoliation.",
        "treatment": ["Apply copper-based bactericide or fungicide.", "Remove and dispose of infected leaves.", "Avoid working in the garden when foliage is wet."],
        "prevention": ["Use disease-free certified seeds.", "Avoid overhead watering.", "Sanitise tools between plants."],
        "learn_more": ["The disease spreads fastest under warm, humid conditions with frequent rainfall."]
    },

    "bellpepper leaf healthy": {
        "description": "Bell pepper leaf appears healthy with no disease symptoms.",
        "treatment": ["No treatment required."],
        "prevention": ["Water at soil level.", "Inspect leaves weekly.", "Avoid plant stress through balanced fertilisation."],
        "learn_more": ["Healthy pepper foliage supports consistent fruit set and size."]
    },

    "blueberry leaf": {
        "description": "Blueberry leaf appears healthy and free of visible disease.",
        "treatment": ["No treatment required."],
        "prevention": ["Maintain soil pH between 4.5 and 5.5.", "Avoid waterlogging.", "Inspect bushes regularly."],
        "learn_more": ["Healthy blueberry leaves support high fruit yield and quality."]
    },

    "cherry leaf": {
        "description": "Cherry leaf appears healthy with no visible disease symptoms.",
        "treatment": ["No treatment required."],
        "prevention": ["Prune for airflow.", "Remove fallen leaves.", "Monitor for early signs of fungal infection."],
        "learn_more": ["Healthy cherry leaves are critical for fruit development and winter storage preparation."]
    },

    "corn gray leaf spot": {
        "description": "Corn gray leaf spot causes rectangular tan to gray lesions that run parallel to leaf veins.",
        "treatment": ["Apply triazole or strobilurin fungicide when conditions favour disease.", "Remove and bury infected crop residue.", "Improve field ventilation."],
        "prevention": ["Plant resistant hybrids.", "Practice crop rotation.", "Avoid dense planting."],
        "learn_more": ["The pathogen survives in crop debris and spreads through windborne conidia."]
    },

    "corn leaf": {
        "description": "Corn leaf appears healthy with no visible disease.",
        "treatment": ["No treatment required."],
        "prevention": ["Monitor weekly.", "Maintain balanced fertilisation.", "Keep the field free of debris."],
        "learn_more": ["Healthy corn canopy maximises photosynthesis and supports grain fill."]
    },

    "corn leaf blight": {
        "description": "Northern corn leaf blight produces long elliptical grey-green lesions that turn tan as they mature.",
        "treatment": ["Apply registered fungicide at early tasselling if infection is severe.", "Remove infected plant debris after harvest.", "Improve inter-row airflow."],
        "prevention": ["Use resistant hybrids.", "Rotate crops annually.", "Avoid late-season nitrogen excess."],
        "learn_more": ["Blight spreads rapidly in warm, humid weather and can cut yield significantly."]
    },

    "corn leaf rust": {
        "description": "Common corn rust creates small, circular to oval, brick-red pustules scattered across both leaf surfaces.",
        "treatment": ["Apply fungicide (e.g. propiconazole) when rust is detected early.", "Remove heavily infected leaves where practical."],
        "prevention": ["Plant rust-resistant varieties.", "Monitor during humid, moderately cool weather.", "Avoid late-season plant stress."],
        "learn_more": ["Rust spores are wind-dispersed and can travel long distances between fields."]
    },

    "grape leaf healthy": {
        "description": "Grape leaf appears healthy with no signs of disease.",
        "treatment": ["No treatment required."],
        "prevention": ["Maintain vineyard hygiene.", "Prune properly for airflow.", "Monitor leaves weekly."],
        "learn_more": ["Healthy grape leaves drive sugar production essential for fruit ripening."]
    },

    "peach leaf": {
        "description": "Peach leaf appears healthy with no visible disease symptoms.",
        "treatment": ["No treatment required."],
        "prevention": ["Prune for open canopy.", "Rake and dispose of fallen leaves.", "Monitor for early blight or curl symptoms."],
        "learn_more": ["Healthy peach foliage supports strong fruit development and disease resistance."]
    },

    "potato leaf early blight": {
        "description": "Potato early blight produces brown concentric ring spots on older leaves, reducing photosynthetic area.",
        "treatment": ["Apply chlorothalonil or mancozeb fungicide.", "Remove and destroy infected lower leaves.", "Avoid overhead irrigation."],
        "prevention": ["Use certified seed tubers.", "Rotate crops every 3 years.", "Mulch to reduce soil splash."],
        "learn_more": ["Early blight is caused by Alternaria solani and usually begins on the oldest leaves."]
    },

    "potato leaf late blight": {
        "description": "Potato late blight causes rapidly expanding dark water-soaked lesions and white sporulation on the leaf underside.",
        "treatment": ["Apply systemic fungicide (e.g. metalaxyl-mancozeb) immediately.", "Remove and destroy infected plants.", "Avoid storing diseased tubers."],
        "prevention": ["Plant resistant varieties.", "Avoid cool, wet conditions by timing planting.", "Scout fields regularly during high-risk periods."],
        "learn_more": ["Late blight is caused by Phytophthora infestans — the same organism responsible for the Irish Potato Famine."]
    },

    "potato leafroll virus": {
        "description": "Potato leafroll virus causes upward rolling of young leaves, yellowing, and significant yield reduction.",
        "treatment": ["No chemical cure; remove and destroy infected plants.", "Control aphid vectors with insecticide.", "Do not replant from infected stock."],
        "prevention": ["Use certified virus-free seed tubers.", "Control aphid populations throughout the season.", "Remove volunteer potato plants."],
        "learn_more": ["The virus is transmitted persistently by the green peach aphid Myzus persicae."]
    },

    "soyabean leaf": {
        "description": "Soybean leaf appears healthy with no visible disease.",
        "treatment": ["No treatment required."],
        "prevention": ["Rotate with non-legume crops.", "Scout regularly for pest and disease pressure.", "Maintain adequate plant spacing."],
        "learn_more": ["Healthy soybean canopy is essential for nitrogen fixation and pod fill."]
    },

    "squash powedry milddew leaf": {
        "description": "Squash powdery mildew creates white powdery fungal growth on the upper leaf surface, reducing photosynthesis.",
        "treatment": ["Apply sulfur, potassium bicarbonate, or a registered fungicide.", "Remove heavily infected leaves.", "Improve plant spacing and airflow."],
        "prevention": ["Use resistant varieties where available.", "Avoid overhead watering.", "Keep foliage dry, especially in the evening."],
        "learn_more": ["Powdery mildew thrives in warm dry days combined with cool humid nights."]
    },

    "strawberry leaf": {
        "description": "Strawberry leaf appears healthy with no visible disease symptoms.",
        "treatment": ["No treatment required."],
        "prevention": ["Keep beds weed-free.", "Ensure good drainage.", "Replace runners every 2–3 years."],
        "learn_more": ["Healthy strawberry foliage is critical for fruit ripening and runner production."]
    },

    "tomato leaf bacterial spot": {
        "description": "Bacterial spot causes small dark water-soaked spots on tomato leaves that turn brown with yellow halos.",
        "treatment": ["Apply copper-based bactericide at first sign.", "Remove infected foliage.", "Avoid touching plants when wet."],
        "prevention": ["Use certified disease-free seed.", "Avoid overhead irrigation.", "Sanitise tools regularly."],
        "learn_more": ["Warm, wet weather accelerates bacterial spot spread; splash dispersal is the main route."]
    },

    "tomato leaf early blight": {
        "description": "Tomato early blight causes brown concentric ring lesions (target-board pattern) on lower leaves first.",
        "treatment": ["Apply chlorothalonil or mancozeb fungicide.", "Prune infected lower leaves.", "Improve bed airflow with staking."],
        "prevention": ["Use mulch to prevent soil splash.", "Rotate crops.", "Avoid watering leaves directly."],
        "learn_more": ["Early blight progresses from bottom to top of the plant as the season advances."]
    },

    "tomato leaf healthy": {
        "description": "Tomato leaf appears healthy with no visible disease symptoms.",
        "treatment": ["No treatment required."],
        "prevention": ["Continue proper irrigation and nutrition.", "Keep leaves dry.", "Scout regularly."],
        "learn_more": ["Healthy tomato foliage drives strong fruit set and development."]
    },

    "tomato leaf late blight": {
        "description": "Tomato late blight causes dark, greasy-looking patches that can destroy entire plants within days.",
        "treatment": ["Apply systemic fungicide immediately on detection.", "Remove and destroy infected plant parts.", "Do not compost infected material."],
        "prevention": ["Avoid dense planting.", "Use disease-free transplants.", "Improve air circulation."],
        "learn_more": ["Late blight spreads explosively during cool, wet weather — act within 24 hours of detection."]
    },

    "tomato leaf mold": {
        "description": "Tomato leaf mold produces yellow spots on upper leaf surfaces with olive-green mold growth on the underside.",
        "treatment": ["Improve greenhouse or tunnel ventilation.", "Remove infected leaves.", "Apply registered fungicide if severe."],
        "prevention": ["Reduce relative humidity below 85%.", "Avoid overcrowding plants.", "Water at soil level."],
        "learn_more": ["Leaf mold is caused by Passalora fulva and is most common in high-humidity enclosed growing environments."]
    },

    "tomato leaf powdery mildew": {
        "description": "Tomato powdery mildew produces white powdery colonies on leaf surfaces, causing yellowing and early defoliation.",
        "treatment": ["Apply sulfur or potassium bicarbonate spray.", "Remove infected leaves.", "Improve plant airflow."],
        "prevention": ["Avoid overcrowding.", "Keep foliage dry.", "Monitor plants regularly in warm weather."],
        "learn_more": ["Unlike other fungi, powdery mildew can thrive in warm, dry conditions with high humidity."]
    },

    "tomato septoria leaf spot": {
        "description": "Septoria leaf spot creates numerous small circular spots with dark borders and grey-white centres on lower leaves.",
        "treatment": ["Apply chlorothalonil or copper fungicide.", "Remove infected lower leaves.", "Avoid overhead watering."],
        "prevention": ["Use mulch to prevent soil splash.", "Rotate tomatoes with non-solanaceous crops.", "Clear all crop debris after harvest."],
        "learn_more": ["Septoria lesions often appear after the first fruit set and work upward through the canopy."]
    },
}

# =========================================================
# MODEL — ConvNeXtTinyClassifier
# =========================================================

class ConvNeXtTinyClassifier(nn.Module):
    """
    Exact architecture used during training.
    Head: LayerNorm → Dropout → Linear(768→512) → GELU →
          LayerNorm → Dropout → Linear(512→num_classes)
    """
    def __init__(self, num_classes=29, dropout=0.35):
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
            nn.LayerNorm(feat),          # head.0
            nn.Dropout(p=dropout),       # head.1
            nn.Linear(feat, 512),        # head.2
            nn.GELU(),                   # head.3
            nn.LayerNorm(512),           # head.4
            nn.Dropout(p=dropout / 2),   # head.5
            nn.Linear(512, num_classes), # head.6
        )

    def forward(self, x):
        return self.head(self.backbone(x))


def load_checkpoint(path: str) -> dict:
    """Load state dict, stripping any 'module.' prefix from DataParallel."""
    checkpoint = torch.load(path, map_location=DEVICE)

    if isinstance(checkpoint, dict):
        if "model_state_dict" in checkpoint:
            checkpoint = checkpoint["model_state_dict"]
        elif "state_dict" in checkpoint:
            checkpoint = checkpoint["state_dict"]

    return {
        (k[len("module."):] if k.startswith("module.") else k): v
        for k, v in checkpoint.items()
    }


state_dict = load_checkpoint(MODEL_PATH)

_num_classes   = state_dict["head.6.weight"].shape[0]   # 29
_hidden        = state_dict["head.2.weight"].shape[0]   # 512

model = ConvNeXtTinyClassifier(num_classes=_num_classes, dropout=0.35)
model.load_state_dict(state_dict, strict=True)
model.to(DEVICE)
model.eval()

# =========================================================
# IMAGE TRANSFORM  (224×224 — ConvNeXt canonical size)
# =========================================================

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])

# =========================================================
# HELPERS
# =========================================================

def get_severity(conf: float) -> str:
    if conf >= 90:
        return "Low"
    elif conf >= 75:
        return "Medium"
    return "High"


def read_image_as_base64(path: str) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def make_gradcam(image: "Image.Image", input_tensor: "torch.Tensor",
                 pred_idx: int, class_name: str) -> str:
    """
    Generate a sharp, focused Grad-CAM overlay identical in visual quality
    to the original EfficientNet results.

    Pipeline:
      1. healthy class  → plain resized image, no heatmap
      2. diseased class → GradCAM with percentile clipping + Gaussian
         smoothing → JET colormap → 55/45 blend (matching original)
    """
    # ── Common: base image at 224×224 ─────────────────────────────────────
    image_resized = image.resize((224, 224))
    image_np  = np.array(image_resized).astype(np.uint8)
    image_bgr = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)

    output_path = os.path.join(OUTPUT_DIR, "latest_gradcam.jpg")

    # ── Healthy leaf → no heatmap ─────────────────────────────────────────
    if class_name.lower() in HEALTHY_CLASSES:
        cv2.imwrite(output_path, image_bgr)
        return output_path

    # ── Grad-CAM: hook last ConvNeXt stage (768 ch, 7×7) ─────────────────
    target_layer = model.backbone.stages[-1]

    gradcam_obj = GradCAM(model, target_layer)
    # generate() already applies ReLU + percentile clip + normalisation
    cam = gradcam_obj.generate(input_tensor, class_idx=pred_idx)
    gradcam_obj.remove_hooks()

    cam = np.array(cam, dtype=np.float32)
    if cam.ndim == 3:
        cam = cam.squeeze()

    # ── Upsample 7×7 → 224×224 with smooth interpolation ─────────────────
    cam_up = cv2.resize(cam, (224, 224), interpolation=cv2.INTER_LINEAR)

    # ── Mild Gaussian smoothing: softens the coarse grid without
    #    destroying the focused hotspot shape ──────────────────────────────
    cam_up = cv2.GaussianBlur(cam_up, (0, 0), sigmaX=8)

    # Re-normalise after blur
    cam_up -= cam_up.min()
    if cam_up.max() > 1e-8:
        cam_up /= cam_up.max()

    # ── JET colormap + blend ──────────────────────────────────────────────
    heatmap = cv2.applyColorMap(np.uint8(cam_up * 255), cv2.COLORMAP_JET)
    overlay = cv2.addWeighted(image_bgr, 0.55, heatmap, 0.45, 0)

    cv2.imwrite(output_path, overlay)
    return output_path


def get_default_info(name: str) -> dict:
    return {
        "description": f"{name} detected. Please consult an agronomist for precise diagnosis.",
        "treatment":   ["Consult an agriculture expert.", "Remove visibly infected leaves.", "Use recommended crop protection spray."],
        "prevention":  ["Inspect plants weekly.", "Avoid overwatering.", "Maintain field hygiene."],
        "learn_more":  ["Early detection significantly reduces crop damage."],
    }

# =========================================================
# SECURE CHATBOT PROXY & OFFLINE ENGINE
# =========================================================

# Helper to load .env variables securely on backend without dependency issues
def load_env_file():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ[k.strip()] = v.strip().strip("'").strip('"')

load_env_file()

class ChatPayload(BaseModel):
    messages: List[Dict[str, str]]
    systemPrompt: str = None

class SummaryPayload(BaseModel):
    crop: str
    disease: str
    confidence: float

OFFLINE_DISEASE_DB = {
    'apple leaf scab': {
        'description': 'Apple scab is caused by the fungus Venturia inaequalis. It produces olive-green to black velvety spots on leaves, causing leaves to yellow and drop prematurely, weakening the tree.',
        'treatment': '- Apply organic sulfur or copper-based fungicides in early spring during green tip stage.\n- Rake and burn or compost fallen leaves in autumn to eliminate overwintering spores.\n- Prune inner branches to increase sunlight and wind penetration, keeping leaves dry.',
        'prevention': '- Choose disease-resistant apple varieties (like Liberty, Enterprise, or Freedom).\n- Avoid overhead sprinkler irrigation; water directly at the root zone.\n- Maintain a clean orchard floor by clearing weed cover and pruning debris.'
    },
    'early blight': {
        'description': 'Early blight is a fungal infection caused by Alternaria solani. It targets older tomato leaves first, creating dark brown spots with concentric ring patterns that resemble target boards.',
        'treatment': '- Remove all infected lower leaves immediately to prevent fungal spores from splashing upwards.\n- Apply neem oil spray or an organic copper fungicide every 7 to 10 days during humid weather.\n- Apply a thick layer of clean straw mulch around the plant base to create a physical barrier against soil-borne spores.',
        'prevention': '- Rotate crops, ensuring tomatoes or potatoes are not planted in the same soil for at least 3 years.\n- Ensure a 3-foot spacing between plants to maximize air circulation.\n- Water early in the morning and avoid wetting the foliage.'
    },
    'late blight': {
        'description': 'Late blight is a highly destructive disease caused by the oomycete Phytophthora infestans. It causes dark, water-soaked leaf spots with white fungal growth on the undersides during cool, wet periods.',
        'treatment': '- Act immediately: Remove and bag infected plants. Securely bury or burn them; do not compost.\n- Apply preventive copper fungicides to surrounding healthy crops to save the remaining yield.\n- Immediately alert neighboring farmers and local agricultural officers as late blight spreads rapidly via wind.',
        'prevention': '- Always plant certified disease-free potato seed tubers or healthy tomato seedlings.\n- Keep leaves dry using drip lines or early-morning ground watering.\n- Monitor weather closely; late blight thrives in cool, highly humid climates.'
    },
    'default': {
        'description': 'This is a common agricultural pathogen. It usually thrives in high humidity, crowded foliage, and poor soil conditions, spreading via water splash, wind, or contaminated garden tools.',
        'treatment': '- Prune off all infected foliage using shears sanitized with 70% isopropyl alcohol.\n- Apply organic neem oil or home-made baking soda spray (1 tbsp baking soda + 1 tsp liquid soap in 1 gal water).\n- Reduce watering frequency and avoid applying heavy nitrogen fertilizers during active infection.',
        'prevention': '- Sanitize all pruning tools between plants to prevent mechanical transmission.\n- Water at the soil level rather than splashing the crop canopy.\n- Boost soil health and plant immunity by applying organic compost tea.'
    }
}

DEFAULT_MODEL = "llama-3.3-70b-versatile"
API_URL = "https://api.groq.com/openai/v1/chat/completions"

def call_groq_api(messages: List[Dict[str, str]], system_prompt: str = None) -> str:
    # Look for backend environment variables securely
    apiKey = os.getenv("GROQ_API_KEY")
    is_offline = (
        not apiKey or 
        apiKey == 'undefined' or 
        apiKey == 'null' or 
        apiKey.strip() == '' or 
        apiKey.startswith('YOUR_') or 
        apiKey.startswith('your_') or 
        'placeholder' in apiKey
    )
    
    if is_offline:
        print("Chatbot Server: Missing or invalid Groq API key. Serving in simulated offline expert mode.")
        last_message = messages[-1]["content"].lower() if messages else ""
        time.sleep(0.8)  # Simulated thinking delay
        
        if "serious" in last_message or "harmful" in last_message or "severity" in last_message:
            return "According to agricultural records, this disease can be **highly serious** if left unchecked, reducing crop yield by **30% to 60%**. I highly recommend applying the organic treatment remedies immediately and keeping the leaves dry to stop active spread."
        if "treatment" in last_message or "cure" in last_message or "remedy" in last_message:
            return "The best treatments include:\n\n1. **Organic Neem Oil Spray**: Mix 2 tbsp neem oil with 1 tsp mild soap in 1 gallon of water and spray thoroughly.\n2. **Cultural Control**: Prune infected leaves immediately and sanitize tools.\n3. **Soil Mulching**: Spread straw mulch around the base to prevent soil splashing."
        if "prevent" in last_message or "spread" in last_message:
            return "To prevent spread, you must:\n\n- **Sanitize tools**: Clean shears with alcohol between plants.\n- **Drip Irrigation**: Switch to ground watering to keep leaf canopies dry.\n- **Crop Rotation**: Do not plant the same crop families in this soil next season."
        if "organic" in last_message or "natural" in last_message:
            return "For a fully **organic solution**, spray a mixture of **baking soda (1 tbsp)**, hort oil, and warm water. This alters leaf pH and stops fungal spores from germinating. Applying **compost tea** to the roots also boosts general plant immunity!"
        if "pesticide" in last_message or "chemical" in last_message:
            return "Always prioritize **organic biocides** first. If a chemical intervention is required, use a mild **copper octanoate** or chlorothalonil fungicide. *Important: Never spray during high temperatures, and consult local extension officers for dosage rules.*"
        if "fertilizer" in last_message:
            return "During active infection, **avoid high-nitrogen fertilizers**, as new lush growth is highly susceptible to disease. Instead, apply a balanced organic compost or a **potassium-rich foliar spray** to strengthen plant cell walls."
        if "irrigation" in last_message or "water" in last_message:
            return "Switch immediately to **drip irrigation** or water directly at the root zone early in the morning. Fungal spores require active moisture on leaves for **4-6 hours** to germinate. Keeping foliage dry is the best protection!"
            
        return "Hello! I am operating in **Agricultural Offline Demo Mode** since the Groq API key is not configured on the backend server.\n\nAsk me simple questions about **treatment**, **prevention**, **organic solutions**, **pesticides**, **fertilizers**, or **severity levels**, and I will supply expert agricultural guidance based on our local crop databases!"

    # Perform real, secure server-side Groq Llama call
    payload = {
        "model": DEFAULT_MODEL,
        "messages": ([{"role": "system", "content": system_prompt}] if system_prompt else []) + messages,
        "temperature": 0.2,
        "max_tokens": 1024
    }
    
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {apiKey}",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"Error calling Groq API securely: {e}")
        raise e

def generate_summaries_from_api(crop: str, disease: str, confidence: float) -> dict:
    apiKey = os.getenv("GROQ_API_KEY")
    normalized_disease = disease.lower().strip()
    is_offline = (
        not apiKey or 
        apiKey == 'undefined' or 
        apiKey == 'null' or 
        apiKey.strip() == '' or 
        apiKey.startswith('YOUR_') or 
        apiKey.startswith('your_') or 
        'placeholder' in apiKey
    )
    
    if is_offline:
        time.sleep(1.5)  # Simulated thinking delay
        db_match = OFFLINE_DISEASE_DB.get(normalized_disease)
        if not db_match:
            # Try sub-match (e.g. "tomato leaf early blight" contains "early blight")
            for k, v in OFFLINE_DISEASE_DB.items():
                if k in normalized_disease:
                    db_match = v
                    break
        if not db_match:
            db_match = OFFLINE_DISEASE_DB["default"]
            
        return {
            "diseaseSummary": f"[Offline Server Mode] **{disease}** is currently identified on your **{crop}** with a confidence score of **{confidence:.1f}%**. {db_match['description']}",
            "treatmentSummary": f"Here are the top offline recommended treatments:\n\n{db_match['treatment']}",
            "preventionSummary": f"Take these practical steps to protect remaining crops:\n\n{db_match['prevention']}"
        }

    system_prompt = (
        "You are an expert plant pathologist. Generate three clean bullet sections in simple farmer-friendly words:\n"
        "1. [DISEASE SUMMARY]\n"
        "2. [TREATMENT SUMMARY]\n"
        "3. [PREVENTION SUMMARY]\n"
        "Use ===DISEASE===, ===TREATMENT===, and ===PREVENTION=== as delimiters."
    )
    user_prompt = f"Crop: ${crop}, Disease: ${disease}, Confidence: ${confidence:.1f}%"
    
    try:
        raw_response = call_groq_api([{"role": "user", "content": user_prompt}], system_prompt)
        
        import re
        disease_match = re.search(r"===DISEASE===([\s\S]*?)===TREATMENT===", raw_response)
        treatment_match = re.search(r"===TREATMENT===([\s\S]*?)===PREVENTION===", raw_response)
        prevention_match = re.search(r"===PREVENTION===([\s\S]*)", raw_response)
        
        disease_summary = disease_match.group(1).strip() if disease_match else "Could not load summary."
        treatment_summary = treatment_match.group(1).strip() if treatment_match else "Could not load treatment advice."
        prevention_summary = prevention_match.group(1).strip() if prevention_match else "Could not load prevention advice."
        
        return {
            "diseaseSummary": disease_summary,
            "treatmentSummary": treatment_summary,
            "preventionSummary": prevention_summary
        }
    except Exception as e:
        print(f"Server-side pregeneration error, returning offline database fallback: {e}")
        db_match = OFFLINE_DISEASE_DB.get(normalized_disease)
        if not db_match:
            for k, v in OFFLINE_DISEASE_DB.items():
                if k in normalized_disease:
                    db_match = v
                    break
        if not db_match:
            db_match = OFFLINE_DISEASE_DB["default"]
            
        return {
            "diseaseSummary": f"**{disease}** was detected on your **{crop}**. {db_match['description']}",
            "treatmentSummary": db_match['treatment'],
            "preventionSummary": db_match['prevention']
        }

# =========================================================
# ROUTES
# =========================================================

@app.get("/")
def root():
    return {"message": "LeafDoc API running — ConvNeXt-Tiny, 29 classes"}

@app.post("/chat")
def chat_proxy(payload: ChatPayload):
    try:
        reply = call_groq_api(payload.messages, payload.systemPrompt)
        return {"reply": reply}
    except Exception as e:
        return {"error": str(e)}

@app.post("/chat/summaries")
def chat_summaries(payload: SummaryPayload):
    try:
        summaries = generate_summaries_from_api(payload.crop, payload.disease, payload.confidence)
        return summaries
    except Exception as e:
        return {"error": str(e)}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    input_tensor = transform(image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        outputs = model(input_tensor)
        probs   = torch.softmax(outputs, dim=1)
        conf_t, pred_t = torch.max(probs, dim=1)

    pred_idx   = int(pred_t.item())
    confidence = float(conf_t.item() * 100)
    disease    = CLASS_NAMES[pred_idx]

    info = DISEASE_INFO.get(disease.lower(), get_default_info(disease))

    is_healthy   = disease.lower() in HEALTHY_CLASSES
    gradcam_path = make_gradcam(image, input_tensor, pred_idx, disease)
    gradcam_b64  = read_image_as_base64(gradcam_path)

    return {
        "disease":      disease,
        "confidence":   round(confidence, 2),
        "severity":     "N/A" if is_healthy else get_severity(confidence),
        "description":  info["description"],
        "treatment":    info["treatment"],
        "prevention":   info["prevention"],
        "learn_more":   info["learn_more"],
        "xaiInsight":   (
            "Leaf appears healthy — no disease regions to highlight."
            if is_healthy else
            "AI highlighted the infected regions of the leaf using Grad-CAM."
        ),
        "gradcam_image": gradcam_b64,
        "is_healthy":    is_healthy,
    }
