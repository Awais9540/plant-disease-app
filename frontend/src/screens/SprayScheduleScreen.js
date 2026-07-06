import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';
import { useLanguage } from '../context/LanguageContext';

export default function SprayScheduleScreen({ navigation }) {
  const { t, textStyle, language } = useLanguage();

  const addReminder = () => {
    Alert.alert(t('reminderAddedTitle'), t('reminderAddedMsg'));
  };

  const scheduleItems = [
    [t('morningSpray'), t('morningSprayTime'), t('morningSprayDesc')],
    [t('eveningSpray'), t('eveningSprayTime'), t('eveningSprayDesc')],
    [t('avoidSpray'), t('avoidSprayTime'), t('avoidSprayDesc')],
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[language === 'ur' && { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name={language === 'ur' ? 'arrow-forward' : 'arrow-back'} size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, textStyle]}>{t('sprayScheduleTitle')}</Text>
      <Text style={[styles.subtitle, textStyle]}>{t('sprayScheduleSubtitle')}</Text>

      <View style={[styles.heroCard, language === 'ur' && { flexDirection: 'row-reverse' }]}>
        <Ionicons name="partly-sunny-outline" size={42} color="#fff" style={language === 'ur' ? { marginLeft: 16 } : { marginRight: 16 }} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, textStyle]}>{t('bestSprayTime')}</Text>
          <Text style={[styles.heroText, textStyle]}>{t('bestSprayTimeText')}</Text>
        </View>
      </View>

      {scheduleItems.map((item) => (
        <View key={item[0]} style={[styles.card, language === 'ur' && { flexDirection: 'row-reverse' }]}>
          <Ionicons name="time-outline" size={28} color={colors.primary} />
          <View style={[{ flex: 1 }, language === 'ur' ? { marginRight: 12, marginLeft: 0 } : { marginLeft: 12 }]}>
            <Text style={[styles.cardTitle, textStyle]}>{item[0]}</Text>
            <Text style={[styles.cardTime, textStyle]}>{item[1]}</Text>
            <Text style={[styles.cardText, textStyle]}>{item[2]}</Text>
          </View>
        </View>
      ))}

      <TouchableOpacity style={[styles.btn, language === 'ur' && { flexDirection: 'row-reverse' }]} onPress={addReminder}>
        <Ionicons name="notifications-outline" size={21} color="#fff" />
        <Text style={[styles.btnText, language === 'ur' ? { marginRight: 8, marginLeft: 0 } : { marginLeft: 8 }]}>{t('addSprayReminder')}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
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
  btnText: { color: '#fff', fontWeight: '900' },
});