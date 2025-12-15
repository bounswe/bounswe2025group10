import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../providers/AuthContext';

const WS_URL = import.meta.env.VITE_WS_URL;

export const useNotifications = () => {
    const { token, user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    const connect = useCallback(() => {
        if (!token || !user || !WS_URL) return;

        // Close existing connection if any
        if (wsRef.current) {
            wsRef.current.close();
        }

        // Append token to query string for authentication
        const ws = new WebSocket(`${WS_URL}/ws/notifications/?token=${token}`);

        ws.onopen = () => {
            console.log('WebSocket Connected');
            setIsConnected(true);
            // Fetch initial notifications
            ws.send(JSON.stringify({ action: "fetch_notifications" }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.notifications) {
                    // Initial fetch response
                    setNotifications(data.notifications);
                    setUnreadCount(data.notifications.filter(n => !n.read).length);
                } else {
                    // Real-time notification
                    // Assuming data is the notification object itself
                    setNotifications(prev => [data, ...prev]);
                    setUnreadCount(prev => prev + 1);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
            setIsConnected(false);
            // Attempt reconnect after 3 seconds
            reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            ws.close();
        };

        wsRef.current = ws;
    }, [token, user]);

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

    const markAsRead = useCallback((notificationId) => {
        // Optimistic update
        setNotifications(prev => prev.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));

        // Ideally send a message to backend to mark as read
        // if (wsRef.current && isConnected) {
        //     wsRef.current.send(JSON.stringify({ action: "mark_read", id: notificationId }));
        // }
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    }, []);

    return {
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead
    };
};
