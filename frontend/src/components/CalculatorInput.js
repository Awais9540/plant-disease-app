import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { colors } from '../utils/theme';

const CalculatorInput = ({ label, value, onChangeText, placeholder }) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={{ marginBottom: 6, color: colors.textPrimary, fontWeight: '600' }}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      style={{
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#DCE8DC',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12
      }}
    />
  </View>
);

export default CalculatorInput;
