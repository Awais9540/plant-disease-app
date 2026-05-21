import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../utils/theme';

const WeatherCard = ({ weather }) => (
  <LinearGradient colors={['#2E7D32', '#4CAF50']} style={{ borderRadius: 18, padding: 18 }}>
    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{weather.temperature}</Text>
    <Text style={{ color: '#E8F5E9', marginTop: 4 }}>{weather.condition}</Text>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
      <Text style={{ color: '#fff' }}>Humidity: {weather.humidity}</Text>
      <Text style={{ color: '#fff' }}>Wind: {weather.windSpeed}</Text>
    </View>
    <Text style={{ color: '#fff', marginTop: 10, fontWeight: '600' }}>
      Best time to spray today: {weather.sprayTime}
    </Text>
  </LinearGradient>
);

export default WeatherCard;
