import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WeeklyForecast({ daily }) {
  if (!daily || daily.length === 0) return null;

  // Compute the global weekly minimum and maximum temperatures to scale range-bars
  const allMins = daily.map((d) => d.minTemp);
  const allMaxs = daily.map((d) => d.maxTemp);
  const globalMin = Math.min(...allMins);
  const globalMax = Math.max(...allMaxs);
  const globalSpan = globalMax - globalMin || 1;

  const renderDailyRows = () => {
    return daily.map((day, index) => {
      // Calculate layout percentage metrics for the range bar
      const minPct = ((day.minTemp - globalMin) / globalSpan) * 100;
      const maxPct = ((day.maxTemp - globalMin) / globalSpan) * 100;
      const widthPct = maxPct - minPct || 5; // ensure at least some width

      return (
        <View key={`${day.date}-${index}`} style={styles.row}>
          {/* Day Label */}
          <Text style={styles.dayLabel}>{day.dayName}</Text>

          {/* Condition Icon and Rain probability */}
          <View style={styles.conditionCol}>
            {day.conditionIcon ? (
              <Image source={{ uri: day.conditionIcon }} style={styles.conditionIcon} />
            ) : (
              <Ionicons name="sunny-outline" size={20} color="#FF8F00" />
            )}
            
            {day.rainProb > 15 && (
              <Text style={styles.rainChanceText}>{day.rainProb}%</Text>
            )}
          </View>

          {/* Temperature Range Slider Widget */}
          <View style={styles.tempRangeWidget}>
            <Text style={styles.minTempText}>{Math.round(day.minTemp)}°</Text>
            
            {/* Visual range track */}
            <View style={styles.rangeTrack}>
              <View 
                style={[
                  styles.activeRangePill,
                  {
                    left: `${minPct}%`,
                    width: `${widthPct}%`,
                  }
                ]}
              />
            </View>

            <Text style={styles.maxTempText}>{Math.round(day.maxTemp)}°</Text>
          </View>
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>7-Day Forecast</Text>
      <View style={styles.forecastCard}>
        {renderDailyRows()}
      </View>
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
  forecastCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1ECE6',
  },
  dayLabel: {
    width: 80,
    fontSize: 15,
    fontWeight: '800',
    color: '#102A12',
  },
  conditionCol: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionIcon: {
    width: 28,
    height: 28,
  },
  rainChanceText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#1E88E5',
    marginTop: -2,
  },
  tempRangeWidget: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 14,
  },
  minTempText: {
    width: 28,
    fontSize: 14,
    fontWeight: '700',
    color: '#8BA18B',
    textAlign: 'right',
  },
  maxTempText: {
    width: 28,
    fontSize: 14,
    fontWeight: '800',
    color: '#102A12',
    textAlign: 'left',
    marginLeft: 8,
  },
  rangeTrack: {
    flex: 1,
    height: 5,
    backgroundColor: '#E8F5E9',
    borderRadius: 3,
    marginHorizontal: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  activeRangePill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
});
