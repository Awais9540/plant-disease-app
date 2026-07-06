import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWeather } from '../context/WeatherContext';
import { colors } from '../utils/theme';
import WeatherCard from '../components/weather/WeatherCard';
import HourlyForecast from '../components/weather/HourlyForecast';
import WeeklyForecast from '../components/weather/WeeklyForecast';
import AdvisoryCard from '../components/weather/AdvisoryCard';
import { useLanguage } from '../context/LanguageContext';

export default function WeatherScreen({ navigation }) {
  const {
    weatherData,
    locationName,
    loading,
    error,
    lastUpdated,
    sprayAdvisory,
    diseaseRisk,
    farmingAlerts,
    refreshWeather,
    searchCity,
  } = useWeather();

  const [searchText, setSearchText] = useState('');
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const { t, textStyle, language } = useLanguage();

  // Pulse animation for loading skeleton
  useEffect(() => {
    let animation;
    if (loading && !weatherData) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.8,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    }
    return () => animation && animation.stop();
  }, [loading, weatherData, pulseAnim]);

  const handleSearch = async () => {
    if (searchText.trim().length === 0) return;
    Keyboard.dismiss();
    await searchCity(searchText.trim());
    setSearchText('');
  };

  // Render a gorgeous agricultural loading skeleton
  const renderLoadingSkeleton = () => {
    return (
      <View style={styles.skeletonContainer}>
        {/* Search header skeleton */}
        <View style={styles.skeletonHeader} />
        
        {/* Main Card skeleton */}
        <Animated.View style={[styles.skeletonCard, { opacity: pulseAnim }]} />
        
        {/* Advisory Card skeleton */}
        <Animated.View style={[styles.skeletonCard, { height: 160, opacity: pulseAnim }]} />
        
        {/* Forecast scroll skeleton */}
        <Animated.View style={[styles.skeletonHourly, { opacity: pulseAnim }]} />
        
        {/* Daily list skeleton */}
        <Animated.View style={[styles.skeletonCard, { height: 200, opacity: pulseAnim }]} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <View style={[styles.headerRow, language === 'ur' && { flexDirection: 'row-reverse' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, language === 'ur' ? { marginLeft: 14, marginRight: 0 } : { marginRight: 14 }]}>
          <Ionicons name={language === 'ur' ? 'arrow-forward' : 'arrow-back'} size={22} color={colors.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerTitles}>
          <Text style={[styles.headerTitle, textStyle]}>{t('weatherTitle')}</Text>
          <Text style={[styles.headerSubtitle, textStyle]}>{t('weatherSubtitle')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && !!weatherData}
            onRefresh={refreshWeather}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Search Bar / GPS Widget Row */}
        <View style={[styles.searchContainer, language === 'ur' && { flexDirection: 'row-reverse' }]}>
          <View style={[styles.inputWrapper, language === 'ur' && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="search" size={20} color="#8BA18B" style={[styles.searchIcon, language === 'ur' ? { marginLeft: 10, marginRight: 0 } : { marginRight: 10 }]} />
            <TextInput
              style={[styles.searchInput, textStyle, language === 'ur' && { textAlign: 'right' }]}
              placeholder={t('searchFarmingAreas')}
              placeholderTextColor="#8BA18B"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={18} color="#8BA18B" />
              </TouchableOpacity>
            )}
          </View>

          {/* GPS Button */}
          <TouchableOpacity 
            style={styles.gpsBtn} 
            onPress={refreshWeather} 
            disabled={loading}
          >
            <Ionicons name="locate" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={32} color={colors.error} />
            <Text style={[styles.errorText, textStyle]}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={refreshWeather}>
              <Text style={styles.retryText}>{t('retryLoading')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading state - Skeletons */}
        {loading && !weatherData && renderLoadingSkeleton()}

        {/* Success State */}
        {weatherData && (
          <View style={styles.dataContent}>
            {/* 1. Frosted Current Weather Card */}
            <WeatherCard
              current={weatherData.current}
              locationName={locationName}
              cached={weatherData.cached}
              lastUpdated={lastUpdated}
            />

            {/* 2. Intelligent Spray Suitability Advisory */}
            <AdvisoryCard
              sprayAdvisory={sprayAdvisory}
              diseaseRisk={diseaseRisk}
              farmingAlerts={farmingAlerts}
            />

            {/* 3. Horizontal scrolling 24h Hourly Forecast */}
            <HourlyForecast hourly={weatherData.hourly} />

            {/* 4. Vertical 7-Day Range Forecast */}
            <WeeklyForecast daily={weatherData.daily} />

            {/* Smart Farming Banner */}
            <View style={styles.tipCard}>
              <View style={[styles.tipHeader, language === 'ur' && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="sparkles" size={20} color={colors.primary} />
                <Text style={[styles.tipTitle, textStyle, language === 'ur' ? { marginRight: 8, marginLeft: 0 } : { marginLeft: 8 }]}>{t('decisionGuideline')}</Text>
              </View>
              <Text style={[styles.tipText, textStyle]}>
                {t('decisionGuidelineText')}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FBF6',
  },
  headerRow: {
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#102A12',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A856A',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#102A12',
    fontSize: 14,
    fontWeight: '700',
  },
  gpsBtn: {
    width: 52,
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    marginVertical: 14,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 14,
  },
  retryText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
  },
  dataContent: {
    flex: 1,
  },
  tipCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 24,
    padding: 18,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipTitle: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  tipText: {
    color: '#386A38',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  
  // Loading Skeletons Style
  skeletonContainer: {
    flex: 1,
    gap: 16,
    marginTop: 8,
  },
  skeletonHeader: {
    height: 20,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    width: '40%',
  },
  skeletonCard: {
    height: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  skeletonHourly: {
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
});
