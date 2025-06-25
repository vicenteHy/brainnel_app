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
  referrer_page: string | null;
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

// 定义页面浏览属性类型
type PageViewProperty = {
  page_name: string;
  duration?: number; // 页面停留时长（秒）
  timestamp: string;
};

// 定义错误事件属性类型
type ErrorProperty = {
  error_message: string;
  error_stack?: string;
  context?: string;
  user_agent?: string;
  timestamp: string;
};

// 定义会话事件属性类型
type SessionProperty = {
  session_duration: number; // 会话时长（秒）
  page_count: number; // 访问页面数
  event_count: number; // 事件总数
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
  sessionStartTime: number;
  pageStartTimes: Map<string, number>;
  visitedPageCount: number;
  addEvent: (event: AnalyticsEvent) => void;
  startTimer: () => void;
  stopTimer: () => void;
  sendDataWithRetry: (retryCount?: number) => Promise<void>;
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
    fromPage?: string,
    isSubCategory?: boolean
  ) => void;
  logSubCategory: (
    subCategoryInfo: Omit<CategoryProperty, "timestamp">,
    fromPage?: string
  ) => void;
  logPageView: (pageName: string, fromPage?: string) => void;
  logPageLeave: (pageName: string) => void;
  logError: (error: Error | string, context?: string) => void;
  logSessionEnd: () => void;
};

// 获取当前格式化的时间字符串 YYYY-MM-DD HH:MM:SS
const getCurrentFormattedTime = (): string => {
  return new Date().toISOString().replace("T", " ").substr(0, 19);
};

// 提取事件关键信息的辅助函数
const getEventKeyInfo = (event: any): string => {
  const props = event.event_properties[0] || {};
  switch (event.event_name) {
    case 'app_launch':
      return `应用${props.is_open ? '启动成功' : '启动失败'}`;
    case 'product_view':
      return `商品: ${props.product_name || 'N/A'}`;
    case 'search':
      return `关键词: "${props.key_word || 'N/A'}"`;
    case 'login':
      return `方式: ${props.login_method || 'N/A'}, 结果: ${props.is_login ? '成功' : '失败'}`;
    case 'register':
      return `方式: ${props.register_method || 'N/A'}, 结果: ${props.is_register ? '成功' : '失败'}`;
    case 'category':
      return `分类: ${props.category_name || 'N/A'} (${props.category_type || 'main_category'})`;
    case 'sub_category':
      return `子分类: ${props.category_name || 'N/A'}`;
    case 'addToCart':
      return `商品: ${props.product_name || 'N/A'} x${props.quantity || 1}`;
    case 'address':
      return `地址: ${props.first_name} ${props.last_name} (${props.country})`;
    case 'shipping':
      return `物流: ${props.forwarder_name || 'N/A'} (${props.country_city || 'N/A'})`;
    case 'payment':
      return `支付: ${props.pay_method || 'N/A'}, 金额: ${props.all_price} ${props.currency}`;
    case 'order':
      return `订单预览`;
    case 'checkout':
      return `结账${props.is_suc ? '成功' : '失败'}, 金额: ${props.all_price} ${props.currency}`;
    case 'page_view':
      return `进入页面: ${event.page_name}`;
    case 'page_leave':
      return `离开页面: ${event.page_name}, 停留: ${props.duration}秒`;
    case 'session_end':
      return `会话结束: ${props.session_duration}秒, 页面: ${props.page_count}, 事件: ${props.event_count}`;
    case 'error':
      return `错误: ${props.error_message}`;
    case 'batch_trigger':
      return `批量发送触发: ${props.event_count}个事件`;
    default:
      return `事件类型: ${event.event_name}`;
  }
};

