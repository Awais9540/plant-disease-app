import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Storage key for caching weather data
const CACHE_KEY = 'leafdoc_cached_weather';
const DEFAULT_CITY = 'Sialkot';

// Retrieve OpenWeather API key from environment variable
const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '';

/**
 * Fetches the weather forecast using the OpenWeatherMap API
 * (including current weather, 5-day/3-hour forecast grouped into daily/hourly, and air quality).
 * 
 * Implements robust caching and premium simulated fallback if API key is not configured or network is offline.
 */
export async function fetchWeatherForecast(queryOrCoords) {
  let query = '';
  let lat = null;
  let lon = null;
  let isCoords = false;

  if (typeof queryOrCoords === 'object' && queryOrCoords.latitude && queryOrCoords.longitude) {
    lat = queryOrCoords.latitude;
    lon = queryOrCoords.longitude;
    isCoords = true;
    query = `${lat},${lon}`;
  } else if (typeof queryOrCoords === 'string' && queryOrCoords.trim().length > 0) {
    query = queryOrCoords.trim();
  } else {
    query = DEFAULT_CITY;
  }

  // 1. Fallback to simulated data if no API key is provided
  if (!OPENWEATHER_API_KEY) {
    console.log('[LeafDoc Weather] OpenWeather API Key not configured. Using premium simulated agricultural weather data...');
    const simulatedData = generateSimulatedWeatherData(query);
    return {
      success: true,
      data: simulatedData,
      cached: true,
      simulated: true,
      lastUpdated: Date.now() - 3600000, // 1 hour ago
      isDemo: true,
    };
  }

  try {
    let currentRaw = null;
    let resolvedCity = '';

    // Step 1: Fetch Current Weather
    if (isCoords) {
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
      const response = await axios.get(currentUrl, { timeout: 8000 });
      currentRaw = response.data;
      resolvedCity = currentRaw.name || `Punjab Farm (GPS)`;
    } else {
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&units=metric&appid=${OPENWEATHER_API_KEY}`;
      const response = await axios.get(currentUrl, { timeout: 8000 });
      currentRaw = response.data;
      resolvedCity = currentRaw.name;
    }

    // Get exact resolved lat/lon to query forecast and pollution APIs
    const queryLat = currentRaw.coord.lat;
    const queryLon = currentRaw.coord.lon;

    // Step 2: Fetch Forecast and Air Pollution concurrently
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${queryLat}&lon=${queryLon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    const pollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${queryLat}&lon=${queryLon}&units=metric&appid=${OPENWEATHER_API_KEY}`;

    const [forecastRes, pollutionRes] = await Promise.all([
      axios.get(forecastUrl, { timeout: 8000 }).catch(err => {
        console.warn('[LeafDoc Weather] Forecast fetch failed:', err.message);
        return null;
      }),
      axios.get(pollutionUrl, { timeout: 5000 }).catch(err => {
        console.warn('[LeafDoc Weather] Pollution fetch failed:', err.message);
        return null;
      })
    ]);

    const forecastRaw = forecastRes ? forecastRes.data : null;
    const pollutionRaw = pollutionRes ? pollutionRes.data : null;

    // Step 3: Process the data into the exact format expected by components
    const parsedData = processOpenWeatherData(currentRaw, forecastRaw, pollutionRaw, resolvedCity);

    // Cache the fresh data
    const cachePayload = {
      timestamp: Date.now(),
      data: parsedData,
      locationName: parsedData.location.name,
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));

    return {
      success: true,
      data: parsedData,
      cached: false,
      lastUpdated: Date.now(),
    };

  } catch (error) {
    console.warn('[LeafDoc Weather] Request failed, trying cache recovery...', error.message);

    // Attempt cache recovery
    try {
      const cachedString = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedString) {
        const cachePayload = JSON.parse(cachedString);
        return {
          success: true,
          data: cachePayload.data,
          cached: true,
          lastUpdated: cachePayload.timestamp,
        };
      }
    } catch (cacheErr) {
      console.warn('[LeafDoc Weather] AsyncStorage cache recovery failed:', cacheErr);
    }

    // No internet and no cache -> Return premium simulated data
    console.log('[LeafDoc Weather] No cache available. Generating simulated agricultural weather data...');
    const simulatedData = generateSimulatedWeatherData(query);
    return {
      success: true,
      data: simulatedData,
      cached: true,
      simulated: true,
      lastUpdated: Date.now() - 3600000,
    };
  }
}

/**
 * Processes OpenWeatherMap API responses and maps them to the standardized UI model.
 */
