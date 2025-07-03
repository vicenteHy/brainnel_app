import React, { useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  Image,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../types/navigation';
import { loginApi, userApi } from '../../services/api';
import useUserStore from '../../store/user';
import useAnalyticsStore from '../../store/analytics';
import { changeLanguage } from '../../i18n';
import fontSize from '../../utils/fontsizeUtils';
import { settingApi } from '../../services/api/setting';
import { handleLoginSettingsCheck } from '../../utils/userSettingsUtils';

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

const WEB_CLIENT_ID = "449517618313-av37nffa7rqkefu0ajh5auou3pb0mt51.apps.googleusercontent.com";
const isDevelopment = __DEV__;
const isSimulator = Platform.OS === 'ios' && Platform.isPad === false && __DEV__;

// 全局配置标记，避免重复配置
let isGoogleSigninConfigured = false;

interface GoogleLoginButtonProps {
  handleFirstLoginSettings?: (response: any) => Promise<void>;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  handleFirstLoginSettings,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setUser } = useUserStore();
  const analyticsStore = useAnalyticsStore();

  useEffect(() => {
    // 配置 Google 登录 - 避免重复配置
    if (!isSimulator && !isGoogleSigninConfigured) {
      try {
        GoogleSignin.configure({
          // 不指定 iosClientId，让 SDK 自动从 GoogleService-Info.plist 读取
          webClientId: WEB_CLIENT_ID, // Web Client ID
          scopes: ["profile", "email"],
          offlineAccess: false,
          forceCodeForRefreshToken: false,
        });
        isGoogleSigninConfigured = true;
        console.log("✅ Google Sign-in模块配置成功");
      } catch (error) {
        console.log("Google Sign-in模块配置错误:", error);
      }
    }
  }, []);

  // 处理登录设置检查（使用新的通用函数）
  const handleFirstLoginSettingsInternal = async (loginResponse: any) => {
    await handleLoginSettingsCheck(loginResponse, 'google');
  };

  const signInWithGoogle = async () => {
    console.log("🚀 Google登录按钮被点击");
    console.log("🔧 GoogleSignin模块:", GoogleSignin);
    console.log("🔧 statusCodes:", statusCodes);
    
    try {
      console.log("✅ 开始Google登录流程");
      
      if (typeof GoogleSignin.signIn !== "function") {
        console.error("❌ Google Sign-in模块未正确初始化或配置失败");
        Alert.alert("登录失败", "Google登录服务未正确配置");
        return;
      }
      
      console.log("✅ Google Sign-in模块验证通过");
      
      // 检查Play Services是否可用（仅Android需要）
      console.log("🔍 检查Play Services...");
      await GoogleSignin.hasPlayServices();
      console.log("✅ Play Services检查通过");
      
      // 执行登录
      console.log("🔐 开始执行Google登录...");
      const userInfo = await GoogleSignin.signIn();
      console.log("🎉 Google 登录成功:", JSON.stringify(userInfo, null, 2));
      
      // 检查是否为取消状态
      if (userInfo && typeof userInfo === 'object' && 'type' in userInfo) {
        if ((userInfo as any).type === 'cancelled') {
          console.log('ℹ️ 用户取消了Google登录 - 直接返回');
          return;
        }
      }
      
      // 检查是否有有效的用户信息
      let userData = userInfo;
      
      // 如果返回的是 {type: "success", data: {...}} 格式，检查data部分的用户信息
      if (userInfo && (userInfo as any).type === 'success' && (userInfo as any).data) {
        console.log('✅ 检测到success格式，检查data部分的用户信息');
        if (!(userInfo as any).data.user || !(userInfo as any).data.user.email) {
          console.warn('⚠️ Google登录返回的用户信息无效');
          Alert.alert("登录失败", "获取Google用户信息失败，请重试");
          return;
        }
        // 保持原始数据结构发送给后端
        userData = userInfo;
      } else {
        // 传统格式检查
        if (!userData || !userData.user || !userData.user.email) {
          console.warn('⚠️ Google登录返回的用户信息无效');
          Alert.alert("登录失败", "获取Google用户信息失败，请重试");
          return;
        }
      }
      
      try {
        // 调用后端API进行登录
        console.log("📡 调用后端API进行登录验证...");
        console.log("📤 发送的用户数据:", userData);
        const res = await loginApi.google(userData);
        console.log("✅ 后端登录验证成功:", res);
        
        // 保存access_token到AsyncStorage
        if (res.access_token) {
          const token = `${res.token_type} ${res.access_token}`;
          await AsyncStorage.setItem("token", token);
          console.log("✅ Token已保存:", token);
        }
        
        // 处理首次登录设置
        if (handleFirstLoginSettings) {
          await handleFirstLoginSettings(res);
        } else {
          await handleFirstLoginSettingsInternal(res);
        }
        
        console.log("👤 获取用户信息...");
        const user = await userApi.getProfile();
        console.log("✅ 用户信息获取成功:", user);
        
        if (user.language) {
          await changeLanguage(user.language);
        }
        
        setUser(user);
        
        // 导航到主页
        console.log("🏠 导航到主页...");
        analyticsStore.logLogin(true, "google");
        navigation.navigate("MainTabs", { screen: "Home" });
        console.log("✅ 登录流程完成");
        
      } catch (err) {
        console.error("❌ 后端登录验证失败:", err);
        analyticsStore.logLogin(false, "google");
        Alert.alert("登录失败", "服务器处理Google登录时出错，请稍后重试");
      }
      
    } catch (error: any) {
      console.error("❌ Google 登录错误:", error);
      console.error("❌ 错误详情:", JSON.stringify(error, null, 2));
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("⏹️ 用户取消登录");
        // 用户取消，不显示错误
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("⏳ 登录正在进行中");
        Alert.alert("请稍候", "登录正在进行中，请不要重复操作");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log("❌ Play Services 不可用");
        Alert.alert("登录失败", "Google Play服务不可用，请更新Google Play服务后重试");
      } else {
        console.error("❌ 其他错误:", error.message);
        analyticsStore.logLogin(false, "google");
        Alert.alert("登录失败", `Google登录出现错误: ${error.message || '未知错误'}`);
      }
    }
  };

  return (
    <TouchableOpacity
      style={styles.loginButton}
      onPress={signInWithGoogle}
    >
      <Image
        source={require("../../../assets/login/google.png")}
        style={styles.loginIcon}
      />
      <Text style={styles.loginButtonText}>Continue with Google</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loginIcon: {
    width: 24,
    height: 24,
  },
  loginButtonText: {
    flex: 1,
    color: "#374151",
    fontSize: fontSize(16),
    fontWeight: "500",
    textAlign: "center",
    marginLeft: -24,
  },
}); 