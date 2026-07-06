import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../utils/theme';
import { useLanguage } from '../../context/LanguageContext';

const QUESTIONS = [
  { key: 'qHowSerious', default: 'How serious is this disease?' },
  { key: 'qBestTreatment', default: 'Best treatment?' },
  { key: 'qOrganicSolution', default: 'Organic solution?' },
  { key: 'qPesticide', default: 'Which pesticide should I use?' },
  { key: 'qPreventSpread', default: 'How to prevent spread?' },
  { key: 'qFertilizer', default: 'Fertilizer recommendation?' },
  { key: 'qHarmfulToYield', default: 'Is this harmful to yield?' },
  { key: 'qIrrigation', default: 'Irrigation advice?' },
];

export default function QuickQuestions({ onSelectQuestion, disabled }) {
  const { t, textStyle, language } = useLanguage();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={[styles.content, language === 'ur' && { flexDirection: 'row-reverse' }]}
    >
      {QUESTIONS.map((question, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onSelectQuestion(t(question.key))}
          style={[styles.chip, disabled && styles.disabledChip]}
          disabled={disabled}
        >
          <Text style={[styles.text, textStyle, disabled && styles.disabledText]}>{t(question.key)}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 54,
    backgroundColor: '#F9FBF9',
    borderTopWidth: 1,
    borderTopColor: '#E8F5E9',
  },
  content: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
    height: '100%',
  },
  chip: {
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderColor: '#C8E6C9',
    borderWidth: 1,
  },
  disabledChip: {
    backgroundColor: '#ECEFF1',
    borderColor: '#CFD8DC',
  },
  text: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  disabledText: {
    color: '#90A4AE',
  },
});
