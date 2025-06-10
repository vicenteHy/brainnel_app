import { NotificationItem } from "../../../services/api/chat";

export interface Message {
  id?: string;
  mimetype: string;
  userWs: string;
  app_id: string;
  country: number;
  body: string;
  text: string;
  type: string;
  isMe?: boolean;
  timestamp?: Date;
}

export interface ProductInquiry {
  product_image_urls?: string[];
  subject_trans?: string;
  min_price?: number;
  offer_id?: string;
  lastInquiryTime: number;
}

export type TabType = "customer" | "product" | "notification";

export type RootStackParamList = {
  Login: undefined;
  ChatScreen: { 
    product_id?: string;
    product_image_urls?: string[];
    subject_trans?: string;
    min_price?: number;
    offer_id?: string;
  };
  ProductChatScreen: {
    product_image_urls?: string[];
    subject_trans?: string;
    min_price?: number;
    offer_id?: string;
  };
};

export interface ChatState {
  messages: Message[];
  inputText: string;
  activeTab: TabType;
  country: string;
}

export interface NotificationState {
  notifications: NotificationItem[];
  page: number;
  loading: boolean;
  hasMore: boolean;
  unreadCount: number;
}

export interface ProductInquiryState {
  inquiries: ProductInquiry[];
}