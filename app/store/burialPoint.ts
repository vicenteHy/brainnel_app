import { Platform } from "react-native";
import { create } from "zustand";
import useUserStore from "./user";
import { sendBurialData } from "../services/api/burialService";

// 定义事件属性类型为灵活的记录类型
type EventProperty = Record<string, any>;

// 定义事件类型
type BurialEvent = {
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

// 定义埋点store的状态
type BurialPointState = {
  device_id: string;
  version: string;
  session_id: string;
  event_list: BurialEvent[];
  addEvent: (event: BurialEvent) => void;
  // startTimer: () => void;
  // stopTimer: () => void;
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

// 创建埋点store
const useBurialPointStore = create<BurialPointState>((set, get) => {
  // 定义定时器变量
//   let burialDataTimer: NodeJS.Timeout | null = null;

  return {
    device_id: Platform.OS,
    version: generateUniqueId(),
    session_id: SESSION_ID,
    event_list: [],

    // 启动定时器
    // startTimer: () => {
    //   // 清除可能存在的旧定时器
    //   if (burialDataTimer) {
    //     clearInterval(burialDataTimer);
    //   }

    //   // 每10秒执行一次发送埋点数据
    //   burialDataTimer = setInterval(() => {
    //     const currentEventList = get().event_list;
        
    //     if (currentEventList.length > 0) {
    //       console.log("Timer triggered, sending burial data:", currentEventList.length, "events");
    //       console.log(getBurialPointData());
          
    //       // 发送数据
    //       sendBurialData(currentEventList);
          
    //       // 清空本地数据
    //       set({ event_list: [] });
    //     }
    //   }, 10000); // 10秒 = 10000毫秒
    // },

    // // 停止定时器
    // stopTimer: () => {
    //   if (burialDataTimer) {
    //     clearInterval(burialDataTimer);
    //     burialDataTimer = null;
    //   }
    // },

    // 添加事件
    addEvent: (event: BurialEvent) => {
      set((state) => {
        // 直接添加新事件到列表中
        const newEventList = [...state.event_list, event];

        // 检查是否需要清理数据（当事件数量达到阈值时）
        if (newEventList.length >= 10) {
          // 立即发送数据到服务器
          console.log("Event count reached limit, sending data immediately:", newEventList.length);
          console.log(getBurialPointData());
          sendBurialData(newEventList);
          
          // 清空本地数据
          return { event_list: [] };
        }

        return { event_list: newEventList };
      });
    },

    // 记录应用启动埋点
    logAppLaunch: (isSuccess = 1) => {
      const appLaunchEvent: BurialEvent = {
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

    // 记录登录事件埋点
    logLogin: (isSuccess = true, loginMethod = "phone") => {
      const loginEvent: BurialEvent = {
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

    // 记录注册事件埋点
    logRegister: (isSuccess = true, registerMethod = "phone") => {
      const registerEvent: BurialEvent = {
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

    // 记录浏览商品事件埋点
    logViewProduct: (productInfo: ProductProperty, fromPage = "home") => {
      const viewProductEvent: BurialEvent = {
        event_name: "product",
        page_name: "product",
        referre_page: fromPage,
        event_properties: [productInfo],
      };

      get().addEvent(viewProductEvent);
    },

    // 记录搜索事件埋点
    logSearch: (keyword: string, fromPage = "home") => {
      const searchEvent: BurialEvent = {
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

    // 记录填写地址信息事件埋点
    logAddressInfo: (
      addressInfo: Omit<AddressProperty, "timestamp">,
      fromPage = "cart"
    ) => {
      const addressEvent: BurialEvent = {
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

    // 记录物流信息确认事件埋点
    logShippingConfirm: (
      shippingInfo: Omit<ShippingProperty, "timestamp">,
      fromPage = "address"
    ) => {
      const shippingEvent: BurialEvent = {
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

    // 记录支付方式确认事件埋点
    logPaymentConfirm: (
      paymentInfo: Omit<PaymentProperty, "timestamp">,
      fromPage = "shipping"
    ) => {
      const paymentEvent: BurialEvent = {
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

    // 记录预览订单事件埋点
    logPreviewOrder: (fromPage = "pay_method") => {
      const previewEvent: BurialEvent = {
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

    // 记录支付结账事件埋点
    logCheckout: (
      checkoutInfo: Omit<CheckoutProperty, "timestamp">,
      fromPage = "perview"
    ) => {
      const checkoutEvent: BurialEvent = {
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

    // 分类事件埋点
    logCategory: (
      categoryInfo: Omit<CategoryProperty, "timestamp">,
      fromPage = "home"
    ) => {
      const categoryEvent: BurialEvent = {
        event_name: "category",
        page_name: "category",
        referre_page: fromPage,
        event_properties: [categoryInfo],
      };

      get().addEvent(categoryEvent);
    },

    // 二级分类事件埋点
    logSubCategory: (
      subCategoryInfo: Omit<CategoryProperty, "timestamp">,
      fromPage = "category"
    ) => {
      const subCategoryEvent: BurialEvent = {
        event_name: "category",
        page_name: "category",
        referre_page: fromPage,
        event_properties: [subCategoryInfo],
      };

      get().addEvent(subCategoryEvent);
    },

    // 记录添加购物车事件埋点
    logAddToCart: (
      cartInfo: Omit<CartProperty, "timestamp">,
      fromPage = "search"
    ) => {
      const addToCartEvent: BurialEvent = {
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

// 获取埋点数据，包括从userStore获取的user_id
export const getBurialPointData = () => {
  const burialState = useBurialPointStore.getState();
  const user = useUserStore.getState().user;

  return {
    user_id: user?.user_id || null,
    device_id: burialState.device_id,
    version: burialState.version,
    session_id: burialState.session_id,
    event_list: burialState.event_list,
  };
};

export default useBurialPointStore;

// 定时器函数：每10秒发送一次埋点数据
// const startBurialTimer = () => {
//   setInterval(() => {
//     const store = useBurialPointStore.getState();
//     const eventList = store.event_list;
    
//     if (eventList.length > 0) {
//       console.log("Timer triggered, sending burial data:", eventList.length, "events");
//       console.log(getBurialPointData());
      
//       // 发送数据
//       sendBurialData(eventList);
      
//       // 清空本地数据
//       useBurialPointStore.setState({ event_list: [] });
//     }
//   }, 10000); // 10秒 = 10000毫秒
// };

// 自动启动埋点数据定时器
// startBurialTimer();
