import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function WeatherCard({ current, locationName, cached, lastUpdated }) {
  if (!current) return null;

  // Format the last updated text
  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const minStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${hour12}:${minStr} ${ampm}`;
  };

  // Weather icon fallback handler
  const renderConditionIcon = () => {
    if (current.conditionIcon) {
      return <Image source={{ uri: current.conditionIcon }} style={styles.weatherIcon} />;
    }
    // Fallback emoji icon
    return <Text style={styles.emojiIcon}>☀️</Text>;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2E7D32', '#1B5E20']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Header Location & Sync Badge */}
        <View style={styles.header}>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={20} color="#fff" />
            <Text style={styles.locationText}>{locationName}</Text>
          </View>
          
          {cached && (
            <View style={styles.cacheBadge}>
              <MaterialCommunityIcons name="cloud-off-outline" size={14} color="#FFD54F" />
              <Text style={styles.cacheText}>Offline Cache</Text>
            </View>
          )}
        </View>

        {/* Temperature & Main Conditions */}
        <View style={styles.mainRow}>
          <View>
            <View style={styles.tempRow}>
              <Text style={styles.temp}>{Math.round(current.temp)}</Text>
              <Text style={styles.degreeSymbol}>°C</Text>
            </View>
            <Text style={styles.condition}>{current.condition}</Text>
            <Text style={styles.feelsLike}>Feels like {Math.round(current.feelsLike)}°C</Text>
          </View>
          <View style={styles.iconContainer}>
            {renderConditionIcon()}
          </View>
        </View>

        {/* Grid Stats (Glassmorphism layout) */}
        <View style={styles.grid}>
          {/* Stat Item: Humidity */}
          <View style={styles.gridCell}>
            <Ionicons name="water" size={18} color="#A5D6A7" />
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{current.humidity}%</Text>
              <Text style={styles.statLabel}>Humidity</Text>
            </View>
          </View>

          {/* Stat Item: Wind */}
          <View style={styles.gridCell}>
            <Ionicons name="flag" size={18} color="#A5D6A7" />
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{Math.round(current.windSpeed)} km/h</Text>
              <Text style={styles.statLabel}>Wind Speed</Text>
            </View>
          </View>

          {/* Stat Item: UV Index */}
          <View style={styles.gridCell}>
            <Ionicons name="sunny" size={18} color="#A5D6A7" />
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{current.uv}</Text>
              <Text style={styles.statLabel}>UV Index</Text>
            </View>
          </View>

          {/* Stat Item: Air Quality */}
          <View style={styles.gridCell}>
            <Ionicons name="leaf" size={18} color="#A5D6A7" />
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{current.aqi} AQI</Text>
              <Text style={styles.statLabel}>Air Quality</Text>
            </View>
          </View>
        </View>

        {/* Footer info: Last Updated */}
        <View style={styles.footer}>
          <Text style={styles.updatedText}>
            Last updated: {lastUpdated ? formatTime(lastUpdated) : 'Just now'}
          </Text>
          <View style={styles.astroRow}>
            <Ionicons name="sunny-outline" size={13} color="#E8F5E9" style={{ marginRight: 2 }} />
            <Text style={styles.astroText}>{current.sunrise} • </Text>
            <Ionicons name="moon-outline" size={13} color="#E8F5E9" style={{ marginRight: 2 }} />
            <Text style={styles.astroText}>{current.sunset}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    borderRadius: 28,
    shadowColor: '#1B5E20',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    borderRadius: 28,
    padding: 22,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '900',
    marginLeft: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cacheBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  cacheText: {
    color: '#FFD54F',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 4,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  temp: {
    color: '#fff',
    fontSize: 66,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 74,
  },
  degreeSymbol: {
    color: '#E8F5E9',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 6,
    marginLeft: 2,
  },
  condition: {
    color: '#E8F5E9',
    fontSize: 20,
    fontWeight: '700',
    marginTop: -2,
  },
  feelsLike: {
    color: '#A5D6A7',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  iconContainer: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  weatherIcon: {
    width: 68,
    height: 68,
  },
  emojiIcon: {
    fontSize: 54,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 14,
    marginBottom: 16,
  },
  gridCell: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statContent: {
    marginLeft: 10,
    flexShrink: 1,
  },
  statValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  statLabel: {
    color: '#A5D6A7',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 14,
  },
  updatedText: {
    color: '#A5D6A7',
    fontSize: 12,
    fontWeight: '600',
  },
  astroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  astroText: {
    color: '#E8F5E9',
    fontSize: 11,
    fontWeight: '700',
  },
});
