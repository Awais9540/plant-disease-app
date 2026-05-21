import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useApp } from '../context/AppContext';
import { getHistory } from '../services/storageService';
import { STORAGE_KEYS } from '../utils/constants';
import { colors } from '../utils/theme';

const DEFAULT_PROFILE = {
  name: 'Farmer User',
  location: 'Pakistan',
  language: 'English',
  notifications: true,
  darkMode: false,
};

export default function ProfileScreen() {
  const { profile, setProfile } = useApp();

  const [totalScans, setTotalScans] = useState(0);
  const [cropCount, setCropCount] = useState(0);
  const [editVisible, setEditVisible] = useState(false);

  const [draftName, setDraftName] = useState(profile?.name || DEFAULT_PROFILE.name);
  const [draftLocation, setDraftLocation] = useState(profile?.location || DEFAULT_PROFILE.location);
  const [draftLanguage, setDraftLanguage] = useState(profile?.language || DEFAULT_PROFILE.language);

  const saveProfileToStorage = async (updatedProfile) => {
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updatedProfile));
  };

  const loadProfileFromStorage = async () => {
    const saved = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);

    if (saved) {
      setProfile(JSON.parse(saved));
    } else {
      setProfile((prev) => ({ ...DEFAULT_PROFILE, ...prev }));
    }
  };

  const loadStats = async () => {
    const history = await getHistory();
    setTotalScans(history.length);

    const uniqueCrops = new Set(history.map((item) => item.crop || 'Unknown'));
    setCropCount(uniqueCrops.size);
  };

  useFocusEffect(
    useCallback(() => {
      loadProfileFromStorage();
      loadStats();
    }, [])
  );

  const toggle = async (key, value) => {
    const updated = {
      ...DEFAULT_PROFILE,
      ...profile,
      [key]: value,
    };

    setProfile(updated);
    await saveProfileToStorage(updated);
  };

  const openEditModal = () => {
    setDraftName(profile?.name || DEFAULT_PROFILE.name);
    setDraftLocation(profile?.location || DEFAULT_PROFILE.location);
    setDraftLanguage(profile?.language || DEFAULT_PROFILE.language);
    setEditVisible(true);
  };

  const saveEditedProfile = async () => {
    if (!draftName.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }

    const updated = {
      ...DEFAULT_PROFILE,
      ...profile,
      name: draftName.trim(),
      location: draftLocation.trim() || 'Pakistan',
      language: draftLanguage.trim() || 'English',
    };

    setProfile(updated);
    await saveProfileToStorage(updated);
    setEditVisible(false);
    Alert.alert('Saved', 'Profile updated successfully.');
  };

  const changeLanguage = () => {
    Alert.alert(
      'Choose Language',
      'Select app language',
      [
        {
          text: 'English',
          onPress: async () => toggle('language', 'English'),
        },
        {
          text: 'Urdu',
          onPress: async () => toggle('language', 'Urdu'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const resetAppData = () => {
    Alert.alert(
      'Reset App Data',
      'This will remove history and saved profile settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              STORAGE_KEYS.HISTORY,
              STORAGE_KEYS.PROFILE,
            ]);

            setProfile(DEFAULT_PROFILE);
            setTotalScans(0);
            setCropCount(0);

            Alert.alert('Done', 'App data cleared successfully.');
          },
        },
      ]
    );
  };

  const menuItem = (icon, title, subtitle, onPress) => (
    <TouchableOpacity style={styles.menuCard} onPress={onPress}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#9AB29A" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={42} color="#fff" />
        </View>

        <Text style={styles.name}>{profile?.name || DEFAULT_PROFILE.name}</Text>
        <Text style={styles.location}>{profile?.location || DEFAULT_PROFILE.location}</Text>

        <TouchableOpacity style={styles.editBtn} onPress={openEditModal}>
          <Ionicons name="create-outline" size={16} color={colors.primary} />
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalScans}</Text>
          <Text style={styles.statLabel}>Total Scans</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{cropCount}</Text>
          <Text style={styles.statLabel}>Crops</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{profile?.language || 'English'}</Text>
          <Text style={styles.statLabel}>Language</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Preferences</Text>

      <View style={styles.prefCard}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Notifications</Text>
          <Switch
            value={profile?.notifications ?? true}
            onValueChange={(value) => toggle('notifications', value)}
          />
        </View>
        <View style={styles.divider} />

        <TouchableOpacity style={styles.switchRow} onPress={changeLanguage}>
          <Text style={styles.switchLabel}>Language</Text>
          <Text style={styles.languageText}>{profile?.language || 'English'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>More</Text>

      {menuItem(
        'information-circle-outline',
        'About LeafDoc',
        'AI-powered plant disease detection app',
        () => Alert.alert(
          'About LeafDoc',
          'LeafDoc is a Final Year Project app for Plant Leaf Disease Detection using Deep Learning and Explainable AI.'
        )
      )}

      {menuItem(
        'star-outline',
        'Rate App',
        'Give feedback about LeafDoc',
        () => Alert.alert('Thank you!', 'This feature can be connected to Play Store later.')
      )}

      {menuItem(
        'shield-checkmark-outline',
        'Privacy Policy',
        'Your history is stored locally on your phone',
        () => Alert.alert(
          'Privacy Policy',
          'LeafDoc stores scan history locally using phone storage. No cloud database is used in this FYP demo.'
        )
      )}

      {menuItem(
        'trash-outline',
        'Reset App Data',
        'Delete history and saved profile',
        resetAppData
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>LeafDoc v1.0.0</Text>
        <Text style={styles.footerSub}>
          Plant Leaf Disease Detection using Deep Learning
        </Text>
      </View>

      <Modal visible={editVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              style={styles.input}
              placeholder="Enter your name"
            />

            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              value={draftLocation}
              onChangeText={setDraftLocation}
              style={styles.input}
              placeholder="Enter your location"
            />

            <Text style={styles.inputLabel}>Language</Text>
            <TextInput
              value={draftLanguage}
              onChangeText={setDraftLanguage}
              style={styles.input}
              placeholder="English or Urdu"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={saveEditedProfile}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6FBF6' },
  content: { padding: 18, paddingBottom: 120 },
  header: {
    marginTop: 34,
    fontSize: 32,
    fontWeight: '900',
    color: '#102A12',
  },
  profileCard: {
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    elevation: 3,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    marginTop: 14,
    fontSize: 24,
    fontWeight: '900',
    color: '#102A12',
  },
  location: {
    marginTop: 6,
    color: '#6A856A',
    fontSize: 15,
  },
  editBtn: {
    marginTop: 16,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editText: {
    marginLeft: 6,
    color: colors.primary,
    fontWeight: '900',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 18,
    alignItems: 'center',
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  statLabel: {
    marginTop: 6,
    color: '#6A856A',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    marginTop: 26,
    marginBottom: 12,
    fontSize: 22,
    fontWeight: '900',
    color: '#102A12',
  },
  prefCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 8,
    elevation: 2,
  },
  switchRow: {
    height: 58,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#102A12',
  },
  languageText: {
    color: colors.primary,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: '#EDF4ED',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  menuIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#102A12',
  },
  menuSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#6A856A',
  },
  footer: {
    marginTop: 28,
    alignItems: 'center',
  },
  footerText: {
    fontWeight: '900',
    color: '#102A12',
  },
  footerSub: {
    marginTop: 6,
    color: '#6A856A',
    textAlign: 'center',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#102A12',
    marginBottom: 16,
  },
  inputLabel: {
    fontWeight: '800',
    color: '#102A12',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F3F8F3',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#102A12',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 22,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    marginRight: 8,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelText: {
    color: colors.primary,
    fontWeight: '900',
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});