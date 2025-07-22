import { Settings, AppEventsLogger, AppLink } from 'react-native-fbsdk-next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../constants/config';
import { getTrackingStatus, requestTrackingPermission } from 'react-native-tracking-transparency';
import Constants from 'expo-constants';
import useUserStore from '../store/user';

// 测试模式配置
const FACEBOOK_TEST_MODE = false; // 设置为 true 启用测试模式
const FACEBOOK_TEST_CODE = 'TEST25912'; // Facebook 测试编号

// Facebook 事件类型（仅包含需要手动处理的事件）
export const FB_EVENTS = {
  // INSTALL: 'Install', // 现在由 SDK 自动处理
  ADD_TO_CART: 'AddToCart',
  VIEW_CONTENT: 'ViewContent',
  INITIATE_CHECKOUT: 'InitiateCheckout',
  PURCHASE: 'Purchase',
  COMPLETE_REGISTRATION: 'CompleteRegistration'
};

// 保存 Facebook Click ID (通常从深度链接获取)
export const saveFbclid = async (fbclid) => {
  if (fbclid) {
    try {
      await AsyncStorage.setItem('fbclid', fbclid);
      await AsyncStorage.setItem('fbclid_timestamp', Date.now().toString());
    } catch (error) {
    }
  }
};

// 从深度链接或安装来源中提取 fbclid
export const extractAndSaveFbclid = async (url) => {
  try {
    if (!url) return;
    
    // 解析 URL 参数
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const fbclid = urlParams.get('fbclid');
    
    if (fbclid) {
      await saveFbclid(fbclid);
      return fbclid;
    }
  } catch (error) {
  }
  return null;
};

// 请求追踪权限（仅 iOS）
export const requestTrackingPermissionIOS = async () => {
  if (Platform.OS !== 'ios') {
    return 'granted';
  }

  try {
    const trackingStatus = await getTrackingStatus();
    
    if (trackingStatus === 'not-determined') {
      // 请求权限
      const status = await requestTrackingPermission();
      return status;
    }
    
    return trackingStatus;
  } catch (error) {
    return 'denied';
  }
};

// 检查 Facebook SDK 状态
export const checkFacebookSDKStatus = async () => {
  try {
    // 只检查支持的方法
    const trackingEnabled = await Settings.getAdvertiserTrackingEnabled();
    
    
    return {
      appId: '1662120374497452',
      trackingEnabled: trackingEnabled,
      autoLogEnabled: true,
    };
  } catch (error) {
    return null;
  }
};

// 初始化 Facebook SDK
export const initializeFacebookSDK = async () => {
  try {
    
    // SDK 已经通过 app.json 中的 isAutoInitEnabled: true 自动初始化
    // 自动事件记录也已通过 app.json 中的 autoLogAppEventsEnabled: true 启用
    
    
    // 在 iOS 上请求追踪权限
    if (Platform.OS === 'ios') {
      const trackingStatus = await requestTrackingPermissionIOS();
      const isTrackingEnabled = trackingStatus === 'authorized';
      
      // 设置广告追踪（根据用户权限）
      await Settings.setAdvertiserTrackingEnabled(isTrackingEnabled);
      
    } else {
      // Android 默认启用
      await Settings.setAdvertiserTrackingEnabled(true);
    }
    
    // 获取延迟深度链接（用于广告归因）
    fetchDeferredAppLink();
    
    // 手动记录一个自定义事件来验证 SDK 工作状态
    const initEventParams = {
      platform: Platform.OS,
      version: Constants.expoConfig?.version || '1.0.0',
    };
    if (FACEBOOK_TEST_MODE) {
    }
    logEventWithCallback('sdk_initialized', initEventParams);
    
  } catch (error) {
  }
};

// 带回调的事件记录（用于确认事件发送）
export const logEventWithCallback = (eventName, parameters = {}) => {
  try {
    // 在测试模式下，添加测试编号到参数中
    const eventParams = FACEBOOK_TEST_MODE 
      ? { ...parameters, test_event_code: FACEBOOK_TEST_CODE }
      : parameters;
    
    AppEventsLogger.logEvent(eventName, eventParams);
    
    // Facebook SDK 不提供直接的成功回调，但我们可以捕获错误
    return true;
  } catch (error) {
    return false;
  }
};

