import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { colors } from '../../utils/theme';
import { useLanguage } from '../../context/LanguageContext';

const CATEGORIES = ['General', 'Tomato', 'Wheat', 'Rice', 'Corn'];

export default function CreatePostScreen({ navigation }) {
  const { session } = useAuth();
  const userId = session?.user?.id;
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t, textStyle, language } = useLanguage();

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(t('permissionRequired'), t('photoPermissionText'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const uploadImage = async () => {
    if (!image) return null;
    const fileExt = image.uri.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('community')
      .upload(fileName, decode(image.base64), {
        contentType: `image/${fileExt}`,
      });

    if (error) throw error;
    
    const { data: publicData } = supabase.storage
      .from('community')
      .getPublicUrl(fileName);
      
    return publicData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert(t('incomplete'), t('enterTitleAndQuestion'));
      return;
    }
    
    try {
      setLoading(true);
      
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage();
      }
      
      const { error } = await supabase.from('community_posts').insert({
        author_id: userId,
        title: title.trim(),
        content: content.trim(),
        category,
        image_url: imageUrl,
      });
      
      if (error) throw error;
      
      Alert.alert(t('success'), t('postPublished'));
      navigation.goBack();
    } catch (error) {
      console.log('Error creating post:', error);
      Alert.alert(t('errorCreatingPost'), error.message || JSON.stringify(error));
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (cat) => {
    if (cat === 'General') return language === 'ur' ? 'عام' : 'General';
    if (cat === 'Tomato') return language === 'ur' ? 'ٹماٹر' : 'Tomato';
    if (cat === 'Wheat') return language === 'ur' ? 'گندم' : 'Wheat';
    if (cat === 'Rice') return language === 'ur' ? 'چاول' : 'Rice';
    if (cat === 'Corn') return language === 'ur' ? 'مکئی' : 'Corn';
    return cat;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, language === 'ur' && { flexDirection: 'row-reverse' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name={language === 'ur' ? 'close' : 'close'} size={28} color="#102A12" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, textStyle]}>{t('newPost')}</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={loading}>
          {loading ? (
             <ActivityIndicator color={colors.primary} />
          ) : (
             <Text style={styles.publishText}>{t('publish')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.categoryRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={language === 'ur' && { flexDirection: 'row-reverse' }}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catBadge, category === cat && styles.catBadgeActive, language === 'ur' ? { marginLeft: 10, marginRight: 0 } : { marginRight: 10 }]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.catText, category === cat && styles.catTextActive]}>
                  {getCategoryLabel(cat)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TextInput
          style={[styles.titleInput, textStyle, language === 'ur' && { textAlign: 'right' }]}
          placeholder={t('postTitlePlaceholder')}
          placeholderTextColor="#9AB29A"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        <TextInput
          style={[styles.contentInput, textStyle, language === 'ur' && { textAlign: 'right' }]}
          placeholder={t('postContentPlaceholder')}
          placeholderTextColor="#9AB29A"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        {image && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImage(null)}>
              <Ionicons name="close-circle" size={24} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footerRow, language === 'ur' && { flexDirection: 'row-reverse' }]}>
        <TouchableOpacity style={[styles.iconBtn, language === 'ur' && { flexDirection: 'row-reverse' }]} onPress={pickImage}>
          <Ionicons name="image-outline" size={24} color={colors.primary} />
          <Text style={[styles.iconBtnText, language === 'ur' ? { marginRight: 8, marginLeft: 0 } : { marginLeft: 8 }]}>{t('attachPhoto')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF4ED',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#102A12',
  },
  publishText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  categoryRow: {
    marginBottom: 20,
  },
  catBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F6FBF6',
    borderWidth: 1,
    borderColor: '#EDF4ED',
  },
  catBadgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catText: {
    color: '#6A856A',
    fontWeight: '600',
  },
  catTextActive: {
    color: '#FFFFFF',
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '800',
    color: '#102A12',
    marginBottom: 15,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2C3F2C',
    minHeight: 150,
  },
  imagePreviewContainer: {
    marginTop: 20,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 16,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  footerRow: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#EDF4ED',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6FBF6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  iconBtnText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});
