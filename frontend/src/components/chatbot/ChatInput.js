import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/theme';
import { useLanguage } from '../../context/LanguageContext';

export default function ChatInput({ onSendMessage, disabled }) {
  const [text, setText] = useState('');
  const { t, textStyle, language } = useLanguage();

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText('');
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.container, language === 'ur' && { flexDirection: 'row-reverse' }]}>
      <View style={[styles.inputContainer, language === 'ur' ? { marginLeft: 10, marginRight: 0 } : { marginRight: 10 }]}>
        <TextInput
          style={[styles.input, textStyle, language === 'ur' && { textAlign: 'right' }]}
          placeholder={t('chatPlaceholder')}
          placeholderTextColor="#78909C"
          multiline
          maxHeight={100}
          value={text}
          onChangeText={setText}
          editable={!disabled}
        />
      </View>

      <TouchableOpacity
        onPress={handleSend}
        style={[styles.sendButton, (!text.trim() || disabled) && styles.disabledSendButton]}
        disabled={!text.trim() || disabled}
      >
        <Ionicons name={language === 'ur' ? 'send' : 'send'} size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECEFF1',
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#F1F5F1',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    minHeight: 40,
    justifyContent: 'center',
    borderColor: '#E2EDE2',
    borderWidth: 1,
  },
  input: {
    color: colors.text,
    fontSize: 15,
    padding: 0,
    margin: 0,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  disabledSendButton: {
    backgroundColor: '#CFD8DC',
    elevation: 0,
    shadowOpacity: 0,
  },
});
