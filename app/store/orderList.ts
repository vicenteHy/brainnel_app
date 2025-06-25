import { create } from "zustand";
import {
  ordersApi,
  PaginatedOrderResponse,
  PaginatedOrderRequest,
  UpdateOrderShippingInfo,
} from "../services/api/orders";

interface OrderListState {
  orders: PaginatedOrderResponse;
  getAllOrders: (data: PaginatedOrderRequest, page: number) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  changeOrder: (orderId: string, status: number) => Promise<void>;
  updateOrderShippingInfo: (
    orderId: string,
    data: UpdateOrderShippingInfo
  ) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  confirmOrder: (orderId: string) => Promise<void>;
}

export const useOrderListStore = create<OrderListState>((set, get) => ({
  orders: {
    items: [],
    total: 0,
    page: 1,
    page_size: 10,
  },

  getAllOrders: async (data: PaginatedOrderRequest, page: number) => {
    console.log('📋 请求订单列表参数:', JSON.stringify(data, null, 2), '页码:', page);
    const response = await ordersApi.getAllOrders(data);
    console.log('📋 获取订单列表响应:', JSON.stringify(response, null, 2));
    set((state) => ({
      orders: {
        ...response,
        items:
          page === 1
            ? response.items
            : [...state.orders.items, ...response.items],
      },
    }));
    console.log('📋 订单列表状态更新完成，当前总数:', response.total);
  },

  deleteOrder: async (orderId: string) => {
    console.log('📋 正在删除订单:', orderId);
    await ordersApi.deleteOrder(orderId);
    console.log('📋 订单删除成功:', orderId);
    set((state) => ({
      orders: {
        ...state.orders,
        items: state.orders.items.filter((item) => item.order_id !== orderId),
        total: state.orders.total - 1,
      },
    }));
  },

  changeOrder: async (orderId: string, status: number) => {
    await ordersApi.changeOrder(orderId, status);
    set((state) => ({
      orders: {
        ...state.orders,
        items: state.orders.items.filter((item) => item.order_id !== orderId),
        total: state.orders.total - 1,
      },
    }));
  },

  updateOrderShippingInfo: async (
    orderId: string,
    data: UpdateOrderShippingInfo
  ) => {
    await ordersApi.updateOrderShippingInfo(orderId, data);
    set((state) => ({
      orders: {
        ...state.orders,
        items: state.orders.items.filter((item) => item.order_id !== orderId),
        total: state.orders.total - 1,
      },
    }));
  },
  // 取消订单
  cancelOrder: async (orderId: string) => {
    console.log('📋 Store-正在取消订单:', orderId);
    set((state) => ({
      orders: {
        ...state.orders,
        items: state.orders.items.filter((item) => item.order_id !== orderId),
        total: state.orders.total - 1,
      },
    }));
    await ordersApi.cancelOrder(orderId);
    console.log('📋 Store-订单取消成功:', orderId);
  },

  // 确定收货
  confirmOrder: async (orderId: string,status:number = 3) => {
    set((state) => ({
      orders: {
        ...state.orders,
        items: state.orders.items.filter((item) => item.order_id !== orderId),
        total: state.orders.total - 1,
      },
    }));
    await ordersApi.changeOrderStatus(orderId,status);
  },
}));
