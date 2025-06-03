import { Platform, AppState, AppStateStatus } from "react-native";
import { create } from "zustand";
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import useUserStore from "./user";
import { sendAnalyticsData } from "../services/api/analyticsService";

// 定义事件属性类型为灵活的记录类型
type EventProperty = Record<string, any>;

// 定义事件类型
type AnalyticsEvent = {
  event_name: string;
  page_name: string | null;
  referre_page: string | null; // 注意这里字段名已更正为referre_page
  event_properties: EventProperty[];
};

// 定义产品属性类型
type ProductProperty = {
  offer_id: number;
  category_id: number;
  price: number;
  sku_id: number;
  currency: string;
  product_name: string;
  timestamp: string;
  product_img: string;
};

// 定义购物车属性类型
type CartProperty = {
  offer_id: number;
  category_id: number;
  price: number;
  all_price: number;
  currency: string;
  sku_id: number;
  quantity: number;
  product_name: string;
  timestamp: string;
  sku_img: string;
  all_quantity: number;
  level?: number;
};

// 定义搜索属性类型
type SearchProperty = {
  key_word: string;
  timestamp: string;
};

// 定义地址信息属性类型
type AddressProperty = {
  last_name: string;
  first_name: string;
  country: string;
  phone_number: number;
  whatsApp_number: number;
  timestamp: string;
};

// 定义物流信息属性类型
type ShippingProperty = {
  shipping_method: number;
  shipping_price_outside: number;
  shipping_price_within: number;
  currency: string;
  forwarder_name: string;
  country_city: string;
  timestamp: string;
};

// 定义支付方式属性类型
type PaymentProperty = {
  pay_method: string;
  offline_payment: number;
  all_price: number;
  currency: string;
  pay_product?: string;
  shipping_method: number;
  shipping_price_outside: number;
  shipping_price_within: number;
  timestamp: string;
};

// 定义支付结账属性类型
type CheckoutProperty = {
  is_suc: number;
  all_price: number;
  currency: string;
  shipping_method: number;
  shipping_price_outside: number;
  shipping_price_within: number;
  pay_product?: string;
  timestamp: string;
};

// 定义分类属性类型
type CategoryProperty = {
  category_id: number;
  category_name: string;
  timestamp: string;
  level?: number;
};

// 生成唯一ID函数，替代md5
const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 创建唯一的session_id
const SESSION_ID = generateUniqueId();

// 本地存储key
const ANALYTICS_STORAGE_KEY = 'analytics_pending_events';

// 重试配置
const RETRY_DELAYS = [1000, 5000, 15000]; // 1秒、5秒、15秒
const MAX_EVENTS_STORAGE = 1000; // 最大存储事件数

// 定义发送状态
type SendingStatus = 'idle' | 'sending' | 'failed';

// 定义分析数据store的状态
type AnalyticsState = {
  device_id: string;
  version: string;
  session_id: string;
  event_list: AnalyticsEvent[];
  sendingStatus: SendingStatus;
  isOnline: boolean;
  addEvent: (event: AnalyticsEvent) => void;
  startTimer: () => void;
  stopTimer: () => void;
  sendDataWithRetry: () => Promise<void>;
  loadPersistedData: () => Promise<void>;
  persistData: () => Promise<void>;
  logAppLaunch: (isSuccess?: number) => void;
  logLogin: (isSuccess: boolean, loginMethod: string) => void;
  logRegister: (isSuccess: boolean, registerMethod: string) => void;
  logViewProduct: (productInfo: ProductProperty, fromPage?: string) => void;
  logSearch: (keyword: string, fromPage?: string) => void;
  logAddressInfo: (
    addressInfo: Omit<AddressProperty, "timestamp">,
    fromPage?: string
  ) => void;
  logShippingConfirm: (
    shippingInfo: Omit<ShippingProperty, "timestamp">,
    fromPage?: string
  ) => void;
  logPaymentConfirm: (
    paymentInfo: Omit<PaymentProperty, "timestamp">,
    fromPage?: string
  ) => void;
  logPreviewOrder: (fromPage?: string) => void;
  logCheckout: (
    checkoutInfo: Omit<CheckoutProperty, "timestamp">,
    fromPage?: string
  ) => void;
  logAddToCart: (
    cartInfo: Omit<CartProperty, "timestamp">,
    fromPage?: string
  ) => void;
  clearData: () => void;
  logCategory: (
    categoryInfo: Omit<CategoryProperty, "timestamp">,
    fromPage?: string
  ) => void;
  logSubCategory: (
    subCategoryInfo: Omit<CategoryProperty, "timestamp">,
    fromPage?: string
  ) => void;
};

