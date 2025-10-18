import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, FlatList, RefreshControl, Dimensions } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { API_URL, profilePublicService } from '../services/api';
import { colors } from '../utils/theme';
import api from '../services/api';

const PROFILE_PLACEHOLDER = require('../assets/profile_placeholder.png');

type RouteParams = {
  OtherProfile: {
    username: string;
  };
};

export const OtherUserProfileScreen: React.FC = () => {
  const route = useRoute<RouteProp<RouteParams, 'OtherProfile'>>();
  const { username } = route.params;

  const [bio, setBio] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const getProfilePictureUrl = (u: string) => `${API_URL}/api/profile/${u}/picture/`;

  const fetchBio = async () => {
    try {
      const data = await profilePublicService.getUserBio(username);
      setBio(data.bio || '');
    } catch (error) {
      console.warn('Error fetching user bio:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const response = await api.get('/api/posts/all/');
      const allPosts = response.data.data || [];
      const userPosts = allPosts.filter((p: any) => p.creator_username === username);
      setPosts(userPosts);
    } catch (error) {
      console.warn('Error fetching posts for user:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchBio();
    fetchPosts();
  }, [username]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchBio(), fetchPosts()]);
  }, [username]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Image source={{ uri: getProfilePictureUrl(username) }} style={styles.profilePic} defaultSource={PROFILE_PLACEHOLDER} />
      <Text style={styles.username}>{username}</Text>
      {bio ? <Text style={styles.bio}>{bio}</Text> : null}
      <Text style={[styles.sectionTitle, { alignSelf: 'flex-start' }]}>Posts</Text>
    </View>
  );

  const renderPost = ({ item }: { item: any }) => {
    const screenWidth = Dimensions.get('window').width - 48; // padding
    return (
      <View style={styles.postItem}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={{ width: screenWidth, height: 180, borderRadius: 8, marginBottom: 8 }} />
        ) : null}
        {item.text ? <Text style={styles.postText}>{item.text}</Text> : null}
        <View style={styles.postStatsRow}>
          <Text style={styles.postStat}>👍 {item.like_count}</Text>
          <Text style={styles.postStat}>👎 {item.dislike_count}</Text>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      style={{ backgroundColor: '#eafbe6' }}
      contentContainerStyle={styles.container}
      data={loadingPosts ? [] : posts}
      keyExtractor={(item, index) => item.id?.toString() || index.toString()}
      renderItem={renderPost}
      ListHeaderComponent={renderHeader}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#eafbe6',
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eafbe6',
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    resizeMode: 'cover',
    backgroundColor: colors.lightGray,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginVertical: 8,
  },
  postItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: '100%',
  },
  postText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  postStatsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  postStat: {
    fontSize: 13,
    color: '#666',
    marginLeft: 12,
  },
}); 