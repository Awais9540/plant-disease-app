import React, { createContext, useContext, useState, useCallback } from 'react';
import { sendChatMessage, generateDiseaseSummaries } from '../services/chatbotService';
import { useLanguage } from './LanguageContext';

const ChatbotContext = createContext();

export const ChatbotProvider = ({ children }) => {
  const { language, t } = useLanguage();
  const [diseaseContext, setDiseaseContext] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preGeneratedSummaries, setPreGeneratedSummaries] = useState(null);
  const [isPreGenerating, setIsPreGenerating] = useState(false);

  // System prompt based on user requirements for expert farming guidance
  const getSystemPrompt = useCallback((crop, disease, confidence) => {
    const urduInstructions = language === 'ur' ? `
IMPORTANT: The user has selected Urdu as their app language. You MUST respond in simple, farmer-friendly, conversational Urdu (اردو). 
Use simple words (e.g. spray instead of complicated terms, "بیماری", "احتیاط", "علاج"). 
Do not use complex Arabic/Persian vocabulary. Present details in short bullet points.
` : '';

    return `You are a highly experienced and friendly agricultural consultant and plant pathologist. 
Your goal is to help a farmer manage crop health, with a specific focus on the following current diagnosis:
- Crop: ${crop}
- Disease: ${disease}
- Prediction Confidence: ${confidence.toFixed(1)}%

Always follow these guidelines in your responses:
1. Act as a supportive, expert agricultural consultant. Use simple, direct, farmer-friendly language. Avoid overly complex technical jargon.
2. Structure your replies using clean spacing, paragraphs, and markdown bullets so it's easy to read on a mobile screen under field conditions.
3. Offer practical, low-cost remedies first. Highlight natural, cultural, and organic control methods.
4. When suggesting pesticides or fertilizers, prioritize safe and approved options. Always warn the user to follow local safety protocols, check label instructions, and avoid recommending dangerous chemical dosages or unverified chemical mixes.
5. If a disease is severe or highly contagious (e.g. Late Blight, Rust, Canker), explicitly suggest consulting a local agricultural extension officer, government agriculture department, or university lab.
6. Support general conversation regarding farming, crop rotation, soil health, and weather impact.
7. Keep answers concise but thorough enough to be fully useful.
${urduInstructions}`;
  }, [language]);

  /**
   * Initializes the Chatbot Context with the current prediction context
   * and triggers the pre-generation of disease, treatment, and prevention summaries.
   */
  const initializeChatbot = useCallback(async (crop, disease, confidenceScore) => {
    const cropName = crop || 'Unknown Crop';
    const diseaseName = disease || 'Unknown Disease';
    const confidence = confidenceScore || 0;

    // Set context state
    setDiseaseContext({ cropName, diseaseName, confidence });
    setError(null);
    setPreGeneratedSummaries(null);
    setIsPreGenerating(true);

    // Initial message to make it feel alive
    const welcomeText = language === 'ur'
      ? `السلام علیکم! میں آپ کا AI زرعی مددگار ہوں۔ 🧑‍🌾\n\nمیں نے آپ کے **${cropName}** پر **${diseaseName}** کی شناخت کی ہے جس میں یقین کی شرح **${confidence.toFixed(1)}%** ہے۔\n\nمیں فی الحال آپ کے لیے علاج اور احتیاطی تدابیر کا خلاصہ تیار کر رہا ہوں۔ بس ایک سیکنڈ کا انتظار کریں!`
      : `Hello! I am your AI Agriculture Assistant. 🧑‍🌾\n\nI see we detected **${diseaseName}** on your **${cropName}** with a confidence score of **${confidence.toFixed(1)}%**.\n\nI am currently preparing your personalized **disease, treatment, and prevention summaries**. Give me just a second!`;

    const initialWelcomeMessage = {
      id: 'welcome',
      role: 'assistant',
      content: welcomeText,
      timestamp: new Date().toISOString(),
    };
    
    setMessages([initialWelcomeMessage]);

    try {
      // Pre-generate summaries using secure backend proxy (Groq API)
      const summaries = await generateDiseaseSummaries(cropName, diseaseName, confidence, language);
      setPreGeneratedSummaries(summaries);
      setIsPreGenerating(false);

      // Append pre-generated summaries as structured cards in assistant stream
      const summaryMessage = {
        id: 'summary-cards',
        role: 'assistant',
        content: t('summaryIntro'),
        isSummaryCard: true,
        summaries: summaries,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, summaryMessage]);
    } catch (err) {
      console.warn('Error pre-generating summaries:', err);
      setIsPreGenerating(false);
      
      // Add a fallback helper message if summaries failed to load
      const fallbackMessage = {
        id: 'summary-failed',
        role: 'assistant',
        content: t('summaryFailed'),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    }
  }, [language, t]);

  /**
   * Sends a user message to the secure backend proxy (Groq API)
   */
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    setError(null);
    const timestamp = new Date().toISOString();
    const userMessageId = `msg-${Date.now()}`;
    const userMessage = {
      id: userMessageId,
      role: 'user',
      content: text,
      timestamp,
    };

    // Update screen to show user's chat bubble
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build API conversational history (excluding custom summary metadata objects)
      const chatHistory = messages
        .filter((msg) => !msg.isSummaryCard)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Append new message to request history
      chatHistory.push({ role: 'user', content: text });

      // Generate prompt and call secure backend proxy (Groq API)
      const systemPrompt = getSystemPrompt(
        diseaseContext?.cropName || 'Crop',
        diseaseContext?.diseaseName || 'Disease',
        diseaseContext?.confidence || 0
      );

      const aiResponseText = await sendChatMessage(chatHistory, systemPrompt);

      const assistantMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: aiResponseText,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.warn('Error getting chat completion:', err);
      setError(t('networkErrorBody'));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, diseaseContext, getSystemPrompt, t]);

  /**
   * Resets and clears the chat session to original state
   */
  const clearChat = useCallback(() => {
    if (diseaseContext) {
      initializeChatbot(diseaseContext.cropName, diseaseContext.diseaseName, diseaseContext.confidence);
    } else {
      setMessages([]);
      setPreGeneratedSummaries(null);
      setError(null);
    }
  }, [diseaseContext, initializeChatbot]);

  return (
    <ChatbotContext.Provider
      value={{
        diseaseContext,
        messages,
        isLoading,
        error,
        preGeneratedSummaries,
        isPreGenerating,
        initializeChatbot,
        sendMessage,
        clearChat,
        setError,
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};
