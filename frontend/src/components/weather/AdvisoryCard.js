import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../utils/theme';

export default function AdvisoryCard({ sprayAdvisory, diseaseRisk, farmingAlerts }) {
  if (!sprayAdvisory) return null;

  const { score, category, color, description, deductions, windowsText, hasWindow } = sprayAdvisory;

  return (
    <View style={styles.container}>
      {/* 1. Main Spray Gauge & Score Card */}
      <View style={styles.card}>
        <View style={styles.gaugeHeader}>
          <View style={styles.titleRow}>
            <MaterialCommunityIcons name="spray" size={24} color={color} />
            <Text style={styles.title}>Smart Spray Advisory</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${color}18`, borderColor: color }]}>
            <Text style={[styles.badgeText, { color }]}>{category}</Text>
          </View>
        </View>

        {/* Visual score display */}
        <View style={styles.scoreRow}>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreValue, { color }]}>{score}</Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </View>
          <Text style={styles.scoreDesc}>{description}</Text>
        </View>

        {/* Dynamic Timing Windows */}
        <View style={styles.windowBox}>
          <Ionicons 
            name={hasWindow ? 'time-outline' : 'warning-outline'} 
            size={22} 
            color={hasWindow ? colors.primary : '#C62828'} 
          />
          <Text style={[styles.windowText, { color: hasWindow ? '#102A12' : '#C62828' }]}>
            {windowsText}
          </Text>
        </View>

        {/* Active Constraints / Deductions */}
        {deductions && deductions.length > 0 && (
          <View style={styles.deductionsList}>
            <Text style={styles.deductionsHeader}>Active Weather Constraints</Text>
            {deductions.map((reason, idx) => (
              <View key={`deduction-${idx}`} style={styles.deductionRow}>
                <Ionicons name="alert-circle-outline" size={15} color="#E65100" style={{ marginTop: 2 }} />
                <Text style={styles.deductionText}>{reason}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 2. Weather-Based Disease Risk Card */}
      {diseaseRisk && (
        <View style={[styles.card, styles.diseaseCard]}>
          <View style={styles.gaugeHeader}>
            <View style={styles.titleRow}>
              <Ionicons name="bug-outline" size={24} color={diseaseRisk.color} />
              <Text style={styles.title}>Fungal Disease Risk</Text>
            </View>
            <View 
              style={[
                styles.badge, 
                { backgroundColor: `${diseaseRisk.color}18`, borderColor: diseaseRisk.color }
              ]}
            >
              <Text style={[styles.badgeText, { color: diseaseRisk.color }]}>
                {diseaseRisk.level} Risk
              </Text>
            </View>
          </View>

          <Text style={styles.diseaseDesc}>{diseaseRisk.description}</Text>

          {diseaseRisk.conditions && diseaseRisk.conditions.length > 0 && (
            <View style={styles.diseaseIndicators}>
              {diseaseRisk.conditions.map((cond, idx) => (
                <View key={`disease-cond-${idx}`} style={styles.diseaseRow}>
                  <View style={[styles.dot, { backgroundColor: diseaseRisk.color }]} />
                  <Text style={styles.diseaseCondText}>{cond}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* 3. Farming Alerts & Irrigation Guidelines */}
      {farmingAlerts && farmingAlerts.length > 0 && (
        <View style={styles.alertsContainer}>
          <Text style={styles.alertsSectionTitle}>Farming Advisories</Text>
          {farmingAlerts.map((alert, idx) => (
            <View 
              key={`alert-${idx}-${alert.type}`}
              style={[
                styles.alertCard,
                { borderLeftColor: alert.color }
              ]}
            >
              <Ionicons name={alert.icon} size={24} color={alert.color} style={styles.alertIcon} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.alertTitle, { color: alert.color }]}>{alert.title}</Text>
                <Text style={styles.alertDesc}>{alert.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  diseaseCard: {
    backgroundColor: '#FFF8F8',
    borderColor: '#FFEBEE',
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#102A12',
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 16,
  },
  scoreCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 5,
    borderColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFDFB',
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 24,
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6A856A',
  },
  scoreDesc: {
    flex: 1,
    fontSize: 14,
    color: '#4F724F',
    fontWeight: '600',
    lineHeight: 19,
  },
  windowBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8E9',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  windowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
  },
  deductionsList: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#E8F5E9',
    paddingTop: 14,
  },
  deductionsHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5A7A5A',
    marginBottom: 8,
  },
  deductionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  deductionText: {
    flex: 1,
    fontSize: 12,
    color: '#7A5A1A',
    lineHeight: 16,
    fontWeight: '600',
  },
  diseaseDesc: {
    fontSize: 14,
    color: '#7f2525',
    fontWeight: '600',
    lineHeight: 19,
    marginBottom: 14,
  },
  diseaseIndicators: {
    backgroundColor: '#FFEBEE',
    borderRadius: 18,
    padding: 12,
    gap: 8,
  },
  diseaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  diseaseCondText: {
    flex: 1,
    fontSize: 11,
    color: '#8c2d2d',
    fontWeight: '700',
  },
  alertsContainer: {
    marginTop: 6,
    gap: 12,
  },
  alertsSectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#102A12',
    marginBottom: 4,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  alertIcon: {
    marginRight: 14,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  alertDesc: {
    fontSize: 12,
    color: '#6A856A',
    fontWeight: '600',
    marginTop: 3,
    lineHeight: 17,
  },
});