// 获取延迟深度链接
export const fetchDeferredAppLink = async () => {
  try {
    const url = await AppLink.fetchDeferredAppLink();
    
    if (url) {
      // 提取并保存 fbclid
      await extractAndSaveFbclid(url);
    } else {
    }
  } catch (error) {
  }
};

// 获取或生成 fbp (Facebook Browser ID)
const getFbp = async () => {
  try {
    let fbp = await AsyncStorage.getItem('_fbp');
    if (!fbp) {
      // 生成新的 fbp: fb.1.timestamp.randomNumber
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 2147483647);
      fbp = `fb.1.${timestamp}.${randomNum}`;
      await AsyncStorage.setItem('_fbp', fbp);
    }
    return fbp;
  } catch (error) {
    return null;
  }
};

// 获取 fbc (Facebook Click ID from URL parameters)
const getFbc = async () => {
  try {
    // 检查是否有存储的 fbclid
    const fbclid = await AsyncStorage.getItem('fbclid');
    if (fbclid) {
      // 格式: fb.1.timestamp.fbclid
      const timestamp = await AsyncStorage.getItem('fbclid_timestamp') || Date.now();
      return `fb.1.${timestamp}.${fbclid}`;
    }
    return null;
  } catch (error) {
    return null;
  }
};

// 获取设备信息
const getDeviceInfo = () => {
  return {
    device_id: Constants.sessionId || Constants.installationId,
    device_model: Constants.platform?.ios?.model || Constants.platform?.android?.model || 'Unknown',
    os_version: Platform.Version.toString(),
    app_name: Constants.expoConfig?.name || 'brainnel',
    app_version: Constants.expoConfig?.version || '1.0.0',
  };
};

