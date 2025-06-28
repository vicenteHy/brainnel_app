import apiService from "./apiClient";

// 地址类型
export interface Address {
  address_id: number;
  user_id: number;
  forwarder_name: string;
  receiver_first_name: string;
  receiver_last_name: string;
  country: string;
  receiver_phone: string;
  whatsapp_phone: string;
  province: string | null;
  city: string | null;
  district: string | null;
  detail_address: string | null;
  is_default: number;
  create_time: string;
  update_time: string;
}

// 订单商品项类型
interface OrderItem {
  sku_image: string | undefined;
  offer_id: number;
  cart_item_id: number;
  sku_id: number;
  product_name: string;
  sku_image_url: string;
  product_name_en: string;
  product_name_fr: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  attributes: {
    attribute_name: string;
    attribute_name_trans: string;
    attribute_value: string;
    attribute_value_trans: string;
    value: string;
    value_trans: string;
    value_trans_ar: string;
    value_trans_fr: string;
  }[];
}

// 订单汇总类型
interface OrderSummary {
  total_amount: number;
  shipping_fee: number;
  discount_amount: number;
  actual_amount: number;
  currency: string;
}

// 完整订单数据类型
export interface OrderData {
  address: Address;
  items: OrderItem[];
  total_amount: number;
  shipping_fee: number;
  discount_amount: number;
  actual_amount: number;
  currency: string;
  shipping_fee_sea: number;
  shipping_fee_air: number;
  shipping_fee_sea_time: number;
  shipping_fee_air_time: number;
}

interface CurrentCountryAddress {
  forwarder_name: string;
  contact_person: string;
  phone_number: string;
  transport_mode: number;
  shipping_fee: string;
  status: number;
  email: string;
  country: number;
  country_code: number;
  province: string;
  city: string;
  district: string;
  detail_address: string;
  postal_code: string;
  remarks: string;
  address_id: number;
  create_time: string; // or Date if you prefer to use Date objects
  update_time: string; // or Date if you prefer to use Date objects
}

export interface AddressDataItem {
  current_country_address: CurrentCountryAddress;
  other_addresses: any[]; // or specify a more specific type if you know the structure of other addresses
}

export interface OrderPreviewData {
  items: {
    cart_item_id: number;
  }[];
}

export interface ShippingFeeData {
  items: {
    cart_item_id: number;
  }[];
  freight_forwarder_address_id: number;
}

interface CartShippingFeeItem {
  cart_item_id: number;
  estimated_shipping_fee_air: number;
  estimated_shipping_fee_sea: number;
  shipping_fee_currency: string;
}

export interface CartShippingFeeData {
  items: CartShippingFeeItem[];
  currency?: string;
  total_shipping_fee_air: number;
  total_shipping_fee_sea: number;
}

export interface DomesticShippingFeeData {
  currency?: string;
  total_shipping_fee: number;
}

