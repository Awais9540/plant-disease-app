import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';
import { WEATHER_PLACEHOLDER } from '../utils/constants';

export default function WeatherAdvisoryScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color={colors.primary} />
      </TouchableOpacity>

      <Text style={styles.title}>Weather Advisory</Text>
      <Text style={styles.subtitle}>Spray and disease risk advice based on local weather.</Text>

      <View style={styles.weatherCard}>
        <Text style={styles.temp}>{WEATHER_PLACEHOLDER.temperature}</Text>
        <Text style={styles.condition}>{WEATHER_PLACEHOLDER.condition}</Text>

        <View style={styles.row}>
          <Text style={styles.whiteText}>Humidity: {WEATHER_PLACEHOLDER.humidity}</Text>
          <Text style={styles.whiteText}>Wind: {WEATHER_PLACEHOLDER.windSpeed}</Text>
        </View>
      </View>

      <View style={styles.adviceCard}>
        <Ionicons name="checkmark-circle" size={30} color={colors.primary} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.adviceTitle}>Spray Advice</Text>
          <Text style={styles.adviceText}>
            Best time to spray today is {WEATHER_PLACEHOLDER.sprayTime}. Avoid spraying during strong wind, rain, or hot noon hours.
          </Text>
        </View>
      </View>

      <View style={styles.warningCard}>
        <Ionicons name="warning-outline" size={30} color="#FF8F00" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.warningTitle}>Disease Risk</Text>
          <Text style={styles.warningText}>
            High humidity can increase fungal disease risk. Inspect tomato, potato, grape and apple leaves regularly.
          </Text>
        </View>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Smart Tip</Text>
        <Text style={styles.tipText}>
          Scan leaves immediately when you notice yellowing, brown spots, rust-like dots, powdery marks, or curling.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6FBF6' },
  content: { padding: 18, paddingBottom: 120 },
  backBtn: {
    marginTop: 32,
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { marginTop: 18, fontSize: 32, fontWeight: '900', color: '#102A12' },
  subtitle: { marginTop: 6, color: '#6A856A', fontWeight: '600' },
  weatherCard: {
    marginTop: 22,
    backgroundColor: colors.primary,
    borderRadius: 28,
    padding: 24,
    elevation: 5,
  },
  temp: { color: '#fff', fontSize: 44, fontWeight: '900' },
  condition: { color: '#fff', fontSize: 22, marginTop: 6 },
  row: { marginTop: 26, flexDirection: 'row', justifyContent: 'space-between' },
  whiteText: { color: '#fff', fontWeight: '800' },
  adviceCard: {
    marginTop: 18,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    elevation: 3,
  },
  adviceTitle: { fontSize: 18, fontWeight: '900', color: '#102A12' },
  adviceText: { marginTop: 6, color: '#6A856A', lineHeight: 21 },
  warningCard: {
    marginTop: 14,
    backgroundColor: '#FFF8EC',
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    elevation: 3,
  },
  warningTitle: { fontSize: 18, fontWeight: '900', color: '#FF8F00' },
  warningText: { marginTop: 6, color: '#7A5A1A', lineHeight: 21 },
  tipCard: {
    marginTop: 14,
    backgroundColor: '#E8F5E9',
    borderRadius: 24,
    padding: 18,
  },
  tipTitle: { color: colors.primary, fontSize: 19, fontWeight: '900' },
  tipText: { marginTop: 6, color: '#4F724F', lineHeight: 21, fontWeight: '600' },
});