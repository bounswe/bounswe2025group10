import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, Alert, TouchableOpacity, Modal, TextInput } from 'react-native';
import { colors, spacing, typography, commonStyles } from '../utils/theme';
import api from '../services/api';
import { launchImageLibrary } from 'react-native-image-picker';

interface Post {
  id: number;
  text: string;
  image?: string;
  date: string;
  creator_username: string;
  creator_profile_image?: string;
  like_count: number;
  dislike_count: number;
  image_url?: string;
  is_user_liked?: boolean;
  is_user_disliked?: boolean;
}

const BASE_URL = 'https://134-209-253-215.sslip.io';

export const CommunityScreen = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newText, setNewText] = useState('');
  const [imageFile, setImageFile] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  const fetchPosts = async () => {
    if (!refreshing) setLoading(true);
    try {
      const response = await api.get('/api/posts/all/');
      setPosts(response.data.data); // response.data.data is the array of posts
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const pickImage = async () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8 },
      (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Image picker error');
          return;
        }
        if (response.assets && response.assets.length > 0) {
          setImageFile(response.assets[0]);
        }
      }
    );
  };

  const createPost = async () => {
    if (!newText && !imageFile) {
      Alert.alert('Error', 'Please enter text or select an image');
      return;
    }
    setCreating(true);
    try {
      const formData = new FormData();
      if (newText) formData.append('text', newText);
      if (imageFile) {
        formData.append('image', {
          uri: imageFile.uri,
          name: imageFile.fileName || 'photo.jpg',
          type: imageFile.type || 'image/jpeg',
        });
      }
      await api.post('/api/posts/create/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setModalVisible(false);
      setNewText('');
      setImageFile(null);
      fetchPosts();
    } catch (error) {
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleReaction = async (postId: number, type: 'like' | 'dislike') => {
    try {
      const response = await api.post(`/api/posts/${postId}/${type}/`);
      if (response.data && response.data.data) {
        const updatedPost = response.data.data;
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId ? { ...post, ...updatedPost } : post
          )
        );
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${type} post`);
    }
  };

  const renderItem = ({ item }: { item: Post }) => {
    const imageUrl = item.image_url || (
      item.image
        ? item.image.startsWith('http')
          ? item.image
          : `${BASE_URL}${item.image.startsWith('/') ? '' : '/'}${item.image}`
        : null
    );

    return (
      <View style={styles.postItem}>
        <View style={styles.postHeader}>
          {item.creator_profile_image ? (
            <Image source={{ uri: item.creator_profile_image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
          <Text style={styles.username}>{item.creator_username}</Text>
        </View>
        {item.text ? <Text style={styles.postText}>{item.text}</Text> : null}
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.postImage} />
        ) : null}
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={[styles.reactionButton, item.is_user_liked && styles.activeReactionButton]} 
            onPress={() => handleReaction(item.id, 'like')}
          >
            <Text style={[styles.reactionText, item.is_user_liked && styles.activeReactionText]}>
              👍 {item.like_count}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.reactionButton, item.is_user_disliked && styles.activeReactionButton]} 
            onPress={() => handleReaction(item.id, 'dislike')}
          >
            <Text style={[styles.reactionText, item.is_user_disliked && styles.activeReactionText]}>
              👎 {item.dislike_count}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Community Posts</Text>
      <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.createButtonText}>+ Create</Text>
      </TouchableOpacity>
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: spacing.lg }}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Post</Text>
            <TextInput
              style={styles.input}
              placeholder="What's on your mind?"
              value={newText}
              onChangeText={setNewText}
              multiline
            />
            <TouchableOpacity style={styles.modalButton} onPress={pickImage}>
              <Text style={styles.modalButtonText}>{imageFile ? 'Image Selected' : 'Pick Image'}</Text>
            </TouchableOpacity>
            {imageFile && (
              <Image source={{ uri: imageFile.uri }} style={{ width: 100, height: 100, marginBottom: 8, alignSelf: 'center' }} />
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)} disabled={creating}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={createPost} disabled={creating}>
                <Text style={styles.modalButtonText}>{creating ? 'Sharing...' : 'Share'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { ...commonStyles.container, padding: spacing.md },
  title: { ...typography.h1, color: colors.primary, marginBottom: spacing.md },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  createButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  postItem: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.sm,
    backgroundColor: colors.lightGray,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.sm,
    backgroundColor: colors.lightGray,
  },
  username: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.primary,
  },
  postText: {
    ...typography.body,
    color: colors.black,
    marginBottom: spacing.sm,
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: spacing.sm,
    backgroundColor: colors.lightGray,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  reactionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    marginLeft: spacing.sm,
  },
  activeReactionButton: {
    backgroundColor: colors.lightGray,
  },
  reactionText: {
    ...typography.body,
    color: colors.gray,
  },
  activeReactionText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    width: '90%',
    maxWidth: 400,
    elevation: 5,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  input: {
    ...commonStyles.input,
    marginBottom: spacing.sm,
  },
  modalButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginLeft: spacing.sm,
    marginTop: spacing.sm,
  },
  modalButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 