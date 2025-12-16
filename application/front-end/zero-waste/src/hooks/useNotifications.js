import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../providers/AuthContext';
import { apiClient } from '../services/api';
import { toast } from 'react-toastify';

// Helper to determine the correct WebSocket URL synchronously
const getWsUrl = () => {
    let derivedUrl = '';

    if (import.meta.env.VITE_WS_URL) {
        derivedUrl = import.meta.env.VITE_WS_URL;
    } else if (import.meta.env.VITE_API_URL) {
        derivedUrl = import.meta.env.VITE_API_URL.replace(/^http/, 'ws');
    } else {
        derivedUrl = 'ws://localhost:8000';
    }

    // Clean up and append path
    derivedUrl = derivedUrl.replace(/\/$/, '') + '/ws/notifications/';

    // Security Upgrade: If page is HTTPS, force WSS to prevent Mixed Content blocking
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && derivedUrl.startsWith('ws:')) {
        derivedUrl = derivedUrl.replace('ws:', 'wss:');
    }

    return derivedUrl;
};

export const useNotifications = () => {
    const { token, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    // Initialize with the correct URL immediately
    const [wsUrl] = useState(getWsUrl);

    // Derive unread count from notifications list to ensure it's always in sync
    // This prevents "ghost" counts or double counting duplicates
    const unreadCount = notifications.filter(n => !n.read).length;

    const connect = useCallback(() => {
        if (!token || !isAuthenticated) return;

        // Close existing connection if any
        if (wsRef.current) {
            if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
                return;
            }
            wsRef.current.close();
        }

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WebSocket Connected');
            setIsConnected(true);
            // Authenticate immediately after connection
            ws.send(JSON.stringify({ action: "authenticate", token: token }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'auth_success') {
                    // Once authenticated, fetch notifications
                    ws.send(JSON.stringify({ action: "fetch_notifications" }));
                } else if (data.notifications) {
                    // Initial fetch response
                    setNotifications(data.notifications);
                } else if (data.message && data.id) {
                    // Real-time notification
                    // Check if notification already exists to prevent duplicates
                    setNotifications(prev => {
                        if (prev.some(n => n.id === data.id)) return prev;
                        return [data, ...prev];
                    });

                    // toast.info("You have a new notification");
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
            setIsConnected(false);
            wsRef.current = null;
            // Attempt reconnect after 3 seconds
            reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            ws.close();
        };

        wsRef.current = ws;
    }, [token, isAuthenticated, wsUrl]);

    useEffect(() => {
        connect();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connect]);

    const markAsRead = useCallback(async (notificationId) => {
        // Optimistic update
        setNotifications(prev => prev.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
        ));

        try {
            await apiClient.post(`/api/notifications/${notificationId}/read/`);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            // Revert on failure if strictly necessary, but usually acceptable to keep optimistic state
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));

        try {
            await apiClient.post(`/api/notifications/read-all/`);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    }, []);

    return {
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead
    };
};
