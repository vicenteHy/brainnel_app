import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform, Linking, AppState, NativeModules } from 'react-native';
import log from '../utils/logger';

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
      log.info('[权限] ========== 开始请求通知权限 ==========');
      log.info('[权限] 平台:', Platform.OS, Platform.Version);
      
      // Android 13+ 需要先请求 POST_NOTIFICATIONS 权限
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const { PermissionsAndroid } = require('react-native');
        
        // 检查是否已有权限
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        
        log.info('[权限] Android POST_NOTIFICATIONS 状态:', hasPermission);
        
        if (!hasPermission) {
          // 请求权限 - 使用系统默认对话框
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            log.warn('[权限] 用户拒绝了 Android 通知权限');
            return false;
          }
        }
      }
      
      // iOS 特定检查
      if (Platform.OS === 'ios') {
        log.info('[权限] iOS: 检查当前权限状态...');
        const currentStatus = await messaging().hasPermission();
        log.info('[权限] iOS: 当前权限状态码:', currentStatus);
        log.info('[权限] iOS: 权限状态:', this.getAuthStatusString(currentStatus));
      }
      
      // 请求 Firebase 权限
      log.info('[权限] 请求 Firebase 通知权限...');
      const authStatus = await messaging().requestPermission();
      
      log.info('[权限] Firebase 返回状态码:', authStatus);
      log.info('[权限] Firebase 权限状态:', this.getAuthStatusString(authStatus));
      
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        log.info('[权限] 通知权限已启用');
        
        // iOS 特定: 检查具体权限设置
        if (Platform.OS === 'ios') {
          const settings = await messaging().requestPermission({
            alert: true,
            badge: true,
            sound: true,
            provisional: false,
          });
          
          log.info('[权限] iOS 详细权限设置:', {
            authorizationStatus: this.getAuthStatusString(settings.authorizationStatus),
            alert: settings.alert,
            badge: settings.badge,
            sound: settings.sound,
            criticalAlert: settings.criticalAlert,
            notificationCenter: settings.notificationCenter,
            lockScreen: settings.lockScreen,
            provisional: settings.provisional,
          });
        }
        
        log.info('[权限] ========== 权限请求成功 ==========');
        return true;
      }
      
      log.warn('[权限] ========== 权限请求失败 ==========');
      return false;
    } catch (error) {
      log.error('[权限] ========== 权限请求出错 ==========');
      log.error('[权限] 错误:', error);
      return false;
    }
  }
  
  // 辅助方法：将权限状态码转换为可读字符串
  private getAuthStatusString(status: number): string {
    switch (status) {
      case -1: return 'NOT_DETERMINED (未确定)';
      case 0: return 'DENIED (已拒绝)';
      case 1: return 'AUTHORIZED (已授权)';
      case 2: return 'PROVISIONAL (临时授权)';
      default: return `UNKNOWN (${status})`;
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
            log.warn('Android 13+ POST_NOTIFICATIONS 权限未授予');
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
      log.error('检查通知状态失败:', error);
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
      log.error('检查和请求权限失败:', error);
      return false;
    }
  }

  // 获取 FCM Token
  async getToken(): Promise<string | null> {
    try {
      log.info('[FCM] ========== 开始获取 FCM Token ==========');
      log.info('[FCM] 平台:', Platform.OS, Platform.Version);
      log.info('[FCM] 环境:', __DEV__ ? '开发' : '生产');
      
      // 确保已注册远程消息
      if (Platform.OS === 'ios') {
        log.info('[FCM] iOS: 检查远程消息注册状态...');
        
        // 检查是否已经注册
        const isRegistered = messaging().isDeviceRegisteredForRemoteMessages;
        log.info('[FCM] iOS: 当前注册状态:', isRegistered ? '已注册' : '未注册');
        
        if (!isRegistered) {
          log.info('[FCM] iOS: 开始注册远程消息...');
          try {
            await messaging().registerDeviceForRemoteMessages();
            log.info('[FCM] iOS: 远程消息注册成功');
          } catch (regError) {
            log.error('[FCM] iOS: 远程消息注册失败:', regError);
            throw regError;
          }
        }
        
        // 再次检查注册状态
        const isRegisteredAfter = messaging().isDeviceRegisteredForRemoteMessages;
        log.info('[FCM] iOS: 注册后状态:', isRegisteredAfter ? '已注册' : '未注册');
      }
      
      log.info('[FCM] 正在获取 Token...');
      const token = await messaging().getToken();
      
      if (token) {
        log.info('[FCM] Token 获取成功');
        log.info('[FCM] Token 长度:', token.length);
        log.info('[FCM] Token 前30字符:', token.substring(0, 30) + '...');
        log.info('[FCM] Token 后30字符:', '...' + token.substring(token.length - 30));
        
        // 保存 token 到本地存储
        await AsyncStorage.setItem('fcmToken', token);
        log.info('[FCM] Token 已保存到本地存储');
      } else {
        log.error('[FCM] Token 获取失败: 返回值为 null');
      }
      
      log.info('[FCM] ========== Token 获取流程结束 ==========');
      
      return token;
    } catch (error) {
      log.error('[FCM] ========== Token 获取出错 ==========');
      log.error('[FCM] 错误类型:', error?.constructor?.name);
      log.error('[FCM] 错误信息:', error);
      
      if (error instanceof Error) {
        log.error('[FCM] 错误详情:', error.message);
        log.error('[FCM] 错误代码:', (error as any).code);
        log.error('[FCM] 错误域:', (error as any).domain);
        log.error('[FCM] 错误堆栈:', error.stack);
      }
      
      log.error('[FCM] ========== 错误信息结束 ==========');
      return null;
    }
  }

  // 检查 token 是否需要刷新
  onTokenRefresh(callback: (token: string) => void): () => void {
    return messaging().onTokenRefresh(async (token) => {
      log.info('FCM Token 已刷新:', token);
      await AsyncStorage.setItem('fcmToken', token);
      callback(token);
    });
  }

  // 处理前台消息
  onMessage(callback: (message: any) => void): () => void {
    return messaging().onMessage(async (remoteMessage) => {
      log.info('[FCM] 收到前台消息:', JSON.stringify(remoteMessage, null, 2));
      
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
      log.info('[FCM] 通过通知打开应用（后台）:', JSON.stringify(remoteMessage, null, 2));
      callback(remoteMessage);
    });
  }

  // 处理通知点击（应用已关闭）
  async getInitialNotification(): Promise<any> {
    const remoteMessage = await messaging().getInitialNotification();
    if (remoteMessage) {
      log.info('[FCM] 通过通知打开应用（已关闭）:', JSON.stringify(remoteMessage, null, 2));
      return remoteMessage;
    }
    return null;
  }

  // 订阅主题
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      log.info(`已订阅主题: ${topic}`);
    } catch (error) {
      log.error(`订阅主题失败 ${topic}:`, error);
    }
  }

  // 取消订阅主题
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      log.info(`已取消订阅主题: ${topic}`);
    } catch (error) {
      log.error(`取消订阅主题失败 ${topic}:`, error);
    }
  }
}

export default NotificationService.getInstance();