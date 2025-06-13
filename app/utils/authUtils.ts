import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp, CommonActions } from '@react-navigation/native';
import i18n from '../i18n';
import useUserStore from '../store/user';
import { navigationRef } from '../navigation/AppNavigator';

// 全局标志，防止重复显示弹窗
let isHandlingMultipleDeviceLogin = false;

/**
 * 处理多设备登录冲突的全局处理函数
 */
export const handleMultipleDeviceLogin = () => {
  // 如果已经在处理中，直接返回
  if (isHandlingMultipleDeviceLogin) {
    return;
  }
  
  isHandlingMultipleDeviceLogin = true;
  const { t } = i18n;
  
  Alert.alert(
    t('auth.multipleDeviceLogin.title'),
    t('auth.multipleDeviceLogin.message'),
    [
      {
        text: t('auth.multipleDeviceLogin.button'),
        onPress: () => {
          // 清除用户数据并登出
          logout();
        },
      },
    ],
    { 
      cancelable: false // 不允许用户取消，必须点击确定
    }
  );
};

/**
 * 登出并清除所有用户数据
 */
export const logout = async () => {
  try {
    // 清除AsyncStorage中的认证信息
    await AsyncStorage.multiRemove([
      'token',
      'refreshToken',
      'user',
      'userSettings'
    ]);
    
    // 清除Zustand store中的用户数据
    const { clearUser } = useUserStore.getState();
    clearUser();
    
    // 使用全局导航引用重置到国家选择页面
    if (navigationRef.isReady()) {
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'CountrySelect' }], // 重置到国家选择页面
        })
      );
    }
    
    // 重置处理标志
    isHandlingMultipleDeviceLogin = false;
  } catch (error) {
    console.error('Logout failed:', error);
    // 即使出错也要重置标志
    isHandlingMultipleDeviceLogin = false;
  }
};

/**
 * 检查401错误是否为多设备登录冲突
 */
export const isMultipleDeviceLoginError = (error: any): boolean => {
  // 检查是否为401错误，并且包含"无效的身份凭证"或"invalid credentials"等信息
  return (
    error?.response?.status === 401 && 
    (error?.response?.data?.detail === "无效的身份凭证" ||
     error?.response?.data?.detail?.includes("无效的身份凭证") ||
     error?.response?.data?.message?.includes("invalid") ||
     error?.response?.data?.message?.includes("credentials"))
  );
};