import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, Alert, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { colors as defaultColors, spacing, typography, commonStyles } from '../utils/theme';
import { MIN_TOUCH_TARGET } from '../utils/accessibility';
import { postService, getProfilePictureUrl, getPostImageUrl } from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../context/ThemeContext';

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

export const CommunityScreen = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
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

  const fetchPosts = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {setLoading(true);}
    try {
      const response = await postService.getAllPosts();
      setPosts(response.data); // response.data is the array of posts
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
      await postService.createPost(formData);
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
    await fetchPosts(true);
  }, [fetchPosts]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleReaction = async (postId: number, type: 'like' | 'dislike') => {
    try {
      const response = type === 'like'
        ? await postService.likePost(postId)
        : await postService.dislikePost(postId);
      if (response && response.data) {
        const updatedPost = response.data;
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
      const response = await postService.getComments(postId);
      if (response && response.data) {
        setComments(prev => ({ ...prev, [postId]: response.data }));
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
      await postService.createComment(selectedPostId, newComment);
      setNewComment('');
      fetchComments(selectedPostId); // Refresh comments
    } catch (error) {
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  const renderItem = ({ item }: { item: Post }) => {
    const imageUrl = item.image_url
      ? getPostImageUrl(item.image_url)
      : (item.image ? getPostImageUrl(item.image) : null);

    // Load profile picture from API with fallback to placeholder
    const profileImageSource = item.creator_username
      ? { uri: getProfilePictureUrl(item.creator_username) }
      : require('../assets/profile_placeholder.png');

    return (
      <View style={[styles.postItem, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={styles.postHeader}>
          <TouchableOpacity onPress={() => navigation.navigate('OtherProfile', { username: item.creator_username })} style={{flexDirection:'row', alignItems:'center'}}>
            <Image
              source={profileImageSource}
              style={[styles.avatar, { backgroundColor: colors.lightGray }]}
            />
            <Text style={[styles.username, { color: colors.primary }]}>{item.creator_username}</Text>
          </TouchableOpacity>
        </View>
        {item.text ? <Text style={[styles.postText, { color: colors.textPrimary }]}>{item.text}</Text> : null}
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={[styles.postImage, { backgroundColor: colors.lightGray }]} />
        ) : null}
        <View style={[styles.statsRow, { borderTopColor: colors.lightGray }]}>
          <TouchableOpacity
            style={[styles.reactionButton, item.is_user_liked && { backgroundColor: colors.lightGray }]}
            onPress={() => handleReaction(item.id, 'like')}
          >
            <Text style={[styles.reactionText, { color: colors.textSecondary }, item.is_user_liked && { color: colors.primary, fontWeight: 'bold' }]}>
              👍 {item.like_count}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reactionButton, item.is_user_disliked && { backgroundColor: colors.lightGray }]}
            onPress={() => handleReaction(item.id, 'dislike')}
          >
            <Text style={[styles.reactionText, { color: colors.textSecondary }, item.is_user_disliked && { color: colors.primary, fontWeight: 'bold' }]}>
              👎 {item.dislike_count}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.commentsButton, { backgroundColor: colors.lightGray }]}
          onPress={() => openCommentsModal(item.id)}
        >
          <Text style={[styles.commentsButtonText, { color: colors.primary }]}>{t('community.comments')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScreenWrapper
      title={t('community.title')}
      scrollable={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
        <Text style={[styles.createButtonText, { color: colors.textOnPrimary }]}>+ {t('community.createPost')}</Text>
      </TouchableOpacity>
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: spacing.lg }}
        />
      )}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.primary }]}>{t('community.createPost')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundSecondary, borderColor: colors.lightGray, color: colors.textPrimary }]}
              placeholder={t('community.writePost')}
              placeholderTextColor={colors.textSecondary}
              value={newText}
              onChangeText={setNewText}
              multiline
            />
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={pickImage}>
              <Text style={[styles.modalButtonText, { color: colors.textOnPrimary }]}>{imageFile ? t('community.addImage') : t('community.addImage')}</Text>
            </TouchableOpacity>
            {imageFile && (
              <Image source={{ uri: imageFile.uri }} style={{ width: 100, height: 100, marginBottom: 8, alignSelf: 'center' }} />
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.lightGray }]} onPress={() => setModalVisible(false)} disabled={creating}>
                <Text style={[styles.modalButtonText, { color: colors.textPrimary }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={createPost} disabled={creating}>
                <Text style={[styles.modalButtonText, { color: colors.textOnPrimary }]}>{creating ? t('common.loading') : t('community.post')}</Text>
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
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.lightGray }}>
            <Text style={{ ...typography.h2, color: colors.primary }}>{t('community.comments')}</Text>
            <TouchableOpacity onPress={closeCommentsModal}>
              <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
          {loadingComments ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <ScrollView style={{ flex: 1, padding: spacing.md }}>
              {selectedPostId && comments[selectedPostId] && comments[selectedPostId].length > 0 ? (
                comments[selectedPostId].map(comment => {
                  // Load profile picture from API with fallback to placeholder
                  const commentProfileSource = comment.author_username
                    ? { uri: getProfilePictureUrl(comment.author_username) }
                    : require('../assets/profile_placeholder.png');
                  return (
                    <View key={comment.id} style={{ marginBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.lightGray, paddingBottom: spacing.sm }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Image
                          source={commentProfileSource}
                          style={{ width: 24, height: 24, borderRadius: 12, marginRight: spacing.sm, backgroundColor: colors.lightGray }}
                        />
                        <Text style={{ fontWeight: 'bold', color: colors.primary }}>{comment.author_username}</Text>
                        <Text style={{ marginLeft: 8, color: colors.textSecondary, fontSize: 12 }}>{new Date(comment.date).toLocaleString()}</Text>
                      </View>
                      <Text style={{ color: colors.textPrimary }}>{comment.content}</Text>
                    </View>
                  );
                })
              ) : (
                <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg }}>{t('community.noPostsYet')}</Text>
              )}
            </ScrollView>
          )}
          <View style={[styles.newCommentContainer, { backgroundColor: colors.background, borderTopColor: colors.lightGray }]}>
            <TextInput
              style={[styles.newCommentInput, { backgroundColor: colors.backgroundSecondary, borderColor: colors.lightGray, color: colors.textPrimary }]}
              placeholder={t('community.writeComment')}
              placeholderTextColor={colors.textSecondary}
              value={newComment}
              onChangeText={setNewComment}
              editable={!postingComment}
            />
            <TouchableOpacity
              style={[styles.postCommentButton, { backgroundColor: colors.primary }, (!newComment.trim() || postingComment) && { backgroundColor: colors.gray }]}
              onPress={postComment}
              disabled={!newComment.trim() || postingComment}
            >
              <Text style={[styles.postCommentButtonText, { color: colors.textOnPrimary }]}>{postingComment ? t('common.loading') : t('community.post')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  createButton: {
    backgroundColor: defaultColors.primary,
    borderRadius: 24,
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: defaultColors.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  postItem: {
    backgroundColor: defaultColors.white,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: defaultColors.black,
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
    backgroundColor: defaultColors.lightGray,
  },
  username: {
    ...typography.body,
    fontWeight: 'bold',
    color: defaultColors.primary,
  },
  postText: {
    ...typography.body,
    color: defaultColors.black,
    marginBottom: spacing.sm,
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: spacing.sm,
    backgroundColor: defaultColors.lightGray,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: defaultColors.lightGray,
  },
  reactionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    marginLeft: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeReactionButton: {
    backgroundColor: defaultColors.lightGray,
  },
  reactionText: {
    ...typography.body,
    color: defaultColors.gray,
  },
  activeReactionText: {
    color: defaultColors.primary,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: defaultColors.white,
    borderRadius: 12,
    padding: spacing.lg,
    width: '90%',
    maxWidth: 400,
    elevation: 5,
  },
  modalTitle: {
    ...typography.h2,
    color: defaultColors.primary,
    marginBottom: spacing.md,
  },
  input: {
    ...commonStyles.input,
    marginBottom: spacing.sm,
  },
  modalButton: {
    backgroundColor: defaultColors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginLeft: spacing.sm,
    marginTop: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: defaultColors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  commentsButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-end',
    backgroundColor: defaultColors.lightGray,
    borderRadius: 8,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsButtonText: {
    color: defaultColors.primary,
    fontWeight: 'bold',
  },
  newCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: defaultColors.lightGray,
    backgroundColor: defaultColors.white,
  },
  newCommentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: defaultColors.lightGray,
    borderRadius: 8,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    backgroundColor: defaultColors.lightGray,
  },
  postCommentButton: {
    backgroundColor: defaultColors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postCommentButtonText: {
    color: defaultColors.white,
    fontWeight: 'bold',
  },
});
