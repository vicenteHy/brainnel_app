import { apiService } from '../api/apiClient';

export interface CreateLocalOrderItem {
  product_id: string;
  sku_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CreateLocalOrderRequest {
  items: CreateLocalOrderItem[];
  address_id: number;
  pickup_location_id: number;
  payment_method: string;
  buyer_message?: string;
  total_amount: number;
  actual_amount: number;
  discount_amount: number;
  currency: string;
}

export interface CreatedLocalOrderItem {
  order_item_id: number;
  order_no: string;
  product_id: string;
  sku_id: string;
  product_name_fr: string;
  product_name_cn: string;
  product_images: string[];
  sku_image: string;
  sku_name?: string;  // SKU名称
  sku_attributes?: string;  // SKU属性，如 "颜色: 红色, 尺码: L"
  content_fr?: string;  // SKU的法语描述
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CreateLocalOrderResponse {
  order_id: number;
  order_no: string;
  user_id: number;
  total_amount: number;
  actual_amount: number;
  currency: string;
  payment_method: string;
  pay_status: number;
  order_status: number;
  address_id: number;
  pickup_location_id: number;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  create_time: string;
  items: CreatedLocalOrderItem[];
  pickup_date: string;
  pickup_time: string[];
  verification_code: string;
}

export interface LocalOrderDetail {
  order_id: number;
  order_no: string;
  user_id: number;
  total_amount: number;
  actual_amount: number;
  currency: string;
  payment_method: string;
  pay_status: number;
  order_status: number;
  address_id: number;
  pickup_location_id: number;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  create_time: string;
  items: CreatedLocalOrderItem[];
  pickup_date: string;
  pickup_time: string[];
  verification_code: string;
}

export type PaymentMethod = 'balance' | 'mobile_money' | 'paypal' | 'bank_card' | 'wave' | 'cod';

export interface InitiatePaymentRequest {
  order_id: number;
  amount: number;
  method: PaymentMethod;
  currency: string;
  extra?: Record<string, unknown>;
}

export interface InitiatePaymentResponse {
  status: string;
  payment_url?: string;
  transaction_id?: string;
  [key: string]: unknown;
}

class OrderApi {
  /**
   * 创建本地订单
   */
  async createOrder(request: CreateLocalOrderRequest): Promise<CreateLocalOrderResponse> {
    try {
      const response = await apiService.post<CreateLocalOrderResponse>(
        '/api/flash-local/orders/',
        request
      );
      return response;
    } catch (error) {
      console.error('Create local order failed:', error);
      throw error;
    }
  }

  /**
   * 发起支付
   */
  async initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    try {
      console.log('[OrderApi] initiatePayment request:', {
        url: '/api/payment/initiate/',
        body: request,
        order_id_type: typeof request.order_id,
        order_id_value: request.order_id,
        extra: request.extra
      });
      
      const response = await apiService.post<InitiatePaymentResponse>(
        '/api/payment/initiate/',
        request
      );
      
      console.log('[OrderApi] initiatePayment response:', response);
      return response;
    } catch (error) {
      console.error('Initiate payment failed:', error);
      console.error('[OrderApi] Error details:', {
        message: (error as any)?.message,
        response: (error as any)?.response?.data,
        status: (error as any)?.response?.status
      });
      throw error;
    }
  }

  /**
   * 获取本地订单详情
   * @param identifier 订单标识符（order_id 或 order_no）
   */
  async getOrderDetail(identifier: string | number): Promise<LocalOrderDetail> {
    try {
      const response = await apiService.get<LocalOrderDetail>(
        `/api/flash-local/orders/${identifier}`
      );
      console.log('获取本地订单详情成功:', response);
      return response;
    } catch (error) {
      console.error('获取本地订单详情失败:', error);
      throw error;
    }
  }
}

export const orderApi = new OrderApi();


