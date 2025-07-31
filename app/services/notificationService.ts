import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform, Linking, AppState, NativeModules } from 'react-native';

class NotificationService {
  private static instance: NotificationService;
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // 请求通知权限
  async requestPermission(): Promise<boolean> {
    try {
      // Android 13+ 需要先请求 POST_NOTIFICATIONS 权限
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const { PermissionsAndroid } = require('react-native');
        
        // 检查是否已有权限
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        
        if (!hasPermission) {
          // 请求权限 - 使用系统默认对话框
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('用户拒绝了通知权限');
            return false;
          }
        }
      }
      
      // 然后请求 Firebase 权限
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('通知权限状态:', authStatus);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('请求通知权限失败:', error);
      return false;
    }
  }
  
  // 检查实际的通知状态（Android）
  async checkActualNotificationStatus(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // Android 13+ 需要检查 POST_NOTIFICATIONS 权限
        const { PermissionsAndroid } = require('react-native');
        
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          
          if (!granted) {
            console.log('Android 13+ POST_NOTIFICATIONS 权限未授予');
            return false;
          }
        }
        
        // 对于所有 Android 版本，还需要检查应用通知设置
        // 这里我们只能通过 Firebase 的状态来判断
        // 如果用户在系统设置中关闭了通知，Firebase 在某些情况下仍会返回已授权
        // 这是 Android 的限制，无法通过代码精确检测
        
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('检查通知状态失败:', error);
      // 如果检查失败，默认返回 true
      return true;
    }
  }
  
  // 显示通知权限提示
  async showNotificationPermissionAlert(): Promise<void> {
    // 导入 i18n
    const { t } = require('../i18n');
    
    Alert.alert(
      t('notification.permission.title'),
      t('notification.permission.message'),
      [
        {
          text: t('notification.permission.later'),
          style: 'cancel',
        },
        {
          text: t('notification.permission.goToSettings'),
          onPress: () => this.openNotificationSettings(),
        },
      ],
    );
  }
  
  // 打开系统通知设置
  async openNotificationSettings(): Promise<void> {
    if (Platform.OS === 'ios') {
      // iOS: 打开应用设置
      Linking.openURL('app-settings:');
    } else {
      // Android: 打开应用通知设置
      Linking.openSettings();
    }
  }
  
  // 完整的权限检查和请求流程
  async checkAndRequestPermission(): Promise<boolean> {
    try {
      // 先请求权限（Android 13+ 会弹出系统对话框）
      const hasPermission = await this.requestPermission();
      
      if (!hasPermission) {
        // Android 13+ 用户在系统对话框中拒绝了
        // Android 12- 或用户之前已经在设置中关闭了通知
        // 显示自定义提示，引导去设置
        await this.showNotificationPermissionAlert();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('检查和请求权限失败:', error);
      return false;
    }
  }

  // 获取 FCM Token
  async getToken(): Promise<string | null> {
    try {
      // 确保已注册远程消息
      if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
      }
      
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      
      // 保存 token 到本地存储
      await AsyncStorage.setItem('fcmToken', token);
      
      // TODO: 将 token 发送到你的服务器
      // await api.updateDeviceToken(token);
      
      return token;
    } catch (error) {
      console.error('获取 FCM Token 失败:', error);
      return null;
    }
  }

  // 检查 token 是否需要刷新
  onTokenRefresh(callback: (token: string) => void): () => void {
    return messaging().onTokenRefresh(async (token) => {
      console.log('FCM Token 已刷新:', token);
      await AsyncStorage.setItem('fcmToken', token);
      callback(token);
    });
  }

  // 处理前台消息
  onMessage(callback: (message: any) => void): () => void {
    return messaging().onMessage(async (remoteMessage) => {
      console.log('收到前台消息:', remoteMessage);
      
      // 在前台时显示本地通知或 Alert
      Alert.alert(
        remoteMessage.notification?.title || '新消息',
        remoteMessage.notification?.body || '',
        [
          {
            text: '查看',
            onPress: () => callback(remoteMessage),
          },
          {
            text: '忽略',
            style: 'cancel',
          },
        ],
      );
    });
  }

  // 处理通知点击（应用在后台）
  onNotificationOpenedApp(callback: (message: any) => void): () => void {
    return messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('通过通知打开应用（后台）:', remoteMessage);
      callback(remoteMessage);
    });
  }

  // 处理通知点击（应用已关闭）
  async getInitialNotification(): Promise<any> {
    const remoteMessage = await messaging().getInitialNotification();
    if (remoteMessage) {
      console.log('通过通知打开应用（已关闭）:', remoteMessage);
      return remoteMessage;
    }
    return null;
  }

  // 订阅主题
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`已订阅主题: ${topic}`);
    } catch (error) {
      console.error(`订阅主题失败 ${topic}:`, error);
    }
  }

  // 取消订阅主题
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`已取消订阅主题: ${topic}`);
    } catch (error) {
      console.error(`取消订阅主题失败 ${topic}:`, error);
    }
  }
}

export default NotificationService.getInstance();