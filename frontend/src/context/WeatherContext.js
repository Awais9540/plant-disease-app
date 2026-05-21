import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { fetchWeatherForecast } from '../services/weatherService';
import { calculateSprayScore, getBestSprayWindows, getFungalDiseaseRisk, getFarmingAdvice } from '../utils/sprayAdvisor';
import { scheduleLocalNotification } from '../utils/notificationHelper';

const WeatherContext = createContext();

const PREF_LOC_KEY = 'leafdoc_preferred_location';
const DEFAULT_CITY = 'Sialkot';

export function WeatherProvider({ children }) {
  const [weatherData, setWeatherData] = useState(null);
  const [locationName, setLocationName] = useState(DEFAULT_CITY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Agricultural Derived Analytics States
  const [sprayAdvisory, setSprayAdvisory] = useState(null);
  const [diseaseRisk, setDiseaseRisk] = useState(null);
  const [farmingAlerts, setFarmingAlerts] = useState([]);

  // Fetch weather data helper
  const loadWeatherData = async (queryOrCoords) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWeatherForecast(queryOrCoords);
      if (result.success && result.data) {
        setWeatherData(result.data);
        setLocationName(result.data.location.name);
        setLastUpdated(result.lastUpdated);

        // Calculate Agriculture insights
        const current = result.data.current;
        const scoreAnalysis = calculateSprayScore(
          current.temp,
          current.windSpeed,
          current.humidity,
          current.rainProb,
          current.uv
        );
        const windowsAnalysis = getBestSprayWindows(result.data.hourly);
        const fungalAnalysis = getFungalDiseaseRisk(current.temp, current.humidity, current.rainProb);
        const alertsList = getFarmingAdvice(
          current.temp,
          current.windSpeed,
          current.humidity,
          current.rainProb,
          current.uv
        );

        setSprayAdvisory({
          ...scoreAnalysis,
          windowsText: windowsAnalysis.text,
          windows: windowsAnalysis.windows,
          hasWindow: windowsAnalysis.hasWindow,
        });

        setDiseaseRisk(fungalAnalysis);
        setFarmingAlerts(alertsList);

        // Proactively trigger notification if risk is high or excellent window is available
        if (scoreAnalysis.score >= 80) {
          scheduleLocalNotification(
            'Optimal Spray Window Available 🚜',
            `Favorable spraying conditions detected in ${result.data.location.name} (Score: ${scoreAnalysis.score}/100). Wind is low, temperature is perfect.`,
            5 // trigger in 5 seconds
          );
        } else if (fungalAnalysis.level === 'High') {
          scheduleLocalNotification(
            'High Fungal Disease Risk Alert ⚠️',
            `Current weather in ${result.data.location.name} increases danger of Apple Scab and Blights. Check your leaf scan history.`,
            5
          );
        }
      } else {
        setError('Failed to download forecast data.');
      }
    } catch (err) {
      console.warn('Error in loadWeatherData:', err);
      setError('An error occurred while loading weather data.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Auto GPS Detection Flow
  const refreshWeatherByGPS = async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. Falling back to default region.');
        // Fallback to preferred or default
        const saved = await AsyncStorage.getItem(PREF_LOC_KEY);
        await loadWeatherData(saved || DEFAULT_CITY);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
      });

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      await loadWeatherData(coords);
      
      // Save this coordinates object or name as default
      await AsyncStorage.setItem(PREF_LOC_KEY, JSON.stringify(coords));
    } catch (err) {
      console.warn('GPS detection failed, falling back to cached city:', err.message);
      const saved = await AsyncStorage.getItem(PREF_LOC_KEY);
      
      let query = DEFAULT_CITY;
      if (saved) {
        try {
          query = JSON.parse(saved);
        } catch {
          query = saved;
        }
      }
      await loadWeatherData(query);
    }
  };

  // 2. Manual Search Flow
  const searchCity = async (cityName) => {
    if (!cityName || cityName.trim().length === 0) return;
    await loadWeatherData(cityName.trim());
    await AsyncStorage.setItem(PREF_LOC_KEY, cityName.trim());
  };

  // Auto initialize on mount
  useEffect(() => {
    const init = async () => {
      try {
        const saved = await AsyncStorage.getItem(PREF_LOC_KEY);
        if (saved) {
          let query = saved;
          try {
            query = JSON.parse(saved); // could be coordinate object
          } catch {
            query = saved; // is city string
          }
          await loadWeatherData(query);
        } else {
          // No saved location -> try GPS first, else default
          await refreshWeatherByGPS();
        }
      } catch (err) {
        console.warn('Context init failed:', err);
        await loadWeatherData(DEFAULT_CITY);
      }
    };
    init();
  }, []);

  return (
    <WeatherContext.Provider
      value={{
        weatherData,
        locationName,
        loading,
        error,
        lastUpdated,
        sprayAdvisory,
        diseaseRisk,
        farmingAlerts,
        refreshWeather: refreshWeatherByGPS,
        searchCity,
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
}
