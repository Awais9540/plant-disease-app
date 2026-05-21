import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import SeverityBadge from './SeverityBadge';
import { colors } from '../utils/theme';

const DiseaseCard = ({ item, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      width: 220,
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 14,
      marginRight: 14,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      elevation: 4
    }}
  >
    <Text style={{ color: colors.primary, fontWeight: '700', marginBottom: 6 }}>{item.cropType}</Text>
    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>{item.disease}</Text>
    <Text style={{ color: colors.textSecondary, marginVertical: 8 }}>{item.date}</Text>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <SeverityBadge severity={item.severity} />
      <Text style={{ color: colors.primary, fontWeight: '700' }}>{item.confidence}%</Text>
    </View>
  </TouchableOpacity>
);

export default DiseaseCard;