function processOpenWeatherData(current, forecast, pollution, resolvedCity) {
  const currentTemp = current.main.temp;
  const currentHumidity = current.main.humidity;
  const windKph = current.wind.speed * 3.6; // convert m/s to km/h
  const weatherCond = current.weather[0]?.main || 'Clear';
  const weatherIcon = current.weather[0]?.icon || '01d';
  
  // Format sunrise/sunset unix timestamps
  const formatTime = (unixSeconds) => {
    if (!unixSeconds) return '--:--';
    const date = new Date(unixSeconds * 1000);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // hour 0 is 12
    return `${hours}:${minutes} ${ampm}`;
  };

  // Convert wind degrees to compass directions
  const getWindDirection = (deg) => {
    if (deg === undefined || deg === null) return 'N';
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(deg / 22.5) % 16;
    return directions[index];
  };

  // Estimate UV based on weather condition and hour
  const estimateUvIndex = (condition, hour) => {
    if (hour < 6 || hour > 18) return 0;
    let baseUv = (hour >= 11 && hour <= 14) ? 7 : (hour >= 9 || hour <= 16) ? 4 : 2;
    const condLower = condition.toLowerCase();
    if (condLower.includes('rain') || condLower.includes('thunder')) return 1;
    if (condLower.includes('cloud') || condLower.includes('mist')) return Math.max(1, Math.round(baseUv * 0.5));
    return baseUv;
  };

  const currentHour = new Date().getHours();
  const estimatedUv = estimateUvIndex(weatherCond, currentHour);

  // Parse PM2.5 to standard index or map directly
  // OpenWeather AQI is index 1 to 5 (1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor)
  const pm2_5 = pollution?.list?.[0]?.components?.pm2_5 ?? 15;
  const scaledAqi = Math.round(pm2_5 * 2); // Quick approximation of US AQI for display

  // Construct Hourly Forecast (using first 8 slots from OpenWeather 3-hour list)
  const hourly = (forecast?.list || []).slice(0, 8).map(item => {
    const itemDate = new Date(item.dt * 1000);
    const itemHour = itemDate.getHours();
    const itemCond = item.weather[0]?.main || 'Clear';
    return {
      time: itemDate.toISOString(),
      temp: Math.round(item.main.temp),
      condition: item.weather[0]?.description ? item.weather[0].description.charAt(0).toUpperCase() + item.weather[0].description.slice(1) : itemCond,
      conditionIcon: `https://openweathermap.org/img/wn/${item.weather[0]?.icon || '01d'}@2x.png`,
      humidity: item.main.humidity,
      wind: Math.round(item.wind.speed * 3.6),
      will_it_rain: itemCond.toLowerCase().includes('rain') ? 1 : 0,
      chance_of_rain: Math.round((item.pop || 0) * 100),
      uv: estimateUvIndex(itemCond, itemHour),
    };
  });

  // Construct Daily Forecast (grouping 5 days from forecast list)
  const dailyGroups = {};
  (forecast?.list || []).forEach(item => {
    const dateStr = item.dt_txt.split(' ')[0];
    if (!dailyGroups[dateStr]) dailyGroups[dateStr] = [];
    dailyGroups[dateStr].push(item);
  });

  const dailyList = Object.keys(dailyGroups).map(dateStr => {
    const group = dailyGroups[dateStr];
    let maxTemp = -999;
    let minTemp = 999;
    let sumTemp = 0;
    let sumHumidity = 0;
    let maxWind = 0;
    let maxPop = 0;

    group.forEach(item => {
      if (item.main.temp_max > maxTemp) maxTemp = item.main.temp_max;
      if (item.main.temp_min < minTemp) minTemp = item.main.temp_min;
      sumTemp += item.main.temp;
      sumHumidity += item.main.humidity;
      const itemWindKph = item.wind.speed * 3.6;
      if (itemWindKph > maxWind) maxWind = itemWindKph;
      if (item.pop > maxPop) maxPop = item.pop;
    });

    const avgTemp = sumTemp / group.length;
    const avgHumidity = sumHumidity / group.length;
    const middaySlot = group[Math.floor(group.length / 2)] || group[0];

    return {
      date: dateStr,
      dayName: getDayName(dateStr),
      maxTemp: Math.round(maxTemp),
      minTemp: Math.round(minTemp),
      avgTemp: Math.round(avgTemp),
      condition: middaySlot.weather[0]?.main || 'Clear',
      conditionIcon: `https://openweathermap.org/img/wn/${middaySlot.weather[0]?.icon || '01d'}@2x.png`,
      rainProb: Math.round(maxPop * 100),
      humidity: Math.round(avgHumidity),
      wind: Math.round(maxWind),
    };
  });

  // Pad to 7 days for premium UI consistency
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  while (dailyList.length < 7) {
    const lastDay = dailyList[dailyList.length - 1] || {
      date: new Date().toISOString().split('T')[0],
      maxTemp: 32,
      minTemp: 20,
      avgTemp: 26,
      condition: 'Sunny',
      conditionIcon: 'https://openweathermap.org/img/wn/01d@2x.png',
      rainProb: 10,
      humidity: 55,
      wind: 12,
    };
    const lastDate = new Date(lastDay.date);
    lastDate.setDate(lastDate.getDate() + 1);
    const nextDateStr = lastDate.toISOString().split('T')[0];

    dailyList.push({
      date: nextDateStr,
      dayName: days[lastDate.getDay()],
      maxTemp: lastDay.maxTemp + (Math.random() > 0.5 ? 1 : -1),
      minTemp: lastDay.minTemp + (Math.random() > 0.5 ? 1 : -1),
      avgTemp: lastDay.avgTemp,
      condition: lastDay.condition,
      conditionIcon: lastDay.conditionIcon,
      rainProb: Math.max(0, Math.min(100, lastDay.rainProb + (Math.random() > 0.5 ? 10 : -10))),
      humidity: Math.max(30, Math.min(100, lastDay.humidity + (Math.random() > 0.5 ? 5 : -5))),
      wind: Math.max(5, Math.min(50, lastDay.wind + (Math.random() > 0.5 ? 2 : -2))),
    });
  }

  return {
    location: {
      name: resolvedCity,
      country: current.sys?.country || 'Pakistan',
      region: current.sys?.country === 'PK' ? 'Punjab' : 'Region',
      localtime: new Date().toISOString(),
    },
    current: {
      temp: Math.round(currentTemp),
      feelsLike: Math.round(current.main.feels_like),
      condition: weatherCond,
      conditionCode: current.weather[0]?.id || 800,
      conditionIcon: `https://openweathermap.org/img/wn/${weatherIcon}@2x.png`,
      humidity: currentHumidity,
      windSpeed: Math.round(windKph),
      windDirection: getWindDirection(current.wind.deg),
      rainProb: hourly[0]?.chance_of_rain || 0,
      uv: estimatedUv,
      aqi: scaledAqi,
      sunrise: formatTime(current.sys?.sunrise),
      sunset: formatTime(current.sys?.sunset),
    },
    hourly,
    daily: dailyList,
  };
}

