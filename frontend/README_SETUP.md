# LeafDoc React Native Setup Guide

This project uses **Expo + React Native + JavaScript** because it is the easiest path for an Android FYP demo.

## 1) External software tools to install first

1. Node.js LTS
2. Git
3. VS Code
4. Android Studio
5. Android SDK + Android Emulator
6. Expo Go on your Android phone (optional for testing)

## 2) VS Code terminal commands from scratch

### Create project folder
```powershell
cd $HOME\Desktop
mkdir leafdoc-app
cd leafdoc-app
```

### Open in VS Code
```powershell
code .
```

### Initialize Expo project in current folder
```powershell
npx create-expo-app@latest . --template blank
```

### Install app dependencies
```powershell
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install @react-native-async-storage/async-storage axios react-native-svg react-native-pager-view
npx expo install expo-image-picker expo-linear-gradient expo-sharing expo-file-system expo-status-bar
npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated
npm install @expo/vector-icons
```

### Create folders automatically
```powershell
mkdir src
mkdir src\assets
mkdir src\assets\images
mkdir src\assets\icons
mkdir src\components
mkdir src\screens
mkdir src\navigation
mkdir src\services
mkdir src\context
mkdir src\models
mkdir src\utils
mkdir src\data
mkdir docs
```

### Start app
```powershell
npx expo start
```

### Run on Android emulator
```powershell
npx expo run:android
```

## 3) FastAPI backend notes

Update `src/utils/constants.js`:
- For Android emulator: use `http://10.0.2.2:8000`
- For real Android phone on same Wi-Fi: use your PC local IP like `http://192.168.100.10:8000`

## 4) Recommended workflow

1. Run FastAPI backend first.
2. Run Expo app.
3. Open app in emulator or Expo Go.
4. Test image upload.
5. Confirm `/predict` returns:
   - disease
   - confidence
   - severity
   - description
   - gradcam_image
   - treatment
   - prevention
   - learn_more

## 5) Suggested prompt for UI mockup asset design

Use this prompt in a professional AI image generator:

"Design a premium Android mobile app UI called LeafDoc for plant leaf disease detection. Inspired by Plantix but more modern. Green theme (#2E7D32, #4CAF50, #A5D6A7), white cards, rounded corners, farmer-friendly interface, large buttons, bottom navigation with 5 tabs, central scan FAB, result screen with original leaf image, AI heatmap image, confidence badge, severity badge, treatment tabs, modern clean Android design, subtle motion cues, polished FYP presentation style."
