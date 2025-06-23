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

export interface PaymentResponse {
  success: boolean;
  order_id: number;
  status: number; // 0: unpaid, 1: paid
  msg?: string; // 失败原因
}

export interface RechargePaymentResponse {
  success: boolean;
  recharge_id: string;
  status: number; // 0: unpaid, 1: paid
  msg?: string; // 失败原因
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

  // 支付成功的回调
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

  //获取充值推荐金额
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

  // wave / mobile money 支付
  wavePay: (order_id: string) => {
    return apiService.get<PaymentResponse>(
      `/api/orders/${order_id}/payment-status/`
    );
  },

  // 查询支付状态
  checkPaymentStatus: (order_id: string) => {
    return apiService.get<PaymentResponse>(
      `/api/orders/${order_id}/`
    );
  },

  // 查询充值支付状态
  rechargePaymentStatus: (recharge_id: string) => {
    return apiService.get<RechargePaymentResponse>(
      `/api/orders/${recharge_id}/payment-status/`
    );
  },
};
