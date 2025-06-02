import { useState, useEffect } from "react";
import { chatService, NotificationItem } from "../../../services/api/chat";
import useUserStore from "../../../store/user";

export const useNotifications = (activeTab: string) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationPage, setNotificationPage] = useState(1);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationHasMore, setNotificationHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useUserStore();

  const loadNotifications = async (
    page: number = 1,
    isRefresh: boolean = false
  ) => {
    if (!user.user_id) return;

    setNotificationLoading(true);

    try {
      const response = await chatService.getMessageList(page, 10);

      if (response && response.items) {
        if (isRefresh || page === 1) {
          setNotifications(response.items.reverse());
          setNotificationPage(1);
        } else {
          setNotifications((prev) => [...response.items.reverse(), ...prev]);
        }
        setNotificationHasMore(response.items.length === 10);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setNotificationLoading(false);
    }
  };

  const loadMoreNotifications = () => {
    if (!notificationLoading && notificationHasMore && user.user_id) {
      const nextPage = notificationPage + 1;
      setNotificationPage(nextPage);
      loadNotifications(nextPage, false);
    }
  };

  const getUnreadCount = async () => {
    if (!user.user_id) return;

    try {
      const response = await chatService.getUnreadMessageCount();
      console.log("Unread count response:", response);
      if (response && typeof response.unread_count === "number") {
        setUnreadCount(response.unread_count);
        console.log("Set unread count to:", response.unread_count);
      } else {
        console.log("Invalid response format:", response);
      }
    } catch (error) {
      console.error("Error getting unread count:", error);
    }
  };

  const markMessageAsRead = async (messageId: number) => {
    if (!user.user_id) return;

    setNotifications((prev) =>
      prev.map((item) =>
        item.notification_id === messageId ? { ...item, is_read: true } : item
      )
    );

    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await chatService.markMessageAsRead(messageId);
      await getUnreadCount();
    } catch (error) {
      console.error("Error marking message as read:", error);
      setNotifications((prev) =>
        prev.map((item) =>
          item.notification_id === messageId
            ? { ...item, is_read: false }
            : item
        )
      );
      setUnreadCount((prev) => prev + 1);
    }
  };

  const markAllMessagesAsRead = async () => {
    if (!user.user_id) return;

    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;

    setNotifications((prev) =>
      prev.map((item) => ({ ...item, is_read: true }))
    );
    setUnreadCount(0);

    try {
      await chatService.markAllMessagesAsRead();
      await getUnreadCount();
    } catch (error) {
      console.error("Error marking all messages as read:", error);
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }
  };

  const notificationKeyExtractor = (
    item: NotificationItem,
    index: number
  ): string => {
    return item.notification_id?.toString() || index.toString();
  };

  useEffect(() => {
    if (user.user_id && activeTab === "notification") {
      loadNotifications(1, false);
    }
  }, [user.user_id, activeTab]);

  useEffect(() => {
    if (user.user_id) {
      getUnreadCount();
    }
  }, [user.user_id, activeTab]);

  useEffect(() => {
    console.log("Unread count changed to:", unreadCount);
  }, [unreadCount]);

  return {
    notifications,
    notificationPage,
    notificationLoading,
    notificationHasMore,
    unreadCount,
    loadNotifications,
    loadMoreNotifications,
    markMessageAsRead,
    markAllMessagesAsRead,
    notificationKeyExtractor,
  };
};