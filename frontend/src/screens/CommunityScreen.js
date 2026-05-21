import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

const tags = ['All', 'Tomato', 'Wheat', 'Rice', 'Corn', 'General'];

const posts = [
  {
    id: '1',
    name: 'Farmer Ali',
    location: 'Sialkot',
    crop: 'Tomato',
    question: 'My tomato leaves have brown circular spots. Should I spray fungicide or remove leaves first?',
    replies: 8,
    time: '2h ago',
  },
  {
    id: '2',
    name: 'Ayesha Farms',
    location: 'Gujranwala',
    crop: 'Corn',
    question: 'Corn leaves are showing rust-like dots after rain. What is the safest treatment?',
    replies: 5,
    time: '5h ago',
  },
  {
    id: '3',
    name: 'Green Valley',
    location: 'Lahore',
    crop: 'Rice',
    question: 'What is the best time of day to spray pesticide in hot weather?',
    replies: 12,
    time: '1d ago',
  },
  {
    id: '4',
    name: 'Hassan Orchard',
    location: 'Sargodha',
    crop: 'General',
    question: 'How often should I inspect leaves for early disease symptoms?',
    replies: 3,
    time: '2d ago',
  },
];

export default function CommunityScreen() {
  const [activeTag, setActiveTag] = useState('All');

  const filteredPosts = useMemo(() => {
    if (activeTag === 'All') return posts;
    return posts.filter((post) => post.crop === activeTag);
  }, [activeTag]);

  const askQuestion = () => {
    Alert.alert(
      'Ask a Question',
      'This is a static FYP demo screen. Later you can connect this with Firebase or your backend.'
    );
  };

  const openPost = (post) => {
    Alert.alert(
      post.crop,
      `${post.question}\n\nReplies: ${post.replies}\nLocation: ${post.location}`
    );
  };

  const renderPost = ({ item }) => (
    <TouchableOpacity style={styles.postCard} onPress={() => openPost(item)}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color="#fff" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.location}>{item.location} • {item.time}</Text>
        </View>

        <View style={styles.cropBadge}>
          <Text style={styles.cropBadgeText}>{item.crop}</Text>
        </View>
      </View>

      <Text style={styles.question}>{item.question}</Text>

      <View style={styles.postFooter}>
        <View style={styles.footerItem}>
          <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
          <Text style={styles.footerText}>{item.replies} replies</Text>
        </View>

        <View style={styles.footerItem}>
          <Ionicons name="leaf-outline" size={18} color={colors.primary} />
          <Text style={styles.footerText}>Crop help</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <Text style={styles.subtitle}>Ask questions and learn from farmers</Text>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Ionicons name="people" size={34} color="#fff" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Farmer Help Forum</Text>
          <Text style={styles.heroText}>
            Share crop issues, discuss symptoms, and learn disease prevention tips.
          </Text>
        </View>
      </View>

      <View style={styles.tagsRow}>
        {tags.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[styles.tag, activeTag === tag && styles.activeTag]}
            onPress={() => setActiveTag(tag)}
          >
            <Text style={[styles.tagText, activeTag === tag && styles.activeTagText]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="chatbubbles-outline" size={60} color={colors.primary} />
            <Text style={styles.emptyTitle}>No posts found</Text>
            <Text style={styles.emptyText}>Try another crop filter.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={askQuestion}>
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={styles.fabText}>Ask</Text>
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
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
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
  },
  question: {
    marginTop: 14,
    color: '#2C3F2C',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  postFooter: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EDF4ED',
    paddingTop: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '900',
    marginLeft: 6,
  },
});
