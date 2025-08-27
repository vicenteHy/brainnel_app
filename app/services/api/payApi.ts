import apiService from "./apiClient";

// 支付方式类型定义
export interface PaymentMethod {
  key: string;
  value: string | string[];
}

export interface CountryPaymentMethods {
  country?: number;
  country_name?: string;
  payment_methods: PaymentMethod[];
}

export interface PaymentMethodsResponse {
  current_country_code: number;
  current_country_methods: PaymentMethod[];
  other_country_methods: CountryPaymentMethods[];
}

export interface PaymentInfoResponse {
  success: boolean;
  payment_url: string;
  msg: string;
}

export interface PayInfoBody {
  order_id: number | string;
  method: string;
  amount: number;
  currency: string;
}

// 新增充值接口请求体类型
export interface RechargeInitiateBody {
  amount: number;
  currency: string;
  payment_method: string;
  phone?: string;
}

// 新增充值接口返回类型
export interface RechargeInitiateResponse {
  success: boolean;
  recharge_id: number;
  payment: {
    success: boolean;
    msg: string;
    payment_url: string;
    order_id: number;
    method: string;
    status: string | null;
    transaction_id: string;
  };
  msg: string | null;
}

export interface ConvertCurrencyBody {
  from_currency: string;
  to_currency: string;
  amounts: {
    total_amount?: number;
    domestic_shipping_fee?: number;
    shipping_fee?: number;
  };
}

// 统一的支付状态响应接口
export interface PaymentStatusResponse {
  success: boolean;
  id: string | number; // order_id 或 recharge_id
  status: number; // 0: unpaid, 1: paid, 2: processing, 3: failed
  msg?: string; // 失败原因
  payment_type?: 'order' | 'recharge'; // 支付类型
  is_local?: number; // 0: 普通订单, 1: 本地订单
  // 兼容旧接口
  order_id?: number;
  recharge_id?: string;
}

export interface PaymentResponse extends PaymentStatusResponse {
  order_id: number;
}

export interface RechargePaymentResponse extends PaymentStatusResponse {
  recharge_id: string;
}

export interface rechargeHistory {
  recharge_id: number;
  user_id: number;
  amount: number;
  currency: string;
  payment_method: string;
  status: number;
  transaction_id: string;
  create_time: string;
  update_time: string;
}

export interface RechargeRecommendAmountResponse {
  amounts: number[];
  currency: string;
}

export interface Transaction {
  transaction_id: string;
  type: "order_payment"; // Assuming 'order_payment' is the only possible type for this dataset
  amount: number;
  currency: string;
  description: string;
  timestamp: string; // Could also be `Date` if you plan to parse it immediately
  related_order_no: string;
}

export interface TransactionsResponse {
  items: Transaction[];
  total: number;
  page: number;
  page_size: number;
}

export const payApi = {
  // 获取当前国家支付方式
  getCountryPaymentMethods: () => {
    return apiService.get<PaymentMethodsResponse>(
      "/api/payment/country_payment_methods/"
    );
  },

  // 获取支付信息
  getPayInfo: (data: PayInfoBody) => {
    return apiService.post<PaymentInfoResponse>(`/api/payment/initiate/`, data);
  },

  // 货币转换
  convertCurrency: (data: ConvertCurrencyBody) => {
    return apiService.post<any>(`/api/currency/convert/`, data);
  },

  // 支付成功的回调（PayPal/Bank Card）
  paySuccessCallback: (paymentId: string, PayerID: string) => {
    return apiService.get<PaymentResponse>(
      `/api/payment/paypal/execute/`,
      { paymentId, PayerID }
    );
  },

  // 新增充值接口
  initiateRecharge: (data: RechargeInitiateBody) => {
    return apiService.post<RechargeInitiateResponse>(
      "/api/recharge/initiate/",
      data
    );
  },

  // 获取充值历史
  getRechargeHistory: () => {
    return apiService.get<rechargeHistory[]>("/api/recharge/records/");
  },

  // 获取充值推荐金额
  getRechargeRecommendAmount: () => {
    return apiService.get<RechargeRecommendAmountResponse>(
      "/api/recharge/recommended-amounts/"
    );
  },

  // 获取流水
  getTransactionHistory: (page: number, page_size: number) => {
    return apiService.get<TransactionsResponse>(
      `/api/users/me/transactions/?page=${page}&page_size=${page_size}`
    );
  },

  // ========== 统一的支付状态查询接口 ==========
  
  /**
   * 统一的支付状态查询接口
   * @param paymentType - 支付类型：'order' 或 'recharge'
   * @param paymentId - 支付ID（订单ID或充值ID）
   * @returns 支付状态响应
   */
  getPaymentStatus: (paymentType: 'order' | 'recharge', paymentId: string): Promise<PaymentStatusResponse> => {
    // 端点映射配置 - 方便未来修改
    const endpointConfig = {
      order: `/api/orders/${paymentId}/payment-status/`,
      recharge: `/api/orders/${paymentId}/payment-status/`  // 当前后端充值也使用 orders 端点
      // 未来后端统一后，修改为：
      // recharge: `/api/recharge/${paymentId}/payment-status/`
    };
    
    const endpoint = endpointConfig[paymentType];
    
    return apiService.get<PaymentStatusResponse>(endpoint).then(response => {
      // 确保响应包含统一的字段
      return {
        ...response,
        id: paymentId,
        payment_type: paymentType,
        // 保持向后兼容
        ...(paymentType === 'order' ? { order_id: Number(paymentId) } : { recharge_id: paymentId })
      };
    });
  },

  // ========== 向后兼容的旧接口（标记为废弃） ==========
  
  /**
   * @deprecated 请使用 getPaymentStatus('order', orderId) 代替
   * Wave/Mobile Money/PayPal/Bank Card 订单支付状态查询
   */
  wavePay: (order_id: string) => {
    console.warn('wavePay is deprecated. Use getPaymentStatus("order", orderId) instead.');
    return payApi.getPaymentStatus('order', order_id) as Promise<PaymentResponse>;
  },

  /**
   * @deprecated 请使用 getPaymentStatus('order', orderId) 代替
   * 查询订单支付状态
   */
  checkPaymentStatus: (order_id: string) => {
    console.warn('checkPaymentStatus is deprecated. Use getPaymentStatus("order", orderId) instead.');
    return apiService.get<PaymentResponse>(`/api/orders/${order_id}/`);
  },

  /**
   * @deprecated 请使用 getPaymentStatus('recharge', rechargeId) 代替
   * 查询充值支付状态
   */
  rechargePaymentStatus: (recharge_id: string) => {
    console.warn('rechargePaymentStatus is deprecated. Use getPaymentStatus("recharge", rechargeId) instead.');
    return payApi.getPaymentStatus('recharge', recharge_id) as Promise<RechargePaymentResponse>;
  },
};