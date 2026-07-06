import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../utils/theme';
import { predictLeafDisease } from '../services/apiService';
import { useScan } from '../context/ScanContext';
import { useLanguage } from '../context/LanguageContext';
import { getCropLabel } from '../utils/localization';

const CROPS = [
  { name: 'Apple', image: require('../assets/crops/apple.png') },
  { name: 'Bell_Pepper', image: require('../assets/crops/bellpepper.png') },
  { name: 'Corn', image: require('../assets/crops/corn.png') },
  { name: 'Grape', image: require('../assets/crops/grape.png') },
  { name: 'Potato', image: require('../assets/crops/potato.png') },
  { name: 'Tomato', image: require('../assets/crops/tomato.png') },
  { name: 'Cherry', image: require('../assets/crops/cherry.png') },
  { name: 'Peach', image: require('../assets/crops/peach.png') },
  { name: 'Soyabeans', image: require('../assets/crops/soyabeans.png') },
  { name: 'Squash', image: require('../assets/crops/squash.png') },
  { name: 'Strawberry', image: require('../assets/crops/strawberry.png') },
  
];

const firstValue = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
};

const getCropFromDisease = (diseaseName, fallback) => {
  if (!diseaseName) return fallback;
  const name = diseaseName.toLowerCase();
  if (name.includes('tomato')) return 'Tomato';
  if (name.includes('potato')) return 'Potato';
  if (name.includes('apple')) return 'Apple';
  if (name.includes('grape')) return 'Grape';
  if (name.includes('pepper') || name.includes('bellpepper') || name.includes('bell pepper')) return 'Bell_Pepper';
  if (name.includes('blueberry')) return 'Blueberry';
  if (name.includes('cherry')) return 'Cherry';
  if (name.includes('corn')) return 'Corn';
  if (name.includes('peach')) return 'Peach';
  if (name.includes('soyabean') || name.includes('soybeans') || name.includes('soybean')) return 'Soybeans';
  if (name.includes('squash')) return 'Squash';
  if (name.includes('strawberry')) return 'Strawberry';
  return fallback;
};

