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

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
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
      Alert.alert('Name required', 'Please enter your name.');
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
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => await signOut() }
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
      Alert.alert('Success', 'Profile picture updated!');
    } catch (error) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const menuItem = (icon, title, subtitle, onPress, destructive = false) => (
    <TouchableOpacity style={styles.menuCard} onPress={onPress}>
      <View style={[styles.menuIcon, destructive && { backgroundColor: '#FFEBEE' }]}>
        <Ionicons name={icon} size={22} color={destructive ? '#E53935' : colors.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.menuTitle, destructive && { color: '#E53935' }]}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={destructive ? "#E53935" : "#9AB29A"} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Profile</Text>

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
            <Text style={styles.location}>{profile.location || 'Location not set'}</Text>
            <Text style={styles.email}>{session?.user?.email}</Text>
          </>
        )}

        <TouchableOpacity style={styles.editBtn} onPress={openEditModal}>
          <Ionicons name="create-outline" size={16} color={colors.primary} />
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalScans}</Text>
          <Text style={styles.statLabel}>Cloud Scans</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>Online</Text>
          <Text style={styles.statLabel}>Status</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Account</Text>

      {menuItem(
        'log-out-outline',
        'Sign Out',
        'Log out of your account',
        handleLogout,
        true
      )}

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

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditVisible(false)}
                disabled={loading}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={saveEditedProfile} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
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