// 获取当前格式化的时间字符串 YYYY-MM-DD HH:MM:SS
const getCurrentFormattedTime = (): string => {
  return new Date().toISOString().replace("T", " ").substr(0, 19);
};

// 创建分析数据store
const useAnalyticsStore = create<AnalyticsState>((set, get) => {
  // 定义定时器变量
  let analyticsDataTimer: NodeJS.Timeout | null = null;
  let retryTimer: NodeJS.Timeout | null = null;
  
  // 初始化网络监听
  NetInfo.addEventListener(state => {
    set({ isOnline: state.isConnected || false });
    if (state.isConnected && get().event_list.length > 0) {
      // 网络恢复时发送数据
      get().sendDataWithRetry();
    }
  });
  
  // 监听应用状态变化
  AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' && get().event_list.length > 0) {
      // 应用进入后台时发送数据
      get().sendDataWithRetry();
    }
  });

  return {
    device_id: Platform.OS,
    version: generateUniqueId(),
    session_id: SESSION_ID,
    event_list: [],
    sendingStatus: 'idle' as SendingStatus,
    isOnline: true,

    // 加载持久化数据
    loadPersistedData: async () => {
      try {
        const stored = await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY);
        if (stored) {
          const events = JSON.parse(stored);
          set(state => ({ 
            event_list: [...state.event_list, ...events].slice(-MAX_EVENTS_STORAGE)
          }));
        }
      } catch (error) {
        console.log('加载持久化数据失败:', error);
      }
    },

    // 持久化数据
    persistData: async () => {
      try {
        const events = get().event_list;
        if (events.length > 0) {
          await AsyncStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(events));
        }
      } catch (error) {
        console.log('持久化数据失败:', error);
      }
    },

    // 带重试的数据发送
    sendDataWithRetry: async (retryCount = 0) => {
      const state = get();
      
      // 检查是否正在发送或无数据
      if (state.sendingStatus === 'sending' || state.event_list.length === 0) {
        return;
      }

      // 检查网络状态
      if (!state.isOnline) {
        await get().persistData();
        return;
      }

      set({ sendingStatus: 'sending' });
      
      try {
        const analyticsData = getAnalyticsData();
        await sendAnalyticsData(analyticsData);
        
        // 发送成功，清空数据
        set({ event_list: [], sendingStatus: 'idle' });
        await AsyncStorage.removeItem(ANALYTICS_STORAGE_KEY);
        
        console.log('数据发送成功:', analyticsData.event_list.length, 'events');
        
      } catch (error) {
        console.log(`数据发送失败 (第${retryCount + 1}次):`, error);
        
        if (retryCount < RETRY_DELAYS.length - 1) {
          // 重试
          const delay = RETRY_DELAYS[retryCount];
          retryTimer = setTimeout(() => {
            get().sendDataWithRetry(retryCount + 1);
          }, delay);
          
          set({ sendingStatus: 'failed' });
        } else {
          // 重试失败，持久化数据
          set({ sendingStatus: 'failed' });
          await get().persistData();
        }
      }
    },

    // 智能定时器：只在有数据时启动
    startTimer: () => {
      if (analyticsDataTimer) {
        clearTimeout(analyticsDataTimer);
      }
      
      // 30秒后发送数据（如果有的话）
      analyticsDataTimer = setTimeout(() => {
        if (get().event_list.length > 0) {
          get().sendDataWithRetry();
        }
      }, 30000); // 30秒
    },

    // 停止定时器
    stopTimer: () => {
      if (analyticsDataTimer) {
        clearTimeout(analyticsDataTimer);
        analyticsDataTimer = null;
      }
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    },

    // 添加事件
    addEvent: (event: AnalyticsEvent) => {
      set((state) => {
        const newEventList = [...state.event_list, event];

        // 立即发送：事件数 >= 10
        if (newEventList.length >= 10) {
          console.log('事件数达到阈值，立即发送:', newEventList.length);
          // 使用异步发送避免阻塞
          setTimeout(() => get().sendDataWithRetry(), 0);
          return { event_list: newEventList };
        }
        
        // 启动智能定时器（只在第一个事件时）
        if (newEventList.length === 1) {
          get().startTimer();
        }

        return { event_list: newEventList };
      });
    },

    // 记录应用启动事件
    logAppLaunch: (isSuccess = 1) => {
      const appLaunchEvent: AnalyticsEvent = {
        event_name: "app_launch",
        page_name: null,
        referre_page: null,
        event_properties: [
          {
            is_open: isSuccess ? 1 : 0, // 1表示成功，0表示失败
            timestamp: getCurrentFormattedTime(),
          },
        ],
      };

      get().addEvent(appLaunchEvent);
    },

    // 记录登录事件
    logLogin: (isSuccess = true, loginMethod = "phone") => {
      const loginEvent: AnalyticsEvent = {
        event_name: "login",
        page_name: "login",
        referre_page: null,
        event_properties: [
          {
            is_login: isSuccess ? 1 : 0, // 1表示成功，0表示失败
            login_method: loginMethod, // 登录方式
            timestamp: getCurrentFormattedTime(),
          },
        ],
      };

      get().addEvent(loginEvent);
    },

    // 记录注册事件
    logRegister: (isSuccess = true, registerMethod = "phone") => {
      const registerEvent: AnalyticsEvent = {
        event_name: "register",
        page_name: "register",
        referre_page: null,
        event_properties: [
          {
            is_register: isSuccess ? 1 : 0, // 1表示成功，0表示失败
            register_method: registerMethod, // 注册方式
            timestamp: getCurrentFormattedTime(),
          },
        ],
      };

      get().addEvent(registerEvent);
    },

    // 记录浏览商品事件
    logViewProduct: (productInfo: ProductProperty, fromPage = "home") => {
      const viewProductEvent: AnalyticsEvent = {
        event_name: "product",
        page_name: "product",
        referre_page: fromPage,
        event_properties: [productInfo],
      };

      get().addEvent(viewProductEvent);
    },

    // 记录搜索事件
    logSearch: (keyword: string, fromPage = "home") => {
      const searchEvent: AnalyticsEvent = {
        event_name: "search",
        page_name: "search",
        referre_page: 'home',
        event_properties: [
          {
            key_word: keyword,
            timestamp: getCurrentFormattedTime(),
          },
        ],
      };

      get().addEvent(searchEvent);
    },

    // 记录填写地址信息事件
    logAddressInfo: (
      addressInfo: Omit<AddressProperty, "timestamp">,
      fromPage = "cart"
    ) => {
      const addressEvent: AnalyticsEvent = {
        event_name: "address",
        page_name: "address",
        referre_page: fromPage,
        event_properties: [
          {
            ...addressInfo,
            timestamp: getCurrentFormattedTime(),
          },
        ],
      };

      get().addEvent(addressEvent);
    },

    // 记录物流信息确认事件
    logShippingConfirm: (
      shippingInfo: Omit<ShippingProperty, "timestamp">,
      fromPage = "address"
    ) => {
      const shippingEvent: AnalyticsEvent = {
        event_name: "shipping",
        page_name: "shipping",
        referre_page: fromPage,
        event_properties: [
          {
            ...shippingInfo,
            timestamp: getCurrentFormattedTime(),
          },
        ],
      };

      get().addEvent(shippingEvent);
    },

    // 记录支付方式确认事件
    logPaymentConfirm: (
      paymentInfo: Omit<PaymentProperty, "timestamp">,
      fromPage = "shipping"
    ) => {
      const paymentEvent: AnalyticsEvent = {
        event_name: "payment",
        page_name: "payment",
        referre_page: fromPage,
        event_properties: [
          {
            ...paymentInfo,
            timestamp: getCurrentFormattedTime(),
          },
        ],
      };

      get().addEvent(paymentEvent);
    },

    // 记录预览订单事件
    logPreviewOrder: (fromPage = "pay_method") => {
      const previewEvent: AnalyticsEvent = {
        event_name: "order",
        page_name: "order",
        referre_page: fromPage,
        event_properties: [
          {
            timestamp: getCurrentFormattedTime(),
          },
        ],
      };

      get().addEvent(previewEvent);
    },

    // 记录支付结账事件
    logCheckout: (
      checkoutInfo: Omit<CheckoutProperty, "timestamp">,
      fromPage = "perview"
    ) => {
      const checkoutEvent: AnalyticsEvent = {
        event_name: "checkout",
        page_name: "checkout",
        referre_page: fromPage,
        event_properties: [
          {
            ...checkoutInfo,
            timestamp: getCurrentFormattedTime(),
          },
        ],
      };

      get().addEvent(checkoutEvent);
    },

    // 分类事件
    logCategory: (
      categoryInfo: Omit<CategoryProperty, "timestamp">,
      fromPage = "home"
    ) => {
      const categoryEvent: AnalyticsEvent = {
        event_name: "category",
        page_name: "category",
        referre_page: fromPage,
        event_properties: [categoryInfo],
      };

      get().addEvent(categoryEvent);
    },

    // 二级分类事件
    logSubCategory: (
      subCategoryInfo: Omit<CategoryProperty, "timestamp">,
      fromPage = "category"
    ) => {
      const subCategoryEvent: AnalyticsEvent = {
        event_name: "category",
        page_name: "category",
        referre_page: fromPage,
        event_properties: [subCategoryInfo],
      };

      get().addEvent(subCategoryEvent);
    },

    // 记录添加购物车事件
    logAddToCart: (
      cartInfo: Omit<CartProperty, "timestamp">,
      fromPage = "search"
    ) => {
      const addToCartEvent: AnalyticsEvent = {
        event_name: "addToCart",
        page_name: "addToCart",
        referre_page: "search",
        event_properties: [
          {
            ...cartInfo,
            timestamp: getCurrentFormattedTime(),
          },
        ],
      };

      get().addEvent(addToCartEvent);
    },

    // 清空数据
    clearData: () => {
      // 这里可以添加发送数据到服务器的逻辑
      console.log("Data cleared, event count:", get().event_list.length);
      set({ event_list: [] });
    },
  };
});

// 获取分析数据，包括从userStore获取的user_id
export const getAnalyticsData = () => {
  const analyticsState = useAnalyticsStore.getState();
  const user = useUserStore.getState().user;

  return {
    user_id: user?.user_id || null,
    device_id: analyticsState.device_id,
    version: analyticsState.version,
    session_id: analyticsState.session_id,
    event_list: analyticsState.event_list,
  };
};

export default useAnalyticsStore;

// 初始化analytics系统
const initializeAnalytics = async () => {
  const store = useAnalyticsStore.getState();
  
  // 加载持久化数据
  await store.loadPersistedData();
  
  // 如果有数据且在线，尝试发送
  if (store.event_list.length > 0 && store.isOnline) {
    store.sendDataWithRetry();
  }
};

// 初始化时自动加载
initializeAnalytics();
