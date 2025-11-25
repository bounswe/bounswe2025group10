// src/services/inviteService.js
import apiClient from "./api";

export const inviteService = {
  sendInvite: async (email, token) => {
    const response = await apiClient.post(
      "/api/invite/send/",
      { email },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  },
};
