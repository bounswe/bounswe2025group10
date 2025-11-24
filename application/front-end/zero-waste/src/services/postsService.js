// src/services/postsService.js
import apiClient, { createAuthenticatedFetch, API_BASE_URL } from './api.js';

export const postsService = {
  // Get all posts
  getAllPosts: async (token) => {
    const authenticatedFetch = createAuthenticatedFetch(token);
    const response = await authenticatedFetch('/api/posts/all/');
    const result = await response.json();
    return result; // Return full paginated response
  },

  // Get posts from a specific URL (for pagination)
  getPostsFromUrl: async (url, token) => {
    const authenticatedFetch = createAuthenticatedFetch(token);
    // Extract path from full URL (e.g., "http://...api/posts/all/?page=2" -> "/api/posts/all/?page=2")
    const path = url.includes('://') ? new URL(url).pathname + new URL(url).search : url;
    const response = await authenticatedFetch(path);
    const result = await response.json();
    return result;
  },

  // Create new post
  createPost: async (postData, token) => {
    const authenticatedFetch = createAuthenticatedFetch(token);
    const formData = new FormData();
    formData.append('text', postData.description);
    if (postData.image) {
      formData.append('image', postData.image);
    }

    const response = await authenticatedFetch('/api/posts/create/', {
      method: 'POST',
      // Don't set headers at all - createAuthenticatedFetch handles auth
      // Don't set Content-Type for FormData - browser sets it automatically with boundary
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.Error || 'Failed to create post');
    }

    const result = await response.json();
    return result;
  },

  // Like/Unlike post
  toggleLike: async (postId, isLiked, token) => {
    const authenticatedFetch = createAuthenticatedFetch(token);
    const endpoint = `/api/posts/${postId}/like/`;
    const response = await authenticatedFetch(endpoint, { method: 'POST' });

    if (!response.ok) {
      throw new Error('Failed to toggle like');
    }

    return await response.json();
  },

  // Dislike/Undislike post
  toggleDislike: async (postId, isDisliked, token) => {
    const authenticatedFetch = createAuthenticatedFetch(token);
    const endpoint = `/api/posts/${postId}/dislike/`;
    const response = await authenticatedFetch(endpoint, { method: 'POST' });

    if (!response.ok) {
      throw new Error('Failed to toggle dislike');
    }

    return await response.json();
  },

  // Get saved posts
  getSavedPosts: async (token) => {
    const authenticatedFetch = createAuthenticatedFetch(token);
    const response = await authenticatedFetch('/api/posts/saved/');
    const result = await response.json();
    return result.data || [];
  },

  // Save post
  savePost: async (postId, token) => {
    const authenticatedFetch = createAuthenticatedFetch(token);
    const response = await authenticatedFetch(`/api/posts/${postId}/save/`, { method: 'POST' });

    if (!response.ok) {
      throw new Error('Failed to save post');
    }

    return await response.json();
  },

  // Unsave post
  unsavePost: async (postId, token) => {
    const authenticatedFetch = createAuthenticatedFetch(token);
    const response = await authenticatedFetch(`/api/posts/${postId}/unsave/`, { method: 'POST' });

    if (!response.ok) {
      throw new Error('Failed to unsave post');
    }

    return await response.json();
  },

  // Get post comments
  getComments: async (postId) => {
    const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments/`);

    if (!response.ok) {
      throw new Error('Failed to fetch comments');
    }

    return await response.json();
  },

  // Create comment
  createComment: async (postId, content, token) => {
    const authenticatedFetch = createAuthenticatedFetch(token);
    const response = await authenticatedFetch(`/api/posts/${postId}/comments/create/`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error('Failed to create comment');
    }

    return await response.json();
  },

  // Report post
  reportPost: async (postId, reason, description, token) => {
    const authenticatedFetch = createAuthenticatedFetch(token);
    const response = await authenticatedFetch(`/api/posts/${postId}/report/`, {
      method: 'POST',
      body: JSON.stringify({ reason, description }),
    });

    if (!response.ok) {
      throw new Error('Failed to report post');
    }

    return response;
  },

  // Report comment
  reportComment: async (commentId, reason, description, token) => {
    const authenticatedFetch = createAuthenticatedFetch(token);
    const response = await authenticatedFetch(`/api/comments/${commentId}/report/`, {
      method: 'POST',
      body: JSON.stringify({ reason, description }),
    });

    if (!response.ok) {
      throw new Error('Failed to report comment');
    }

    return response;
  },

  // Get user posts
  getUserPosts: async (token) => {
    const authenticatedFetch = createAuthenticatedFetch(token);
    const response = await authenticatedFetch('/api/posts/user/');

    if (!response.ok) {
      throw new Error('Failed to fetch user posts');
    }

    return await response.json();
  },
};