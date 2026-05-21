import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 900,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 900,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: width - 80,
        duration: 2200,
        useNativeDriver: false,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }, { scale: pulse }],
          },
        ]}
      >
        <Ionicons name="leaf" size={58} color="#fff" />
      </Animated.View>

      <Animated.View
        style={{
          opacity: textOpacity,
          transform: [{ translateY: slideUp }],
          alignItems: 'center',
        }}
      >
        <Text style={styles.title}>LeafDoc</Text>
        <Text style={styles.subtitle}>AI Powered Plant Diagnosis</Text>
        <Text style={styles.caption}>
          Detect diseases • Explain with AI • Smart farming tools
        </Text>
      </Animated.View>

      <View style={styles.loaderTrack}>
        <Animated.View
          style={[
            styles.loaderFill,
            {
              width: progress,
            },
          ]}
        />
      </View>

      <Text style={styles.loadingText}>Loading smart agriculture engine...</Text>

      <Text style={styles.version}>Version 1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  bgCircle1: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -40,
    right: -80,
  },

  bgCircle2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -30,
    left: -70,
  },

  logoWrapper: {
    width: 118,
    height: 118,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },

  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  subtitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#E8F5E9',
  },

  caption: {
    marginTop: 10,
    textAlign: 'center',
    color: '#DFF3DF',
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 10,
  },

  loaderTrack: {
    width: width - 60,
    height: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginTop: 40,
    overflow: 'hidden',
  },

  loaderFill: {
    height: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },

  loadingText: {
    marginTop: 16,
    color: '#E8F5E9',
    fontSize: 13,
    fontWeight: '600',
  },

  version: {
    position: 'absolute',
    bottom: 34,
    color: '#DFF3DF',
    fontSize: 12,
    fontWeight: '600',
  },
});
