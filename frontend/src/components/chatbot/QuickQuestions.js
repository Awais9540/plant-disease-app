import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../utils/theme';

const QUESTIONS = [
  'How serious is this disease?',
  'Best treatment?',
  'Organic solution?',
  'Which pesticide should I use?',
  'How to prevent spread?',
  'Fertilizer recommendation?',
  'Is this harmful to yield?',
  'Irrigation advice?',
];

export default function QuickQuestions({ onSelectQuestion, disabled }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {QUESTIONS.map((question, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onSelectQuestion(question)}
          style={[styles.chip, disabled && styles.disabledChip]}
          disabled={disabled}
        >
          <Text style={[styles.text, disabled && styles.disabledText]}>{question}</Text>
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
