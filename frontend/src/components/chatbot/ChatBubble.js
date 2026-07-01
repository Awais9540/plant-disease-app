import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutAnimation, TouchableOpacity, UIManager, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/theme';

// Enable layout animations on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * A robust helper to parse simple Markdown-like syntax (bold **text** and bullet points)
 * and return standard React Native Text nodes.
 */
const renderParsedText = (text, defaultStyle) => {
  if (!text) return null;

  // Split text by newlines
  const lines = text.split('\n');

  return (
    <View style={styles.textContainer}>
      {lines.map((line, lineIndex) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <View key={lineIndex} style={{ height: 6 }} />;
        }

        // 1. Heading Matching (1 to 6 hash symbols followed by optional spaces and text)
        const headerMatch = trimmed.match(/^(#{1,6})\s*(.*)$/);
        
        // 2. Bullet/List Matching (either -, •, *, or a number with dot, followed by optional spaces and text)
        const bulletMatch = trimmed.match(/^([-•*]|\d+\.)\s*(.*)$/);

        let cleanLine = line;
        let lineStyle = [defaultStyle];
        let isListItem = false;
        let bulletChar = '';

        if (headerMatch) {
          const headerLevel = headerMatch[1].length;
          cleanLine = headerMatch[2];
          
          if (!cleanLine.trim()) {
            return <View key={lineIndex} style={{ height: 6 }} />;
          }

          lineStyle = [
            defaultStyle,
            {
              fontSize: headerLevel === 1 ? 19 : headerLevel === 2 ? 17 : headerLevel === 3 ? 15 : 14,
              fontWeight: 'bold',
              color: '#1A4D2E', // Elegant dark forest green for headings
              marginTop: lineIndex > 0 ? 12 : 4,
              marginBottom: 4,
              lineHeight: headerLevel === 1 ? 24 : headerLevel === 2 ? 22 : 20,
            }
          ];
        } else if (bulletMatch) {
          isListItem = true;
          const marker = bulletMatch[1];
          cleanLine = bulletMatch[2];
          
          if (marker === '-' || marker === '•' || marker === '*') {
            bulletChar = '•';
          } else {
            bulletChar = marker;
          }
          
          lineStyle = [
            defaultStyle,
            {
              marginLeft: 4,
              flexShrink: 1,
              lineHeight: 20,
            }
          ];
        } else {
          lineStyle = [
            defaultStyle,
            {
              marginVertical: 1.5,
              lineHeight: 20,
            }
          ];
        }

        // Parse bold segments **text**
        const boldRegex = /\*\*(.*?)\*\*/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = boldRegex.exec(cleanLine)) !== null) {
          if (match.index > lastIndex) {
            parts.push(cleanLine.substring(lastIndex, match.index));
          }
          parts.push({ text: match[1], bold: true });
          lastIndex = boldRegex.lastIndex;
        }

        if (lastIndex < cleanLine.length) {
          parts.push(cleanLine.substring(lastIndex));
        }

        const renderedLineContent = parts.map((part, partIndex) => {
          if (typeof part === 'object' && part.bold) {
            return (
              <Text key={partIndex} style={styles.boldText}>
                {part.text}
              </Text>
            );
          }
          return part;
        });

        if (isListItem) {
          return (
            <View key={lineIndex} style={styles.listItemRow}>
              <Text style={styles.bulletMarker}>{bulletChar}</Text>
              <Text style={lineStyle}>{renderedLineContent}</Text>
            </View>
          );
        }

        return (
          <Text key={lineIndex} style={lineStyle}>
            {renderedLineContent}
          </Text>
        );
      })}
    </View>
  );
};

export default function ChatBubble({ message }) {
  const isUser = message.role === 'user';
  const { isSummaryCard, summaries } = message;

  // States for expanding individual summaries
  const [diseaseExpanded, setDiseaseExpanded] = useState(true);
  const [treatmentExpanded, setTreatmentExpanded] = useState(false);
  const [preventionExpanded, setPreventionExpanded] = useState(false);

  const toggleSection = (section) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (section === 'disease') setDiseaseExpanded(!diseaseExpanded);
    if (section === 'treatment') setTreatmentExpanded(!treatmentExpanded);
    if (section === 'prevention') setPreventionExpanded(!preventionExpanded);
  };

  // If this is the automatically generated summary message
  if (isSummaryCard && summaries) {
    return (
      <View style={styles.summaryContainer}>
        {/* Disease Card */}
        <View style={[styles.summaryCard, { borderLeftColor: colors.primary }]}>
          <TouchableOpacity onPress={() => toggleSection('disease')} style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="information-circle" size={18} color={colors.primary} />
              </View>
              <Text style={styles.cardTitle}>Disease Summary</Text>
            </View>
            <Ionicons
              name={diseaseExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textLight}
            />
          </TouchableOpacity>
          {diseaseExpanded && (
            <View style={styles.cardBody}>
              {renderParsedText(summaries.diseaseSummary, styles.summaryText)}
            </View>
          )}
        </View>

        {/* Treatment Card */}
        <View style={[styles.summaryCard, { borderLeftColor: colors.warning }]}>
          <TouchableOpacity onPress={() => toggleSection('treatment')} style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#FFF8E1' }]}>
                <Ionicons name="medical" size={18} color={colors.warning} />
              </View>
              <Text style={styles.cardTitle}>Quick Treatment</Text>
            </View>
            <Ionicons
              name={treatmentExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textLight}
            />
          </TouchableOpacity>
          {treatmentExpanded && (
            <View style={styles.cardBody}>
              {renderParsedText(summaries.treatmentSummary, styles.summaryText)}
            </View>
          )}
        </View>

        {/* Prevention Card */}
        <View style={[styles.summaryCard, { borderLeftColor: colors.secondary }]}>
          <TouchableOpacity onPress={() => toggleSection('prevention')} style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="shield-checkmark" size={18} color={colors.secondary} />
              </View>
              <Text style={styles.cardTitle}>Prevention Steps</Text>
            </View>
            <Ionicons
              name={preventionExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textLight}
            />
          </TouchableOpacity>
          {preventionExpanded && (
            <View style={styles.cardBody}>
              {renderParsedText(summaries.preventionSummary, styles.summaryText)}
            </View>
          )}
        </View>
      </View>
    );
  }

  // Standard chat bubble
  return (
    <View style={[styles.bubbleWrapper, isUser ? styles.userWrapper : styles.assistantWrapper]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Ionicons name="leaf" size={15} color="#fff" />
        </View>
      )}

      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {isUser ? (
          <Text style={styles.userText}>{message.content}</Text>
        ) : (
          renderParsedText(message.content, styles.assistantText)
        )}
        
        <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleWrapper: {
    flexDirection: 'row',
    marginVertical: 6,
    width: '100%',
  },
  userWrapper: {
    justifyContent: 'flex-end',
    paddingLeft: 40,
  },
  assistantWrapper: {
    justifyContent: 'flex-start',
    paddingRight: 40,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxWidth: '85%',
    flexShrink: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 2,
    borderColor: '#E8F2E8',
    borderWidth: 1,
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
  },
  assistantText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: '#C8E6C9',
  },
  assistantTimestamp: {
    color: colors.textLight,
  },
  // Simple markdown renderer styling
  textContainer: {
    width: '100%',
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
    paddingLeft: 4,
  },
  bulletMarker: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: 'bold',
    marginRight: 6,
    width: 12,
    textAlign: 'center',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#0E2F0E',
  },
  // Summary pre-generation card layout
  summaryContainer: {
    marginVertical: 10,
    width: '100%',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F8F1',
    paddingTop: 10,
  },
  summaryText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
