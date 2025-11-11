import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, Alert, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { colors, spacing, typography, commonStyles } from '../utils/theme';
import api from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

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

interface Comment {
  id: number;
  content: string;
  date: string;
  post: number;
  author: number;
  author_username: string;
  author_profile_image?: string;
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
  const [comments, setComments] = useState<{ [postId: number]: Comment[] }>({});
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const navigation = useNavigation<any>();

  const fetchPosts = useCallback(async () => {
    if (!refreshing) {setLoading(true);}
    try {
      const response = await api.get('/api/posts/all/');
      setPosts(response.data.data); // response.data.data is the array of posts
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) {return;}

      if (result.assets && result.assets.length > 0) {
        setImageFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Image picker error');
    }
  };

  const createPost = async () => {
    if (!newText && !imageFile) {
      Alert.alert('Error', 'Please enter text or select an image');
      return;
    }
    setCreating(true);
    try {
      const formData = new FormData();
      if (newText) {formData.append('text', newText);}
      if (imageFile) {
        formData.append('image', {
          uri: imageFile.uri,
          name: 'photo.jpg',
          type: 'image/jpeg',
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
  }, [fetchPosts]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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

  const fetchComments = async (postId: number) => {
    setLoadingComments(true);
    try {
      const response = await api.get(`/api/posts/${postId}/comments/`);
      if (response.data && response.data.data) {
        setComments(prev => ({ ...prev, [postId]: response.data.data }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const openCommentsModal = (postId: number) => {
    setSelectedPostId(postId);
    setCommentsModalVisible(true);
    fetchComments(postId);
  };

  const closeCommentsModal = () => {
    setCommentsModalVisible(false);
    setSelectedPostId(null);
  };

  const postComment = async () => {
    if (!selectedPostId || !newComment.trim()) {return;}
    setPostingComment(true);
    try {
      await api.post(`/api/posts/${selectedPostId}/comments/create/`, { content: newComment });
      setNewComment('');
      fetchComments(selectedPostId); // Refresh comments
    } catch (error) {
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setPostingComment(false);
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
          <TouchableOpacity onPress={() => navigation.navigate('OtherProfile', { username: item.creator_username })} style={{flexDirection:'row', alignItems:'center'}}>
            {item.creator_profile_image ? (
              <Image source={{ uri: item.creator_profile_image.startsWith('http') ? item.creator_profile_image : `${BASE_URL}${item.creator_profile_image.startsWith('/') ? '' : '/'}${item.creator_profile_image}` }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
            <Text style={styles.username}>{item.creator_username}</Text>
          </TouchableOpacity>
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
        <TouchableOpacity
          style={styles.commentsButton}
          onPress={() => openCommentsModal(item.id)}
        >
          <Text style={styles.commentsButtonText}>View Comments</Text>
        </TouchableOpacity>
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
      <Modal
        visible={commentsModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeCommentsModal}
      >
        <View style={{ flex: 1, backgroundColor: 'white' }}>
          <Text style={{ ...typography.h2, color: colors.primary, margin: spacing.md }}>Comments</Text>
          <TouchableOpacity onPress={closeCommentsModal} style={{ alignSelf: 'flex-end', margin: spacing.md }}>
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Close</Text>
          </TouchableOpacity>
          {loadingComments ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <ScrollView style={{ flex: 1, padding: spacing.md }}>
              {selectedPostId && comments[selectedPostId] && comments[selectedPostId].length > 0 ? (
                comments[selectedPostId].map(comment => (
                  <View key={comment.id} style={{ marginBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.lightGray, paddingBottom: spacing.sm }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      {comment.author_profile_image ? (
                        <Image source={{ uri: comment.author_profile_image }} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8, backgroundColor: colors.lightGray }} />
                      ) : (
                        <View style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8, backgroundColor: colors.lightGray }} />
                      )}
                      <Text style={{ fontWeight: 'bold', color: colors.primary }}>{comment.author_username}</Text>
                      <Text style={{ marginLeft: 8, color: colors.gray, fontSize: 12 }}>{new Date(comment.date).toLocaleString()}</Text>
                    </View>
                    <Text style={{ color: colors.black }}>{comment.content}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: colors.gray, textAlign: 'center', marginTop: spacing.lg }}>No comments yet.</Text>
              )}
            </ScrollView>
          )}
          <View style={styles.newCommentContainer}>
            <TextInput
              style={styles.newCommentInput}
              placeholder="Write a comment..."
              value={newComment}
              onChangeText={setNewComment}
              editable={!postingComment}
            />
            <TouchableOpacity
              style={[styles.postCommentButton, (!newComment.trim() || postingComment) && { backgroundColor: colors.gray }]}
              onPress={postComment}
              disabled={!newComment.trim() || postingComment}
            >
              <Text style={styles.postCommentButtonText}>{postingComment ? 'Posting...' : 'Post'}</Text>
            </TouchableOpacity>
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
  commentsButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-end',
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  commentsButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  newCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  newCommentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    backgroundColor: colors.lightGray,
  },
  postCommentButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  postCommentButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});
