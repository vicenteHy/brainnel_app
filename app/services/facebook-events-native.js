import { Settings, AppEventsLogger } from 'react-native-fbsdk-next';
import { Platform } from 'react-native';
import { requestTrackingPermissionIOS } from './facebook-events';

// 使用 Facebook SDK 原生上报（可选方案）
export const initializeFacebookSDKNative = async () => {
  try {
    // 初始化设置
    Settings.initializeSDK();
    
    // 在 iOS 上请求追踪权限
    if (Platform.OS === 'ios') {
      const trackingStatus = await requestTrackingPermissionIOS();
      const isTrackingEnabled = trackingStatus === 'authorized';
      await Settings.setAdvertiserTrackingEnabled(isTrackingEnabled);
    } else {
      await Settings.setAdvertiserTrackingEnabled(true);
    }
    
    // SDK 会自动记录 App Install 和 App Launch 事件
    console.log('Facebook SDK initialized with native events');
  } catch (error) {
    console.error('Failed to initialize Facebook SDK:', error);
  }
};

// 原生方式记录事件（直接发送给 Facebook）
export const logEventNative = {
  // 添加到购物车
  addToCart: (product, quantity = 1) => {
    AppEventsLogger.logEvent('fb_mobile_add_to_cart', {
      fb_content_type: 'product',
      fb_content_id: product.id?.toString(),
      fb_content: JSON.stringify([{
        id: product.id?.toString(),
        quantity: quantity,
      }]),
      fb_currency: 'USD',
      _valueToSum: product.price,
    });
  },
  
  // 查看内容
  viewContent: (product) => {
    AppEventsLogger.logEvent('fb_mobile_content_view', {
      fb_content_type: 'product', 
      fb_content_id: product.id?.toString(),
      fb_content: product.title || product.name,
      fb_currency: 'USD',
      _valueToSum: product.price,
    });
  },
  
  // 开始结账
  initiateCheckout: (totalPrice, numItems) => {
    AppEventsLogger.logEvent('fb_mobile_initiated_checkout', {
      fb_content_type: 'product',
      fb_currency: 'USD',
      fb_num_items: numItems,
      _valueToSum: totalPrice,
    });
  },
  
  // 完成购买
  purchase: (totalPrice, currency = 'USD') => {
    AppEventsLogger.logPurchase(totalPrice, currency);
  }
};