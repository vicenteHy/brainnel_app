import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  BackHandler,
  Image,
  Modal,
  SafeAreaView,
  Alert,
  TextInput,
  ActivityIndicator,
  FlatList
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
// @ts-ignore
import Icon from "react-native-vector-icons/FontAwesome";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import fontSize from "../../utils/fontsizeUtils";
import EmailLoginModal from "./EmailLoginModal";
import PhoneLoginModal from "./PhoneLoginModal";
import WhatsAppLoginModal from "./WhatsAppLoginModal";
import { loginApi } from "../../services/api/login";
import { userApi } from "../../services";
import useUserStore from "../../store/user";
import { settingApi } from "../../services/api/setting";
import { changeLanguage } from "../../i18n";
import { CountryList } from "../../constants/countries";
import { getCountryTransLanguage } from "../../utils/languageUtils";
import useAnalyticsStore from "../../store/analytics";

// 使用标准的ES6模块导入
let GoogleSignin: any = null;
let statusCodes: any = null;

// 注释掉原生模块导入
// try {
//   const googleSigninModule = require("@react-native-google-signin/google-signin");
//   GoogleSignin = googleSigninModule.GoogleSignin;
//   statusCodes = googleSigninModule.statusCodes;
// } catch (error) {
//   console.log("Google Sign-in模块导入错误:", error);
// }

// import { LoginManager, AccessToken, Settings } from "react-native-fbsdk-next"; // 注释掉原生模块
// import * as AppleAuthentication from 'expo-apple-authentication'; // 注释掉原生模块

const isDevelopment = __DEV__; // 开发模式检测
const isSimulator = Platform.OS === 'ios' && Platform.isPad === false && __DEV__;

// 配置 Google 登录 - 自动从 GoogleService-Info.plist 读取配置 (已注释)
// if (GoogleSignin && !isSimulator) {
//   try {
//     GoogleSignin.configure({
//       // 不指定 iosClientId，让 SDK 自动从 GoogleService-Info.plist 读取
//       webClientId: "449517618313-av37nffa7rqkefu0ajh5auou3pb0mt51.apps.googleusercontent.com", // Web Client ID
//       scopes: ["profile", "email"],
//       offlineAccess: false,
//       forceCodeForRefreshToken: false,
//     });
//   } catch (error) {
//     console.log("Google Sign-in模块配置错误:", error);
//   }
// }

type RootStackParamList = {
  Login: undefined;
  EmailLogin: undefined;
  MainTabs: { screen: string };
  Google: undefined;
  Home: { screen: string };
};

type LoginScreenProps = {
  onClose?: () => void;
  isModal?: boolean;
};

