import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform, Linking, AppState, NativeModules } from 'react-native';
import log from '../utils/logger';
import notificationApi from './api/notification';
import useUserStore from '../store/user';
import { API_BASE_URL } from '../constants/config';
import { t } from '../i18n';
import subscriptionCache from './subscriptionCache';

class NotificationService {
  private static instance: NotificationService;
  private hasRequestedPermission: boolean = false;
  
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
      
      // 防止重复请求
      if (this.hasRequestedPermission) {
        log.info('[权限] 已经请求过权限，跳过重复请求');
        // 返回当前的权限状态
        const currentStatus = await messaging().hasPermission();
        return currentStatus === messaging.AuthorizationStatus.AUTHORIZED ||
               currentStatus === messaging.AuthorizationStatus.PROVISIONAL;
      }
      
      // Android 13+ 需要先请求 POST_NOTIFICATIONS 权限
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const { PermissionsAndroid } = require('react-native');
        
        // 检查是否已有权限
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        
        log.info('[权限] Android POST_NOTIFICATIONS 状态:', hasPermission);
        log.info('[权限] 检查时间:', new Date().toISOString());
        
        if (!hasPermission) {
          // 标记已经请求过权限
          this.hasRequestedPermission = true;
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
        
        // 如果已经有权限，直接返回
        if (currentStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            currentStatus === messaging.AuthorizationStatus.PROVISIONAL) {
          return true;
        }
      }
      
      // 标记已经请求过权限
      this.hasRequestedPermission = true;
      
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
  
  // 重置权限请求状态（用于用户主动请求时）
  async resetPermissionState(): Promise<void> {
    this.hasRequestedPermission = false;
    await AsyncStorage.removeItem('notification_permanently_denied');
    await AsyncStorage.removeItem('notification_denied_count');
    log.info('[权限] 已重置权限请求状态');
  }
  
  // 完整的权限检查和请求流程
  async checkAndRequestPermission(): Promise<boolean> {
    try {
      // 检查是否已经永久拒绝
      const permanentlyDenied = await AsyncStorage.getItem('notification_permanently_denied');
      if (permanentlyDenied === 'true') {
        log.info('[权限] 用户已永久拒绝通知权限，不再自动请求');
        return false;
      }
      
      // 先请求权限（Android 13+ 会弹出系统对话框）
      const hasPermission = await this.requestPermission();
      
      if (!hasPermission) {
        // 记录用户拒绝了权限
        await AsyncStorage.setItem('notification_permission_denied', 'true');
        
        // 检查是否应该标记为永久拒绝
        const deniedCount = await AsyncStorage.getItem('notification_denied_count');
        const newCount = (parseInt(deniedCount || '0') + 1).toString();
        await AsyncStorage.setItem('notification_denied_count', newCount);
        
        // 如果拒绝超过2次，标记为永久拒绝
        if (parseInt(newCount) >= 2) {
          await AsyncStorage.setItem('notification_permanently_denied', 'true');
          log.info('[权限] 用户多次拒绝，标记为永久拒绝');
        }
        
        return false;
      }
      
      // 清除拒绝记录
      await AsyncStorage.removeItem('notification_permission_denied');
      await AsyncStorage.removeItem('notification_denied_count');
      await AsyncStorage.removeItem('notification_permanently_denied');
      
      return true;
    } catch (error) {
      log.error('检查和请求权限失败:', error);
      return false;
    }
  }

  // 检查并更新Token
  async checkAndUpdateToken(): Promise<boolean> {
    try {
      log.info('[FCM] ========== 开始检查Token变化 ==========');
      
      // 获取新token
      const newToken = await this.getToken();
      if (!newToken) {
        log.error('[FCM] 无法获取新Token');
        return false;
      }

      // 获取旧token
      const oldToken = await AsyncStorage.getItem('fcmToken');
      
      log.info('[FCM] Token检查结果:');
      log.info('[FCM] 旧Token:', oldToken || '无旧Token');
      log.info('[FCM] 新Token:', newToken);
      
      // 比较token是否一致
      if (oldToken && oldToken === newToken) {
        log.info('[FCM] ✅ Token一致，无需更新');
        log.info('[FCM] ========== Token检查完成 ==========');
        return true;
      }
      
      // 如果token有变化，调用更新接口
      if (oldToken && oldToken !== newToken) {
        log.info('[FCM] ⚠️ Token已变化，需要更新');
        log.info('[FCM] 开始调用后端更新接口...');
        
        try {
          await notificationApi.updateToken({
            old_token: oldToken,
            new_token: newToken
          });
          log.info('[FCM] ✅ Token更新成功');
          
          // 保存新token
          await AsyncStorage.setItem('fcmToken', newToken);
          log.info('[FCM] ========== Token更新完成 ==========');
          return true;
        } catch (error) {
          log.error('[FCM] ❌ Token更新失败:', error);
          return false;
        }
      }
      
      // 如果没有旧token，也保存新token
      if (!oldToken) {
        log.info('[FCM] 首次获取Token，保存到本地');
        await AsyncStorage.setItem('fcmToken', newToken);
        log.info('[FCM] ========== Token保存完成 ==========');
      }
      
      return true;
    } catch (error) {
      log.error('[FCM] 检查并更新Token失败:', error);
      return false;
    }
  }

