import "react-native-gesture-handler";
import React from "react";
import { useEffect, useState } from "react";
import { userApi } from "./app/services/api/userApi";
import useUserStore from "./app/store/user";
import { AuthProvider, useAuth, AUTH_EVENTS } from "./app/contexts/AuthContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppNavigator, navigationRef } from "./app/navigation/AppNavigator";
import { View, ActivityIndicator, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "./app/i18n";
import * as Linking from "expo-linking";
import { EventEmitter } from 'events';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import LanguageSelectionScreen, { checkLanguageSelected } from "./app/screens/LanguageSelectionScreen";
import  useBurialPointStore  from "./app/store/burialPoint";
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
export const PAYMENT_SUCCESS_EVENT = "PAYMENT_SUCCESS_EVENT";
export const PAYMENT_FAILURE_EVENT = "PAYMENT_FAILURE_EVENT";

function AppContent() {
  const burialPointData = useBurialPointStore();
  const { setUser } = useUserStore();
  const { login, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [languageSelected, setLanguageSelected] = useState<boolean>(false);
  const [checkingLanguage, setCheckingLanguage] = useState(true);
  
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

  useEffect(() => {
    // 只有在语言检查完成且用户已选择语言后才初始化应用
    if (!checkingLanguage && languageSelected) {
      const initApp = async () => {
        try {
          burialPointData.logAppLaunch(1);
        } catch (error) {
          console.error('App initialization error:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      initApp();
    }
  }, [checkingLanguage, languageSelected]);

  // 监听登录成功事件，刷新用户资料
  useEffect(() => {
    fetchUserProfile();
    const handleLoginSuccess = () => {
      fetchUserProfile();
    };

    // 注册事件监听器
    global.EventEmitter.on(AUTH_EVENTS.LOGIN_SUCCESS, handleLoginSuccess);

    // 清理函数
    return () => {
      global.EventEmitter.off(AUTH_EVENTS.LOGIN_SUCCESS, handleLoginSuccess);
    };
  }, []);

  // 添加深度链接处理
  useEffect(() => {
    // 处理深度链接
    const handleDeepLink = ({ url }: { url: string }) => {
      console.log('Deep link received:', url);
      
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
      if (!url.includes('payment-success') && !url.includes('payment-failure')) {
        navigationRef.navigate("MainTabs");
      }
    };

    // 注册深度链接监听器
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // 处理应用冷启动的深度链接
    Linking.getInitialURL().then((url) => {
      console.log(url);
      if (url && url.startsWith("myapp://payment-success")) {
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, []);

  // 处理语言选择完成
  const handleLanguageSelected = () => {
    setLanguageSelected(true);
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return <AppNavigator />;
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
