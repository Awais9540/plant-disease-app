import React from 'react';
import { Text, View } from 'react-native';
import { getSeverityColor } from '../utils/helpers';
import { useLanguage } from '../context/LanguageContext';
import { getSeverityLabel } from '../utils/localization';

const SeverityBadge = ({ severity = 'Low' }) => {
  const { language } = useLanguage();
  const color = getSeverityColor(severity);
  const displayLabel = getSeverityLabel(severity, language);
  
  return (
    <View style={{ backgroundColor: color, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
      <Text style={{ color: '#fff', fontWeight: '700' }}>{displayLabel}</Text>
    </View>
  );
};

export default SeverityBadge;
