import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { colors, COLORS } from '../utils/theme';

export default function HistoryScreen({ navigation }) {
  const { session } = useAuth();
  const userId = session?.user?.id;
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.log('Error fetching history:', error);
      Alert.alert('Error', 'Failed to load your scan history.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [userId])
  );

  const deleteRecord = (id) => {
    Alert.alert(
      'Delete Scan',
      'Are you sure you want to permanently delete this scan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('scans')
                .delete()
                .eq('id', id);
              if (error) throw error;
              setHistory(prev => prev.filter(item => item.id !== id));
            } catch (err) {
              Alert.alert('Error', 'Failed to delete the scan.');
            }
          },
        },
      ]
    );
  };

  const clearAllHistory = () => {
    Alert.alert(
      'Clear All History',
      'This will permanently delete ALL your saved scans from the cloud.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('scans')
                .delete()
                .eq('user_id', userId);
              if (error) throw error;
              setHistory([]);
            } catch (err) {
              Alert.alert('Error', 'Failed to clear history.');
            }
          },
        },
      ]
    );
  };

  const viewDetails = (item) => {
    // Reconstruct the result object expected by ResultScreen
    const mappedResult = {
      disease: item.disease_name,
      confidence: item.confidence_score,
      crop: item.crop_name,
      severity: item.is_healthy ? 'N/A' : (item.confidence_score > 90 ? 'High' : 'Medium'),
      date: item.created_at,
      imageUri: item.image_url,
      gradcam_image: item.gradcam_url,
      treatment: item.treatment_summary,
      is_healthy: item.is_healthy,
      description: item.is_healthy ? 'Leaf appears healthy.' : `${item.disease_name} detected.`,
      xaiInsight: item.is_healthy ? 'No disease regions to highlight.' : 'AI highlighted infected regions.'
    };
    navigation.navigate('Result', { result: mappedResult, isHistoryView: true });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.historyCard}
      onPress={() => viewDetails(item)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.cardImage} />
        ) : (
          <Ionicons name="image" size={32} color="#9AB29A" />
        )}
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.cardHeader}>
          <Text style={styles.cropText}>{item.crop_name.replace('_', ' ')}</Text>
          <Text style={styles.dateText}>
            {format(new Date(item.created_at), 'MMM dd, yyyy')}
          </Text>
        </View>

        <Text style={styles.diseaseText} numberOfLines={1}>
          {item.disease_name}
        </Text>

        <View style={styles.confidenceRow}>
          <Ionicons
            name={item.is_healthy ? 'checkmark-circle' : 'warning'}
            size={16}
            color={item.is_healthy ? '#2ecc71' : '#e74c3c'}
          />
          <Text style={styles.confidenceText}>
            {item.confidence_score}% Match
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteRecord(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#e74c3c" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cloud History</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={clearAllHistory} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your scans...</Text>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="time-outline" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Scans Yet</Text>
          <Text style={styles.emptyText}>
            Your future AI disease scans will be securely saved here in the cloud.
          </Text>
          <TouchableOpacity
            style={styles.scanNowBtn}
            onPress={() => navigation.navigate('Scan')}
          >
            <Text style={styles.scanNowText}>Scan a Leaf</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FBF6',
  },
  header: {
    marginTop: 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#102A12',
  },
  clearBtn: {
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
  },
  clearText: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContent: {
    padding: 18,
    paddingBottom: 100,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    width: 65,
    height: 65,
    borderRadius: 14,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cropText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6A856A',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 12,
    color: '#9AB29A',
  },
  diseaseText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#102A12',
    marginBottom: 6,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
  },
  deleteButton: {
    padding: 10,
    marginLeft: 5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6A856A',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#102A12',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6A856A',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 30,
  },
  scanNowBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
    elevation: 2,
  },
  scanNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
});