  // 从后端获取已订阅的分组列表
  async getSubscribedGroups(): Promise<string[]> {
    try {
      // 先检查缓存是否有效
      if (subscriptionCache.isValid()) {
        const cachedGroups = subscriptionCache.getAll();
        log.info('[FCM] 使用缓存的订阅列表:', cachedGroups);
        log.info('[FCM] 缓存年龄:', Math.floor((subscriptionCache.getAge() || 0) / 1000), '秒');
        return cachedGroups;
      }
      
      log.info('[FCM] 缓存无效或不存在，从后端获取订阅分组列表...');
      
      // 先获取最新的 FCM token
      const fcmToken = await this.getToken();
      if (!fcmToken) {
        log.error('[FCM] 无法获取 FCM token，无法查询订阅列表');
        return [];
      }
      
      log.info('[FCM] 使用 token 查询订阅列表，token:', fcmToken);
      const response = await notificationApi.getSubscriptions(fcmToken);
      
      // 打印完整的响应数据，以便了解数据结构
      log.info('[FCM] 后端原始响应:', response);
      log.info('[FCM] 后端响应类型:', typeof response);
      log.info('[FCM] 后端响应字符串化:', JSON.stringify(response, null, 2));
      
      // 尝试不同的解析路径
      log.info('[FCM] response.data:', response?.data);
      log.info('[FCM] response.group_types:', response?.group_types);
      log.info('[FCM] response.data?.group_types:', response?.data?.group_types);
      
      // 后端返回格式可能是 { data: { group_types: ['all_users'] } } 或 { group_types: ['all_users'] }
      const groups = response?.data?.group_types || response?.group_types || [];
      
      log.info('[FCM] 解析后的订阅分组列表:', groups);
      log.info('[FCM] 订阅分组数量:', groups.length);
      if (groups.length > 0) {
        groups.forEach((group, index) => {
          log.info(`[FCM] 订阅分组[${index}]:`, group);
        });
        // 更新缓存
        subscriptionCache.setCache(groups);
      } else {
        log.info('[FCM] 当前没有任何订阅分组');
        // 即使没有订阅，也更新缓存为空
        subscriptionCache.setCache([]);
      }
      
      return Array.isArray(groups) ? groups : [];
    } catch (error) {
      log.error('[FCM] 从后端获取订阅分组列表失败:', error);
      log.error('[FCM] 错误详情:', JSON.stringify(error, null, 2));
      return [];
    }
  }

  // 检查特定分组的订阅状态（从后端获取）
  async checkGroupSubscription(group: string): Promise<boolean> {
    try {
      log.info(`[FCM] ========== 检查分组 "${group}" 订阅状态 ==========`);
      
      const groups = await this.getSubscribedGroups();
      const isSubscribed = groups.includes(group);
      
      log.info(`[FCM] 分组 "${group}" 订阅状态:`, isSubscribed ? '✅ 已订阅' : '❌ 未订阅');
      log.info('[FCM] 当前所有已订阅分组:', JSON.stringify(groups));
      log.info('[FCM] 已订阅分组数量:', groups.length);
      
      return isSubscribed;
    } catch (error) {
      log.error('[FCM] 检查分组订阅状态失败:', error);
      log.error('[FCM] 错误详情:', JSON.stringify(error, null, 2));
      return false;
    }
  }

  // 检查订阅状态（检查all_users分组）
  async checkSubscriptionStatus(): Promise<boolean> {
    return await this.checkGroupSubscription('all_users');
  }

