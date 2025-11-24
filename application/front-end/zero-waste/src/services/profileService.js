// src/services/profileService.js
import { API_BASE_URL } from './api.js';

export const profileService = {
  // Get user bio
  getUserBio: async (username) => {
    const response = await fetch(`${API_BASE_URL}/api/profile/${username}/bio/`);
    return await response.json();
  },

  // Get user profile picture
  getUserPicture: async (username) => {
    const response = await fetch(`${API_BASE_URL}/api/profile/${username}/picture/`);
    return response;
  },

  // Get current user profile (bio)
  getProfile: async (username, token) => {
    const response = await fetch(`${API_BASE_URL}/api/profile/${username}/bio/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    return {
      username: data.username,
      bio: data.bio
    };
  },

  // Update user bio
  updateBio: async (username, bio, token) => {
    const response = await fetch(`${API_BASE_URL}/api/profile/${username}/bio/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ bio }),
    });
    return await response.json();
  },

  // Update profile picture
  updateProfilePicture: async (formData, token) => {
    const response = await fetch(`${API_BASE_URL}/api/profile/profile-picture/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return response;
  },

  // Update full profile (bio and/or picture)
  updateProfile: async (username, bio, avatarFile, token) => {
    // Update bio if provided
    if (bio !== undefined) {
      await fetch(`${API_BASE_URL}/api/profile/${username}/bio/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bio }),
      });
    }

    // Update avatar if provided
    if (avatarFile) {
      const formData = new FormData();
      formData.append("image", avatarFile);
      await fetch(`${API_BASE_URL}/api/profile/profile-picture/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
    }

    return { success: true };
  }
};