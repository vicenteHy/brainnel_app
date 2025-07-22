import "react-native-gesture-handler";
import React from "react";
import { useEffect, useState, useRef } from "react";
import { userApi } from "./app/services/api/userApi";
import useUserStore from "./app/store/user";
import { settingApi } from "./app/services/api/setting";
import { checkAndCreateUserSettings } from "./app/utils/userSettingsUtils";
import useActivityStore from "./app/store/activityStore";
import { AuthProvider, useAuth, AUTH_EVENTS } from "./app/contexts/AuthContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppNavigator, navigationRef } from "./app/navigation/AppNavigator";
import { View, ActivityIndicator, Alert, Text, Image, Animated, AppState } from "react-native";
import { BoostSuccessModal, BoostedSuccessModal, SpinWheelModal, WinningModal } from "./app/screens/activity";
import { getActivityStatus } from "./app/services/api/activity";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "./app/i18n";
import * as Linking from "expo-linking";
import { EventEmitter } from 'events';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StackActions } from '@react-navigation/native';
import LanguageSelectionScreen, { checkLanguageSelected } from "./app/screens/LanguageSelectionScreen";
import  useAnalyticsStore  from "./app/store/analytics";
import { preloadService } from "./app/services/preloadService";
import { useVersionCheck } from "./app/hooks/useVersionCheck";
import { UpdateModal } from "./app/components/UpdateModal";
import { UpdateType } from "./app/utils/versionUtils";
import Constants from 'expo-constants';
import { initializeFacebookSDK, extractAndSaveFbclid } from "./app/services/facebook-events";
import websocketService from "./app/services/websocketService";
import { DeviceFingerprintCollector } from "./app/utils/deviceFingerprint";
import { useModalQueue } from "./app/hooks/useModalQueue";
import { ModalType, ModalPriority } from "./app/utils/modalQueueManager";
type RootStackParamList = {
  Login: undefined;
  EmailLogin: undefined;
  MainTabs: { screen: string };
  Google: undefined;
  Home: { screen: string };
};

// 声明全局事件发射器类型
declare global {
  var EventEmitter: EventEmitter;
}

// 创建全局事件发射器
if (!global.EventEmitter) {
  global.EventEmitter = new EventEmitter();
}

// 定义全局事件处理支付成功
import { PAYMENT_SUCCESS_EVENT, PAYMENT_FAILURE_EVENT } from "./app/constants/events";

