// src/hooks/usePosts.js
import { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthContext';
import { postsService } from '../services/postsService';
import { useApi } from './useApi';

export const usePosts = () => {
  const { token } = useAuth();
  const [savedPostIds, setSavedPostIds] = useState(new Set());
  const [postsData, setPostsData] = useState([]);

  // Fetch all posts
  const {
    data: postsResponse,
    loading: postsLoading,
    error: postsError,
    execute: fetchPosts,
    setData: setPostsResponse,
  } = useApi(
    () => postsService.getAllPosts(token),
    {
      initialData: { results: [] },
      showErrorToast: true,
      errorMessage: 'Failed to fetch posts',
      onSuccess: (data) => setPostsData(data.results || []),
    }
  );

  // Extract posts array from paginated response
  const posts = postsResponse?.results || [];

  // Sync postsData with postsResponse.results whenever it changes (for pagination)
  useEffect(() => {
    if (postsResponse?.results) {
      setPostsData(postsResponse.results);
    }
  }, [postsResponse]);

  // Create post
  const {
    loading: createLoading,
    execute: createPostApi,
  } = useApi(
    (postData) => postsService.createPost(postData, token),
    {
      showErrorToast: true, // Only show error toast, not success (we handle that in component)
      errorMessage: 'Failed to create post',
    }
  );

  // Wrapper for createPost that refreshes the posts list
  const createPost = async (postData) => {
    try {
      const result = await createPostApi(postData);
      // Only fetch posts if the creation was successful
      if (result && !result.error) {
        await fetchPosts();
        return result; // Return result so component knows it succeeded
      }
      throw new Error('Post creation failed');
    } catch (error) {
      console.error('Error in createPost:', error);
      throw error; // Re-throw so component can handle it
    }
  };

  // Toggle like
  const {
    execute: toggleLikeApi,
  } = useApi(
    (postId, isLiked) => postsService.toggleLike(postId, isLiked, token),
    {
      showErrorToast: true,
      errorMessage: 'Failed to update like status',
    }
  );

  // Wrapper for toggleLike that updates local state
  const toggleLike = async (postId, isLiked) => {
    const result = await toggleLikeApi(postId, isLiked);
    if (result && result.data) {
      // Update the post in local state with the new data from API
      setPostsData(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? result.data : post
        )
      );
      // Also update postsResponse for immediate UI update
      setPostsResponse(prevResponse => ({
        ...prevResponse,
        results: prevResponse.results.map(post =>
          post.id === postId ? result.data : post
        )
      }));
      // Also update savedPosts if viewing saved posts
      setSavedPosts(prevSaved =>
        prevSaved.map(post =>
          post.id === postId ? result.data : post
        )
      );
    }
    return result;
  };

  // Toggle dislike
  const {
    execute: toggleDislikeApi,
  } = useApi(
    (postId, isDisliked) => postsService.toggleDislike(postId, isDisliked, token),
    {
      showErrorToast: true,
      errorMessage: 'Failed to update dislike status',
    }
  );

  // Wrapper for toggleDislike that updates local state
  const toggleDislike = async (postId, isDisliked) => {
    const result = await toggleDislikeApi(postId, isDisliked);
    if (result && result.data) {
      // Update the post in local state with the new data from API
      setPostsData(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? result.data : post
        )
      );
      // Also update postsResponse for immediate UI update
      setPostsResponse(prevResponse => ({
        ...prevResponse,
        results: prevResponse.results.map(post =>
          post.id === postId ? result.data : post
        )
      }));
      // Also update savedPosts if viewing saved posts
      setSavedPosts(prevSaved =>
        prevSaved.map(post =>
          post.id === postId ? result.data : post
        )
      );
    }
    return result;
  };

  // Fetch saved posts
  const {
    data: savedPosts,
    loading: savedLoading,
    execute: fetchSavedPosts,
    setData: setSavedPosts,
  } = useApi(
    () => postsService.getSavedPosts(token),
    {
      initialData: [],
      onSuccess: (data) => {
        const ids = new Set(data.map(post => post.id));
        setSavedPostIds(ids);
      },
    }
  );

  // Save post
  const savePost = async (postId) => {
    try {
      await postsService.savePost(postId, token);
      setSavedPostIds(prev => new Set([...prev, postId]));
      // Update postsResponse to reflect saved status
      setPostsResponse(prevResponse => ({
        ...prevResponse,
        results: prevResponse.results.map(post =>
          post.id === postId ? { ...post, is_saved: true } : post
        )
      }));
      // Also update postsData
      setPostsData(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, is_saved: true } : post
        )
      );
      await fetchSavedPosts();
    } catch (error) {
      console.error('Error saving post:', error);
      throw error;
    }
  };

  // Unsave post
  const unsavePost = async (postId) => {
    try {
      await postsService.unsavePost(postId, token);
      setSavedPostIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      // Update postsResponse to reflect unsaved status
      setPostsResponse(prevResponse => ({
        ...prevResponse,
        results: prevResponse.results.map(post =>
          post.id === postId ? { ...post, is_saved: false } : post
        )
      }));
      // Also update postsData
      setPostsData(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, is_saved: false } : post
        )
      );
      await fetchSavedPosts();
    } catch (error) {
      console.error('Error unsaving post:', error);
      throw error;
    }
  };

  // Load posts on mount
  useEffect(() => {
    if (token) {
      fetchPosts();
      fetchSavedPosts();
    }
  }, [token]);

  return {
    // Posts data
    posts: postsData,
    postsLoading,
    postsError,
    fetchPosts,
    postsResponse, // For pagination
    setPostsResponse, // For pagination

    // Create post
    createPost,
    createLoading,

    // Likes
    toggleLike,
    toggleDislike,

    // Saved posts
    savedPosts,
    savedLoading,
    savedPostIds,
    savePost,
    unsavePost,
    fetchSavedPosts,
  };
};