// 统一的埋点调试日志函数
const logAnalyticsDebug = (eventName: string, data: any, context?: string) => {
  // 埋点调试开关 - 设置为 true 开启调试日志，false 关闭
  const ANALYTICS_DEBUG = false;
  
  if (ANALYTICS_DEBUG) {
    if (eventName === 'data_sent') {
      // 数据发送日志特殊处理，更简洁地显示事件摘要
      console.log(`[Analytics Debug] ${eventName}:`, {
        event: eventName,
        timestamp: getCurrentFormattedTime(),
        context,
        event_count: data.event_count,
        user_id: data.user_id,
        session_id: data.session_id,
      });
      
      // 单独显示事件摘要
      console.log(`[Analytics Debug] Events Summary:`);
      if (data.event_list && Array.isArray(data.event_list)) {
        data.event_list.forEach((event: any, index: number) => {
          const keyInfo = getEventKeyInfo(event);
          console.log(`  ${index + 1}. ${event.event_name} (${event.page_name || 'null'}) - ${keyInfo}`);
          
          // 显示完整的事件属性
          if (event.event_properties && event.event_properties.length > 0) {
            console.log(`     Properties:`, JSON.stringify(event.event_properties[0], null, 2));
          }
        });
      } else {
        console.log(`  事件列表为空或无效:`, data.event_list);
      }
      
      // 如果需要查看完整数据，可以取消下面这行的注释
      // console.log(`[Analytics Debug] Full Payload:`, JSON.stringify(data.full_payload, null, 2));
    } else {
      // 普通事件日志 - 移除重复的timestamp，直接使用事件数据中的timestamp
      const logData = {
        event: eventName,
        data,
        context,
      };
      console.log(`[Analytics Debug] ${eventName}:`, logData);
    }
  }
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
    if (nextAppState === 'background') {
      // 应用进入后台时记录会话结束并发送数据
      get().logSessionEnd();
    }
  });

  return {
    device_id: Platform.OS,
    version: generateUniqueId(),
    session_id: SESSION_ID,
    event_list: [],
    sendingStatus: 'idle' as SendingStatus,
    isOnline: true,
    sessionStartTime: Date.now(),
    pageStartTimes: new Map<string, number>(),
    visitedPageCount: 0,

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
        
        // 保存事件列表副本用于调试日志
        const eventListCopy = JSON.parse(JSON.stringify(analyticsData.event_list));
        
        await sendAnalyticsData(analyticsData);
        
        // 发送成功，清空数据
        set({ event_list: [], sendingStatus: 'idle' });
        await AsyncStorage.removeItem(ANALYTICS_STORAGE_KEY);
        
        // 优化发送成功的调试日志，使用保存的事件列表副本
        // logAnalyticsDebug('data_sent', {
        //   event_count: eventListCopy.length,
        //   user_id: analyticsData.user_id,
        //   session_id: analyticsData.session_id,
        //   event_list: eventListCopy,
        //   full_payload: analyticsData // 完整的发送数据
        // }, `数据发送成功 - 共${eventListCopy.length}个事件`);
        
        
      } catch (error) {
        
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
          // logAnalyticsDebug('batch_trigger', { event_count: newEventList.length }, '事件数达到阈值，触发批量发送');
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
      const eventProperties = {
        is_open: isSuccess ? 1 : 0, // 1表示成功，0表示失败
        timestamp: getCurrentFormattedTime(),
      };

      const appLaunchEvent: AnalyticsEvent = {
        event_name: "app_launch",
        page_name: null,
        referrer_page: null,
        event_properties: [eventProperties],
      };

      logAnalyticsDebug("app_launch", eventProperties, "应用启动");
      get().addEvent(appLaunchEvent);
    },

    // 记录登录事件
    logLogin: (isSuccess = true, loginMethod = "phone") => {
      const eventProperties = {
        is_login: isSuccess ? 1 : 0, // 1表示成功，0表示失败
        login_method: loginMethod, // 登录方式
        timestamp: getCurrentFormattedTime(),
      };

      const loginEvent: AnalyticsEvent = {
        event_name: "login",
        page_name: "login",
        referrer_page: null,
        event_properties: [eventProperties],
      };

      logAnalyticsDebug("login", eventProperties, `登录${isSuccess ? '成功' : '失败'} - ${loginMethod}`);
      get().addEvent(loginEvent);
    },

    // 记录注册事件
    logRegister: (isSuccess = true, registerMethod = "phone") => {
      const eventProperties = {
        is_register: isSuccess ? 1 : 0, // 1表示成功，0表示失败
        register_method: registerMethod, // 注册方式
        timestamp: getCurrentFormattedTime(),
      };

      const registerEvent: AnalyticsEvent = {
        event_name: "register",
        page_name: "register",
        referrer_page: null,
        event_properties: [eventProperties],
      };

      logAnalyticsDebug("register", eventProperties, `注册${isSuccess ? '成功' : '失败'} - ${registerMethod}`);
      get().addEvent(registerEvent);
    },

    // 记录浏览商品事件
    logViewProduct: (productInfo: ProductProperty, fromPage = "home") => {
      const viewProductEvent: AnalyticsEvent = {
        event_name: "product_view",
        page_name: "product_view",
        referrer_page: fromPage,
        event_properties: [productInfo],
      };

      logAnalyticsDebug("product_view", productInfo, `浏览商品 - ${productInfo.product_name} (来源: ${fromPage})`);
      get().addEvent(viewProductEvent);
    },

    // 记录搜索事件
    logSearch: (keyword: string, fromPage = "home") => {
      const eventProperties = {
        key_word: keyword,
        timestamp: getCurrentFormattedTime(),
      };

      const searchEvent: AnalyticsEvent = {
        event_name: "search",
        page_name: "search",
        referrer_page: 'home',
        event_properties: [eventProperties],
      };

      logAnalyticsDebug("search", eventProperties, `搜索关键词: "${keyword}" (来源: ${fromPage})`);
      get().addEvent(searchEvent);
    },

    // 记录填写地址信息事件
    logAddressInfo: (
      addressInfo: Omit<AddressProperty, "timestamp">,
      fromPage = "cart"
    ) => {
      const eventProperties = {
        ...addressInfo,
        timestamp: getCurrentFormattedTime(),
      };

      const addressEvent: AnalyticsEvent = {
        event_name: "address",
        page_name: "address",
        referrer_page: fromPage,
        event_properties: [eventProperties],
      };

      logAnalyticsDebug("address", eventProperties, `填写地址信息 - ${addressInfo.first_name} ${addressInfo.last_name} (${addressInfo.country})`);
      get().addEvent(addressEvent);
    },

    // 记录物流信息确认事件
    logShippingConfirm: (
      shippingInfo: Omit<ShippingProperty, "timestamp">,
      fromPage = "address"
    ) => {
      const eventProperties = {
        ...shippingInfo,
        timestamp: getCurrentFormattedTime(),
      };

      const shippingEvent: AnalyticsEvent = {
        event_name: "shipping",
        page_name: "shipping",
        referrer_page: fromPage,
        event_properties: [eventProperties],
      };

      logAnalyticsDebug("shipping", eventProperties, `选择物流 - ${shippingInfo.forwarder_name} (${shippingInfo.country_city})`);
      get().addEvent(shippingEvent);
    },

    // 记录支付方式确认事件
    logPaymentConfirm: (
      paymentInfo: Omit<PaymentProperty, "timestamp">,
      fromPage = "shipping"
    ) => {
      const eventProperties = {
        ...paymentInfo,
        timestamp: getCurrentFormattedTime(),
      };

      const paymentEvent: AnalyticsEvent = {
        event_name: "payment",
        page_name: "payment",
        referrer_page: fromPage,
        event_properties: [eventProperties],
      };

      logAnalyticsDebug("payment", eventProperties, `选择支付方式 - ${paymentInfo.pay_method} (总价: ${paymentInfo.all_price} ${paymentInfo.currency})`);
      get().addEvent(paymentEvent);
    },

    // 记录预览订单事件
    logPreviewOrder: (fromPage = "pay_method") => {
      const eventProperties = {
        timestamp: getCurrentFormattedTime(),
      };

      const previewEvent: AnalyticsEvent = {
        event_name: "order",
        page_name: "order",
        referrer_page: fromPage,
        event_properties: [eventProperties],
      };

      logAnalyticsDebug("order", eventProperties, `预览订单 (来源: ${fromPage})`);
      get().addEvent(previewEvent);
    },

    // 记录支付结账事件
    logCheckout: (
      checkoutInfo: Omit<CheckoutProperty, "timestamp">,
      fromPage = "perview"
    ) => {
      const eventProperties = {
        ...checkoutInfo,
        timestamp: getCurrentFormattedTime(),
      };

      const checkoutEvent: AnalyticsEvent = {
        event_name: "checkout",
        page_name: "checkout",
        referrer_page: fromPage,
        event_properties: [eventProperties],
      };

      logAnalyticsDebug("checkout", eventProperties, `结账${checkoutInfo.is_suc ? '成功' : '失败'} - 总价: ${checkoutInfo.all_price} ${checkoutInfo.currency}`);
      get().addEvent(checkoutEvent);
    },

    // 分类事件（统一处理主分类和子分类）
    logCategory: (
      categoryInfo: Omit<CategoryProperty, "timestamp">,
      fromPage?: string,
      isSubCategory = false
    ) => {
      // 根据是否为子分类设置默认来源页面
      const defaultFromPage = isSubCategory ? "category" : "home";
      const finalFromPage = fromPage || defaultFromPage;
      
      const eventProperties = {
        ...categoryInfo,
        timestamp: getCurrentFormattedTime(),
        category_type: isSubCategory ? "sub_category" : "main_category", // 新增字段区分类型
      };

      const categoryEvent: AnalyticsEvent = {
        event_name: "category",
        page_name: "category",
        referrer_page: finalFromPage,
        event_properties: [eventProperties],
      };

      const categoryType = isSubCategory ? "子分类" : "主分类";
      logAnalyticsDebug("category", eventProperties, `浏览${categoryType} - ${categoryInfo.category_name} (ID: ${categoryInfo.category_id})`);
      get().addEvent(categoryEvent);
    },

    // 子分类事件（独立事件，区别于主分类）
    logSubCategory: (
      subCategoryInfo: Omit<CategoryProperty, "timestamp">,
      fromPage = "category"
    ) => {
      const eventProperties = {
        ...subCategoryInfo,
        timestamp: getCurrentFormattedTime(),
      };

      const subCategoryEvent: AnalyticsEvent = {
        event_name: "sub_category",
        page_name: "sub_category",
        referrer_page: fromPage,
        event_properties: [eventProperties],
      };

      logAnalyticsDebug("sub_category", eventProperties, `浏览子分类 - ${subCategoryInfo.category_name} (ID: ${subCategoryInfo.category_id})`);
      get().addEvent(subCategoryEvent);
    },

    // 记录添加购物车事件
    logAddToCart: (
      cartInfo: Omit<CartProperty, "timestamp">,
      fromPage = "search"
    ) => {
      const eventProperties = {
        ...cartInfo,
        timestamp: getCurrentFormattedTime(),
      };

      const addToCartEvent: AnalyticsEvent = {
        event_name: "addToCart",
        page_name: "addToCart",
        referrer_page: "search",
        event_properties: [eventProperties],
      };

      logAnalyticsDebug("addToCart", eventProperties, `添加购物车 - ${cartInfo.product_name} x${cartInfo.quantity} (总价: ${cartInfo.all_price} ${cartInfo.currency})`);
      get().addEvent(addToCartEvent);
    },

    // 清空数据
    clearData: () => {
      // 这里可以添加发送数据到服务器的逻辑
      set({ event_list: [] });
    },

    // 记录页面浏览开始
    logPageView: (pageName: string, fromPage = "unknown") => {
      const startTime = Date.now();
      set(state => ({
        pageStartTimes: new Map(state.pageStartTimes).set(pageName, startTime),
        visitedPageCount: state.visitedPageCount + 1,
      }));

      const eventProperties = {
        timestamp: getCurrentFormattedTime(),
      };

      const pageViewEvent: AnalyticsEvent = {
        event_name: "page_view",
        page_name: pageName,
        referrer_page: fromPage,
        event_properties: [eventProperties],
      };

      logAnalyticsDebug("page_view", eventProperties, `进入页面 - ${pageName} (来源: ${fromPage})`);
      get().addEvent(pageViewEvent);
    },

    // 记录页面离开（计算停留时长）
    logPageLeave: (pageName: string) => {
      const state = get();
      const startTime = state.pageStartTimes.get(pageName);
      
      if (startTime) {
        const duration = Math.round((Date.now() - startTime) / 1000); // 转换为秒
        
        const eventProperties = {
          duration,
          timestamp: getCurrentFormattedTime(),
        };

        const pageLeaveEvent: AnalyticsEvent = {
          event_name: "page_leave",
          page_name: pageName,
          referrer_page: null,
          event_properties: [eventProperties],
        };

        logAnalyticsDebug("page_leave", eventProperties, `离开页面 - ${pageName} (停留时长: ${duration}秒)`);
        get().addEvent(pageLeaveEvent);
        
        // 清除页面开始时间
        const newPageStartTimes = new Map(state.pageStartTimes);
        newPageStartTimes.delete(pageName);
        set({ pageStartTimes: newPageStartTimes });
      }
    },

    // 记录错误事件
    logError: (error: Error | string, context = "unknown") => {
      const errorMessage = typeof error === 'string' ? error : error.message;
      const errorStack = typeof error === 'object' && error.stack ? error.stack : undefined;
      
      const eventProperties = {
        error_message: errorMessage,
        error_stack: errorStack,
        context,
        user_agent: Platform.OS,
        timestamp: getCurrentFormattedTime(),
      };

      const errorEvent: AnalyticsEvent = {
        event_name: "error",
        page_name: context,
        referrer_page: null,
        event_properties: [eventProperties],
      };

      logAnalyticsDebug("error", eventProperties, `错误事件 - ${errorMessage} (上下文: ${context})`);
      get().addEvent(errorEvent);
    },

    // 记录会话结束
    logSessionEnd: () => {
      const state = get();
      const sessionDuration = Math.round((Date.now() - state.sessionStartTime) / 1000);
      
      const eventProperties = {
        session_duration: sessionDuration,
        page_count: state.visitedPageCount,
        event_count: state.event_list.length,
        timestamp: getCurrentFormattedTime(),
      };

      const sessionEndEvent: AnalyticsEvent = {
        event_name: "session_end",
        page_name: null,
        referrer_page: null,
        event_properties: [eventProperties],
      };

      logAnalyticsDebug("session_end", eventProperties, `会话结束 - 时长: ${sessionDuration}秒, 页面数: ${state.visitedPageCount}, 事件数: ${state.event_list.length}`);
      get().addEvent(sessionEndEvent);
      
      // 立即发送会话结束事件
      setTimeout(() => get().sendDataWithRetry(), 0);
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
