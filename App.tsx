import "react-native-gesture-handler";
import React from "react";
import { useEffect, useState, useRef } from "react";
import { userApi } from "./app/services/api/userApi";
import useUserStore from "./app/store/user";
import { AuthProvider, useAuth, AUTH_EVENTS } from "./app/contexts/AuthContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppNavigator, navigationRef } from "./app/navigation/AppNavigator";
import { View, ActivityIndicator, Alert, Text, Image, Animated, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "./app/i18n";
import * as Linking from "expo-linking";
import { EventEmitter } from 'events';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import LanguageSelectionScreen, { checkLanguageSelected } from "./app/screens/LanguageSelectionScreen";
import  useAnalyticsStore  from "./app/store/analytics";
import { preloadService } from "./app/services/preloadService";
import { useVersionCheck } from "./app/hooks/useVersionCheck";
import { UpdateModal } from "./app/components/UpdateModal";
import { UpdateType } from "./app/utils/versionUtils";
import Constants from 'expo-constants';
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
  const { login, logout } = useAuth();
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
      const user = await userApi.getProfile();
      setUser(user);
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
        console.log('[App] 从本地存储获取到用户ID:', savedUserId);
        return savedUserId;
      }

      // 方法3: 从AsyncStorage获取token，如果有token说明用户已登录
      const authToken = await AsyncStorage.getItem('auth_token');
      if (authToken) {
        console.log('[App] 检测到auth_token，用户应该已登录，但未找到用户ID');
        // 可以在这里尝试从token中解析用户ID，或者返回一个特殊标识
        // 暂时返回undefined，让预加载使用通用推荐
      }

      console.log('[App] 未找到本地用户ID');
      return undefined;
    } catch (error) {
      console.error('[App] 获取本地用户ID失败:', error);
      return undefined;
    }
  };

  // 应用初始化（只执行一次）
  useEffect(() => {
    // 只有在语言检查完成且用户已选择语言后才初始化应用
    if (!checkingLanguage && languageSelected) {
      const initApp = async () => {
        try {
          analyticsData.logAppLaunch(1);
          
          // 直接使用本地用户ID开始预加载
          console.log('[App] 开始预加载推荐产品');
          const localUserId = await getLocalUserId();
          console.log('[App] 获取到本地用户ID:', localUserId);
          
          // 使用本地用户ID开始预加载，如果没有就按未登录情况加载
          preloadService.startPreloading(localUserId).catch(error => {
            console.error('[App] 预加载推荐产品失败:', error);
          });
          
          // 并行获取用户资料（不影响预加载）
          console.log('[App] 并行获取用户资料');
          fetchUserProfile().then(async (success) => {
            if (success) {
              const store = useUserStore.getState();
              const networkUserId = store.user?.user_id?.toString();
              
              // 保存用户ID到本地存储
              if (networkUserId) {
                try {
                  await AsyncStorage.setItem('user_id', networkUserId);
                  console.log('[App] 用户ID已保存到本地:', networkUserId);
                } catch (error) {
                  console.error('[App] 保存用户ID失败:', error);
                }
              }
            }
          }).catch(error => {
            console.error('[App] 获取用户资料失败:', error);
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
      console.log('[App] 显示更新弹窗');
      setShowUpdateModal(true);
      
      // 如果是强制更新，记录状态
      if (updateType === UpdateType.FORCE_UPDATE) {
        console.log('[App] 检测到强制更新，设置持久状态');
        setHasForceUpdate(true);
      }
    } else {
      console.log('[App] 不显示更新弹窗');
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
    const handleLoginSuccess = async () => {
      const success = await fetchUserProfile();
      // 登录成功后，重新预加载推荐产品（使用用户ID）
      if (success && userStore.user?.user_id) {
        const userId = userStore.user.user_id.toString();
        console.log('[App] 登录成功，重新预加载推荐产品', { userId });
        
        // 保存用户ID到本地存储
        try {
          await AsyncStorage.setItem('user_id', userId);
          console.log('[App] 登录成功后，用户ID已保存到本地:', userId);
        } catch (error) {
          console.error('[App] 登录成功后，保存用户ID失败:', error);
        }
        
        preloadService.clearCache().then(() => {
          preloadService.startPreloading(userId);
        });
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
        // 延迟处理，确保导航器已准备好
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

  // 监听应用状态变化，确保强制更新弹窗持久显示
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      
      // 如果应用重新激活且存在强制更新
      if (nextAppState === 'active' && hasForceUpdate) {
        setShowUpdateModal(true);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => subscription?.remove();
  }, [hasForceUpdate]);

  // 处理版本更新
  const handleUpdate = () => {
    console.log('[App] 用户点击更新，跳转到应用商店');
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
