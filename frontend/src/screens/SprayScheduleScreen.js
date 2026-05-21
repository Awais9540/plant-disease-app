import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

export default function SprayScheduleScreen({ navigation }) {
  const addReminder = () => {
    Alert.alert('Reminder Added', 'Demo reminder saved. Real notifications can be added later.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color={colors.primary} />
      </TouchableOpacity>

      <Text style={styles.title}>Spray Schedule</Text>
      <Text style={styles.subtitle}>Plan safe spraying time and reduce disease spread.</Text>

      <View style={styles.heroCard}>
        <Ionicons name="partly-sunny-outline" size={42} color="#fff" />
        <Text style={styles.heroTitle}>Best Spray Time</Text>
        <Text style={styles.heroText}>Morning or evening when wind is low and temperature is moderate.</Text>
      </View>

      {[
        ['Morning Spray', '6:00 AM - 9:00 AM', 'Best for most fungicide and pesticide sprays.'],
        ['Evening Spray', '5:00 PM - 7:00 PM', 'Good when daytime temperature is very high.'],
        ['Avoid Spray', '12:00 PM - 3:00 PM', 'Heat and wind can reduce spray effectiveness.'],
      ].map((item) => (
        <View key={item[0]} style={styles.card}>
          <Ionicons name="time-outline" size={28} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.cardTitle}>{item[0]}</Text>
            <Text style={styles.cardTime}>{item[1]}</Text>
            <Text style={styles.cardText}>{item[2]}</Text>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.btn} onPress={addReminder}>
        <Ionicons name="notifications-outline" size={21} color="#fff" />
        <Text style={styles.btnText}>Add Spray Reminder</Text>
      </TouchableOpacity>
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
  heroCard: {
    marginTop: 22,
    backgroundColor: colors.primary,
    borderRadius: 28,
    padding: 24,
    elevation: 5,
  },
  heroTitle: { marginTop: 12, color: '#fff', fontSize: 24, fontWeight: '900' },
  heroText: { marginTop: 8, color: '#E8F5E9', lineHeight: 21, fontWeight: '600' },
  card: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#102A12' },
  cardTime: { marginTop: 5, color: colors.primary, fontWeight: '900' },
  cardText: { marginTop: 5, color: '#6A856A', lineHeight: 20 },
  btn: {
    marginTop: 22,
    backgroundColor: colors.primary,
    borderRadius: 20,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  btnText: { color: '#fff', fontWeight: '900', marginLeft: 8 },
});