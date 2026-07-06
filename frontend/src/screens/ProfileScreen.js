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
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { colors } from '../utils/theme';
import { useLanguage } from '../context/LanguageContext';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const { t, textStyle, rowStyle, language, setLanguage } = useLanguage();
  const userId = session?.user?.id;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    full_name: 'Farmer User',
    location: 'Unknown',
    avatar_url: null,
  });

  const [totalScans, setTotalScans] = useState(0);
  const [editVisible, setEditVisible] = useState(false);

  const [draftName, setDraftName] = useState('');
  const [draftLocation, setDraftLocation] = useState('');

  const fetchProfile = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          location: data.location || '',
          avatar_url: data.avatar_url,
        });
      }
    } catch (error) {
      console.log('Error fetching profile', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!userId) return;
    try {
      const { count } = await supabase
        .from('scans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      setTotalScans(count || 0);
    } catch (error) {
      console.log('Error fetching stats', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      fetchStats();
    }, [userId])
  );

  const openEditModal = () => {
    setDraftName(profile.full_name);
    setDraftLocation(profile.location);
    setEditVisible(true);
  };

  const saveEditedProfile = async () => {
    if (!draftName.trim()) {
      Alert.alert(t('nameRequired'), t('enterName'));
      return;
    }

    try {
      setLoading(true);
      const updates = {
        full_name: draftName.trim(),
        location: draftLocation.trim(),
      };

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      setProfile(prev => ({ ...prev, ...updates }));
      setEditVisible(false);
      Alert.alert(t('saved'), t('profileUpdated'));
    } catch (error) {
      Alert.alert(t('error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(t('logoutTitle'), t('logoutMessage'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('signOut'), style: 'destructive', onPress: async () => await signOut() }
    ]);
  };

  const handleImagePick = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      uploadAvatar(result.assets[0]);
    }
  };

  const uploadAvatar = async (asset) => {
    try {
      setLoading(true);
      const ext = asset.uri.substring(asset.uri.lastIndexOf(".") + 1);
      const fileName = `${userId}_${Date.now()}.${ext}`;
      
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: fileName,
        type: `image/${ext}`
      });

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, formData, {
          upsert: true,
        });

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = publicData.publicUrl;

      // Update users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId);

      if (updateError) throw updateError;
      
      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
      Alert.alert(t('success'), t('profilePictureUpdated'));
    } catch (error) {
      Alert.alert(t('uploadFailed'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const menuItem = (icon, title, subtitle, onPress, destructive = false) => (
    <TouchableOpacity style={[styles.menuCard, rowStyle]} onPress={onPress}>
      <View style={[styles.menuIcon, destructive && { backgroundColor: '#FFEBEE' }]}>
        <Ionicons name={icon} size={22} color={destructive ? '#E53935' : colors.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.menuTitle, textStyle, destructive && { color: '#E53935' }]}>{title}</Text>
        <Text style={[styles.menuSubtitle, textStyle]}>{subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={destructive ? "#E53935" : "#9AB29A"} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={[styles.header, textStyle]}>{t('profile')}</Text>

      <View style={styles.profileCard}>
        <TouchableOpacity style={styles.avatar} onPress={handleImagePick}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="camera" size={32} color="#fff" />
          )}
        </TouchableOpacity>

        {loading ? (
           <ActivityIndicator color={colors.primary} style={{ marginTop: 14 }} />
        ) : (
          <>
            <Text style={styles.name}>{profile.full_name || session?.user?.email}</Text>
            <Text style={[styles.location, textStyle]}>{profile.location || t('locationNotSet')}</Text>
            <Text style={styles.email}>{session?.user?.email}</Text>
          </>
        )}

        <TouchableOpacity style={styles.editBtn} onPress={openEditModal}>
          <Ionicons name="create-outline" size={16} color={colors.primary} />
          <Text style={styles.editText}>{t('editProfile')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalScans}</Text>
          <Text style={[styles.statLabel, textStyle]}>{t('cloudScans')}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{t('online')}</Text>
          <Text style={[styles.statLabel, textStyle]}>{t('status')}</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, textStyle]}>{t('preferences')}</Text>

      <View style={styles.languageCard}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.menuTitle, textStyle]}>{t('appLanguage')}</Text>
          <Text style={[styles.menuSubtitle, textStyle]}>{t('languageHelp')}</Text>
        </View>

        <View style={styles.languageToggle}>
          {['en', 'ur'].map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => setLanguage(option)}
              style={[styles.languageOption, language === option && styles.languageOptionActive]}
            >
              <Text style={[styles.languageText, language === option && styles.languageTextActive]}>
                {option === 'en' ? t('english') : t('urdu')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={[styles.sectionTitle, textStyle]}>{t('account')}</Text>

      {menuItem(
        'log-out-outline',
        t('signOut'),
        t('signOutSubtitle'),
        handleLogout,
        true
      )}

      <Modal visible={editVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, textStyle]}>{t('editProfile')}</Text>

            <Text style={[styles.inputLabel, textStyle]}>{t('name')}</Text>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              style={styles.input}
              placeholder={t('enterNamePlaceholder')}
            />

            <Text style={[styles.inputLabel, textStyle]}>{t('location')}</Text>
            <TextInput
              value={draftLocation}
              onChangeText={setDraftLocation}
              style={styles.input}
              placeholder={t('enterLocationPlaceholder')}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditVisible(false)}
                disabled={loading}
              >
                <Text style={styles.cancelText}>{t('cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={saveEditedProfile} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{t('save')}</Text>}
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
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
  email: {
    marginTop: 4,
    color: '#7f8c8d',
    fontSize: 13,
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
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  languageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    gap: 12,
  },
  languageToggle: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    borderRadius: 18,
    padding: 4,
  },
  languageOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  languageOptionActive: {
    backgroundColor: colors.primary,
  },
  languageText: {
    color: '#102A12',
    fontWeight: '900',
    fontSize: 12,
  },
  languageTextActive: {
    color: '#FFFFFF',
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
