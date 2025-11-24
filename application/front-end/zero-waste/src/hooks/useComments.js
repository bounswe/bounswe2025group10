// src/hooks/useComments.js
import { useState } from 'react';
import { useAuth } from '../providers/AuthContext';
import { postsService } from '../services/postsService';
import { useApi } from './useApi';

export const useComments = () => {
  const { token } = useAuth();
  const [postComments, setPostComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  // Fetch comments for a post
  const fetchComments = async (postId) => {
    try {
      const result = await postsService.getComments(postId);
      setPostComments(prev => ({
        ...prev,
        [postId]: result.data || []
      }));
      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      return [];
    }
  };

  // Create comment
  const {
    loading: commentLoading,
    execute: createComment,
  } = useApi(
    async (postId, content) => {
      const result = await postsService.createComment(postId, content, token);
      // Refresh comments after creation
      await fetchComments(postId);
      // Clear input
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      return result;
    }
  );

  // Report comment
  const {
    execute: reportComment,
  } = useApi(
    (commentId, reason, description) => 
      postsService.reportComment(commentId, reason, description, token)
  );

  // Update comment input
  const updateCommentInput = (postId, value) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  return {
    postComments,
    commentInputs,
    commentLoading,
    fetchComments,
    createComment,
    reportComment,
    updateCommentInput,
  };
};