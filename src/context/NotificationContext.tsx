import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { notificationApi, NotificationItem, NotificationCreate } from "@/services/api/notification";

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isConnected: boolean;
  latestNotification: NotificationItem | null;
  isIslandExpanded: boolean;
  closeIsland: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  sendNotification: (data: NotificationCreate) => Promise<any>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [latestNotification, setLatestNotification] = useState<NotificationItem | null>(null);
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const heartbeatIntervalRef = useRef<any>(null);
  const queueRef = useRef<NotificationItem[]>([]);
  const isAnimatingRef = useRef(false);
  const isMountedRef = useRef(true);
  const lastConnectedIdRef = useRef<string>("");

  // Derive unread count
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const processNotificationQueue = useCallback(() => {
    if (isAnimatingRef.current || queueRef.current.length === 0) return;

    isAnimatingRef.current = true;
    const nextNotif = queueRef.current.shift()!;
    setLatestNotification(nextNotif);
    setIsIslandExpanded(true);

    // Keep visible for 4 seconds
    setTimeout(() => {
      if (!isMountedRef.current) return;
      setIsIslandExpanded(false);
      setTimeout(() => {
        if (!isMountedRef.current) return;
        isAnimatingRef.current = false;
        processNotificationQueue();
      }, 500); // Transition buffer
    }, 4000);
  }, []);

  const closeIsland = useCallback(() => {
    setIsIslandExpanded(false);
  }, []);

  // Helper to extract userId and shopId reliably from localStorage or JWT
  const getAuthIdentifiers = useCallback(() => {
    let userId = localStorage.getItem("user_id") || "";
    const shopId = localStorage.getItem("shop_id") || "";

    if (!userId) {
      const token = localStorage.getItem("auth_token");
      if (token && token.split(".").length === 3) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          userId = payload.user_id || payload.sub || payload.id || "";
          if (userId) {
            localStorage.setItem("user_id", userId);
          }
        } catch (e) {
          // ignore
        }
      }
    }
    return { userId, shopId };
  }, []);

  // Initial and on-demand fetch from REST API
  const refreshNotifications = useCallback(async () => {
    const { userId, shopId } = getAuthIdentifiers();
    const queryId = userId || shopId;
    if (!queryId) return;

    try {
      const res = await notificationApi.getNotifications(queryId, shopId || undefined);
      let list: NotificationItem[] = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (res && typeof res === "object") {
        if ("data" in (res as any) && Array.isArray((res as any).data)) {
          list = (res as any).data;
        } else if ("datas" in (res as any) && Array.isArray((res as any).datas)) {
          list = (res as any).datas;
        }
      }
      setNotifications(list);
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    }
  }, [getAuthIdentifiers]);

  // WebSocket Connection Logic
  useEffect(() => {
    isMountedRef.current = true;
    let reconnectAttempts = 0;

    const connectWebSocket = () => {
      const { userId, shopId } = getAuthIdentifiers();
      const effectiveId = userId || shopId;
      if (!effectiveId) {
        // Retry when user logs in
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2500);
        return;
      }

      const connectionKey = `${effectiveId}_${shopId || ""}`;
      
      // Determine WebSocket URL from environment gateway URL or fallback
      const getWsBaseUrl = () => {
        const envWs = import.meta.env.VITE_WS_URL;
        if (envWs) return envWs.replace(/\/+$/, "");

        const gatewayUrl = (import.meta.env.VITE_GATEWAY_URL || "https://marketplace.debuggers.co.in/api/").trim();
        const base = gatewayUrl
          .replace(/^http:\/\//i, "ws://")
          .replace(/^https:\/\//i, "wss://")
          .replace(/\/+$/, "");

        return base;
      };

      const wsBase = getWsBaseUrl();
      const token = localStorage.getItem("auth_token") || "";
      const queryParams = new URLSearchParams();
      if (shopId) queryParams.set("shop_id", shopId);
      if (token) {
        queryParams.set("token", token);
        queryParams.set("auth_token", token);
      }
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const wsUrl = `${wsBase}/notifications/ws/${effectiveId}${queryString}`;

      try {
        if (socketRef.current) {
          if (socketRef.current.readyState === WebSocket.OPEN && lastConnectedIdRef.current === connectionKey) {
            return; // Already connected to right endpoint
          }
          socketRef.current.close();
        }

        lastConnectedIdRef.current = connectionKey;
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isMountedRef.current) return;
          setIsConnected(true);
          reconnectAttempts = 0;

          // Heartbeat every 20 seconds
          if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send("ping");
            }
          }, 20000);
        };

        ws.onmessage = (event) => {
          if (!isMountedRef.current) return;
          if (event.data === "pong") return;

          try {
            const data: NotificationItem = JSON.parse(event.data);
            if (data && (data.title || data.message)) {
              // Add to state if not already present
              setNotifications((prev) => {
                const exists = prev.some((item) => item.id === data.id);
                if (exists) return prev;
                return [data, ...prev];
              });

              // Push to animation queue for dynamic island
              queueRef.current.push(data);
              processNotificationQueue();
            }
          } catch (e) {
            // Non-JSON message, ignore
          }
        };

        ws.onclose = () => {
          if (!isMountedRef.current) return;
          setIsConnected(false);
          if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);

          // Exponential backoff reconnect
          const backoff = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          reconnectAttempts++;
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, backoff);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        console.warn("WebSocket init error:", err);
      }
    };

    refreshNotifications();
    connectWebSocket();

    // Listen for storage or shop change events
    const handleStorageChange = () => {
      refreshNotifications();
      connectWebSocket();
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("shop_changed", handleStorageChange);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("shop_changed", handleStorageChange);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [refreshNotifications, processNotificationQueue, getAuthIdentifiers]);

  // Mark single as read
  const markAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const { userId, shopId } = getAuthIdentifiers();
    const targetId = userId || shopId;
    if (!targetId) return;
    try {
      await notificationApi.markAllAsRead(targetId, shopId || undefined);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (latestNotification?.id === id) {
        setLatestNotification(null);
        setIsIslandExpanded(false);
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    const { userId, shopId } = getAuthIdentifiers();
    const targetId = userId || shopId;
    if (!targetId) return;
    try {
      await notificationApi.clearAllNotifications(targetId, shopId || undefined);
      setNotifications([]);
      setLatestNotification(null);
      setIsIslandExpanded(false);
    } catch (err) {
      console.error("Failed to clear all notifications:", err);
    }
  };

  // Send notification helper
  const sendNotification = async (data: NotificationCreate) => {
    return await notificationApi.sendNotification(data);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        latestNotification,
        isIslandExpanded,
        closeIsland,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        refreshNotifications,
        sendNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