// 发送事件到后端
const sendEventToBackend = async (eventName, parameters = {}) => {
  try {
    // 获取当前追踪状态
    let trackingEnabled = true;
    if (Platform.OS === 'ios') {
      const trackingStatus = await getTrackingStatus();
      trackingEnabled = trackingStatus === 'authorized';
    }

    // 获取 Facebook 相关 ID
    const [fbp, fbc] = await Promise.all([getFbp(), getFbc()]);
    
    // 获取设备信息
    const deviceInfo = getDeviceInfo();

    // 基础数据
    const eventData = {
      eventName,
      parameters,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      trackingEnabled,
      // Facebook 标识符
      fbp,
      fbc,
      // 设备信息
      deviceInfo,
      // IP 和 User Agent 由后端从请求头获取
    };

    // 获取用户信息（如果已登录）
    const userInfo = useUserStore.getState().user;
    if (userInfo?.user_id) {
      eventData.userId = userInfo.user_id.toString();
      eventData.userEmail = userInfo.email;
      eventData.userPhone = userInfo.phone;
    }

    const response = await fetch(`${API_BASE_URL}/api/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      throw new Error(`Failed to send event: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
};

// Install 事件现在由 Facebook SDK 自动处理
// 以下函数保留用于其他需要手动上报的事件

// 记录添加到购物车事件（使用 SDK 自动上报）
export const logAddToCartEvent = (product, skuDetails = null, totalQuantity = 1, totalPrice = null) => {
  try {
    // 获取产品ID（兼容不同的字段名）
    const productId = product.offer_id || product.id || '';
    const productName = product.subject || product.subject_trans || product.title || product.name || '';
    
    // 构建内容数组
    let contents = [];
    let contentIds = [];
    
    if (skuDetails && skuDetails.length > 0) {
      // 多SKU情况
      contents = skuDetails.map(sku => {
        const skuId = String(sku.sku_id || '');
        contentIds.push(skuId);
        return {
          id: skuId,
          quantity: sku.quantity || 1,
          item_price: typeof sku.price === 'string' ? parseFloat(sku.price) || 0 : sku.price || 0
        };
      });
    } else {
      // 单个商品或无SKU情况
      const singleId = String(productId);
      contentIds.push(singleId);
      contents = [{
        id: singleId,
        quantity: totalQuantity,
        item_price: typeof product.price === 'string' ? parseFloat(product.price) || 0 : product.price || 0
      }];
    }
    
    // 计算总价值
    const value = totalPrice || (product.price * totalQuantity) || 0;
    
    // 准备参数 - 确保所有值都是正确的类型
    const parameters = {
      [AppEventsLogger.AppEventParams.ContentType]: 'product',
      [AppEventsLogger.AppEventParams.ContentID]: contentIds.join(','), // 多个ID用逗号分隔
      [AppEventsLogger.AppEventParams.Currency]: product.currency || 'USD',
      [AppEventsLogger.AppEventParams.NumItems]: totalQuantity,
      [AppEventsLogger.AppEventParams.Content]: JSON.stringify(contents)
    };
    
    // 在测试模式下添加测试编号
    if (FACEBOOK_TEST_MODE) {
      parameters.test_event_code = FACEBOOK_TEST_CODE;
    }
    
    
    // 使用 SDK 直接上报
    AppEventsLogger.logEvent(
      AppEventsLogger.AppEvents.AddedToCart,
      value,  // valueToSum
      parameters
    );
    
    
    
  } catch (error) {
  }
};

// 记录查看内容事件（使用 SDK 自动上报）
export const logViewContentEvent = (product) => {
  try {
    // 获取产品ID（兼容不同的字段名）
    const productId = product.offer_id || product.id || '';
    const productName = product.subject || product.subject_trans || product.title || product.name || '';
    const productPrice = typeof product.price === 'string' ? parseFloat(product.price) || 0 : product.price || 0;
    
    // 准备参数 - 确保所有值都是字符串
    const parameters = {
      [AppEventsLogger.AppEventParams.ContentType]: 'product',
      [AppEventsLogger.AppEventParams.ContentID]: String(productId),
      [AppEventsLogger.AppEventParams.Currency]: product.currency || 'USD',
      [AppEventsLogger.AppEventParams.Content]: JSON.stringify([{
        id: String(productId),
        quantity: 1,
        item_price: productPrice
      }])
    };
    
    // 在测试模式下添加测试编号
    if (FACEBOOK_TEST_MODE) {
      parameters.test_event_code = FACEBOOK_TEST_CODE;
    }
    
    
    // 使用 SDK 直接上报
    AppEventsLogger.logEvent(
      AppEventsLogger.AppEvents.ViewedContent,
      productPrice,  // valueToSum
      parameters
    );
    
    
    
  } catch (error) {
  }
};

// 记录开始结账事件（使用 SDK 自动上报）
export const logInitiateCheckoutEvent = (orderInfo, skuDetails = [], paymentMethod = '') => {
  try {
    // 确保 skuDetails 是数组
    const skuArray = Array.isArray(skuDetails) ? skuDetails : [];
    
    // 构建内容数组，处理不同的字段名
    let contents = [];
    let contentIds = [];
    
    if (skuArray.length > 0) {
      contents = skuArray.map(sku => {
        const skuId = String(sku.sku_id || '');
        const price = typeof sku.price === 'string' ? parseFloat(sku.price) || 0 : sku.price || 0;
        const quantity = sku.quantity || 1;
        
        contentIds.push(skuId);
        
        return {
          id: skuId,
          quantity: quantity,
          item_price: price
        };
      });
    }
    
    // 计算总价值
    const totalPrice = typeof orderInfo.totalPrice === 'string' 
      ? parseFloat(orderInfo.totalPrice) || 0 
      : orderInfo.totalPrice || 0;
    
    // 计算总数量
    const totalQuantity = orderInfo.totalQuantity || 
      skuArray.reduce((sum, sku) => sum + (sku.quantity || 1), 0) || 
      1;
    
    // 准备参数 - 确保所有值都是正确的类型
    const parameters = {
      [AppEventsLogger.AppEventParams.ContentType]: 'product',
      [AppEventsLogger.AppEventParams.ContentID]: contentIds.join(',') || 'unknown', // 多个ID用逗号分隔
      [AppEventsLogger.AppEventParams.Currency]: orderInfo.currency || 'USD',
      [AppEventsLogger.AppEventParams.NumItems]: totalQuantity,
      [AppEventsLogger.AppEventParams.Content]: JSON.stringify(contents),
      // 添加支付方式信息作为自定义参数
      'payment_method': paymentMethod || 'unknown',
      'payment_type': orderInfo.offlinePayment ? 'offline' : 'online'
    };
    
    // 在测试模式下添加测试编号
    if (FACEBOOK_TEST_MODE) {
      parameters.test_event_code = FACEBOOK_TEST_CODE;
    }
    
    
    // 使用 SDK 直接上报
    AppEventsLogger.logEvent(
      AppEventsLogger.AppEvents.InitiatedCheckout,
      totalPrice,  // valueToSum - 订单总价值
      parameters
    );
    
    
    
  } catch (error) {
  }
};

// 记录购买完成事件（使用 SDK 自动上报）
export const logPurchaseEvent = (orderInfo, skuDetails = [], paymentMethod = '') => {
  try {
    // 确保 skuDetails 是数组
    const skuArray = Array.isArray(skuDetails) ? skuDetails : [];
    
    // 构建内容数组，处理不同的字段名
    let contents = [];
    let contentIds = [];
    
    if (skuArray.length > 0) {
      contents = skuArray.map(sku => {
        const skuId = String(sku.sku_id || '');
        const price = typeof sku.price === 'string' ? parseFloat(sku.price) || 0 : sku.price || 0;
        const quantity = sku.quantity || 1;
        
        contentIds.push(skuId);
        
        return {
          id: skuId,
          quantity: quantity,
          item_price: price
        };
      });
    }
    
    // 计算总价值
    const totalPrice = typeof orderInfo.totalPrice === 'string' 
      ? parseFloat(orderInfo.totalPrice) || 0 
      : orderInfo.totalPrice || 0;
    
    // 计算总数量
    const totalQuantity = orderInfo.totalQuantity || 
      skuArray.reduce((sum, sku) => sum + (sku.quantity || 1), 0) || 
      1;
    
    // 准备参数 - 确保所有值都是正确的类型
    const parameters = {
      [AppEventsLogger.AppEventParams.ContentType]: 'product',
      [AppEventsLogger.AppEventParams.ContentID]: contentIds.join(',') || 'unknown', // 多个ID用逗号分隔
      [AppEventsLogger.AppEventParams.Currency]: orderInfo.currency || 'USD',
      [AppEventsLogger.AppEventParams.NumItems]: totalQuantity,
      [AppEventsLogger.AppEventParams.Content]: JSON.stringify(contents),
      // 添加支付方式信息作为自定义参数
      'payment_method': paymentMethod || 'unknown',
      'order_id': String(orderInfo.orderId || ''),
      'order_no': String(orderInfo.orderNo || '')
    };
    
    // 在测试模式下添加测试编号
    if (FACEBOOK_TEST_MODE) {
      parameters.test_event_code = FACEBOOK_TEST_CODE;
    }
    
    
    // 使用 SDK 直接上报（Facebook SDK 推荐的方式）
    AppEventsLogger.logPurchase(
      totalPrice,  // valueToSum - 订单总价值
      orderInfo.currency || 'USD',  // 货币
      parameters  // 额外参数
    );
    
    
    
  } catch (error) {
  }
};

// 记录完成注册事件（使用 SDK 自动上报）
export const logCompleteRegistrationEvent = (userInfo = {}, registrationMethod = '') => {
  try {
    // 准备参数 - 确保所有值都是正确的类型
    const parameters = {
      [AppEventsLogger.AppEventParams.RegistrationMethod]: registrationMethod || 'unknown',
      'user_id': String(userInfo.user_id || ''),
      'registration_method': registrationMethod || 'unknown',
      'registration_timestamp': new Date().toISOString()
    };
    
    // 添加用户相关信息（如果有）
    if (userInfo.email) {
      parameters.email = String(userInfo.email);
    }
    if (userInfo.phone) {
      parameters.phone = String(userInfo.phone);
    }
    if (userInfo.username) {
      parameters.username = String(userInfo.username);
    }
    
    // 在测试模式下添加测试编号
    if (FACEBOOK_TEST_MODE) {
      parameters.test_event_code = FACEBOOK_TEST_CODE;
    }
    
    
    // 使用 SDK 直接上报（Facebook SDK 推荐的方式）
    AppEventsLogger.logEvent(
      AppEventsLogger.AppEvents.CompletedRegistration,
      parameters
    );
    
    
    
  } catch (error) {
  }
};