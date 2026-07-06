import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';

import { supabase } from '../services/supabase';
import { colors } from '../utils/theme';
import { useLanguage } from '../context/LanguageContext';
import { getCropLabel } from '../utils/localization';

const tags = ['All', 'Tomato', 'Wheat', 'Rice', 'Corn', 'General'];

export default function CommunityScreen({ navigation }) {
  const [activeTag, setActiveTag] = useState('All');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, textStyle, language } = useLanguage();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          author:users!community_posts_author_id_fkey(full_name, location, avatar_url),
          comments:post_comments(id),
          likes:post_likes(user_id)
        `)
        .order('created_at', { ascending: false });

      if (activeTag !== 'All') {
        query = query.eq('category', activeTag);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.log('Error fetching posts:', err);
      Alert.alert(t('errorFetchingPosts'), err.message || JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [activeTag])
  );

  const openPost = (post) => {
    navigation.navigate('PostDetail', { post });
  };

  const getTagLabel = (tag) => {
    if (tag === 'All') return language === 'ur' ? 'سب' : 'All';
    if (tag === 'Tomato') return language === 'ur' ? 'ٹماٹر' : 'Tomato';
    if (tag === 'Wheat') return language === 'ur' ? 'گندم' : 'Wheat';
    if (tag === 'Rice') return language === 'ur' ? 'چاول' : 'Rice';
    if (tag === 'Corn') return language === 'ur' ? 'مکئی' : 'Corn';
    if (tag === 'General') return language === 'ur' ? 'عام' : 'General';
    return getCropLabel(tag, language);
  };

  const renderPost = ({ item }) => {
    const author = item.author || {};
    const replyCount = item.comments ? item.comments.length : 0;
    const likeCount = item.likes ? item.likes.length : 0;
    
    return (
      <TouchableOpacity style={styles.postCard} onPress={() => openPost(item)}>
        <View style={[styles.postHeader, language === 'ur' && { flexDirection: 'row-reverse' }]}>
          {author.avatar_url ? (
            <Image source={{ uri: author.avatar_url }} style={[styles.avatar, language === 'ur' ? { marginLeft: 12, marginRight: 0 } : { marginRight: 12 }]} />
          ) : (
            <View style={[styles.avatarPlaceholder, language === 'ur' ? { marginLeft: 12, marginRight: 0 } : { marginRight: 12 }]}>
              <Ionicons name="person" size={24} color="#fff" />
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text style={[styles.name, textStyle]}>{author.full_name || t('anonymousFarmer')}</Text>
            <Text style={[styles.location, textStyle]}>
              {author.location || t('unknownLocation')} • {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </Text>
          </View>

          <View style={styles.cropBadge}>
            <Text style={[styles.cropBadgeText, textStyle]}>{getTagLabel(item.category)}</Text>
          </View>
        </View>

        {item.title && <Text style={[styles.postTitle, textStyle]}>{item.title}</Text>}
        <Text style={[styles.question, textStyle]} numberOfLines={3}>{item.content}</Text>
        
        {item.image_url && (
           <Image source={{ uri: item.image_url }} style={styles.postImage} />
        )}

        <View style={[styles.postFooter, language === 'ur' && { flexDirection: 'row-reverse' }]}>
          <View style={[styles.footerItem, language === 'ur' && { flexDirection: 'row-reverse' }, language === 'ur' ? { marginLeft: 24, marginRight: 0 } : { marginRight: 24 }]}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
            <Text style={[styles.footerText, textStyle, language === 'ur' ? { marginRight: 6, marginLeft: 0 } : { marginLeft: 6 }]}>{replyCount} {t('replies')}</Text>
          </View>

          <View style={[styles.footerItem, language === 'ur' && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="heart-outline" size={18} color={colors.primary} />
            <Text style={[styles.footerText, textStyle, language === 'ur' ? { marginRight: 6, marginLeft: 0 } : { marginLeft: 6 }]}>{likeCount} {t('likes')}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, textStyle]}>{t('communityTitle')}</Text>
        <Text style={[styles.subtitle, textStyle]}>{t('communitySubtitle')}</Text>
      </View>

      <View style={[styles.heroCard, language === 'ur' && { flexDirection: 'row-reverse' }]}>
        <View style={[styles.heroIcon, language === 'ur' ? { marginLeft: 14, marginRight: 0 } : { marginRight: 14 }]}>
          <Ionicons name="people" size={34} color="#fff" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, textStyle]}>{t('farmerHelpForum')}</Text>
          <Text style={[styles.heroText, textStyle]}>
            {t('farmerHelpForumDesc')}
          </Text>
        </View>
      </View>

      <View style={[styles.tagsRow, language === 'ur' && { flexDirection: 'row-reverse' }]}>
        {tags.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[styles.tag, activeTag === tag && styles.activeTag, language === 'ur' ? { marginLeft: 8, marginRight: 0 } : { marginRight: 8 }]}
            onPress={() => setActiveTag(tag)}
          >
            <Text style={[styles.tagText, textStyle, activeTag === tag && styles.activeTagText]}>
              {getTagLabel(tag)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="chatbubbles-outline" size={60} color={colors.primary} />
              <Text style={[styles.emptyTitle, textStyle]}>{t('noPostsYet')}</Text>
              <Text style={[styles.emptyText, textStyle]}>{t('beFirstToAsk')}</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={[styles.fab, language === 'ur' && { flexDirection: 'row-reverse' }]} onPress={() => navigation.navigate('CreatePost')}>
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={[styles.fabText, textStyle, language === 'ur' ? { marginRight: 6, marginLeft: 0 } : { marginLeft: 6 }]}>{t('askBtn')}</Text>
      </TouchableOpacity>
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
  },
  title: {
    fontSize: 33,
    fontWeight: '900',
    color: '#102A12',
  },
  subtitle: {
    marginTop: 6,
    color: '#6A856A',
    fontSize: 15,
    fontWeight: '600',
  },
  heroCard: {
    margin: 18,
    backgroundColor: colors.primary,
    borderRadius: 28,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '900',
  },
  heroText: {
    color: '#E8F5E9',
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 18,
    marginBottom: 6,
  },
  tag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activeTag: {
    backgroundColor: colors.primary,
  },
  tagText: {
    color: '#102A12',
    fontWeight: '800',
  },
  activeTagText: {
    color: '#FFFFFF',
  },
  list: {
    padding: 18,
    paddingBottom: 120,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '900',
    color: '#102A12',
  },
  location: {
    marginTop: 3,
    color: '#6A856A',
    fontSize: 12,
    fontWeight: '600',
  },
  cropBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
  },
  cropBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  postTitle: {
    marginTop: 14,
    color: '#102A12',
    fontSize: 17,
    fontWeight: '800',
  },
  question: {
    marginTop: 6,
    color: '#2C3F2C',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
    resizeMode: 'cover',
  },
  postFooter: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: '#EDF4ED',
    paddingTop: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  footerText: {
    color: '#6A856A',
    marginLeft: 6,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 21,
    fontWeight: '900',
    color: '#102A12',
  },
  emptyText: {
    marginTop: 5,
    color: '#6A856A',
  },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 28,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '900',
    marginLeft: 6,
  },
});
