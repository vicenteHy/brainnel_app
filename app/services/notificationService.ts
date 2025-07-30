import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

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
  async onTokenRefresh(callback: (token: string) => void): Promise<void> {
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