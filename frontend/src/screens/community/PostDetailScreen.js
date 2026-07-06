import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { colors } from '../../utils/theme';
import { useLanguage } from '../../context/LanguageContext';

import { API_BASE_URL } from '../../utils/constants';

export default function PostDetailScreen({ route, navigation }) {
  const { post } = route.params;
  const { session } = useAuth();
  const userId = session?.user?.id;
  
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t, textStyle, language } = useLanguage();

  useEffect(() => {
    fetchComments();
    checkIfLiked();
  }, []);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*, author:users!post_comments_author_id_fkey(full_name, avatar_url)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.log('Error fetching comments', err);
    } finally {
      setLoading(false);
    }
  };
  
  const checkIfLiked = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('post_id', post.id)
        .eq('user_id', userId)
        .single();
        
      if (data) setIsLiked(true);
    } catch (err) {
      // Not liked or error
    }
  };
  
  const toggleLike = async () => {
    if (!userId) return;
    try {
      if (isLiked) {
        setLikesCount(prev => prev - 1);
        setIsLiked(false);
        await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', userId);
      } else {
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
        await supabase.from('post_likes').insert({ post_id: post.id, user_id: userId });
      }
    } catch (err) {
      console.log('Error toggling like:', err);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          author_id: userId,
          content: newComment.trim(),
        })
        .select('*, author:users!post_comments_author_id_fkey(full_name, avatar_url)')
        .single();
        
      if (error) throw error;
      setComments(prev => [...prev, data]);
      setNewComment('');

      // Trigger Push Notification via Backend (only if the author is not the one commenting)
      if (post.author_id && post.author_id !== userId) {
        try {
          await fetch(`${API_BASE_URL}/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: post.author_id,
              title: "New Comment on your Post!",
              body: `${data.author?.full_name || 'Someone'} commented: ${data.content}`
            })
          });
        } catch (e) {
          console.log('Error sending notification:', e);
        }
      }

    } catch (err) {
      Alert.alert(t('error'), t('failedToPostComment'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const deletePost = () => {
    Alert.alert(t('deletePost'), t('confirmDeletePost'), [
      { text: t('cancel'), style: 'cancel' },
      { 
        text: language === 'ur' ? 'ڈیلیٹ کریں' : 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from('community_posts').delete().eq('id', post.id);
            navigation.goBack();
          } catch (err) {
            Alert.alert(t('error'), t('failedToDeletePost'));
          }
        }
      }
    ]);
  };

  const author = post.author || {};

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.header, language === 'ur' && { flexDirection: 'row-reverse' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name={language === 'ur' ? 'arrow-forward' : 'arrow-back'} size={26} color="#102A12" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, textStyle]}>{t('post')}</Text>
        {userId === post.author_id ? (
          <TouchableOpacity onPress={deletePost}>
             <Ionicons name="trash-outline" size={24} color="#e74c3c" />
          </TouchableOpacity>
        ) : <View style={{width: 24}} />}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.postSection}>
          <View style={[styles.authorRow, language === 'ur' && { flexDirection: 'row-reverse' }]}>
            {author.avatar_url ? (
              <Image source={{ uri: author.avatar_url }} style={[styles.avatar, language === 'ur' ? { marginLeft: 12, marginRight: 0 } : { marginRight: 12 }]} />
            ) : (
              <View style={[styles.avatarPlaceholder, language === 'ur' ? { marginLeft: 12, marginRight: 0 } : { marginRight: 12 }]}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
            )}
            <View>
              <Text style={[styles.name, textStyle]}>{author.full_name || t('anonymousFarmer')}</Text>
              <Text style={[styles.dateText, textStyle]}>
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.postTitle, textStyle]}>{post.title}</Text>
          <Text style={[styles.postContent, textStyle]}>{post.content}</Text>
          
          {post.image_url && (
            <Image source={{ uri: post.image_url }} style={styles.postImage} />
          )}
          
          <View style={[styles.statsRow, language === 'ur' && { flexDirection: 'row-reverse' }]}>
            <TouchableOpacity style={[styles.statBtn, language === 'ur' && { flexDirection: 'row-reverse' }, language === 'ur' ? { marginLeft: 25, marginRight: 0 } : { marginRight: 25 }]} onPress={toggleLike}>
              <Ionicons name={isLiked ? "heart" : "heart-outline"} size={22} color={isLiked ? "#e74c3c" : "#6A856A"} />
              <Text style={[styles.statText, textStyle, language === 'ur' ? { marginRight: 8, marginLeft: 0 } : { marginLeft: 8 }]}>{likesCount} {t('likesCount')}</Text>
            </TouchableOpacity>
            
            <View style={[styles.statBtn, language === 'ur' && { flexDirection: 'row-reverse' }]}>
              <Ionicons name="chatbubble-outline" size={20} color="#6A856A" />
              <Text style={[styles.statText, textStyle, language === 'ur' ? { marginRight: 8, marginLeft: 0 } : { marginLeft: 8 }]}>{comments.length} {t('repliesCount')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.commentsSection}>
          <Text style={[styles.commentsTitle, textStyle]}>{t('commentsTitle')}</Text>
          
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : comments.length === 0 ? (
            <Text style={[styles.noCommentsText, textStyle]}>{t('noCommentsYet')}</Text>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={[styles.commentCard, language === 'ur' && { flexDirection: 'row-reverse' }]}>
                {comment.author?.avatar_url ? (
                  <Image source={{ uri: comment.author.avatar_url }} style={[styles.commentAvatar, language === 'ur' ? { marginLeft: 10, marginRight: 0 } : { marginRight: 10 }]} />
                ) : (
                  <View style={[styles.commentAvatarPlaceholder, language === 'ur' ? { marginLeft: 10, marginRight: 0 } : { marginRight: 10 }]}>
                    <Ionicons name="person" size={14} color="#fff" />
                  </View>
                )}
                <View style={[styles.commentBody, language === 'ur' ? { borderTopRightRadius: 4, borderTopLeftRadius: 16 } : { borderTopLeftRadius: 4, borderTopRightRadius: 16 }]}>
                  <View style={[styles.commentHeader, language === 'ur' && { flexDirection: 'row-reverse' }]}>
                    <Text style={[styles.commentName, textStyle]}>{comment.author?.full_name || t('anonymousFarmer')}</Text>
                    <Text style={[styles.commentDate, textStyle]}>
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </Text>
                  </View>
                  <Text style={[styles.commentContent, textStyle]}>{comment.content}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={[styles.inputSection, language === 'ur' && { flexDirection: 'row-reverse' }]}>
        <TextInput
          style={[styles.input, textStyle, language === 'ur' && { textAlign: 'right' }]}
          placeholder={t('addReplyPlaceholder')}
          placeholderTextColor="#9AB29A"
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendBtn, !newComment.trim() && { opacity: 0.5 }, language === 'ur' ? { marginRight: 10, marginLeft: 0 } : { marginLeft: 10 }]} 
          onPress={submitComment}
          disabled={!newComment.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name={language === 'ur' ? 'send' : 'send'} size={18} color="#fff" />
          )}
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
  scrollContent: {
    paddingBottom: 40,
  },
  postSection: {
    padding: 20,
    borderBottomWidth: 6,
    borderBottomColor: '#F6FBF6',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  dateText: {
    fontSize: 12,
    color: '#6A856A',
    marginTop: 2,
  },
  postTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#102A12',
    marginBottom: 10,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2C3F2C',
    marginBottom: 15,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: 15,
    resizeMode: 'cover',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EDF4ED',
    paddingTop: 15,
  },
  statBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 25,
  },
  statText: {
    marginLeft: 8,
    color: '#6A856A',
    fontWeight: '700',
    fontSize: 14,
  },
  commentsSection: {
    padding: 20,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#102A12',
    marginBottom: 15,
  },
  noCommentsText: {
    color: '#9AB29A',
    fontStyle: 'italic',
  },
  commentCard: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  commentAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#9AB29A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  commentBody: {
    flex: 1,
    backgroundColor: '#F6FBF6',
    padding: 12,
    borderRadius: 16,
    borderTopLeftRadius: 4,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  commentName: {
    fontWeight: 'bold',
    color: '#102A12',
    fontSize: 14,
  },
  commentDate: {
    fontSize: 11,
    color: '#6A856A',
  },
  commentContent: {
    fontSize: 14,
    color: '#2C3F2C',
    lineHeight: 20,
  },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EDF4ED',
    backgroundColor: '#FFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F6FBF6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    color: '#102A12',
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});