// 创建订单请求参数类型
export interface CreateOrderRequest {
  address_id: number;
  items: {
    offer_id: string | number;
    cart_item_id: number;
    sku_id: string | number;
    product_name: string;
    product_name_en: string;
    product_name_ar: string;
    product_name_fr: string;
    product_image: string;
    sku_attributes: Record<string, any>[];
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  buyer_message: string;
  payment_method: string;
  create_payment: boolean;
  total_amount: number;
  actual_amount: number;
  discount_amount: number;
  shipping_fee: number;
  domestic_shipping_fee: number;
  currency: string;
  receiver_address: string;
  shipping_type?: number; // 运输方式 0-海运 1-空运
  is_cod?: number;
}

// 创建订单响应类型
export interface CreateOrderResponse {
  order_id: number;
  order_no: string;
  status: string;
  payment_url?: string;
}

interface SkuAttribute {
  [key: string]: any;
}

interface OrderItem {
  offer_id: number;
  cart_item_id: number;
  sku_id: number;
  product_name: string;
  product_name_en: string;
  product_name_ar: string;
  product_name_fr: string;
  product_image: string;
  sku_attributes: SkuAttribute[];
  quantity: number;
  unit_price: number;
  total_price: number;
  order_item_id: number;
  order_id: number;
  create_time: string; // or Date if you prefer to parse it
  update_time: string; // or Date
}

export interface Order {
  user_id: number;
  total_amount: number;
  currency: string;
  actual_amount: number;
  discount_amount: number;
  shipping_fee: number;
  address_id: number;
  domestic_shipping_fee: number;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  whatsapp_number: number;
  buyer_message: string;
  pay_status: number;
  order_status: number;
  shipping_status: number;
  receiver_country: string;
  order_id: number;
  payment_method: string;
  order_no: string;
  items: OrderItem[];
  create_time: string; // or Date
  pay_time: string; // or Date
  shipping_time: string; // or Date
  complete_time: string; // or Date
  update_time: string; // or Date
}

interface SkuAttributes {
  [key: string]: any;
}

interface OrderItem {
  offer_id: number;
  cart_item_id: number;
  sku_id: number;
  product_name: string;
  product_name_en: string;
  product_name_ar: string;
  product_name_fr: string;
  product_image: string;
  sku_attributes: SkuAttributes[];
  quantity: number;
  unit_price: number;
  total_price: number;
  order_item_id: number;
  order_id: number;
  create_time: string; // or Date
  update_time: string; // or Date
}

interface Orders {
  user_id: number;
  total_amount: number;
  actual_amount: number;
  discount_amount: number;
  currency:string,
  shipping_fee: number;
  address_id: number;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  buyer_message: string;
  pay_status: number;
  order_status: number;
  shipping_status: number;
  sku_image: string;
  order_id: string;
  order_no: string;
  status:number;
  items: OrderItem[];
  create_time: string; // or Date
  pay_time: string; // or Date
  shipping_time: string; // or Date
  complete_time: string; // or Date
  update_time: string; // or Date
}

export interface PaginatedOrderResponse {
  items: Orders[];
  total: number;
  page: number;
  page_size: number;
}

export interface PaginatedOrderRequest {
  status?: number | null;
  page: number;
  page_size: number;
}

interface SkuAttributesDetails {
  attribute_name: string;
  attribute_value: string;
  sku_image: string;
}

export interface OrderItemDetails {
  offer_id: number;
  cart_item_id: number | null;
  sku_id: number;
  product_name: string;
  product_name_en: string;
  product_name_ar: string;
  product_name_fr: string;
  product_image: string;
  sku_attributes: SkuAttributesDetails[];
  quantity: number;
  unit_price: number;
  total_price: number;
  sku_image: string;
  order_item_id: string;
  order_id: string;
  create_time: string; // or Date
  update_time: string; // or Date
}

export interface OrderDetailsType {
  user_id: number;
  total_amount: number;
  domestic_shipping_fee: number;
  actual_amount: number;
  currency:string,
  whatsapp_number:string,
  discount_amount: number;
  shipping_fee: number;
  address_id: number;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  buyer_message: string;
  pay_status: number;
  order_status: number;
  shipping_status: number;
  order_id: string;
  order_no: string;
  items: OrderItemDetails[];
  create_time: string; // or Date
  shipping_type: number; // 运输方式 0-海运 1-空运
  payment_method: string;
  pay_time: string | null; // or Date | null
  shipping_time: string | null; // or Date | null
  complete_time: string | null; // or Date | null
  update_time: string; // or Date
  verification_code?: string; // 取件码
  location_code?: string; // 货架号
  is_cod?: number; // COD标记，0=非COD，1=COD
}
export interface UpdateOrderShippingInfo {
  shipping_status: number;
  shipping_info: {
    shipping_company: string;
    shipping_no: string;
    shipping_info: {};
  };
}
export interface UpdateOrderPaymentMethod {
  order_id: string;
  payment_method: string;
  currency: string;
  total_amount: number;
  actual_amount: number;
  shipping_fee: number;
  domestic_shipping_fee: number;
  items?: {
    order_item_id: string;
    unit_price: number;
    total_price: number;
  }[];
}

interface OrderItemCancel {
  offer_id: string;
  cart_item_id: number;
  sku_id: string;
  spec_id: string;
  product_name: string;
  product_name_en: string;
  product_name_fr: string;
  product_name_ar: string;
  product_name_invoice: string;
  product_image: string;
  product_images: string;
  material: string;
  product_link: string;
  source_data: string;
  sku_attributes: Record<string, any>[];
  sku_image: string;
  sku_key_name: string;
  sku_key_name_cn: string;
  category_id: string;
  category_name: string;
  supplier_name: string;
  is_live_stream_product: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit_volume: number;
  unit_weight: number;
  order_item_id: string;
  order_no: string;
  create_time: string;
  update_time: string;
}

export interface OrderCancelResponse {
  user_id: number;
  total_amount: number;
  actual_amount: number;
  exchange_rate: number;
  discount_amount: number;
  shipping_fee: number;
  domestic_shipping_fee: number;
  currency: string;
  payment_method: string;
  transaction_id: string;
  pay_status: number;
  order_status: number;
  shipping_status: number;
  address_id: number;
  receiver_name: string;
  receiver_phone: string;
  whatsapp_number: string;
  receiver_address: string;
  receiver_country: string;
  shipping_no: string;
  shipping_type: number;
  shipping_company: string;
  shipping_url: string;
  total_weight: number;
  total_volume: number;
  total_packages: number;
  buyer_message: string;
  pay_time: string;
  shipping_time: string;
  complete_time: string;
  coupon_id: number;
  gold_coins_deducted: number;
  vip_info: string;
  verification_code: string;
  verification_time: string;
  sensitive_goods_flag: number;
  update_time: string;
  order_id: string;
  order_no: string;
  items: OrderItemCancel[];
  create_time: string;
}

export const ordersApi = {
  // 获得订单预览信息
  getOrders: (data: OrderPreviewData) =>
    apiService.post<OrderData>("/api/orders/preview/", data),

  // 获取货代地址
  freightForwarderAddress: (transport_mode: number | null, is_toc?: number) =>
    apiService.get<AddressDataItem>(
      `/api/freight_forwarder_address/?transport_mode=${transport_mode}${is_toc !== undefined ? `&is_toc=${is_toc}` : ''}`
    ),

  // 获得物流价格
  calcShippingFee: (data: ShippingFeeData) =>
    apiService.post<CartShippingFeeData>(
      `/api/orders/calc_shipping_fee/`,
      data
    ),

  // 获得国内价格
  calcDomesticShippingFee: (data: ShippingFeeData) =>
    apiService.post<DomesticShippingFeeData>(
      `/api/orders/calc_domestic_shipping/`,
      data
    ),

  // 创建订单
  createOrder: (data: CreateOrderRequest) =>
    apiService.post<Order>("/api/orders/cart/", data),

  // 获取所有订单
  getAllOrders: (data: PaginatedOrderRequest) =>
    apiService.get<PaginatedOrderResponse>(`/api/orders/`, data),

  // 获取订单指定信息
  getOrderDetails: (order_id: string) =>
    apiService.get<OrderDetailsType>(`/api/orders/${order_id}/`),

  // 删除订单
  deleteOrder: (order_id: string) =>
    apiService.delete<void>(`/api/orders/${order_id}/`),

  // 修改订单
  changeOrder: (order_id: string, status: number) =>
    apiService.patch<void>(`/api/orders/${order_id}/status/?status=${status}`),

  // 修改物流信息
  updateOrderShippingInfo: (order_id: string, data: UpdateOrderShippingInfo) =>
    apiService.patch<void>(`/api/orders/${order_id}/shipping/`, data),

  // 修改支付方式
  updateOrderPaymentMethod: (data: UpdateOrderPaymentMethod) =>
    apiService.put<void>(`/api/orders/edit/`, data),

  // 取消订单
  cancelOrder: (order_id: string) =>
    apiService.post<OrderDetailsType>(`/api/orders/${order_id}/cancel/`),

  // 确定收货
  confirmOrder: (order_id: string) =>
    apiService.patch<OrderDetailsType>(`/api/orders/${order_id}/shipping/`,{
    }),

    // 修改订单状态
    changeOrderStatus: (order_id: string, status: number) =>
     apiService.patch<void>(`/api/orders/${order_id}/status/?status=${status}`),
};