function AppContent() {
  const analyticsData = useAnalyticsStore();
  const userStore = useUserStore();
  const { setUser } = userStore;
  
  // 使用弹窗队列管理各个弹窗
  const boostModal = useModalQueue({
    modalId: 'boost-success',
    modalType: ModalType.BOOST_SUCCESS,
    priority: ModalPriority.URGENT, // 助力弹窗也设为最高优先级
    canInterrupt: false, // 助力弹窗不可被中断
  });
  
  const boostedModal = useModalQueue({
    modalId: 'boosted-success',
    modalType: ModalType.BOOSTED_SUCCESS,
    priority: ModalPriority.URGENT, // 被助力弹窗也设为最高优先级
    canInterrupt: false, // 被助力弹窗不可被中断
  });
  
  const spinWheelModal = useModalQueue({
    modalId: 'spin-wheel',
    modalType: ModalType.SPIN_WHEEL,
    priority: ModalPriority.MEDIUM,
    canInterrupt: true, // 转盘弹窗可被中断
  });
  
  const winningModal = useModalQueue({
    modalId: 'winning',
    modalType: ModalType.WINNING,
    priority: ModalPriority.LOW,
    canInterrupt: true, // 中奖弹窗可被中断
  });
  
  // 旧的状态保留用于数据传递
  const [boostedUserId, setBoostedUserId] = useState<string>('');
  const [isAlreadyBoosted, setIsAlreadyBoosted] = useState(false);
  
  const { login, logout } = useAuth();
  const appStateRef = useRef(AppState.currentState);
  const [isLoading, setIsLoading] = useState(true);
  const [languageSelected, setLanguageSelected] = useState<boolean>(false);
  const [checkingLanguage, setCheckingLanguage] = useState(true);
  
  // 版本检查
  const currentVersion = Constants.expoConfig?.version || '5.0.0';
  const { updateType, versionInfo, isChecking } = useVersionCheck({
    currentVersion,
    checkOnMount: true,
  });
  
  // 版本更新弹窗显示状态
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  
  // 强制更新状态 - 用于确保强制更新弹窗持久显示
  const [hasForceUpdate, setHasForceUpdate] = useState(false);
  
  // 开屏动画时间控制
  const splashStartTime = useRef<number>(Date.now());
  const [splashMinTimeElapsed, setSplashMinTimeElapsed] = useState(false);
  const SPLASH_MIN_DURATION = 2500; // 2.5秒
  
  // Logo动画
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  
  // 开屏时间监控
  const appStartTime = useRef(Date.now());
  const [splashDuration, setSplashDuration] = useState(0);
  

  // 获取用户资料的函数
  const fetchUserProfile = async () => {
    try {
      console.log('[App] 开始获取用户资料...');
      const user = await userApi.getProfile();
      console.log('[App] 获取到的用户资料:', user);
      
      setUser(user);
      
      // 等待一下确保状态更新
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 验证状态是否正确更新
      const updatedUser = useUserStore.getState().user;
      console.log('[App] 更新后的 userStore.user:', updatedUser);
      
      // 获取用户资料成功后，检查并创建用户设置
      await checkAndCreateUserSettings();
      
      // 获取活动任务状态
      const activityStore = useActivityStore.getState();
      await activityStore.fetchTasks();
      console.log('[App] 活动任务状态已加载');
      
      return true;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return false;
    }
  };

  // 开屏动画最小时长控制
  useEffect(() => {
    // 启动logo动画
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();

    const timer = setTimeout(() => {
      setSplashMinTimeElapsed(true);
    }, SPLASH_MIN_DURATION);

    return () => clearTimeout(timer);
  }, []);

  // 检查语言选择状态
  useEffect(() => {
    const checkLanguage = async () => {
      try {
        const isLanguageSelected = await checkLanguageSelected();
        setLanguageSelected(isLanguageSelected);
      } catch (error) {
        console.error('Error checking language selection:', error);
        setLanguageSelected(false);
      } finally {
        setCheckingLanguage(false);
      }
    };

    checkLanguage();
  }, []);

  // 获取本地用户ID的函数
  const getLocalUserId = async (): Promise<string | undefined> => {
    try {
      // 方法1: 从当前store获取
      const currentUser = useUserStore.getState().user;
      if (currentUser?.user_id) {
        return currentUser.user_id.toString();
      }

      // 方法2: 从AsyncStorage获取保存的用户ID
      const savedUserId = await AsyncStorage.getItem('user_id');
      if (savedUserId) {
        return savedUserId;
      }

      // 方法3: 从AsyncStorage获取token，如果有token说明用户已登录
      const authToken = await AsyncStorage.getItem('token');
      if (authToken) {
        // 可以在这里尝试从token中解析用户ID，或者返回一个特殊标识
        // 暂时返回undefined，让预加载使用通用推荐
      }

      return undefined;
    } catch (error) {
      return undefined;
    }
  };

  // 应用初始化（只执行一次）
  useEffect(() => {
    // 只有在语言检查完成且用户已选择语言后才初始化应用
    if (!checkingLanguage && languageSelected) {
      const initApp = async () => {
        try {
          // 直接使用本地用户ID开始预加载
          const localUserId = await getLocalUserId();
          
          // 使用本地用户ID开始预加载，如果没有就按未登录情况加载
          preloadService.startPreloading(localUserId).catch(error => {
          });
          
          // 初始化 Facebook SDK（Install 事件会自动上报）
          initializeFacebookSDK()
            .then(() => {
              console.log('[App] Facebook SDK initialized successfully');
              // 延迟 2 秒后检查 SDK 状态
              setTimeout(async () => {
                const { checkFacebookSDKStatus } = await import('./app/services/facebook-events');
                await checkFacebookSDKStatus();
              }, 2000);
            })
            .catch(error => {
              console.error('[App] Failed to initialize Facebook SDK:', error);
            });
          
          // 初始化 WebSocket 连接
          websocketService.connect().catch(error => {
            console.error('[App] Failed to establish WebSocket connection:', error);
          });
          
          // 设置 WebSocket 消息处理器
          websocketService.onMessage((data) => {
            console.log('[App] 处理 WebSocket 消息:', data);
            
            // 处理 invitation 类型的消息 - 被别人助力
            if (data.type === 'invitation' && data.invitee_name) {
              console.log('[App] 收到被助力成功消息，显示 BoostedSuccessModal');
              setBoostedUserId(data.invitee_name);
              setIsAlreadyBoosted(false); // 这是成功助力的消息
              // 使用弹窗队列显示被助力弹窗
              boostedModal.showModal({
                userId: data.invitee_name,
                isAlreadyBoosted: false
              });
            }
          });
          
          // 采集设备信息
          // 延迟执行，避免启动时的模块加载问题
          setTimeout(() => {
            // 采集简化的设备信息
            DeviceFingerprintCollector.collectSimpleDeviceInfo()
              .then(deviceInfo => {
                console.log('[App] 设备信息采集成功:');
                
                // 打印简化的设备信息
                DeviceFingerprintCollector.printSimpleDeviceInfo(deviceInfo);
              })
              .catch(error => {
                console.error('[App] 设备信息采集失败:', error);
                // 不影响应用正常运行
              });
          }, 3000); // 延迟3秒执行
          
          // 并行获取用户资料（不影响预加载）
          fetchUserProfile().then(async (success) => {
            // 在用户信息加载完成后发送 app_launch 事件
            analyticsData.logAppLaunch(1);
            
            if (success) {
              const store = useUserStore.getState();
              const networkUserId = store.user?.user_id?.toString();
              
              // 保存用户ID到本地存储
              if (networkUserId) {
                try {
                  await AsyncStorage.setItem('user_id', networkUserId);
                } catch (error) {
                }
              }
              
              // 检查是否有待处理的助力（应用初始化时）
              try {
                const referrerId = await AsyncStorage.getItem('referrer_id');
                if (referrerId) {
                  console.log('应用初始化时发现待处理的referrer_id:', referrerId);
                  
                  // 检查用户是否已登录
                  const authToken = await AsyncStorage.getItem('token');
                  if (authToken) {
                    console.log('用户已登录，执行助力');
                    try {
                      const { assist } = await import('./app/services/api/activity');
                      // 获取设备指纹哈希
                      const deviceInfo = await DeviceFingerprintCollector.collectSimpleDeviceInfo();
                      const result = await assist(parseInt(referrerId), deviceInfo.fingerprintHash);
                      
                      // 根据返回结果显示不同的弹窗内容
                      setBoostedUserId(referrerId);
                      setIsAlreadyBoosted(!result.success); // 如果 success 为 false，说明已经助力过
                      // 使用弹窗队列显示助力弹窗
                      boostModal.showModal({
                        userId: referrerId,
                        isAlreadyBoosted: !result.success
                      });
                      
                      // 设置标记，表示用户是通过邀请链接进入的
                      await AsyncStorage.setItem('entered_via_invite', 'true');
                      
                      // 助力成功后清除referrer_id
                      await AsyncStorage.removeItem('referrer_id');
                    } catch (error) {
                      console.error('助力失败:', error);
                      Alert.alert('Échec', 'Le boost a échoué, veuillez réessayer plus tard');
                    }
                  } else {
                    console.log('用户未登录，保留referrer_id等待登录后处理');
                  }
                }
              } catch (error) {
                console.error('检查待处理助力失败:', error);
              }
            }
          }).catch(error => {
          });
          
        } catch (error) {
          console.error('App initialization error:', error);
        }
      };
      
      initApp();
    }

    
  }, [checkingLanguage, languageSelected]);

  // 版本检查完成后显示更新弹窗
  useEffect(() => {
    if (!isChecking && versionInfo && updateType !== UpdateType.NO_UPDATE) {
      setShowUpdateModal(true);
      
      // 如果是强制更新，记录状态
      if (updateType === UpdateType.FORCE_UPDATE) {
        setHasForceUpdate(true);
      }
    } else {
    }
  }, [isChecking, versionInfo, updateType]);

  // 控制加载屏幕显示（独立的useEffect）
  useEffect(() => {
    if (!checkingLanguage && languageSelected && splashMinTimeElapsed) {
      setIsLoading(false);
    }
  }, [checkingLanguage, languageSelected, splashMinTimeElapsed]);

  // 监听登录成功事件，刷新用户资料
  useEffect(() => {
    console.log('[App] 设置登录成功事件监听器');
    console.log('[App] global.EventEmitter 存在:', !!global.EventEmitter);
    console.log('[App] AUTH_EVENTS.LOGIN_SUCCESS:', AUTH_EVENTS.LOGIN_SUCCESS);
    
    const handleLoginSuccess = async () => {
      console.log('[App] 收到登录成功事件！');
      const success = await fetchUserProfile();
      console.log('[App] fetchUserProfile 结果:', success);
      
      // 登录成功后，获取任务状态
      const activityStore = useActivityStore.getState();
      await activityStore.fetchTasks();
      console.log('[App] 登录成功后，活动任务状态已更新');
      
      // 登录成功后，重新预加载推荐产品（使用用户ID）
      console.log('[App] success:', success);
      console.log('[App] userStore.user:', userStore.user);
      console.log('[App] userStore.user?.user_id:', userStore.user?.user_id);
      
      // 重新获取最新的用户状态
      const latestUserState = useUserStore.getState();
      const latestUser = latestUserState.user;
      console.log('[App] 重新获取的 user:', latestUser);
      
      if (success && latestUser?.user_id) {
        const userId = latestUser.user_id.toString();
        
        // 保存用户ID到本地存储
        try {
          await AsyncStorage.setItem('user_id', userId);
        } catch (error) {
        }
        
        preloadService.clearCache().then(() => {
          preloadService.startPreloading(userId);
        });
        
        // 重新连接 WebSocket
        console.log('[App] 准备重新连接 WebSocket');
        console.log('[App] 当前 WebSocket 连接状态:', websocketService.isConnected());
        websocketService.disconnect();
        console.log('[App] WebSocket 已断开，准备重新连接');
        
        // 延迟一下再连接，确保断开完成
        setTimeout(() => {
          console.log('[App] 开始连接 WebSocket...');
          websocketService.connect().then(() => {
            console.log('[App] WebSocket 重新连接成功');
          }).catch(error => {
            console.error('[App] Failed to reconnect WebSocket after login:', error);
          });
        }, 100);
      }
      
      // 检查是否有待处理的助力
      try {
        const referrerId = await AsyncStorage.getItem('referrer_id');
        if (referrerId) {
          console.log('登录成功，处理待助力的referrer_id:', referrerId);
          
          try {
            const { assist } = await import('./app/services/api/activity');
            // 获取设备指纹哈希
            const deviceInfo = await DeviceFingerprintCollector.collectSimpleDeviceInfo();
            const result = await assist(parseInt(referrerId), deviceInfo.fingerprintHash);
            
            // 根据返回结果显示不同的弹窗内容
            setBoostedUserId(referrerId);
            setIsAlreadyBoosted(!result.success); // 如果 success 为 false，说明已经助力过
            // 使用弹窗队列显示助力弹窗
            boostModal.showModal({
              userId: referrerId,
              isAlreadyBoosted: !result.success
            });
            
            // 设置标记，表示用户是通过邀请链接进入的
            await AsyncStorage.setItem('entered_via_invite', 'true');
            
            // 助力成功后清除referrer_id
            await AsyncStorage.removeItem('referrer_id');
          } catch (error) {
            console.error('助力失败:', error);
            Alert.alert('Échec', 'Le boost a échoué, veuillez réessayer plus tard');
          }
        }
      } catch (error) {
        console.error('检查待处理助力失败:', error);
      }
    };

    // 注册事件监听器
    global.EventEmitter.on(AUTH_EVENTS.LOGIN_SUCCESS, handleLoginSuccess);

    // 清理函数
    return () => {
      global.EventEmitter.off(AUTH_EVENTS.LOGIN_SUCCESS, handleLoginSuccess);
    };
  }, [userStore.user?.user_id]);

  // 添加深度链接处理
  useEffect(() => {
    // 处理深度链接
    const handleDeepLink = ({ url }: { url: string }) => {
      console.log('Deep link received:', url);
      
      // 提取并保存 fbclid（如果存在）
      extractAndSaveFbclid(url);
      
      // 处理活动邀请深度链接
      if (url.includes("/activity/invite")) {
        console.log('Activity invite deep link detected:', url);
        
        // 解析URL参数
        const urlParts = url.split('?');
        const queryParams = new URLSearchParams(urlParts[1] || '');
        const userId = queryParams.get('user_id');
        
        if (userId) {
          console.log('Invite from user_id:', userId);
          
          // 保存邀请者ID到AsyncStorage
          AsyncStorage.setItem('referrer_id', userId).then(async () => {
            console.log('Saved referrer_id:', userId);
            
            // 设置标记，表示用户是通过邀请链接进入的
            await AsyncStorage.setItem('entered_via_invite', 'true');
            
            // 检查用户是否已登录
            const authToken = await AsyncStorage.getItem('token');
            const currentUser = useUserStore.getState().user;
            
            // 优先信任 authToken，因为它是持久化的登录状态
            if (authToken) {
              // 用户已登录，延迟执行助力以确保应用状态完全恢复
              console.log('检测到 authToken，用户已登录，准备执行助力');
              
              // 添加延迟，确保应用从后台恢复到正常状态
              setTimeout(async () => {
                try {
                  // 确保应用在前台活跃状态
                  if (appStateRef.current !== 'active') {
                    console.log('应用不在活跃状态，等待应用恢复到前台');
                    // 监听应用状态变化，等待应用回到前台
                    const waitForActive = () => {
                      return new Promise((resolve) => {
                        const checkState = () => {
                          if (appStateRef.current === 'active') {
                            resolve(true);
                          } else {
                            setTimeout(checkState, 100);
                          }
                        };
                        checkState();
                      });
                    };
                    await waitForActive();
                  }
                  
                  // 重新获取最新的用户状态
                  const latestUser = useUserStore.getState().user;
                  if (!latestUser || !latestUser.user_id) {
                    console.log('用户状态未恢复，尝试重新获取用户信息');
                    const userProfileSuccess = await fetchUserProfile();
                    if (!userProfileSuccess) {
                      console.log('获取用户信息失败，但仍尝试执行助力（API会验证token）');
                      // 即使无法获取用户信息，仍然尝试执行助力
                      // 因为 API 端会通过 token 验证用户身份
                    }
                  }
                  
                  const { assist } = await import('./app/services/api/activity');
                  // 获取设备指纹哈希
                  const deviceInfo = await DeviceFingerprintCollector.collectSimpleDeviceInfo();
                  const result = await assist(parseInt(userId), deviceInfo.fingerprintHash);
                  
                  // 根据返回结果显示不同的弹窗内容
                  setBoostedUserId(userId);
                  setIsAlreadyBoosted(!result.success); // 如果 success 为 false，说明已经助力过
                  // 使用弹窗队列显示助力弹窗
                  boostModal.showModal({
                    userId: userId,
                    isAlreadyBoosted: !result.success
                  });
                  
                  // 设置标记，表示用户是通过邀请链接进入的
                  await AsyncStorage.setItem('entered_via_invite', 'true');
                  
                  // 助力成功后清除referrer_id
                  await AsyncStorage.removeItem('referrer_id');
                } catch (error) {
                  console.error('助力失败:', error);
                  Alert.alert('Échec', 'Le boost a échoué, veuillez réessayer plus tard');
                }
              }, 1000); // 延迟1秒执行，确保应用状态完全恢复
            } else {
              // 用户未登录，保存referrer_id等待登录后处理
              console.log('用户未登录，等待登录后助力');
            }
          }).catch(error => {
            console.error('Failed to save referrer_id:', error);
          });
        }
        return;
      }
      
      // 处理 payment-polling 深度链接
      if (
        url.includes("com.brainnel.app://payment-polling") ||
        url.includes("myapp://payment-polling") ||
        url.includes("exp://") && url.includes("/payment-polling")
      ) {
        console.log('Payment polling deep link detected, staying on current screen');
        // 不做任何导航，保持在当前页面
        return;
      }
      
      if (
        url.startsWith("myapp://payment-success") ||
        url.startsWith("exp://192.168.0.101:8084/--/payment-success")
      ) {
        // 解析参数
        const parsed = Linking.parse(url);
        const params = parsed.queryParams || {};
        const paymentId = params.paymentId || "";
        const token = params.token || "";
        const payerId = params.PayerID || "";

        console.log('Payment success params:', { paymentId, token, payerId });

        // 发送支付成功事件，让当前页面处理
        global.EventEmitter.emit(PAYMENT_SUCCESS_EVENT, {
          paymentId,
          token,
          payerId,
          url
        });

        // 不再强制跳转到MainTabs，让当前页面决定如何处理
        return;
      }

      if (
        url.startsWith("myapp://payment-failure") ||
        url.startsWith("exp://192.168.0.101:8084/--/payment-failure")
      ) {
        // 解析参数
        const parsed = Linking.parse(url);
        const params = parsed.queryParams || {};
        const error = params.error || "";

        console.log('Payment failure params:', { error });

        // 发送支付失败事件
        global.EventEmitter.emit(PAYMENT_FAILURE_EVENT, {
          error,
          url
        });

        return;
      }

      // 只有在非支付相关的深度链接时才跳转到MainTabs
      if (!url.includes('payment-success') && 
          !url.includes('payment-failure') && 
          !url.includes('payment-polling')) {
        // 检查导航器是否已准备好
        if (navigationRef.isReady()) {
          navigationRef.navigate("MainTabs");
        } else {
          // 如果导航器还未准备好，延迟执行导航
          setTimeout(() => {
            if (navigationRef.isReady()) {
              navigationRef.navigate("MainTabs");
            }
          }, 100);
        }
      }
    };

    // 注册深度链接监听器
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // 处理应用冷启动的深度链接
    Linking.getInitialURL().then((url) => {
      console.log(url);
      if (url) {
        // 立即提取 fbclid（不需要等待导航器）
        extractAndSaveFbclid(url);
        
        // 延迟处理导航，确保导航器已准备好
        setTimeout(() => {
          handleDeepLink({ url });
        }, 500);
      }
    });

    return () => subscription.remove();
  }, []);

  // 处理语言选择完成
  const handleLanguageSelected = () => {
    setLanguageSelected(true);
  };

  // 处理 JOUER 按钮点击 - BoostSuccessModal (主动助力别人)
  const handleBoostJouerPress = async () => {
    // 延迟一点时间确保 BoostSuccessModal 关闭动画完成
    setTimeout(async () => {
      try {
        console.log('[App] 检查活动状态...');
        const statusData = await getActivityStatus();
        console.log('[App] 活动状态返回:', statusData);
        
        const currentRewardAmount = parseFloat(statusData.current_reward_amount) || 0;
        console.log('[App] 用户累积金额:', currentRewardAmount);
        
        if (currentRewardAmount < 4000) {
          console.log('[App] 累积金额小于4000，显示转盘弹窗');
          spinWheelModal.showModal();
        } else {
          console.log('[App] 累积金额大于等于4000，跳转到挖矿页面');
          if (navigationRef.isReady()) {
            navigationRef.navigate('MiningGameScreen');
          }
        }
      } catch (error: any) {
        console.log('[App] 获取活动状态错误:', error);
        
        if (error?.response?.status === 404 || error?.status === 404) {
          console.log('[App] 用户未参加活动，显示转盘弹窗');
          spinWheelModal.showModal();
        } else {
          console.error('[App] 获取活动状态失败:', error);
          // 默认跳转到挖矿页面
          if (navigationRef.isReady()) {
            navigationRef.navigate('MiningGameScreen');
          }
        }
      }
    }, 300);
  };

  // 处理 JOUER 按钮点击 - BoostedSuccessModal (被别人助力)
  const handleBoostedJouerPress = async () => {
    // 延迟一点时间确保 BoostedSuccessModal 关闭动画完成
    setTimeout(async () => {
      try {
        console.log('[App] 检查活动状态...');
        const statusData = await getActivityStatus();
        console.log('[App] 活动状态返回:', statusData);
        
        const currentRewardAmount = parseFloat(statusData.current_reward_amount) || 0;
        console.log('[App] 用户累积金额:', currentRewardAmount);
        
        if (currentRewardAmount < 4000) {
          console.log('[App] 累积金额小于4000，显示转盘弹窗');
          spinWheelModal.showModal();
        } else {
          console.log('[App] 累积金额大于等于4000，跳转到挖矿页面');
          if (navigationRef.isReady()) {
            // 获取当前路由
            const currentRoute = navigationRef.current?.getCurrentRoute();
            if (currentRoute?.name === 'MiningGameScreen') {
              // 如果当前已经在挖矿页面，使用 replace 重新加载
              console.log('[App] 当前在挖矿页面，使用 replace 重新加载');
              navigationRef.current?.dispatch(
                StackActions.replace('MiningGameScreen')
              );
            } else {
              // 否则正常导航
              navigationRef.navigate('MiningGameScreen');
            }
          }
        }
      } catch (error: any) {
        console.log('[App] 获取活动状态错误:', error);
        
        if (error?.response?.status === 404 || error?.status === 404) {
          console.log('[App] 用户未参加活动，显示转盘弹窗');
          spinWheelModal.showModal();
        } else {
          console.error('[App] 获取活动状态失败:', error);
          // 默认跳转到挖矿页面
          if (navigationRef.isReady()) {
            const currentRoute = navigationRef.current?.getCurrentRoute();
            if (currentRoute?.name === 'MiningGameScreen') {
              navigationRef.current?.dispatch(
                StackActions.replace('MiningGameScreen')
              );
            } else {
              navigationRef.navigate('MiningGameScreen');
            }
          }
        }
      }
    }, 300);
  };

  // 处理转盘中奖
  const handleSpinWin = (amount: number) => {
    console.log('[App] 转盘中奖金额:', amount);
    spinWheelModal.closeModal();
    // 延迟一点时间再显示中奖弹窗，确保转盘弹窗已关闭
    setTimeout(() => {
      winningModal.showModal({ amount });
    }, 300);
  };

  // 处理中奖弹窗继续按钮
  const handleWinningContinue = () => {
    winningModal.closeModal();
    if (navigationRef.isReady()) {
      navigationRef.navigate('MiningGameScreen');
    }
  };

  // 监听应用状态变化，确保强制更新弹窗持久显示
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      // 更新应用状态引用
      appStateRef.current = nextAppState;
      
      // 如果应用重新激活且存在强制更新
      if (nextAppState === 'active' && hasForceUpdate) {
        setShowUpdateModal(true);
      }
      
      // 处理 WebSocket 连接
      if (nextAppState === 'active') {
        // 应用回到前台，检查并重新连接 WebSocket
        if (!websocketService.isConnected()) {
          console.log('[App] 应用回到前台，重新连接 WebSocket');
          websocketService.connect().catch(error => {
            console.error('[App] Failed to reconnect WebSocket on app active:', error);
          });
        }
      } else if (nextAppState === 'background') {
        // 应用进入后台，断开 WebSocket 连接
        console.log('[App] 应用进入后台，断开 WebSocket');
        websocketService.disconnect();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => subscription?.remove();
  }, [hasForceUpdate]);

  // 处理版本更新
  const handleUpdate = () => {
    // 注意：强制更新时不关闭弹窗，因为用户可能从应用商店返回而没有更新
    if (updateType !== UpdateType.FORCE_UPDATE) {
      setShowUpdateModal(false);
    }
  };

  // 处理关闭更新弹窗（仅非强制更新）
  const handleCloseUpdate = () => {
    if (updateType !== UpdateType.FORCE_UPDATE) {
      setShowUpdateModal(false);
    }
  };

  // 如果还在检查语言状态，显示加载界面
  if (checkingLanguage) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  // 如果用户还没有选择语言，显示语言选择屏幕
  if (!languageSelected) {
    return <LanguageSelectionScreen onLanguageSelected={handleLanguageSelected} />;
  }

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center", 
        backgroundColor: "#ffffff" 
      }}>
        <Animated.View style={{
          transform: [{ scale: logoScale }],
          opacity: logoOpacity,
        }}>
          <Image
            source={require("./assets/logo/launch.png")}
            style={{
              width: 600,
              height: 800,
              resizeMode: "contain",
            }}
          />
        </Animated.View>
      </View>
    );
  }

  console.log('[App] 准备渲染 AppNavigator');
  console.log('[App] isLoading:', isLoading);
  console.log('[App] languageSelected:', languageSelected);
  
  return (
    <>
      <AppNavigator />
      {versionInfo && (
        <UpdateModal
          visible={showUpdateModal || hasForceUpdate}
          updateType={updateType}
          message={versionInfo.update_message}
          messageEn={versionInfo.update_message_en}
          linkUrl={versionInfo.link_url}
          onUpdate={handleUpdate}
          onClose={updateType !== UpdateType.FORCE_UPDATE ? handleCloseUpdate : undefined}
        />
      )}
      <BoostSuccessModal
        visible={boostModal.visible}
        onClose={boostModal.closeModal}
        userId={boostModal.modalData?.userId || boostedUserId}
        isAlreadyBoosted={boostModal.modalData?.isAlreadyBoosted || isAlreadyBoosted}
        onJouerPress={handleBoostJouerPress}
      />
      
      <BoostedSuccessModal
        visible={boostedModal.visible}
        onClose={boostedModal.closeModal}
        userId={boostedModal.modalData?.userId || boostedUserId}
        isAlreadyBoosted={boostedModal.modalData?.isAlreadyBoosted || isAlreadyBoosted}
        onJouerPress={handleBoostedJouerPress}
      />
      
      <SpinWheelModal
        visible={spinWheelModal.visible}
        onClose={spinWheelModal.closeModal}
        onSpinPress={() => {}}
        onWin={handleSpinWin}
      />
      
      <WinningModal
        visible={winningModal.visible}
        onClose={winningModal.closeModal}
        onContinue={handleWinningContinue}
      />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
