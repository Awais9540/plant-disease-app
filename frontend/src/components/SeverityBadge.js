import React from 'react';
import { Text, View } from 'react-native';
import { getSeverityColor } from '../utils/helpers';

const SeverityBadge = ({ severity = 'Low' }) => {
  const color = getSeverityColor(severity);
  return (
    <View style={{ backgroundColor: color, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
      <Text style={{ color: '#fff', fontWeight: '700' }}>{severity}</Text>
    </View>
  );
};

export default SeverityBadge;
