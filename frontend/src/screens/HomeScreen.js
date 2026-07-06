import React, { useCallback, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../utils/theme';
import { WEATHER_PLACEHOLDER } from '../utils/constants';
import { getHistory } from '../services/storageService';
import { useWeather } from '../context/WeatherContext';
import SeverityBadge from '../components/SeverityBadge';
import { useLanguage } from '../context/LanguageContext';
import { getCropLabel, getDiseaseLabel } from '../utils/localization';

const getConfidence = (value) => {
  const number = Number(value);
  if (Number.isNaN(number)) return 0;
  return number <= 1 ? number * 100 : number;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Today';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export default function HomeScreen({ navigation }) {
  const [recentScans, setRecentScans] = useState([]);
  const { weatherData, locationName, sprayAdvisory } = useWeather();
  const { t, textStyle, language } = useLanguage();

  const loadRecentHistory = async () => {
    const history = await getHistory();
    setRecentScans((history || []).slice(0, 5));
  };

  useFocusEffect(
    useCallback(() => {
      loadRecentHistory();
    }, [])
  );

  const openResult = (item) => {
    navigation.navigate('Result', {
      result: {
        ...item,
        gradcamImage: item.gradcamImage || item.gradcam_image,
        gradcam_image: item.gradcam_image || item.gradcamImage,
        learn_more: item.learn_more || item.learnMore,
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.greeting, textStyle]}>{t('homeGreeting')}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={22} color={colors.primary} />
            <Text style={styles.location}>{locationName || 'Sialkot'}</Text>
          </View>
        </View>

        <View style={styles.iconRow}>
          <TouchableOpacity style={styles.roundIcon}>
            <Ionicons name="notifications-outline" size={25} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.roundIcon} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-circle-outline" size={32} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.weatherCard}
        onPress={() => navigation.navigate('WeatherAdvisory')}
        activeOpacity={0.9}
      >
        <View style={styles.weatherHeaderRow}>
          <View>
            <Text style={styles.temp}>
              {weatherData ? `${Math.round(weatherData.current.temp)}°C` : WEATHER_PLACEHOLDER.temperature}
            </Text>
            <Text style={styles.weather}>
              {weatherData ? weatherData.current.condition : WEATHER_PLACEHOLDER.condition}
            </Text>
          </View>
          {weatherData && weatherData.current.conditionIcon && (
            <Image 
              source={{ uri: weatherData.current.conditionIcon }} 
              style={styles.homeWeatherIcon} 
            />
          )}
        </View>

        <View style={styles.weatherInfoRow}>
          <Text style={styles.weatherInfo}>
            {t('humidity')}: {weatherData ? `${weatherData.current.humidity}%` : WEATHER_PLACEHOLDER.humidity}
          </Text>
          <Text style={styles.weatherInfo}>
            {t('wind')}: {weatherData ? `${Math.round(weatherData.current.windSpeed)} km/h` : WEATHER_PLACEHOLDER.windSpeed}
          </Text>
        </View>

        <View style={styles.homeSprayDivider} />

        <Text style={styles.sprayText}>
          {sprayAdvisory ? (
            sprayAdvisory.hasWindow 
              ? `${t('optimalSprayWindow')}: ${sprayAdvisory.windows[0].start} - ${sprayAdvisory.windows[0].end}`
              : t('avoidSprayToday')
          ) : (
            t('bestSprayMorning')
          )}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate('Scan')}
      >
        <Ionicons name="camera" size={28} color="#fff" />
        <Text style={styles.scanText}>{t('scanNow')}</Text>
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, textStyle]}>{t('recentDiagnosis')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('History')}>
          <Text style={styles.viewAll}>{t('viewAll')}</Text>
        </TouchableOpacity>
      </View>

      {recentScans.length === 0 ? (
        <View style={styles.emptyRecent}>
          <Ionicons name="leaf-outline" size={44} color={colors.primary} />
          <Text style={[styles.emptyTitle, textStyle]}>{t('noSavedDiagnosis')}</Text>
          <Text style={[styles.emptyText, textStyle]}>
            {t('saveToSeeHere')}
          </Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recentScans.map((item, index) => {
            const confidence = getConfidence(item.confidence);

            return (
              <TouchableOpacity
                key={`${item.id || 'recent'}-${index}`}
                style={styles.recentCard}
                onPress={() => openResult(item)}
              >
                {item.imageUri ? (
                  <Image source={{ uri: item.imageUri }} style={styles.recentImage} />
                ) : (
                  <View style={styles.recentImagePlaceholder}>
                    <Ionicons name="leaf-outline" size={32} color={colors.primary} />
                  </View>
                )}

                <Text style={[styles.cropText, textStyle]}>{getCropLabel(item.crop, language)}</Text>
                <Text style={[styles.diseaseText, textStyle]} numberOfLines={1}>
                  {getDiseaseLabel(item.disease, language)}
                </Text>
                <Text style={[styles.dateText, textStyle]}>{formatDate(item.date)}</Text>

                <View style={[styles.cardBottom, language === 'ur' && { flexDirection: 'row-reverse' }]}>
                  <SeverityBadge severity={item.severity || 'Medium'} />
                  <Text style={styles.confidence}>{confidence.toFixed(1)}%</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <Text style={[styles.sectionTitle, textStyle]}>{t('diseaseAlerts')}</Text>

      <View style={[styles.alertCard, language === 'ur' && { flexDirection: 'row-reverse' }]}>
        <Ionicons name="warning-outline" size={28} color="#FF8F00" />
        <View style={{ flex: 1, marginLeft: language === 'ur' ? 0 : 12, marginRight: language === 'ur' ? 12 : 0 }}>
          <Text style={[styles.alertTitle, textStyle]}>{t('diseaseAlertArea')}</Text>
          <Text style={[styles.alertDisease, textStyle]}>{language === 'ur' ? 'پتوں کا جھلساؤ' : 'Leaf Blight'}</Text>
          <Text style={[styles.alertText, textStyle]}>{t('affectedCrops')}</Text>
          <Text style={[styles.alertDate, textStyle]}>{language === 'ur' ? '۲۳ اپریل ۲۰۲۶' : '23 Apr 2026'}</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, textStyle]}>{t('cultivationTips')}</Text>

      <View style={[styles.tipCard, language === 'ur' && { flexDirection: 'row-reverse' }]}>
        <Ionicons name="water-outline" size={28} color={colors.primary} />
        <View style={{ flex: 1, marginLeft: language === 'ur' ? 0 : 12, marginRight: language === 'ur' ? 12 : 0 }}>
          <Text style={[styles.tipTitle, textStyle]}>{t('avoidOverwatering')}</Text>
          <Text style={[styles.tipText, textStyle]}>
            {t('overwateringTip')}
          </Text>
        </View>
      </View>

      <View style={[styles.tipCard, language === 'ur' && { flexDirection: 'row-reverse' }]}>
        <Ionicons name="leaf-outline" size={28} color={colors.primary} />
        <View style={{ flex: 1, marginLeft: language === 'ur' ? 0 : 12, marginRight: language === 'ur' ? 12 : 0 }}>
          <Text style={[styles.tipTitle, textStyle]}>{t('inspectWeekly')}</Text>
          <Text style={[styles.tipText, textStyle]}>
            {t('inspectWeeklyTip')}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FBF6',
  },
  content: {
    padding: 18,
    paddingBottom: 120,
  },
  topRow: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: '#5A7A5A',
    fontSize: 16,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  location: {
    fontSize: 24,
    fontWeight: '900',
    marginLeft: 6,
    color: '#102A12',
  },
  iconRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roundIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherCard: {
    marginTop: 26,
    backgroundColor: colors.primary,
    borderRadius: 26,
    padding: 22,
    elevation: 5,
  },
  temp: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
  },
  weather: {
    fontSize: 20,
    color: '#fff',
    marginTop: 5,
  },
  weatherInfoRow: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weatherInfo: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  sprayText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 22,
  },
  scanButton: {
    marginTop: 24,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#1F7A2E',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  scanText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '900',
    marginLeft: 10,
  },
  sectionHeader: {
    marginTop: 30,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 14,
    fontSize: 25,
    fontWeight: '900',
    color: '#102A12',
  },
  viewAll: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 16,
  },
  emptyRecent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#102A12',
    marginTop: 10,
  },
  emptyText: {
    color: '#6A856A',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  recentCard: {
    width: 210,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    marginRight: 14,
    elevation: 3,
  },
  recentImage: {
    height: 110,
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
  },
  recentImagePlaceholder: {
    height: 110,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 12,
  },
  diseaseText: {
    color: '#102A12',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  dateText: {
    color: '#6A856A',
    marginTop: 5,
  },
  cardBottom: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidence: {
    color: colors.primary,
    fontWeight: '900',
  },
  alertCard: {
    backgroundColor: '#FFF8EC',
    borderLeftWidth: 7,
    borderLeftColor: '#FF8F00',
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    elevation: 2,
  },
  alertTitle: {
    color: '#FF8F00',
    fontSize: 17,
    fontWeight: '900',
  },
  alertDisease: {
    color: '#102A12',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },
  alertText: {
    color: '#6A856A',
    fontSize: 15,
    marginTop: 4,
  },
  alertDate: {
    color: '#6A856A',
    marginTop: 8,
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    elevation: 2,
  },
  tipTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#102A12',
  },
  tipText: {
    color: '#6A856A',
    marginTop: 5,
    lineHeight: 20,
  },
  weatherHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  homeWeatherIcon: {
    width: 52,
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
  },
  homeSprayDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginVertical: 14,
  },
});
