import apiClient from './apiClient';

export interface NotificationGroup {
  token: string;
  type: 'all_users' | 'specific_group' | string;
  user_id?: number;
  device_id?: string;
}

export interface NotificationResponse {
  success: boolean;
  message?: string;
  data?: any;
}

const notificationApi = {
  /**
   * 分配通知组
   */
  assignGroup: async (params: NotificationGroup): Promise<NotificationResponse> => {
    try {
      const response = await apiClient.post('/api/notification-groups/assign-group', params);
      return response.data;
    } catch (error) {
      console.error('分配通知组失败:', error);
      throw error;
    }
  },

  /**
   * 获取用户通知列表
   */
  getNotifications: async (page: number = 1, pageSize: number = 20) => {
    try {
      const response = await apiClient.get('/notifications', {
        params: { page, pageSize }
      });
      return response.data;
    } catch (error) {
      console.error('获取通知列表失败:', error);
      throw error;
    }
  },

  /**
   * 标记通知为已读
   */
  markAsRead: async (notificationId: string) => {
    try {
      const response = await apiClient.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('标记通知失败:', error);
      throw error;
    }
  },

  /**
   * 标记所有通知为已读
   */
  markAllAsRead: async () => {
    try {
      const response = await apiClient.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('标记所有通知失败:', error);
      throw error;
    }
  },

  /**
   * 删除通知
   */
  deleteNotification: async (notificationId: string) => {
    try {
      const response = await apiClient.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('删除通知失败:', error);
      throw error;
    }
  },

  /**
   * 获取未读通知数量
   */
  getUnreadCount: async () => {
    try {
      const response = await apiClient.get('/notifications/unread-count');
      return response.data;
    } catch (error) {
      console.error('获取未读通知数量失败:', error);
      throw error;
    }
  }
};

export default notificationApi;