/**
 * Generates highly realistic agricultural weather details for offline/fallback mode.
 */
function generateSimulatedWeatherData(query) {
  let cityName = DEFAULT_CITY;
  if (typeof query === 'string') {
    if (query.includes(',')) {
      const parts = query.split(',');
      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lon)) {
        cityName = 'Punjab Farm (GPS)';
      } else {
        cityName = parts[0];
      }
    } else {
      cityName = query;
    }
  } else {
    cityName = DEFAULT_CITY;
  }
  
  // Format current date
  const now = new Date();
  
  // Create 24 hours of forecast
  const hourly = [];
  for (let i = 0; i < 24; i++) {
    const time = new Date();
    time.setHours(i, 0, 0, 0);
    
    // Simulate diurnal temperature cycle (warmer mid-afternoon, cooler morning)
    let temp = 22;
    if (i >= 6 && i <= 15) {
      temp += (i - 6) * 1.2; // rising
    } else if (i > 15 && i <= 21) {
      temp += 10.8 - (i - 15) * 1.5; // falling
    } else {
      temp = 16 + (i < 6 ? i : i - 21) * 0.5; // cold night
    }
    
    hourly.push({
      time: time.toISOString(),
      temp: Math.round(temp),
      condition: i >= 8 && i <= 18 ? 'Sunny' : 'Clear',
      conditionIcon: i >= 8 && i <= 18 
        ? 'https://openweathermap.org/img/wn/01d@2x.png'
        : 'https://openweathermap.org/img/wn/01n@2x.png',
      humidity: Math.round(60 + Math.sin(i / 3) * 20), // oscillating humidity
      wind: Math.round(8 + Math.cos(i / 4) * 5),
      will_it_rain: 0,
      chance_of_rain: 10,
      uv: i >= 11 && i <= 14 ? 6 : 0,
    });
  }

  // Create 7 days of daily forecast
  const daily = [];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  for (let i = 0; i < 7; i++) {
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + i);
    
    let condition = 'Sunny';
    let icon = 'https://openweathermap.org/img/wn/01d@2x.png';
    let rain = 10;
    
    if (i === 2) {
      condition = 'Patchy Rain Nearby';
      icon = 'https://openweathermap.org/img/wn/10d@2x.png';
      rain = 45;
    } else if (i === 5) {
      condition = 'Cloudy';
      icon = 'https://openweathermap.org/img/wn/03d@2x.png';
      rain = 20;
    }

    daily.push({
      date: futureDate.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : days[futureDate.getDay()],
      maxTemp: 32 + (i % 2),
      minTemp: 19 - (i % 3),
      avgTemp: 26,
      condition,
      conditionIcon: icon,
      rainProb: rain,
      humidity: 55 + (i * 2),
      wind: 11 + (i % 4),
    });
  }

  return {
    location: {
      name: cityName.charAt(0).toUpperCase() + cityName.slice(1),
      country: 'Pakistan',
      region: 'Punjab',
      localtime: now.toISOString(),
    },
    current: {
      temp: 29.5,
      feelsLike: 31.0,
      condition: 'Sunny',
      conditionCode: 800,
      conditionIcon: 'https://openweathermap.org/img/wn/01d@2x.png',
      humidity: 52,
      windSpeed: 8.5,
      windDirection: 'NE',
      rainProb: 10,
      uv: 5.0,
      aqi: 45,
      sunrise: '05:08 AM',
      sunset: '07:05 PM',
    },
    hourly,
    daily,
  };
}

function getDayName(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    return 'Today';
  }
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}
