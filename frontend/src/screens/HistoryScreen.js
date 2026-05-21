import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getHistory } from '../services/storageService';
import { STORAGE_KEYS } from '../utils/constants';
import { colors } from '../utils/theme';
import SeverityBadge from '../components/SeverityBadge';

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';

  const date = new Date(dateString);

  return (
    date.toLocaleDateString() +
    ' • ' +
    date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
};

const getConfidence = (value) => {
  const number = Number(value);
  if (Number.isNaN(number)) return 0;
  return number <= 1 ? number * 100 : number;
};

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadHistory = async () => {
    const data = await getHistory();
    setHistory(data || []);
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const refresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const clearAllHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all saved scan results?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(STORAGE_KEYS.HISTORY);
            setHistory([]);
          },
        },
      ]
    );
  };

  const deleteSingleItem = (itemToDelete) => {
    Alert.alert(
      'Delete Scan',
      'Do you want to delete this saved scan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = history.filter((item, index) => {
              const itemKey = `${item.id || 'scan'}-${index}`;
              const deleteKey = `${itemToDelete.id || 'scan'}-${itemToDelete.__index}`;
              return itemKey !== deleteKey;
            });

            setHistory(updated);
            await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
          },
        },
      ]
    );
  };

  const openResult = (item) => {
    navigation.navigate('Result', {
      result: {
        ...item,
        gradcam_image: item.gradcam_image || item.gradcamImage,
        gradcamImage: item.gradcamImage || item.gradcam_image,
        learn_more: item.learn_more || item.learnMore,
      },
    });
  };

  const filteredHistory = history
    .map((item, index) => ({ ...item, __index: index }))
    .filter((item) => {
      const query = searchQuery.trim().toLowerCase();

      if (!query) return true;

      return (
        item.disease?.toLowerCase().includes(query) ||
        item.crop?.toLowerCase().includes(query) ||
        item.severity?.toLowerCase().includes(query)
      );
    });

  const renderItem = ({ item }) => {
    const confidence = getConfidence(item.confidence);

    return (
      <TouchableOpacity style={styles.card} onPress={() => openResult(item)}>
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="leaf-outline" size={32} color={colors.primary} />
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.disease} numberOfLines={1}>
            {item.disease || 'Unknown Disease'}
          </Text>

          <Text style={styles.meta} numberOfLines={1}>
            {item.crop || 'Unknown Crop'} • {formatDate(item.date)}
          </Text>

          <View style={styles.row}>
            <View style={styles.confidenceBadge}>
              <Ionicons name="analytics" size={15} color={colors.primary} />
              <Text style={styles.confidenceText}>
                {confidence.toFixed(1)}%
              </Text>
            </View>

            <SeverityBadge severity={item.severity || 'Medium'} />
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteSingleItem(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#C62828" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Scan History</Text>
          <Text style={styles.subtitle}>
            {history.length} saved diagnosis result{history.length === 1 ? '' : 's'}
          </Text>
        </View>

        {history.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearAllHistory}>
            <Ionicons name="trash-outline" size={20} color="#C62828" />
          </TouchableOpacity>
        )}
      </View>

      {history.length > 0 && (
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#6A856A" />
          <TextInput
            placeholder="Search disease, crop, or severity..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholderTextColor="#8BA18B"
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#8BA18B" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {history.length > 0 && (
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{history.length}</Text>
            <Text style={styles.statLabel}>Total Scans</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {new Set(history.map((item) => item.crop || 'Unknown')).size}
            </Text>
            <Text style={styles.statLabel}>Crops</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {filteredHistory.length}
            </Text>
            <Text style={styles.statLabel}>Showing</Text>
          </View>
        </View>
      )}

      {history.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIcon}>
            <Ionicons name="leaf-outline" size={76} color={colors.primary} />
          </View>

          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptyText}>
            Scan your first crop leaf and save the result here.
          </Text>

          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Scan' })}
          >
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.scanBtnText}>Scan Now</Text>
          </TouchableOpacity>
        </View>
      ) : filteredHistory.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="search-outline" size={70} color={colors.primary} />
          <Text style={styles.emptyTitle}>No matching results</Text>
          <Text style={styles.emptyText}>
            Try searching with another disease, crop, or severity.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item, index) => `${item.id || 'scan'}-${item.__index}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
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
    paddingHorizontal: 18,
    paddingTop: 48,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 31,
    fontWeight: '900',
    color: '#102A12',
  },
  subtitle: {
    color: '#6A856A',
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  clearBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBox: {
    marginHorizontal: 18,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: '#102A12',
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    marginHorizontal: 18,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 16,
    flexDirection: 'row',
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: '#6A856A',
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0EDE0',
  },
  list: {
    padding: 18,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
  },
  thumbnail: {
    width: 86,
    height: 86,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
  },
  thumbnailPlaceholder: {
    width: 86,
    height: 86,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  disease: {
    fontSize: 17,
    fontWeight: '900',
    color: '#102A12',
    textTransform: 'capitalize',
  },
  meta: {
    marginTop: 5,
    color: '#6A856A',
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
    gap: 8,
    flexWrap: 'wrap',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceText: {
    color: colors.primary,
    fontWeight: '900',
    marginLeft: 4,
    fontSize: 12,
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
  },
  emptyIcon: {
    width: 125,
    height: 125,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 18,
    fontSize: 24,
    fontWeight: '900',
    color: '#102A12',
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#6A856A',
    fontSize: 15,
    lineHeight: 22,
  },
  scanBtn: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    marginLeft: 8,
  },
});
