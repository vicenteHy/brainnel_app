import { Alert } from 'react-native';

// 只在非生产环境显示调试信息
export function debugAlert(title: string, message: string) {
  if (__DEV__ || process.env.EXPO_PUBLIC_ENABLE_DEBUG === 'true') {
    Alert.alert(`[DEBUG] ${title}`, message);
  }
}

// 显示 FCM Token（截断显示）
export function showFCMToken(token: string | null) {
  if (token) {
    const shortToken = `${token.substring(0, 20)}...${token.substring(token.length - 20)}`;
    debugAlert('FCM Token', shortToken);
  } else {
    debugAlert('FCM Token', 'Token 获取失败');
  }
}