export const LoginScreen = ({ onClose, isModal }: LoginScreenProps) => {
  const { setUser, setSettings } = useUserStore();
  const analyticsStore = useAnalyticsStore();
  const { t, i18n } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 全新的状态管理方式
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [whatsappModalVisible, setWhatsappModalVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryList>();
  
  // WhatsApp登录状态
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [phoneNumberError, setPhoneNumberError] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countryList, setCountryList] = useState<CountryList[]>([]);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);

  // 防止多次触发
  const isProcessingEmail = useRef(false);
  const isProcessingPhone = useRef(false);
  const isProcessingWhatsapp = useRef(false);

  // 加载国家数据
  useEffect(() => {
    const loadCountryData = async () => {
      try {
        // 加载国家列表
        const res = await settingApi.getSendSmsCountryList();
        setCountryList(res);
        
        // 加载已保存的国家
        const savedCountry = await AsyncStorage.getItem("@selected_country");
        if (savedCountry) {
          const parsedCountry = JSON.parse(savedCountry);
          const item = res.find(item => item.country === parsedCountry.country);
          if (item) {
            setSelectedCountry(item);
          }
        } else {
          // 默认设置为科特迪瓦 +225
          const defaultCountry = res.find(item => item.country === 225);
          if (defaultCountry) {
            setSelectedCountry(defaultCountry);
          }
        }
      } catch (error) {
        console.error("加载国家数据失败:", error);
      }
    };
    loadCountryData();
  }, []);

  // 处理Android返回按钮
  useEffect(() => {
    const backAction = () => {
      if (emailModalVisible) {
        setEmailModalVisible(false);
        return true;
      }
      if (phoneModalVisible) {
        setPhoneModalVisible(false);
        return true;
      }
      if (whatsappModalVisible) {
        setWhatsappModalVisible(false);
        return true;
      }
      handleClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [emailModalVisible, phoneModalVisible, whatsappModalVisible]);

  // 关闭主屏幕
  const handleClose = () => {
    if (isModal && onClose) {
      onClose();
    } else {
      navigation.goBack();
    }
  };

  // 处理首次登录设置同步
  const handleFirstLoginSettings = async (loginResponse: any) => {
    try {
      // 检查是否是首次登录
      if (loginResponse.first_login) {
        console.log("✅ 检测到首次登录，开始同步本地设置");
        
        // 读取本地存储的国家设置
        const savedCountry = await AsyncStorage.getItem("@selected_country");
        let countryCode = 221; // 默认国家
        
        if (savedCountry) {
          try {
            const parsedCountry = JSON.parse(savedCountry);
            countryCode = parsedCountry.country;
            console.log("✅ 读取到本地国家设置:", countryCode);
          } catch (e) {
            console.error("❌ 解析本地国家设置失败:", e);
          }
        }
        
        // 调用首次登录API创建用户设置（包含国家对应的默认货币）
        console.log("📡 调用首次登录API，国家代码:", countryCode);
        const firstLoginData = await settingApi.postFirstLogin(countryCode);
        console.log("✅ 首次登录设置创建成功:", firstLoginData);
        
        // 读取本地存储的语言设置
        const savedLanguage = await AsyncStorage.getItem("app_language");
        if (savedLanguage && savedLanguage !== firstLoginData.language) {
          console.log("🌐 同步本地语言设置:", savedLanguage);
          try {
            await settingApi.putSetting({ language: savedLanguage });
            console.log("✅ 语言设置同步成功");
          } catch (error) {
            console.error("❌ 语言设置同步失败:", error);
          }
        }
        
      } else {
        console.log("ℹ️ 非首次登录，跳过设置同步");
      }
    } catch (error) {
      console.error("❌ 处理首次登录设置失败:", error);
      // 不阻断登录流程，只记录错误
    }
  };

  // 处理谷歌登录 (已禁用)
  const handleGoogleLogin = async () => {
    Alert.alert("功能暂时不可用", "Google登录功能在开发模式下暂时禁用");
    return;
    /* 
    console.log("🚀 Google登录按钮被点击");
    console.log("🔧 GoogleSignin模块:", GoogleSignin);
    console.log("🔧 statusCodes:", statusCodes);
    
    try {
      console.log("✅ 开始Google登录流程");
      
      if (!GoogleSignin || typeof GoogleSignin.signIn !== "function") {
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
      
      try {
        // 调用后端API进行登录
        console.log("📡 调用后端API进行登录验证...");
        const res = await loginApi.googleLogin(userInfo);
        console.log("✅ 后端登录验证成功:", res);
        
        // 保存access_token到AsyncStorage
        if (res.access_token) {
          const token = `${res.token_type} ${res.access_token}`;
          await AsyncStorage.setItem("token", token);
          console.log("✅ Token已保存:", token);
        }
        
        // 处理首次登录设置同步
        console.log("⚙️ 检查是否需要同步本地设置...");
        await handleFirstLoginSettings(res);
        
        console.log("👤 获取用户信息...");
        const user = await userApi.getProfile();
        console.log("✅ 用户信息获取成功:", user);
        
        // 同步语言设置
        if (user.language) {
          console.log("🌐 同步用户语言设置:", user.language);
          await changeLanguage(user.language);
        }
        
        setUser(user);
        
        // 导航到主页
        console.log("🏠 导航到主页...");
        if (isModal && onClose) {
          onClose();
        }
        navigation.navigate("MainTabs", { screen: "Home" });
        console.log("✅ 登录流程完成");
        
      } catch (err) {
        console.error("❌ 后端登录验证失败:", err);
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
        Alert.alert("登录失败", `Google登录出现错误: ${error.message || '未知错误'}`);
      }
    }
    */ // 注释结束
  };
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    // 确保在 App 启动时初始化 SDK (已注释)
    // Settings.initializeSDK();
    
    console.log("✅ Facebook SDK初始化已禁用");

    // 在应用程序启动时检查是否已经登录（可选）
    // AccessToken.getCurrentAccessToken().then(data => {
    //   if (data) {
    //     console.log("已登录 Facebook，Token:", data.accessToken);
    //     // 可以尝试获取用户信息
    //     // fetchFacebookProfile(data.accessToken);
    //   }
    // });

  }, []);


  // 辅助函数：获取 Facebook 用户资料 - iOS Limited Login兼容版本
  const fetchFacebookProfile = async (accessTokenData: any) => {
    try {
      console.log('📡 开始获取Facebook用户资料...');
      console.log('🔑 AccessToken数据:', JSON.stringify(accessTokenData, null, 2));
      
      // 对于iOS Limited Login，需要使用Graph API的特殊方式
      if (Platform.OS === 'ios' && accessTokenData.permissions && accessTokenData.permissions.includes('openid')) {
        console.log('🍎 检测到iOS Limited Login模式');
        
        // 构造基本用户信息（Limited Login模式下可能无法获取完整信息）
        const profile = {
          id: accessTokenData.userID,
          name: '用户', // Limited Login模式下可能无法获取真实姓名
          email: null   // Limited Login模式下可能无法获取邮箱
        };
        
        console.log('📋 Limited Login模式用户信息:', JSON.stringify(profile, null, 2));
        setUserInfo(profile);
        return profile;
      } else {
        // 标准模式的Graph API调用
        const token = accessTokenData.accessToken;
        const url = `https://graph.facebook.com/me?fields=id,name,email&access_token=${token}`;
        console.log('🌐 请求URL:', url);
        
        const response = await fetch(url);
        console.log('📊 响应状态:', response.status);
        
        const profile = await response.json();
        console.log('📋 Facebook User Info (完整响应):', JSON.stringify(profile, null, 2));
        
        // 检查是否有错误
        if (profile.error) {
          console.error('❌ Facebook API返回错误:', JSON.stringify(profile.error, null, 2));
          throw new Error(`Facebook API错误: ${profile.error.message} (代码: ${profile.error.code})`);
        }
        
        setUserInfo(profile);
        console.log('✅ Facebook用户资料获取成功');
        return profile;
      }
    } catch (error) {
      console.error('❌ 获取 Facebook 用户资料错误:', error);
      console.error('❌ 错误详情:', JSON.stringify(error, null, 2));
      Alert.alert("获取资料失败", "无法从 Facebook 获取用户详细资料，请检查网络或权限设置。");
      throw error;
    }
  };

  // 处理Facebook登录
  const handleFacebookLogin = async () => {
    console.log("🚀 Facebook登录按钮被点击");
    console.log("📱 设备平台:", Platform.OS);
    console.log("🔧 开发模式:", __DEV__);
    
    try {
      console.log("✅ 开始Facebook登录流程");
      
      // 先检查Facebook SDK状态
      console.log("🔍 检查Facebook SDK状态...");
      try {
        const currentToken = await AccessToken.getCurrentAccessToken();
        console.log("📋 当前Facebook Token状态:", currentToken ? "已存在Token" : "无Token");
        if (currentToken) {
          console.log("📋 当前Token信息:", JSON.stringify(currentToken, null, 2));
        }
      } catch (sdkError) {
        console.error("❌ Facebook SDK检查错误:", sdkError);
      }
      
      // 可选: 先退出登录，确保每次都是全新登录 (主要用于测试)
      // await LoginManager.logOut();

      console.log("🚀 开始Facebook权限请求...");
      // 使用标准的Facebook登录
      const result = await LoginManager.logInWithPermissions([
        "public_profile",
        "email",
      ]);

      if (result.isCancelled) {
        console.log("⏹️ 用户取消Facebook登录");
        Alert.alert("登录取消", "用户取消了 Facebook 登录。");
        return;
      }

      console.log("✅ Facebook登录授权成功");
      console.log("📋 Facebook登录结果:", JSON.stringify(result, null, 2));
      
      const data = await AccessToken.getCurrentAccessToken();
      console.log("📋 Facebook AccessToken 数据:", JSON.stringify(data, null, 2));
      
      // 确保 accessToken 存在且为字符串
      if (!data || !data.accessToken) {
        console.error("❌ 无法获取Facebook AccessToken");
        console.error("❌ data对象:", JSON.stringify(data, null, 2));
        Alert.alert("登录失败", "无法获取有效的 Facebook AccessToken。");
        return;
      }

      const tokenString = data.accessToken.toString();
      console.log("🔑 Facebook Access Token:", tokenString);
      console.log("🕒 Token到期时间:", data.expirationTime);
      console.log("🔐 Token权限:", JSON.stringify(data.permissions, null, 2));

      // 获取 Facebook 用户信息
      console.log("👤 获取Facebook用户信息...");
      const facebookProfile = await fetchFacebookProfile(data);
      
      try {
        // 准备发送给后端的数据
        const backendData = Platform.OS === 'ios' && data.permissions && data.permissions.includes('openid')
          ? {
              // iOS Limited Login模式 - 发送更多token信息给后端验证
              access_token: tokenString,
              user_id: data.userID,
              application_id: data.applicationID,
              permissions: data.permissions,
              profile: facebookProfile,
              limited_login: true
            }
          : {
              // 标准模式
              access_token: tokenString,
              profile: facebookProfile
            };
        console.log("📤 准备发送给后端的数据:", JSON.stringify(backendData, null, 2));
        
        // 调用后端API进行Facebook登录
        console.log("📡 调用后端API进行Facebook登录验证...");
        const res = await loginApi.facebookLogin(backendData);
        console.log("✅ 后端Facebook登录验证成功:", JSON.stringify(res, null, 2));
        
        // 保存access_token到AsyncStorage
        if (res.access_token) {
          const token = `${res.token_type} ${res.access_token}`;
          await AsyncStorage.setItem("token", token);
          console.log("✅ Token已保存:", token);
        }
        
        // 处理首次登录设置同步
        console.log("⚙️ 检查是否需要同步本地设置...");
        await handleFirstLoginSettings(res);
        
        console.log("👤 获取用户信息...");
        const user = await userApi.getProfile();
        console.log("✅ 用户信息获取成功:", JSON.stringify(user, null, 2));
        
        // 同步语言设置
        if (user.language) {
          console.log("🌐 同步用户语言设置:", user.language);
          await changeLanguage(user.language);
        }
        
        setUser(user);
        
        // 导航到主页
        console.log("🏠 导航到主页...");
        if (isModal && onClose) {
          onClose();
        }
        navigation.navigate("MainTabs", { screen: "Home" });
        console.log("✅ Facebook登录流程完成");
        
      } catch (err: any) {
        console.error("❌ 后端Facebook登录验证失败:", err);
        
        // 详细记录错误信息
        if (err.response) {
          console.error("📊 响应状态:", err.response.status);
          console.error("📊 响应头:", JSON.stringify(err.response.headers, null, 2));
          console.error("📊 响应数据:", JSON.stringify(err.response.data, null, 2));
        } else if (err.request) {
          console.error("📡 请求信息:", JSON.stringify(err.request, null, 2));
          console.error("❌ 没有收到响应");
        } else {
          console.error("❌ 错误配置:", err.message);
        }
        
        console.error("❌ 完整错误对象:", JSON.stringify(err, null, 2));
        
        Alert.alert("登录失败", `服务器处理Facebook登录时出错: ${err.message || '未知错误'}`);
      }

    } catch (error: any) {
      console.error("❌ Facebook登录错误:", error);
      console.error("❌ 错误详情:", JSON.stringify(error, null, 2));
      
      let errorMessage = "发生未知错误";
      if (error && typeof error.message === 'string') {
        errorMessage = error.message;
      }
      Alert.alert("登录错误", `Facebook 操作失败：${errorMessage}`);
    }
  };

  // 处理Apple登录
  const handleAppleLogin = async () => {
    console.log("🚀 Apple登录按钮被点击");
    
    try {
      console.log("✅ 开始Apple登录流程");
      
      // 检查Apple登录是否可用
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        console.error("❌ Apple登录不可用");
        Alert.alert("登录失败", "Apple登录在此设备上不可用");
        return;
      }
      
      console.log("✅ Apple登录可用，开始认证...");
      
      // 执行Apple登录
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      console.log("🎉 Apple登录成功:", JSON.stringify(credential, null, 2));
      
      // 构造用户信息
      const appleUserData = {
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode,
        state: credential.state,
      };
      
      try {
        // 调用后端API进行Apple登录
        console.log("📡 调用后端API进行Apple登录验证...");
        const res = await loginApi.appleLogin(appleUserData);
        console.log("✅ 后端Apple登录验证成功:", res);
        
        // 保存access_token到AsyncStorage
        if (res.access_token) {
          const token = `${res.token_type} ${res.access_token}`;
          await AsyncStorage.setItem("token", token);
          console.log("✅ Token已保存:", token);
        }
        
        // 处理首次登录设置同步
        console.log("⚙️ 检查是否需要同步本地设置...");
        await handleFirstLoginSettings(res);
        
        console.log("👤 获取用户信息...");
        const user = await userApi.getProfile();
        console.log("✅ 用户信息获取成功:", user);
        
        // 同步语言设置
        if (user.language) {
          console.log("🌐 同步用户语言设置:", user.language);
          await changeLanguage(user.language);
        }
        
        setUser(user);
        
        // 导航到主页
        console.log("🏠 导航到主页...");
        if (isModal && onClose) {
          onClose();
        }
        navigation.navigate("MainTabs", { screen: "Home" });
        console.log("✅ Apple登录流程完成");
        
      } catch (err) {
        console.error("❌ 后端Apple登录验证失败:", err);
        Alert.alert("登录失败", "服务器处理Apple登录时出错，请稍后重试");
      }
      
    } catch (error: any) {
      console.error("❌ Apple登录错误:", error);
      console.error("❌ 错误详情:", JSON.stringify(error, null, 2));
      
      if (error.code === 'ERR_CANCELED') {
        console.log("⏹️ 用户取消Apple登录");
        // 用户取消，不显示错误
      } else {
        console.error("❌ 其他错误:", error.message);
        Alert.alert("登录失败", `Apple登录出现错误: ${error.message || '未知错误'}`);
      }
    }
  };


  // 显示邮箱登录
  const showEmailModal = () => {
    if (isProcessingEmail.current) return;

    isProcessingEmail.current = true;
    // 确保其他模态框已关闭
    setPhoneModalVisible(false);
    setWhatsappModalVisible(false);

    // 延迟打开邮箱模态框，避免冲突
    setTimeout(() => {
      setEmailModalVisible(true);
      isProcessingEmail.current = false;
    }, 100);
  };

  // 显示手机登录
  const showPhoneModal = () => {
    if (isProcessingPhone.current) return;

    isProcessingPhone.current = true;
    // 确保其他模态框已关闭
    setEmailModalVisible(false);
    setWhatsappModalVisible(false);

    // 延迟打开手机模态框，避免冲突
    setTimeout(() => {
      setPhoneModalVisible(true);
      isProcessingPhone.current = false;
    }, 100);
  };

  // 显示WhatsApp登录
  const showWhatsappModal = () => {
    console.log("🚀 WhatsApp登录按钮被点击");
    if (isProcessingWhatsapp.current) {
      console.log("⏳ WhatsApp登录正在处理中，跳过");
      return;
    }

    isProcessingWhatsapp.current = true;
    console.log("🔄 关闭其他登录模态框");
    // 确保其他模态框已关闭
    setEmailModalVisible(false);
    setPhoneModalVisible(false);

    // 延迟打开WhatsApp模态框，避免冲突
    setTimeout(() => {
      console.log("📱 显示WhatsApp登录模态框");
      setWhatsappModalVisible(true);
      isProcessingWhatsapp.current = false;
    }, 100);
  };

  // 关闭邮箱登录
  const hideEmailModal = () => {
    console.log("Hiding email modal");
    setEmailModalVisible(false);
  };

  // 关闭手机登录
  const hidePhoneModal = () => {
    console.log("Hiding phone modal");
    setPhoneModalVisible(false);
  };

  // 关闭WhatsApp登录
  const hideWhatsappModal = () => {
    console.log("❌ 关闭WhatsApp登录模态框");
    setWhatsappModalVisible(false);
  };

  // 验证手机号 (8-11位)
  const validatePhoneNumber = (phoneNum: string) => {
    const length = phoneNum.length;
    return length >= 8 && length <= 11;
  };

  // 处理手机号输入
  const handlePhoneNumberChange = (text: string) => {
    setPhoneNumber(text);
    if (text.length > 0) {
      setPhoneNumberError(!validatePhoneNumber(text));
    } else {
      setPhoneNumberError(false);
    }
    setWhatsappError(null);
  };

  // 选择国家
  const handleCountrySelect = (country: CountryList) => {
    console.log("🌍 用户选择国家:", country);
    setSelectedCountry(country);
    setShowCountryModal(false);
    AsyncStorage.setItem("@selected_country", JSON.stringify(country));
  };

  // 发送WhatsApp OTP
  const handleSendWhatsappOtp = async () => {
    console.log("🚀 WhatsApp发送OTP");
    
    if (!validatePhoneNumber(phoneNumber)) {
      console.log("❌ 手机号验证失败");
      setPhoneNumberError(true);
      return;
    }

    try {
      setWhatsappLoading(true);
      setWhatsappError(null);
      
      const fullPhoneNumber = `+${selectedCountry?.country}${phoneNumber}`;
      console.log("📞 完整手机号:", fullPhoneNumber);
      
      const requestData = {
        phone_number: fullPhoneNumber,
        language: i18n.language || "zh"
      };
      
      const response = await loginApi.sendWhatsappOtp(requestData);
      console.log("✅ WhatsApp OTP发送成功:", response);
      
      setShowOtpInput(true);
      setWhatsappLoading(false);
      Alert.alert(t("whatsapp.verification_code_sent"), t("whatsapp.check_whatsapp"));
    } catch (error: any) {
      console.error("❌ 发送WhatsApp OTP失败:", error);
      
      let errorMessage = t("whatsapp.login_failed");
      if (error.code === 'ECONNABORTED') {
        errorMessage = t("whatsapp.login_failed");
      } else if (error.response) {
        if (error.response.status === 404) {
          errorMessage = t("whatsapp.login_failed");
        } else if (error.response.status >= 500) {
          errorMessage = t("whatsapp.login_failed");
        } else if (error.response.status === 422) {
          errorMessage = t("whatsapp.phone_error");
        }
      }
      
      setWhatsappLoading(false);
      setWhatsappError(errorMessage);
    }
  };

  // 验证WhatsApp OTP
  const handleVerifyWhatsappOtp = async () => {
    console.log("🔐 WhatsApp验证OTP");
    
    if (!otpCode.trim()) {
      setWhatsappError(t("whatsapp.enter_code"));
      return;
    }

    try {
      setOtpLoading(true);
      setWhatsappError(null);
      
      const fullPhoneNumber = `+${selectedCountry?.country}${phoneNumber}`;
      const requestData = {
        phone_number: fullPhoneNumber,
        code: otpCode
      };
      
      const res = await loginApi.verifyWhatsappOtp(requestData);
      console.log("✅ WhatsApp OTP验证成功:", res);

      if (res.access_token) {
        const token = `${res.token_type} ${res.access_token}`;
        await AsyncStorage.setItem("token", token);
        
        if (res.first_login) {
          const countryCode = selectedCountry?.country || 225;
          const data = await settingApi.postFirstLogin(countryCode);
          setSettings(data);
        }
        
        const user = await userApi.getProfile();
        if (user.language) {
          await changeLanguage(user.language);
        }
        
        setUser(user);
        setOtpLoading(false);
        
        // 记录登录成功
        analyticsStore.logLogin(true, "whatsapp");
        
        navigation.replace("MainTabs", { screen: "Home" });
        if (onClose) onClose();
      } else {
        setOtpLoading(false);
        setWhatsappError(t("whatsapp.login_failed"));
      }
    } catch (error: any) {
      console.error("❌ 验证WhatsApp OTP失败:", error);
      setOtpLoading(false);
      setWhatsappError(t("whatsapp.code_error"));
      
      // 记录登录失败
      analyticsStore.logLogin(false, "whatsapp");
    }
  };

  // 重新发送OTP
  const handleResendOtp = () => {
    setOtpCode("");
    setWhatsappError(null);
    handleSendWhatsappOtp();
  };

  // 渲染国家列表项
  const renderCountryItem = ({ item }: { item: CountryList }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => handleCountrySelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.countryItemContent}>
        <Text style={styles.countryCode}>+{item.country}</Text>
        <Text style={styles.countryItemName}>
          {getCountryTransLanguage(item)}
        </Text>
      </View>
      {selectedCountry && selectedCountry.country === item.country && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  // 处理忘记密码
  const handleForgotPassword = () => {
    // 处理忘记密码
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#E5E5E5" />
      <View style={styles.container}>
        {/* 背景 */}
        <View style={styles.background} />
        
        {/* 登录卡片 */}
        <View style={styles.loginCard}>
          {/* 关闭按钮 */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>←</Text>
          </TouchableOpacity>

          {/* 标题 */}
          <View style={styles.titleContainer}>
            <Text style={styles.welcomeTitle}>Log in</Text>
            <Text style={styles.subtitle}>By logging in, you agree to our Terms of Use.</Text>
          </View>

          {/* WhatsApp登录区域 */}
          <View style={styles.whatsappSection}>
            <Text style={styles.inputLabel}>{t("whatsapp.title")}</Text>
            
            {!showOtpInput ? (
              // 手机号输入阶段
              <>
                <View style={styles.whatsappInputField}>
                  <TouchableOpacity
                    style={styles.countryCodeButton}
                    onPress={() => setShowCountryModal(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.countryPrefix}>+{selectedCountry?.country || "225"}</Text>
                    <Text style={styles.countryCodeArrow}>▼</Text>
                  </TouchableOpacity>
                  <View style={styles.inputDivider} />
                  <TextInput
                    style={styles.phoneInput}
                    placeholder={t("whatsapp.phone_placeholder")}
                    value={phoneNumber}
                    onChangeText={handlePhoneNumberChange}
                    keyboardType="phone-pad"
                    maxLength={11}
                  />
                </View>
                
                {phoneNumberError && (
                  <Text style={styles.errorText}>{t("whatsapp.phone_error")}</Text>
                )}
                
                {whatsappError && (
                  <Text style={styles.errorText}>{whatsappError}</Text>
                )}
                
                <Text style={styles.whatsappInfoText}>{t("whatsapp.info_text")}</Text>
                
                <TouchableOpacity 
                  style={[
                    styles.connectButton,
                    (phoneNumberError || !phoneNumber.trim()) && styles.disabledButton
                  ]} 
                  onPress={handleSendWhatsappOtp}
                  disabled={phoneNumberError || !phoneNumber.trim() || whatsappLoading}
                >
                  {whatsappLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.connectButtonText}>{t("whatsapp.send_code")}</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              // OTP验证阶段
              <>
                <TextInput
                  style={styles.otpInput}
                  placeholder={t("whatsapp.code_placeholder")}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={4}
                  autoFocus
                />
                
                <Text style={styles.otpInfoText}>
                  {t("whatsapp.code_sent_info", {
                    countryCode: selectedCountry?.country,
                    phoneNumber: phoneNumber
                  })}
                </Text>
                
                {whatsappError && (
                  <Text style={styles.errorText}>{whatsappError}</Text>
                )}
                
                <TouchableOpacity
                  style={[
                    styles.connectButton,
                    !otpCode.trim() && styles.disabledButton
                  ]}
                  onPress={handleVerifyWhatsappOtp}
                  disabled={!otpCode.trim() || otpLoading}
                >
                  {otpLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.connectButtonText}>{t("whatsapp.connect")}</Text>
                  )}
                </TouchableOpacity>
                
                <View style={styles.resendContainer}>
                  <Text style={styles.resendText}>{t("whatsapp.resend_text")} </Text>
                  <TouchableOpacity onPress={handleResendOtp}>
                    <Text style={styles.resendLink}>{t("whatsapp.resend_link")}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* 分隔线 */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 其他登录选项 */}
          <View style={styles.otherOptionsContainer}>
            <TouchableOpacity style={styles.optionButton} onPress={handleGoogleLogin}>
              <Image
                source={require("../../../assets/img/google.png")}
                style={styles.optionIcon}
              />
              <Text style={styles.optionButtonText}>Sign in with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionButton} onPress={showPhoneModal}>
              <Text style={styles.optionButtonText}>Phone number</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionButton} onPress={showEmailModal}>
              <Text style={styles.optionButtonText}>Email</Text>
            </TouchableOpacity>
          </View>

          {/* 隐私政策 */}
          <View style={styles.privacyContainer}>
            <Text style={styles.privacyText}>For more information, please see our Privacy policy.</Text>
          </View>
        </View>
      </View>

      {/* 邮箱登录模态框 - 直接渲染 */}
      <EmailLoginModal visible={emailModalVisible} onClose={hideEmailModal} />

      {/* 手机登录模态框 - 直接渲染 */}
      <PhoneLoginModal visible={phoneModalVisible} onClose={hidePhoneModal} />

      {/* WhatsApp登录模态框 - 直接渲染 */}
      <WhatsAppLoginModal visible={whatsappModalVisible} onClose={hideWhatsappModal} />
      
      {/* 国家选择模态框 */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryModal(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.countryModalContainer}>
          <TouchableOpacity
            style={styles.countryModalOverlay}
            activeOpacity={1}
            onPress={() => setShowCountryModal(false)}
          />
          <View style={styles.countryModalContent}>
            <View style={styles.modalHandleContainer}>
              <View style={styles.modalHandle} />
            </View>
            <View style={styles.countryModalHeader}>
              <TouchableOpacity
                style={styles.countryModalCloseButton}
                onPress={() => setShowCountryModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.countryModalCloseButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.countryModalTitle}>{t("selectCountry")}</Text>
            </View>
            <FlatList
              data={countryList}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.country.toString()}
              style={styles.countryList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  safeAreaContent: {
    flex: 1,
    paddingTop: 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  closeButton: {
    position: "absolute",
    top: 15,
    left: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  closeButtonText: {
    color: "#374151",
    fontSize: fontSize(20),
    fontWeight: "300",
  },
  blueHeader: {
    backgroundColor: "#FF6B35", // 橙色品牌色
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: Platform.OS === "ios" ? 80 : 60,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 8,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logo: {
    fontSize: fontSize(34),
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  features: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 12,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  featureIcon: {
    fontSize: fontSize(16),
  },
  featureText: {
    fontSize: fontSize(15),
    color: "#fff",
    fontWeight: "500",
  },
  loginContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    backgroundColor: "#fafafa",
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 40,
    paddingTop: 20,
    position: "relative",
  },
  subtitle: {
    fontSize: fontSize(16),
    color: "#666",
    textAlign: "center",
    fontWeight: "400",
    lineHeight: 22,
  },
  loginButton: {
    flexDirection: "row",
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loginButtonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  facebookIcon: {
    backgroundColor: "#1877F2",
  },
  appleIconBg: {
    backgroundColor: "#000",
  },
  googleIcon: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  whatsappIcon: {
    backgroundColor: "#25D366",
  },
  loginButtonText: {
    flex: 1,
    fontSize: fontSize(16),
    color: "#333",
    textAlign: "center",
    marginRight: 16,
    fontWeight: "500",
  },
  primaryButton: {
    backgroundColor: "#FF6B35",
    borderColor: "#FF6B35",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  forgotPassword: {
    alignItems: "center",
    marginVertical: 24,
  },
  forgotPasswordText: {
    color: "#FF6B35",
    fontSize: fontSize(15),
    fontWeight: "500",
  },
  termsContainer: {
    alignItems: "center",
    marginTop: 16,
    paddingBottom: 24,
  },
  terms: {
    fontSize: fontSize(13),
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
  link: {
    color: "#FF6B35",
    fontWeight: "500",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E8E8E8",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: fontSize(14),
    color: "#999",
    fontWeight: "400",
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#f0f0f0",
  },
  loginCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 80,
    marginBottom: 40,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  welcomeTitle: {
    fontSize: fontSize(32),
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "left",
  },
  whatsappSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: fontSize(16),
    fontWeight: "500",
    color: "#374151",
    marginBottom: 12,
  },
  whatsappInputField: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  whatsappInputContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  countryPrefix: {
    fontSize: fontSize(16),
    color: "#374151",
    fontWeight: "500",
    marginRight: 8,
  },
  whatsappInputText: {
    fontSize: fontSize(16),
    color: "#9ca3af",
    flex: 1,
  },
  whatsappInfoText: {
    fontSize: fontSize(14),
    color: "#6b7280",
    marginBottom: 24,
    lineHeight: 20,
  },
  connectButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  connectButtonText: {
    color: "#fff",
    fontSize: fontSize(16),
    fontWeight: "600",
  },
  otherOptionsContainer: {
    marginTop: 24,
    gap: 12,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  optionIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  optionButtonText: {
    fontSize: fontSize(16),
    color: "#374151",
    fontWeight: "500",
  },
  privacyContainer: {
    marginTop: 32,
    alignItems: "center",
  },
  privacyText: {
    fontSize: fontSize(14),
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  countryCodeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
    paddingLeft: 4,
  },
  inputDivider: {
    width: 1,
    height: "60%",
    backgroundColor: "#d1d5db",
    marginRight: 12,
  },
  countryCodeArrow: {
    fontSize: fontSize(10),
    color: "#6b7280",
    marginLeft: 4,
  },
  phoneInput: {
    flex: 1,
    fontSize: fontSize(16),
    color: "#374151",
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  errorText: {
    color: "#ef4444",
    fontSize: fontSize(14),
    marginTop: 8,
    marginBottom: 8,
  },
  disabledButton: {
    backgroundColor: "#d1d5db",
  },
  otpContainer: {
    alignItems: "center",
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: fontSize(16),
    textAlign: "center",
    marginBottom: 12,
    width: "100%",
    letterSpacing: 2,
  },
  otpInfoText: {
    fontSize: fontSize(14),
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  resendText: {
    fontSize: fontSize(14),
    color: "#6b7280",
    marginRight: 4,
  },
  resendLink: {
    fontSize: fontSize(14),
    color: "#FF6B35",
    fontWeight: "600",
  },
  // 国家选择模态框样式
  countryModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  countryModalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  countryModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "80%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  modalHandleContainer: {
    width: "100%",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
  },
  countryModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  countryModalCloseButton: {
    padding: 4,
  },
  countryModalCloseButtonText: {
    fontSize: fontSize(18),
    color: "#6b7280",
  },
  countryModalTitle: {
    flex: 1,
    fontSize: fontSize(18),
    fontWeight: "600",
    textAlign: "center",
    marginRight: 24,
  },
  countryList: {
    padding: 8,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  countryItemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  countryItemName: {
    fontSize: fontSize(16),
    color: "#374151",
  },
  countryCode: {
    fontSize: fontSize(15),
    color: "#6b7280",
    marginRight: 12,
    width: 50,
    textAlign: "center",
  },
  checkmark: {
    fontSize: fontSize(20),
    color: "#FF6B35",
    fontWeight: "bold",
  },
});

export default LoginScreen;
