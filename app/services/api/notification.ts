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

export interface UpdateTokenParams {
  old_token: string;
  new_token: string;
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
  },

  /**
   * 更新FCM Token
   */
  updateToken: async (params: UpdateTokenParams): Promise<NotificationResponse> => {
    try {
      const response = await apiClient.post('/api/notification-groups/update-token', params);
      return response.data;
    } catch (error) {
      console.error('更新Token失败:', error);
      throw error;
    }
  },

  /**
   * 获取用户订阅列表
   */
  getSubscriptions: async (token: string) => {
    try {
      // 使用 apiService 的 get 方法，返回的直接是 data
      const response = await apiClient.get('/api/notification-groups/subscriptions', { token });
      return response;
    } catch (error) {
      console.error('获取用户订阅列表失败:', error);
      throw error;
    }
  },

  /**
   * 登出取消订阅
   */
  logoutUnsubscribe: async (userId: number): Promise<NotificationResponse> => {
    try {
      const response = await apiClient.post('/api/notification-groups/user/logout', {
        user_id: userId
      });
      return response.data;
    } catch (error) {
      console.error('登出取消订阅失败:', error);
      throw error;
    }
  }
};

export default notificationApi;