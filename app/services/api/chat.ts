import apiService from './apiClient';
export interface ChatMessage {
  type: string;
  mimetype: string;
  userWs: string;
  app_id: string;
  country: string;
  body: string;
  text: string;
}

export interface ProductSupportMessage {
  type: string;
  mimetype: string;
  userWs: string;
  app_id: string;
  country: string;
  body: string;
  text: string;
  product_category?: string; // 产品类别
  issue_type?: string; // 问题类型
}

/**
 * 表示单个通知项的结构。
 */
export interface NotificationItem {
  notification_type: string;
  icon: string;
  title: string;
  content: string;
  related_entity_type: string;
  related_entity_id: string;
  notification_id: number;
  user_id: number;
  template_id: number;
  is_read: boolean;
  read_time: string; // 推荐使用 Date 类型，如果会在前端进行日期操作
  sent_time: string;  // 推荐使用 Date 类型
  create_time: string; // 推荐使用 Date 类型
  update_time: string; // 推荐使用 Date 类型
}

/**
 * 表示通知列表 API 响应的整体结构。
 */
export interface NotificationResponse {
  total: number;
  page: number;
  page_size: number;
  items: NotificationItem[];
}

export interface ChatMessageData {
  newMessage:ChatMessage;
}

export interface ProductSupportMessageData {
  newMessage: ProductSupportMessage;
}

export interface ChatSupportMessage {
  type:string;
  mimetype:string,
  body:string,
  text:string,
  app_id:string,
  product_id:string,
  country:string
}

export interface ChatSupportMessageData {
  imagesBase64:string[],
  reply:string
}

// API methods
export const chatService = {
  // Send message with retry mechanism
  async sendMessage(newMessage:ChatMessageData): Promise<any> {
    return apiService.post<ChatSupportMessageData>('https://api.brainnel.com/app_chat/chat',newMessage);
  },

  // Send product support message (待添加具体的API端点)
  async sendProductSupportMessage(newMessage: ChatSupportMessage): Promise<any> {
    const data = {
      newMessage
    }
    // 临时返回固定响应，等待后端接口实现
    return apiService.post<ChatSupportMessageData>('https://api.brainnel.com/product_chat/chat',data);
  },

  // 消息列表
  async getMessageList(page:number,page_size:number): Promise<any> {
    return apiService.get<NotificationItem>(`/api/notifications/?page=${page}&page_size=${page_size}`);
  },
  // 将单个消息标记为已读
  async markMessageAsRead(message_id:number): Promise<any> {
    return apiService.post(`/api/notifications/${message_id}/read/`);
  },
  // 将所有消息标记为已读
  async markAllMessagesAsRead(): Promise<any> {
    return apiService.post(`/api/notifications/read_all/`);
  },
  // 获取未读消息数量
  async getUnreadMessageCount(): Promise<any> {
    return apiService.get<{unread_count:number}>(`/api/notifications/unread_count/`);
  },
};

