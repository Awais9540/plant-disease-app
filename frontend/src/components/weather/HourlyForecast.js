import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/theme';

export default function HourlyForecast({ hourly }) {
  if (!hourly || hourly.length === 0) return null;

  // Render hourly scroll steps
  const renderHours = () => {
    return hourly.slice(0, 24).map((item, index) => {
      const dateObj = new Date(item.time);
      const hourNum = dateObj.getHours();
      
      // Determine active hour format (e.g. "12 PM", "6 AM")
      const currentHour = new Date().getHours();
      const isCurrent = hourNum === currentHour;
      
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const hour12 = hourNum % 12 || 12;
      const displayTime = isCurrent ? 'Now' : `${hour12} ${ampm}`;

      const rainChance = item.chance_of_rain ?? (item.will_it_rain ? 100 : 0);

      return (
        <View 
          key={`${item.time}-${index}`} 
          style={[
            styles.hourCard,
            isCurrent && styles.activeCard
          ]}
        >
          <Text style={[styles.timeText, isCurrent && styles.activeText]}>
            {displayTime}
          </Text>
          
          <View style={styles.iconWrapper}>
            {item.conditionIcon ? (
              <Image source={{ uri: item.conditionIcon }} style={styles.weatherIcon} />
            ) : (
              <Ionicons name="cloud-outline" size={24} color={isCurrent ? '#fff' : colors.primary} />
            )}
          </View>

          <Text style={[styles.tempText, isCurrent && styles.activeText]}>
            {Math.round(item.temp)}°
          </Text>

          {/* Rain Probability Pill */}
          {rainChance > 10 ? (
            <View style={styles.rainBadge}>
              <Ionicons name="water" size={10} color="#1E88E5" />
              <Text style={styles.rainText}>{rainChance}%</Text>
            </View>
          ) : (
            <View style={[styles.rainBadge, { backgroundColor: 'transparent', borderWidth: 0 }]}>
              <Text style={[styles.rainText, { color: '#8BA18B' }]}>-</Text>
            </View>
          )}

          {/* Wind pill */}
          <View style={styles.windRow}>
            <Ionicons name="flag-outline" size={10} color={isCurrent ? '#A5D6A7' : '#6A856A'} />
            <Text style={[styles.windText, isCurrent && styles.activeSubtext]}>
              {Math.round(item.wind)}kph
            </Text>
          </View>
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>24-Hour Forecast</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderHours()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#102A12',
    marginBottom: 12,
  },
  scrollContent: {
    paddingLeft: 4,
    paddingRight: 20,
    gap: 12,
  },
  hourCard: {
    width: 76,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8F5E9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  activeCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  timeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5A7A5A',
  },
  activeText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  activeSubtext: {
    color: '#E8F5E9',
  },
  iconWrapper: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
  },
  weatherIcon: {
    width: 36,
    height: 36,
  },
  tempText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#102A12',
  },
  rainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 8,
    minHeight: 18,
  },
  rainText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1E88E5',
    marginLeft: 2,
  },
  windRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  windText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6A856A',
    marginLeft: 2,
  },
});