  // 完整的初始化和检查流程
  async initializeAndCheck(): Promise<{
    hasPermission: boolean;
    isSubscribed: boolean;
    tokenUpdated: boolean;
    needsPermissionPrompt: boolean;
  }> {
    const result = {
      hasPermission: false,
      isSubscribed: false,
      tokenUpdated: false,
      needsPermissionPrompt: false
    };

    try {
      // 1. 检查权限
      const hasPermission = await this.requestPermission();
      result.hasPermission = hasPermission;
      
      if (!hasPermission) {
        // 检查是否已经拒绝过
        const deniedBefore = await AsyncStorage.getItem('notification_permission_denied');
        if (deniedBefore === 'true') {
          result.needsPermissionPrompt = true;
        }
        return result;
      }
      
      // 2. 检查并更新Token
      result.tokenUpdated = await this.checkAndUpdateToken();
      
      // 3. 检查all_users分组订阅状态
      result.isSubscribed = await this.checkGroupSubscription('all_users');
      
      // 4. 如果未订阅all_users，重新订阅
      if (!result.isSubscribed) {
        await this.subscribeToTopic('all_users');
        result.isSubscribed = true;
      }
      
      return result;
    } catch (error) {
      log.error('[FCM] 初始化和检查失败:', error);
      return result;
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
        log.info('[FCM] 完整 Token:', token);
        
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
      // 获取当前的 FCM token
      const token = await this.getToken();
      if (!token) {
        log.error(`订阅主题失败: 无法获取 FCM token`);
        return;
      }

      log.info(`[订阅主题] 准备订阅 topic: ${topic}, token: ${token}`);
      
      // 获取当前用户ID（如果已登录）
      const currentUser = useUserStore.getState().user;
      const userId = currentUser?.user_id;
      
      // 获取设备ID - 使用与埋点相同的device_id
      let deviceId = await AsyncStorage.getItem('analytics_device_id');
      if (!deviceId) {
        // 如果没有，生成一个新的（与埋点保持一致的格式）
        deviceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('analytics_device_id', deviceId);
      }
      
      log.info(`[订阅主题] API Base URL: ${API_BASE_URL}`);
      log.info(`[订阅主题] 完整请求 URL: ${API_BASE_URL}/api/notification-groups/assign-group`);
      log.info(`[订阅主题] 用户ID: ${userId || '未登录'}, 设备ID: ${deviceId}`);
      
      // 构建请求参数
      const params: any = {
        token: token,
        type: topic, // 比如 'all_users'
        device_id: deviceId
      };
      
      // 如果用户已登录，添加 user_id
      if (userId) {
        params.user_id = userId;
      }
      
      await notificationApi.assignGroup(params);
      
      // 订阅成功后，更新缓存
      subscriptionCache.add(topic);
      
      log.info(`已通过后端订阅主题: ${topic}`);
      log.info(`订阅信息 - Token: ${token}, UserId: ${userId || '未登录'}, Topic: ${topic}`);
    } catch (error) {
      log.error(`订阅主题失败 ${topic}:`, error);
    }
  }

  // 取消订阅主题
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      // 注意：后端的取消订阅应该在 logoutUnsubscribe 中处理
      // 这里只是本地 Firebase 的取消订阅
      await messaging().unsubscribeFromTopic(topic);
      
      // 从缓存中移除
      subscriptionCache.remove(topic);
      
      log.info(`已取消订阅主题: ${topic}`);
    } catch (error) {
      log.error(`取消订阅主题失败 ${topic}:`, error);
    }
  }

  // 清除所有订阅（用于登出时）
  async clearAllSubscriptions(): Promise<void> {
    try {
      log.info('[FCM] ========== 开始清除所有订阅 ==========');
      
      // 获取当前用户ID
      const currentUser = useUserStore.getState().user;
      const userId = currentUser?.user_id;
      log.info('[FCM] 当前用户信息:', { userId, userName: currentUser?.name });
      
      if (userId) {
        // 调用后端API取消所有订阅
        log.info('[FCM] 调用后端API取消用户订阅, userId:', userId);
        try {
          const response = await notificationApi.logoutUnsubscribe(userId);
          log.info('[FCM] 后端取消订阅响应:', JSON.stringify(response, null, 2));
          log.info('[FCM] 后端取消订阅成功');
        } catch (apiError) {
          log.error('[FCM] 后端取消订阅失败:', apiError);
          log.error('[FCM] API错误详情:', JSON.stringify(apiError, null, 2));
        }
      } else {
        log.warn('[FCM] 没有用户ID，跳过后端取消订阅');
      }
      
      // 获取当前订阅的分组（从后端）
      log.info('[FCM] 获取取消后的订阅列表，验证是否已清空...');
      const groups = await this.getSubscribedGroups();
      log.info('[FCM] 取消后仍存在的订阅分组:', groups);
      
      // 本地Firebase取消所有分组的订阅
      if (groups.length > 0) {
        log.info('[FCM] 开始本地Firebase取消订阅...');
        for (const group of groups) {
          try {
            await messaging().unsubscribeFromTopic(group);
            log.info(`[FCM] 本地取消订阅分组成功: ${group}`);
          } catch (error) {
            log.error(`[FCM] 本地取消订阅分组 ${group} 失败:`, error);
          }
        }
      } else {
        log.info('[FCM] 没有需要本地取消的订阅分组');
      }
      
      // 清空缓存
      subscriptionCache.clear();
      
      log.info('[FCM] ========== 清除所有订阅完成 ==========');
    } catch (error) {
      log.error('[FCM] 清除所有订阅失败:', error);
      log.error('[FCM] 错误堆栈:', error.stack);
    }
  }

  // 获取当前所有订阅的分组
  async getAllSubscribedGroups(): Promise<string[]> {
    return await this.getSubscribedGroups();
  }
}

export default NotificationService.getInstance();