import React, { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { setOnboardingSeen } from '../services/storageService';
import { colors } from '../utils/theme';

const { width } = Dimensions.get('window');

const slides = [
  {
    icon: 'leaf-outline',
    title: 'Detect Plant Leaf Diseases',
    text: 'Upload or capture a leaf image and get AI-based disease prediction.',
  },
  {
    icon: 'analytics-outline',
    title: 'Explain Results with Grad-CAM',
    text: 'See highlighted disease regions so predictions are easier to understand.',
  },
  {
    icon: 'calculator-outline',
    title: 'Calculate Exact Fertilizer & Pesticide Amounts',
    text: 'Use offline calculators for quick farming decisions in the field.',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [index, setIndex] = useState(0);

  const finishOnboarding = async () => {
    try {
      await setOnboardingSeen();
    } catch (error) {
      console.log('Onboarding save error:', error);
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const nextSlide = () => {
    if (index < slides.length - 1) {
      setIndex(index + 1);
    } else {
      finishOnboarding();
    }
  };

  const current = slides[index];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipBtn} onPress={finishOnboarding}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.center}>
        <View style={styles.iconCircle}>
          <Ionicons name={current.icon} size={76} color={colors.primary} />
        </View>

        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.text}>{current.text}</Text>

        <View style={styles.dots}>
          {slides.map((_, dotIndex) => (
            <View
              key={dotIndex}
              style={[
                styles.dot,
                index === dotIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.mainBtn} onPress={nextSlide}>
        <Text style={styles.mainBtnText}>
          {index === slides.length - 1 ? 'Get Started' : 'Next'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingBottom: 36,
  },
  skipBtn: {
    position: 'absolute',
    top: 58,
    right: 28,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 58,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    lineHeight: 36,
  },
  text: {
    marginTop: 26,
    fontSize: 18,
    color: '#5A7A5A',
    textAlign: 'center',
    lineHeight: 28,
  },
  dots: {
    flexDirection: 'row',
    marginTop: 90,
    alignItems: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#CFE8D1',
    marginHorizontal: 6,
  },
  activeDot: {
    width: 44,
    backgroundColor: colors.primary,
  },
  mainBtn: {
    height: 70,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainBtnText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
});
