import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';
import { useLanguage } from '../context/LanguageContext';

export default function ToolsScreen({ navigation }) {
  const { t, textStyle, language } = useLanguage();

  const calculators = [
    {
      title: t('fertilizerCalculator'),
      subtitle: t('fertilizerCalculatorSub'),
      icon: 'leaf-outline',
      color: colors.primary,
      bg: '#E8F5E9',
      screen: 'FertilizerCalculator',
    },
    {
      title: t('pesticideCalculator'),
      subtitle: t('pesticideCalculatorSub'),
      icon: 'flask-outline',
      color: '#FF8F00',
      bg: '#FFF3E0',
      screen: 'PesticideCalculator',
    },
    {
      title: t('areaCalculator'),
      subtitle: t('areaCalculatorSub'),
      icon: 'resize-outline',
      color: '#1976D2',
      bg: '#E3F2FD',
      screen: 'FarmingCalculator',
    },
  ];

  const smartTools = [
    {
      title: t('diseaseGuide'),
      subtitle: t('diseaseGuideSub'),
      icon: 'book-outline',
      screen: 'DiseaseGuide',
    },
    {
      title: t('spraySchedule'),
      subtitle: t('sprayScheduleSub'),
      icon: 'calendar-outline',
      screen: 'SpraySchedule',
    },
    {
      title: t('weatherAdvisory'),
      subtitle: t('weatherAdvisorySub'),
      icon: 'partly-sunny-outline',
      screen: 'WeatherAdvisory',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, textStyle]}>{t('toolsTitle')}</Text>
        <Text style={[styles.subtitle, textStyle]}>
          {t('toolsSubtitle')}
        </Text>
      </View>

      <View style={[styles.heroCard, language === 'ur' && { flexDirection: 'row-reverse' }]}>
        <View style={[styles.heroIcon, language === 'ur' ? { marginLeft: 16, marginRight: 0 } : { marginRight: 16 }]}>
          <Ionicons name="calculator" size={36} color="#fff" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, textStyle]}>{t('planBeforeApply')}</Text>
          <Text style={[styles.heroText, textStyle]}>
            {t('planBeforeApplyText')}
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, textStyle]}>{t('mainCalculators')}</Text>

      {calculators.map((tool) => (
        <TouchableOpacity
          key={tool.title}
          style={[styles.toolCard, language === 'ur' && { flexDirection: 'row-reverse' }]}
          onPress={() => navigation.navigate(tool.screen)}
        >
          <View style={[styles.toolIcon, { backgroundColor: tool.bg }, language === 'ur' ? { marginLeft: 14, marginRight: 0 } : { marginRight: 14 }]}>
            <Ionicons name={tool.icon} size={30} color={tool.color} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.toolTitle, textStyle]}>{tool.title}</Text>
            <Text style={[styles.toolSubtitle, textStyle]}>{tool.subtitle}</Text>
          </View>

          <Ionicons name={language === 'ur' ? 'chevron-back' : 'chevron-forward'} size={22} color="#8BA18B" />
        </TouchableOpacity>
      ))}

      <Text style={[styles.sectionTitle, textStyle]}>{t('smartAssistantTools')}</Text>

      <View style={[styles.grid, language === 'ur' && { flexDirection: 'row-reverse' }]}>
        {smartTools.map((tool) => (
          <TouchableOpacity
            key={tool.title}
            style={styles.gridCard}
            onPress={() => navigation.navigate(tool.screen)}
          >
            <View style={[styles.gridIcon, language === 'ur' && { alignSelf: 'flex-end' }]}>
              <Ionicons name={tool.icon} size={28} color={colors.primary} />
            </View>

            <Text style={[styles.gridTitle, textStyle]}>{tool.title}</Text>
            <Text style={[styles.gridSubtitle, textStyle]}>{tool.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.xaiCard, language === 'ur' && { flexDirection: 'row-reverse' }]}>
        <View style={[styles.xaiIcon, language === 'ur' ? { marginLeft: 14, marginRight: 0 } : { marginRight: 14 }]}>
          <Ionicons name="sparkles" size={28} color="#fff" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.xaiTitle, textStyle]}>{t('smartAdvantage')}</Text>
          <Text style={[styles.xaiText, textStyle]}>
            {t('smartAdvantageText')}
          </Text>
        </View>
      </View>

      <View style={[styles.disclaimer, language === 'ur' && { flexDirection: 'row-reverse' }]}>
        <Ionicons name="alert-circle-outline" size={22} color="#FF8F00" />
        <Text style={[styles.disclaimerText, textStyle, language === 'ur' ? { marginRight: 10, marginLeft: 0 } : { marginLeft: 10 }]}>
          {t('calculatorDisclaimer')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FBF6',
  },
  content: {
    padding: 18,
    paddingBottom: 120,
  },
  header: {
    marginTop: 34,
  },
  title: {
    fontSize: 33,
    fontWeight: '900',
    color: '#102A12',
  },
  subtitle: {
    marginTop: 6,
    color: '#6A856A',
    fontSize: 15,
    fontWeight: '600',
  },
  heroCard: {
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: 28,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
  },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '900',
  },
  heroText: {
    color: '#E8F5E9',
    marginTop: 6,
    lineHeight: 20,
    fontSize: 14,
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 14,
    fontSize: 23,
    fontWeight: '900',
    color: '#102A12',
  },
  toolCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
  },
  toolIcon: {
    width: 62,
    height: 62,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  toolTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#102A12',
  },
  toolSubtitle: {
    marginTop: 5,
    color: '#6A856A',
    fontSize: 13,
    lineHeight: 19,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
  },
  gridIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#102A12',
  },
  gridSubtitle: {
    marginTop: 6,
    color: '#6A856A',
    fontSize: 12,
    lineHeight: 18,
  },
  xaiCard: {
    marginTop: 10,
    backgroundColor: '#1B5E20',
    borderRadius: 28,
    padding: 20,
    flexDirection: 'row',
    elevation: 4,
  },
  xaiIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  xaiTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  xaiText: {
    marginTop: 6,
    color: '#DFF3DF',
    fontSize: 13,
    lineHeight: 20,
  },
  disclaimer: {
    marginTop: 18,
    backgroundColor: '#FFF8EC',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    elevation: 2,
  },
  disclaimerText: {
    flex: 1,
    marginLeft: 10,
    color: '#7A5A1A',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
});