export default function ScanScreen({ navigation }) {
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  const { setCurrentScan } = useScan();
  const { t, textStyle, language } = useLanguage();

  const pickImageFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(t('permissionNeeded'), t('galleryPermission'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(t('galleryError'), error.message);
    }
  };

  const captureImage = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(t('permissionNeeded'), t('cameraPermission'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(t('cameraError'), error.message);
    }
  };

  const clearImage = () => {
    setImageUri(null);
  };

  const analyzeImage = async () => {
    if (!imageUri) {
      Alert.alert(t('noImageAlert'), t('noImageMessage'));
      return;
    }

    try {
      setLoading(true);

      const response = await predictLeafDisease(imageUri, selectedCrop);

      const disease = firstValue(
        response?.disease,
        response?.prediction,
        response?.class_name,
        response?.predicted_class,
        'Unknown Disease'
      );

      const gradcam = firstValue(
        response?.gradcam_image,
        response?.gradcamImage,
        response?.gradcam,
        response?.heatmap,
        response?.heatmap_image,
        response?.xai_image,
        null
      );

      const scanResult = {
        id: Date.now().toString(),
        crop: getCropFromDisease(disease, selectedCrop),
        imageUri,
        disease,
        confidence: firstValue(
          response?.confidence,
          response?.confidence_score,
          response?.probability,
          0
        ),
        severity: firstValue(response?.severity, 'Medium'),
        description: firstValue(
          response?.description,
          response?.disease_info,
          response?.info,
          `${disease} was detected by the AI model.`
        ),
        gradcam_image: gradcam,
        gradcamImage: gradcam,
        treatment: firstValue(
          response?.treatment,
          response?.treatments,
          'Treatment information is not available yet.'
        ),
        prevention: firstValue(
          response?.prevention,
          response?.preventions,
          'Prevention information is not available yet.'
        ),
        learn_more: firstValue(
          response?.learn_more,
          response?.learnMore,
          response?.more_info,
          'More information is not available yet.'
        ),
        xaiInsight: firstValue(
          response?.xaiInsight,
          response?.xai_insight,
          'AI focused on highlighted infected regions of the leaf.'
        ),
        date: new Date().toISOString(),
      };

      setCurrentScan(scanResult);
      navigation.navigate('Result', { result: scanResult });
    } catch (error) {
      Alert.alert(
        t('predictionFailed'),
        error.response?.data?.detail
          ? String(error.response.data.detail)
          : error.message || t('backendConnection')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.header, language === 'ur' && { flexDirection: 'row-reverse' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, textStyle]}>{t('scanLeaf')}</Text>
          <Text style={[styles.subtitle, textStyle]}>{t('scanSubtitle')}</Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons name="leaf" size={28} color={COLORS.primary || '#2E7D32'} />
        </View>
      </View>

      <Text style={[styles.sectionLabel, textStyle]}>{t('crop')}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.cropList,
          language === 'ur' && { flexDirection: 'row-reverse', paddingLeft: 12, paddingRight: 0 }
        ]}
      >
        {CROPS.map((crop) => {
          const active = selectedCrop === crop.name;

          return (
            <TouchableOpacity
              key={crop.name}
              style={styles.cropCard}
              onPress={() => setSelectedCrop(crop.name)}
            >
              <View style={[styles.cropCircle, active && styles.cropCircleActive]}>
                <Image source={crop.image} style={styles.cropImage} />
              </View>

              <Text style={[styles.cropName, textStyle, active && styles.cropNameActive]}>
                {getCropLabel(crop.name, language)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.previewCard}>
        <View style={[styles.previewHeader, language === 'ur' && { flexDirection: 'row-reverse' }]}>
          <Text style={[styles.previewTitle, textStyle]}>{t('leafPreview')}</Text>

          {imageUri && (
            <TouchableOpacity onPress={clearImage}>
              <Text style={styles.clearText}>{t('remove')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.imageFrame}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholder}>
              <View style={styles.placeholderIcon}>
                <Ionicons name="image-outline" size={48} color={COLORS.primary || '#2E7D32'} />
              </View>
              <Text style={[styles.placeholderTitle, textStyle]}>{t('noImageSelected')}</Text>
              <Text style={[styles.placeholderText, textStyle]}>
                {t('clearLeafPhoto')}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.tipRow, language === 'ur' && { flexDirection: 'row-reverse' }]}>
          <Ionicons name="bulb-outline" size={18} color="#FF8F00" />
          <Text style={[styles.frameHint, textStyle, language === 'ur' && { marginRight: 8, marginLeft: 0 }]}>
            {t('scanTip')}
          </Text>
        </View>
      </View>

      <View style={[styles.actionRow, language === 'ur' && { flexDirection: 'row-reverse' }]}>
        <TouchableOpacity style={styles.optionButton} onPress={pickImageFromGallery}>
          <Ionicons name="images-outline" size={28} color={COLORS.primary || '#2E7D32'} />
          <Text style={[styles.optionTitle, textStyle]}>{t('gallery')}</Text>
          <Text style={[styles.optionSub, textStyle]}>{t('uploadPhoto')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton} onPress={captureImage}>
          <Ionicons name="camera-outline" size={28} color={COLORS.primary || '#2E7D32'} />
          <Text style={[styles.optionTitle, textStyle]}>{t('camera')}</Text>
          <Text style={[styles.optionSub, textStyle]}>{t('takePhoto')}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.analyzeButton, loading && styles.disabledButton, language === 'ur' && { flexDirection: 'row-reverse' }]}
        onPress={analyzeImage}
        disabled={loading}
      >
        {loading ? (
          <>
            <ActivityIndicator color="#fff" />
            <Text style={styles.analyzeText}>{t('analyzingLeaf')}</Text>
          </>
        ) : (
          <>
            <Ionicons name="sparkles" size={22} color="#fff" />
            <Text style={styles.analyzeText}>{t('analyzeWithAi')}</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={[styles.noteCard, language === 'ur' && { flexDirection: 'row-reverse' }]}>
        <View style={[styles.noteIcon, language === 'ur' ? { marginLeft: 0, marginRight: 0 } : { marginRight: 12 }]}>
          <Ionicons name="eye-outline" size={24} color={COLORS.primary || '#2E7D32'} />
        </View>

        <View style={[{ flex: 1 }, language === 'ur' ? { marginRight: 12 } : { marginLeft: 0 }]}>
          <Text style={[styles.noteTitle, textStyle]}>{t('explainableAi')}</Text>
          <Text style={[styles.noteText, textStyle]}>
            {t('explainableAiNote')}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#F6FBF6',
  },
  content: {
    padding: 18,
    paddingBottom: 125,
  },
  header: {
    marginTop: 30,
    marginBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.text || '#102A12',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textLight || '#5A7A5A',
    marginTop: 5,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: '#102A12',
    marginBottom: 10,
  },
  cropList: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  cropCard: {
    alignItems: 'center',
    marginRight: 18,
    width: 92,
  },
  cropCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#DDEBDD',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  cropCircleActive: {
    borderColor: COLORS.primary || '#2E7D32',
    backgroundColor: '#E8F5E9',
    transform: [{ scale: 1.04 }],
  },
  cropImage: {
    width: 62,
    height: 62,
    resizeMode: 'contain',
  },
  cropName: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '900',
    color: '#102A12',
    textAlign: 'center',
  },
  cropNameActive: {
    color: COLORS.primary || '#2E7D32',
  },
  previewCard: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 14,
    elevation: 3,
  },
  previewHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#102A12',
  },
  clearText: {
    color: '#C62828',
    fontWeight: '800',
  },
  imageFrame: {
    height: 315,
    borderWidth: 2.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primary || '#2E7D32',
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  placeholderIcon: {
    width: 86,
    height: 86,
    borderRadius: 28,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '900',
    color: '#102A12',
  },
  placeholderText: {
    marginTop: 6,
    textAlign: 'center',
    color: COLORS.textLight || '#5A7A5A',
    fontSize: 14,
    lineHeight: 20,
  },
  tipRow: {
    marginTop: 12,
    backgroundColor: '#FFF8EC',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  frameHint: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#6A856A',
    lineHeight: 18,
  },
  actionRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 18,
    alignItems: 'center',
    elevation: 3,
  },
  optionTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary || '#2E7D32',
  },
  optionSub: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.textLight || '#5A7A5A',
  },
  analyzeButton: {
    marginTop: 20,
    height: 64,
    borderRadius: 22,
    backgroundColor: COLORS.primary || '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.75,
  },
  analyzeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  noteCard: {
    marginTop: 18,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    elevation: 2,
    flexDirection: 'row',
  },
  noteIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary || '#2E7D32',
  },
  noteText: {
    marginTop: 5,
    fontSize: 13,
    color: COLORS.textLight || '#5A7A5A',
    lineHeight: 19,
  },
});