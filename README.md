🌿 LeafDoc — AI Powered Plant Disease Detection & Smart Farming Assistant

> An intelligent agriculture mobile application that combines Deep Learning, Explainable AI (XAI), Weather Intelligence, and Smart Farming Utilities to help farmers detect and manage plant diseases in real-world conditions.

---

📱 Overview

LeafDoc is a modern AI-powered mobile application developed for plant leaf disease detection using Deep Learning models trained on a custom agricultural dataset.
The application was designed with a strong focus on **real-world image generalization**, mobile usability, and intelligent farming assistance.

Unlike traditional classification-only systems, LeafDoc integrates:

* 🌱 AI Disease Detection
* 🔥 Grad-CAM Explainable AI
* 🤖 AI Farming Assistant Chatbot
* ☁️ Smart Weather & Spray Advisory System
* 🧪 Fertilizer & Pesticide Calculators
* 📊 Farming Utility Tools
* 📖 Diagnosis History & Community Features

into one complete smart agriculture ecosystem.

---

✨ Key Features

🌿 AI Plant Disease Detection

* Real-time leaf disease prediction
* Camera & gallery image support
* Mobile optimized inference
* Designed for real-world agricultural conditions

---

🔥 Explainable AI (Grad-CAM)

* Visual heatmap explanation of predictions
* Highlights infected regions of the leaf
* Improves model transparency and trust

---

🤖 Smart Agriculture Assistant

* AI-powered farming chatbot
* Disease treatment guidance
* Prevention recommendations
* Organic remedy suggestions
* Farming advisory support

---

☁️ Weather Intelligence System

* Live weather forecasting
* Smart spray timing recommendations
* Rain & humidity warnings
* Disease spread risk alerts
* Irrigation guidance

---

🧪 Smart Farming Tools

* Fertilizer Calculator
* Pesticide Calculator
* Farming Area Calculator

---

📖 History & Community

* Save previous diagnoses
* Share prediction results
* Community farming interaction module

---

🧠 Dataset Information

A custom plant disease dataset was created and enhanced specifically for this project.

| Dataset Detail           | Value          |
| ------------------------ | -------------- |
| Total Disease Classes    | 29             |
| Original Dataset Size    | ~6,000 Images  |
| Augmented Dataset Size   | 18,000+ Images |
| Working Training Dataset | ~12,000 Images |

---

🧪 Data Augmentation

Offline augmentation techniques were applied to improve robustness and real-world generalization:

* Rotation
* Horizontal & Vertical Flipping
* Brightness Adjustment
* Contrast Enhancement
* Zoom Transformations
* Noise Injection

The primary objective was to simulate real agricultural image conditions.

---

🏗️ Model Experimentation

Multiple CNN architectures were trained and evaluated:

* EfficientNetB1
* EfficientNetB2
* EfficientNetB3
* EfficientNetV2-S
* ConvNeXt-Tiny ✅ (Final Deployed Model)

---

🚀 Final Model

✅ ConvNeXt-Tiny

ConvNeXt-Tiny was selected as the final deployed model because it demonstrated:

* Better real-world generalization
* More stable unseen-image predictions
* Improved robustness under varying conditions

---

📊 Model Performance

| Metric            | Score |
| ----------------- | ----- |
| Training Accuracy | 87%   |
| Test Accuracy     | 78%   |

> The primary focus of this project was real-world usability and generalization rather than only maximizing benchmark accuracy.

---

🛠️ Tech Stack

Frontend

* React Native
* Expo
* JavaScript
* React Navigation
* Context API

Backend

* FastAPI
* Python

## Deep Learning

* PyTorch
* Torchvision
* ConvNeXt
* EfficientNet

## Explainable AI

* Grad-CAM

## Deployment

* Expo EAS Build
* Android APK

---

# ⚙️ Application Workflow

```text
Leaf Image Capture
        ↓
AI Disease Prediction
        ↓
Grad-CAM Heatmap Generation
        ↓
Result Analysis Screen
        ↓
Prevention & Treatment Guidance
        ↓
AI Agriculture Assistant
        ↓
Weather & Spray Advisory
```

---

# 🎯 Project Motivation

Most existing plant disease detection systems primarily focus on laboratory-level classification accuracy.

This project focused on a more practical challenge:

> Developing a mobile AI system capable of performing effectively on real-world agricultural images while assisting farmers with actionable insights and farming intelligence.

LeafDoc was designed as a complete smart farming ecosystem rather than a simple image classifier.

---

# 📱 App Screens

* Splash Screen
* Onboarding Screen
* Home Dashboard
* Scan Screen
* Result Screen
* Weather Dashboard
* History Screen
* Community Screen
* Profile Screen
* AI Chatbot Assistant
* Farming Tools

---

# 🔮 Future Improvements

* Multilingual chatbot support
* Voice-enabled farming assistant
* Cloud backend deployment
* Real-time weather notifications
* Disease severity estimation
* Crop recommendation system
* IoT sensor integration
* RAG-based agriculture knowledge assistant

---

# ⚡ Installation

## Frontend

```bash
cd frontend
npm install
npx expo start
```

---

## Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

# 📦 APK Build

```bash
eas build -p android --profile preview
```

---

# 👨‍💻 Author

Final Year Project focused on:

* AI-driven Smart Agriculture
* Plant Disease Detection
* Explainable AI
* Mobile AI Applications
* Real-world Agricultural Intelligence

---

# ⭐ If you found this project useful, consider starring the repository.
