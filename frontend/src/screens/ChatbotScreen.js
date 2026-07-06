import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatbot } from '../context/ChatbotContext';
import ChatBubble from '../components/chatbot/ChatBubble';
import TypingIndicator from '../components/chatbot/TypingIndicator';
import QuickQuestions from '../components/chatbot/QuickQuestions';
import ChatInput from '../components/chatbot/ChatInput';
import { colors } from '../utils/theme';
import { useLanguage } from '../context/LanguageContext';
import { getCropLabel, getDiseaseLabel } from '../utils/localization';

export default function ChatbotScreen({ route, navigation }) {
  const {
    cropName,
    diseaseName,
    confidence,
  } = route.params || {};

  const {
    diseaseContext,
    messages,
    isLoading,
    error,
    isPreGenerating,
    initializeChatbot,
    sendMessage,
    clearChat,
  } = useChatbot();

  const flatListRef = useRef(null);
  const { t, textStyle, language } = useLanguage();

  // Initialize context when the screen mounts with crop/disease parameters
  useEffect(() => {
    if (cropName && diseaseName) {
      initializeChatbot(cropName, diseaseName, confidence || 0);
    }
  }, [cropName, diseaseName, confidence, initializeChatbot]);

  // Automatically scroll to bottom when message count changes or keyboard opens
  const scrollToBottom = useCallback(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isPreGenerating, scrollToBottom]);

  const handleSend = (text) => {
    sendMessage(text);
  };

  const handleQuickQuestion = (question) => {
    sendMessage(question);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        {/* Modern Header */}
        <View style={[styles.header, language === 'ur' && { flexDirection: 'row-reverse' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, language === 'ur' ? { marginLeft: 16, marginRight: 0 } : { marginRight: 16 }]}>
            <Ionicons name={language === 'ur' ? 'arrow-forward' : 'arrow-back'} size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, textStyle]}>{t('chatTitle')}</Text>
            <View style={[styles.onlineBadge, language === 'ur' && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.onlineDot, language === 'ur' ? { marginLeft: 4, marginRight: 0 } : { marginRight: 4 }]} />
              <Text style={styles.onlineText}>{t('onlinePathologist')}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={clearChat} style={styles.resetButton} title="Clear Chat">
            <Ionicons name="refresh-circle" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Diagnosis Context Banner */}
        {diseaseContext && (
          <View style={[styles.contextBanner, language === 'ur' && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.contextInfo, language === 'ur' && { flexDirection: 'row-reverse' }]}>
              <Ionicons name="leaf-outline" size={18} color={colors.primary} />
              <Text style={[styles.contextText, textStyle, language === 'ur' ? { marginRight: 6, marginLeft: 0 } : { marginLeft: 6 }]}>
                {t('activeScan')}: <Text style={styles.boldText}>{getCropLabel(diseaseContext.cropName, language)}</Text> (
                <Text style={styles.diseaseHighlight}>{getDiseaseLabel(diseaseContext.diseaseName, language)}</Text>)
              </Text>
            </View>
            <View style={styles.confidencePill}>
              <Text style={styles.confidenceText}>
                {diseaseContext.confidence.toFixed(0)}% {t('match')}
              </Text>
            </View>
          </View>
        )}

        {/* Chat Message List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
          ListFooterComponent={
            <>
              {(isLoading || isPreGenerating) && (
                <View style={styles.footerLoader}>
                  {isPreGenerating ? (
                    <View style={[styles.summaryGeneratingBox, language === 'ur' && { flexDirection: 'row-reverse' }]}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[styles.generatingText, textStyle, language === 'ur' ? { marginRight: 8, marginLeft: 0 } : { marginLeft: 8 }]}>{t('analyzingCrop')}</Text>
                    </View>
                  ) : (
                    <TypingIndicator />
                  )}
                </View>
              )}

              {error && (
                <View style={[styles.errorCard, language === 'ur' && { flexDirection: 'row-reverse' }]}>
                  <Ionicons name="alert-circle" size={24} color={colors.error} />
                  <View style={styles.errorTextContainer}>
                    <Text style={[styles.errorTitle, textStyle]}>{t('networkErrorTitle')}</Text>
                    <Text style={[styles.errorDescription, textStyle]}>{error}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleSend(t('retryLastQuestion'))}
                    style={styles.retryButton}
                  >
                    <Text style={styles.retryText}>{t('retry')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          }
        />

        {/* Suggested Quick Questions */}
        <QuickQuestions
          onSelectQuestion={handleQuickQuestion}
          disabled={isLoading || isPreGenerating}
        />

        {/* Input Bar */}
        <ChatInput onSendMessage={handleSend} disabled={isLoading || isPreGenerating} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
    backgroundColor: '#F5F8F5',
  },
  header: {
    backgroundColor: colors.primary,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#69F0AE',
    marginRight: 4,
  },
  onlineText: {
    color: '#C8E6C9',
    fontSize: 11,
    fontWeight: '600',
  },
  resetButton: {
    padding: 4,
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
  },
  contextInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contextText: {
    fontSize: 13,
    color: colors.text,
    marginLeft: 6,
  },
  boldText: {
    fontWeight: '800',
  },
  diseaseHighlight: {
    color: '#D84315',
    fontWeight: '800',
  },
  confidencePill: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  confidenceText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  footerLoader: {
    marginVertical: 10,
  },
  summaryGeneratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  generatingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginVertical: 10,
  },
  errorTextContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B71C1C',
  },
  errorDescription: {
    fontSize: 12,
    color: '#E53935',
    marginTop: 2,
  },
  retryButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
});
