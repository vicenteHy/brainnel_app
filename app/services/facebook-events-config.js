// Facebook 事件配置 - 混合上报策略

export const FB_EVENT_CONFIG = {
  // SDK 自动上报的事件（不需要手动处理）
  AUTO_EVENTS: [
    'Install',        // 自动
    'AppLaunch',      // 自动
    'Search',         // 可选自动
  ],
  
  // 必须通过后端上报的事件（涉及支付和验证）
  BACKEND_ONLY_EVENTS: [
    'Purchase',
    'AddPaymentInfo',
    'Subscribe',
    'CompletedRegistration',  // 注册完成需要后端确认
  ],
  
  // 同时上报的事件（SDK直接上报 + 后端上报）
  DUAL_REPORT_EVENTS: [
    'AddToCart',         // 快速上报 + 后端验证
    'InitiateCheckout',  // 快速上报 + 后端记录
    'ViewContent',       // 快速上报 + 后端分析
  ],
  
  // 只通过后端上报的自定义事件
  CUSTOM_BACKEND_EVENTS: [
    'ShareProduct',      // 分享商品
    'ContactSupport',    // 联系客服
    'ApplyCoupon',       // 使用优惠券
  ]
};

// Facebook SDK 初始化配置
export const initFacebookWithStrategy = async () => {
  // 初始化 SDK
  Settings.initializeSDK();
  
  // 保留自动事件（Install, Launch）
  Settings.setAutoLogAppEventsEnabled(true);
  
  // 但禁用自动 IAP 事件（购买需要后端验证）
  if (Platform.OS === 'ios') {
    Settings.setAutoInitEnabled(true);
    // 禁用自动购买事件
    Settings.setAdvertiserIDCollectionEnabled(true);
  }
};

// 判断事件是否需要 SDK 直接上报
export const shouldReportToSDK = (eventName) => {
  return FB_EVENT_CONFIG.DUAL_REPORT_EVENTS.includes(eventName) ||
         FB_EVENT_CONFIG.AUTO_EVENTS.includes(eventName);
};

// 判断事件是否需要后端上报
export const shouldReportToBackend = (eventName) => {
  return FB_EVENT_CONFIG.BACKEND_ONLY_EVENTS.includes(eventName) ||
         FB_EVENT_CONFIG.DUAL_REPORT_EVENTS.includes(eventName) ||
         FB_EVENT_CONFIG.CUSTOM_BACKEND_EVENTS.includes(eventName);
};