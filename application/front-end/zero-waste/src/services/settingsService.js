const API_BASE = import.meta.env.VITE_API_URL;

export const settingsService = {
  // --- Account Deletion ---

  // Request account deletion (Authenticated)
  requestDeletion: async (token) => {
    const response = await fetch(`${API_BASE}/api/profile/delete-request/`, {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to request deletion");
    return await response.json();
  },

  // Get current deletion status (Authenticated)
  getDeletionStatus: async (token) => {
    const response = await fetch(`${API_BASE}/api/profile/delete-request/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    // Handle 404 cleanly (no request exists)
    if (response.status === 404) return null;
    
    if (!response.ok) throw new Error("Failed to fetch status");
    return await response.json();
  },
   
  // Cancel deletion while still logged in (Authenticated)
  cancelDeletion: async (token) => {
      const response = await fetch(`${API_BASE}/api/profile/delete-request/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to cancel deletion");
    return await response.json();
  },

  // Cancel deletion using the recovery token (Public/Unauthenticated)
  // Use this if the user has been logged out/deactivated
  cancelDeletionByToken: async (cancelToken) => {
    const response = await fetch(`${API_BASE}/api/profile/delete-request/cancel/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cancel_token: cancelToken }),
    });
    if (!response.ok) throw new Error("Failed to cancel deletion with token");
    return await response.json();
  },

  // --- Privacy & Anonymity ---

  getPrivacySettings: async (token) => {
    const response = await fetch(`${API_BASE}/api/profile/privacy/`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch privacy settings");
    return await response.json();
  },

  updatePrivacySettings: async (settings, token) => {
    const response = await fetch(`${API_BASE}/api/profile/privacy/`, {
      method: "PUT", 
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error("Failed to update privacy settings");
    return await response.json();
  }
};