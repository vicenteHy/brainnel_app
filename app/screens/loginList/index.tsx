import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import fontSize from "../../utils/fontsizeUtils";
import { loginApi } from "../../services/api/login";
import { userApi } from "../../services";
import useUserStore from "../../store/user";
import { settingApi } from "../../services/api/setting";
import { changeLanguage } from "../../i18n";
import { Country, countries } from "../../constants/countries";

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
const isSimulator =
  Platform.OS === "ios" && Platform.isPad === false && __DEV__;

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

// 国家代码到Country对象的映射
const countryCodeToCountry: { [key: number]: Country } = {
  225: { name: 'Ivory Coast', code: 'CI', flag: '🇨🇮', userCount: 1100000, phoneCode: '+225' },
  221: { name: 'Senegal', code: 'SN', flag: '🇸🇳', userCount: 400000, phoneCode: '+221' },
  33: { name: 'France', code: 'FR', flag: '🇫🇷', userCount: 50000, phoneCode: '+33' },
  229: { name: 'Benin', code: 'BJ', flag: '🇧🇯', userCount: 200000, phoneCode: '+229' },
  241: { name: 'Gabon', code: 'GA', flag: '🇬🇦', userCount: 500000, phoneCode: '+241' },
  243: { name: 'Democratic Republic of the Congo', code: 'CD', flag: '🇨🇩', userCount: 1000000, phoneCode: '+243' },
  237: { name: 'Cameroon', code: 'CM', flag: '🇨🇲', userCount: 150000, phoneCode: '+237' },
  242: { name: 'Republic of Congo', code: 'CG', flag: '🇨🇬', userCount: 300000, phoneCode: '+242' },
  224: { name: 'Guinea', code: 'GN', flag: '🇬🇳', userCount: 600000, phoneCode: '+224' },
  226: { name: 'Burkina Faso', code: 'BF', flag: '🇧🇫', userCount: 700000, phoneCode: '+226' },
  223: { name: 'Mali', code: 'ML', flag: '🇲🇱', userCount: 800000, phoneCode: '+223' },
  228: { name: 'Togo', code: 'TG', flag: '🇹🇬', userCount: 900000, phoneCode: '+228' },
};

type RootStackParamList = {
  Login: undefined;
  EmailLogin: undefined;
  MainTabs: { screen: string };
  Google: undefined;
  Home: { screen: string };
};

export const LoginScreen = () => {
  const { setUser, setSettings } = useUserStore();
  const { t, i18n } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // WhatsApp登录状态
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    name: "Ivory Coast",
    code: "CI",
    flag: "🇨🇮",
    userCount: 1100000,
    phoneCode: "+225",
  });
  const [showCountryModal, setShowCountryModal] = useState(false);

  // 组件初始化时加载保存的国家设置
  useEffect(() => {
    const loadSavedCountry = async () => {
      try {
        const savedCountry = await AsyncStorage.getItem('@selected_country');
        if (savedCountry) {
          const parsedCountry = JSON.parse(savedCountry);
          const countryInfo = countryCodeToCountry[parsedCountry.country];
          
          if (countryInfo) {
            setSelectedCountry(countryInfo);
            console.log('已加载保存的国家设置:', countryInfo);
          } else {
            console.log('未找到国家代码映射:', parsedCountry.country);
          }
        }
      } catch (error) {
        console.error('加载保存的国家设置失败:', error);
      }
    };

    loadSavedCountry();
  }, []);

  // 关闭主屏幕
  const handleClose = () => {
    navigation.goBack();
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
        navigation.navigate("MainTabs", { screen: "Home" });
        console.log("✅ Apple登录流程完成");
      } catch (err) {
        console.error("❌ 后端Apple登录验证失败:", err);
        Alert.alert("登录失败", "服务器处理Apple登录时出错，请稍后重试");
      }
    } catch (error: any) {
      console.error("❌ Apple登录错误:", error);
      console.error("❌ 错误详情:", JSON.stringify(error, null, 2));

      if (error.code === "ERR_CANCELED") {
        console.log("⏹️ 用户取消Apple登录");
        // 用户取消，不显示错误
      } else {
        console.error("❌ 其他错误:", error.message);
        Alert.alert(
          "登录失败",
          `Apple登录出现错误: ${error.message || "未知错误"}`,
        );
      }
    }
  };

  // 发送WhatsApp验证码
  const handleSendWhatsAppCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert(t("error"), t("phoneNumber") + " " + t("login.required"));
      return;
    }

    try {
      setLoading(true);
      const countryCode = selectedCountry?.phoneCode || "+225";
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      
      console.log("[WhatsApp] 发送验证码 - 国家代码:", countryCode);
      console.log("[WhatsApp] 发送验证码 - 手机号:", phoneNumber);
      console.log("[WhatsApp] 发送验证码 - 完整号码:", fullPhoneNumber);
      console.log("[WhatsApp] 发送验证码 - 语言:", i18n.language);

      const requestData = {
        phone_number: fullPhoneNumber,
        language: i18n.language || "en",
      };

      console.log("[WhatsApp] 发送请求数据:", requestData);

      await loginApi.sendWhatsappOtp(requestData);

      setShowVerificationInput(true);
      setCountdown(60);
      setLoading(false);

      Alert.alert(t("success"), t("whatsapp.verification_code_sent"));

      // 开始倒计时
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      console.error("[WhatsApp] 发送验证码失败:", error);
      console.error("[WhatsApp] 错误详情:", JSON.stringify(error, null, 2));
      
      if (error?.data?.detail) {
        console.error("[WhatsApp] 服务器错误详情:", error.data.detail);
      }
      
      let errorMessage = "发送验证码失败，请重试";
      if (error?.data?.detail && Array.isArray(error.data.detail)) {
        const firstError = error.data.detail[0];
        if (firstError && typeof firstError === 'object' && firstError.msg) {
          errorMessage = firstError.msg;
        }
      }
      
      Alert.alert(t("error"), errorMessage);
      setLoading(false);
    }
  };

  // 验证WhatsApp验证码并登录
  const handleVerifyWhatsAppCode = async () => {
    if (!verificationCode || verificationCode.length !== 4) {
      Alert.alert(t("error"), "请输入4位验证码");
      return;
    }

    try {
      setLoading(true);
      const countryCode = selectedCountry?.phoneCode || "+225";
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;

      console.log("[WhatsApp] 验证验证码 - 完整号码:", fullPhoneNumber);
      console.log("[WhatsApp] 验证验证码 - 验证码:", verificationCode);

      const res = await loginApi.verifyWhatsappOtp({
        phone_number: fullPhoneNumber,
        code: verificationCode,
      });

      if (res.access_token) {
        const token = res.token_type + " " + res.access_token;
        await AsyncStorage.setItem("token", token);

        if (res.first_login) {
          const countryCodeStr = selectedCountry?.phoneCode?.replace("+", "") || "225";
          const countryCode = parseInt(countryCodeStr);
          await handleFirstLoginSettings(res);
        }

        const user = await userApi.getProfile();
        if (user.language) {
          await changeLanguage(user.language);
        }

        setUser(user);
        setLoading(false);

        navigation.replace("MainTabs", { screen: "Home" });
      }
    } catch (error) {
      console.error("[WhatsApp] 验证码验证失败:", error);
      Alert.alert(t("error"), t("whatsapp.code_error"));
      setLoading(false);
    }
  };

  const handleCountrySelect = useCallback((country: Country) => {
    setSelectedCountry(country);
    setShowCountryModal(false);
  }, []);

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => handleCountrySelect(item)}
    >
      <Text style={styles.countryItemFlag}>{item.flag}</Text>
      <View style={styles.countryItemContent}>
        <Text style={styles.countryItemName}>{item.name}</Text>
        <Text style={styles.countryItemCode}>{item.phoneCode}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* 头部导航 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleClose}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Login</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* 登录内容区域 */}
      <View style={styles.loginContent}>
        
        {/* WhatsApp登录表单 */}
        <View style={styles.whatsappFormSection}>
          {!showVerificationInput ? (
            <>
              {/* WhatsApp图标和主标题 */}
              <View style={styles.whatsappHeader}>
                <Image
                  source={require("../../../assets/login/whatsapp.png")}
                  style={styles.whatsappIcon}
                />
                <Text style={styles.whatsappTitle}>WhatsApp Login</Text>
              </View>

              {/* 提示文本 */}
              <Text style={styles.whatsappHint}>
                We'll send a verification code to your WhatsApp
              </Text>

              {/* 手机号输入 */}
              <View style={styles.phoneInputContainer}>
                <TouchableOpacity
                  style={styles.countrySelector}
                  onPress={() => setShowCountryModal(true)}
                >
                  <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                  <Text style={styles.countryCode}>
                    {selectedCountry.phoneCode}
                  </Text>
                  <Text style={styles.downArrow}>▼</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.phoneInput}
                  placeholder="WhatsApp number"
                  placeholderTextColor="#9CA3AF"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="numeric"
                  returnKeyType="done"
                />
                {phoneNumber.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setPhoneNumber("")}
                  >
                    <Text style={styles.clearButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.whatsappButton,
                  (!phoneNumber.trim() || loading) && styles.disabledButton,
                ]}
                onPress={handleSendWhatsAppCode}
                disabled={loading || !phoneNumber.trim()}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.whatsappButtonText}>Send Code</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* 验证码输入 */}
              <View style={styles.whatsappHeader}>
                <Image
                  source={require("../../../assets/login/whatsapp.png")}
                  style={styles.whatsappIcon}
                />
                <Text style={styles.whatsappTitle}>
                  Enter Verification Code
                </Text>
              </View>

              <Text style={styles.verificationDescription}>
                We sent a code to {selectedCountry.phoneCode || "+225"}
                {phoneNumber}
              </Text>

              <TextInput
                style={styles.codeInput}
                placeholder="Enter 4-digit code"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="numeric"
                returnKeyType="done"
                maxLength={4}
                autoFocus
              />

              <TouchableOpacity
                style={[
                  styles.whatsappButton,
                  (!verificationCode ||
                    verificationCode.length !== 4 ||
                    loading) &&
                    styles.disabledButton,
                ]}
                onPress={handleVerifyWhatsAppCode}
                disabled={
                  loading || !verificationCode || verificationCode.length !== 4
                }
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.whatsappButtonText}>
                    Verify & Continue
                  </Text>
                )}
              </TouchableOpacity>

              {/* 重发验证码 */}
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive the code? </Text>
                <TouchableOpacity
                  onPress={handleSendWhatsAppCode}
                  disabled={countdown > 0 || loading}
                >
                  <Text
                    style={[
                      styles.resendLink,
                      (countdown > 0 || loading) && styles.disabledText,
                    ]}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* 分隔线 */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* 其他登录选项 */}
        <View style={styles.otherLoginSection}>
          {/* Google登录 */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleGoogleLogin}
          >
            <Image
              source={require("../../../assets/login/google.png")}
              style={styles.loginIcon}
            />
            <Text style={styles.loginButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Apple登录 - 只在iOS显示 */}
          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleAppleLogin}
            >
              <Image
                source={require("../../../assets/login/apple.png")}
                style={styles.loginIcon}
              />
              <Text style={styles.loginButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
          )}

          {/* 手机号登录 */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("PhoneLoginScreen")}
          >
            <Image
              source={require("../../../assets/login/phone.png")}
              style={styles.loginIcon}
            />
            <Text style={styles.loginButtonText}>Continue with Phone</Text>
          </TouchableOpacity>

          {/* 邮箱登录 */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("EmailLogin")}
          >
            <Image
              source={require("../../../assets/login/email.png")}
              style={styles.loginIcon}
            />
            <Text style={styles.loginButtonText}>Continue with Email</Text>
          </TouchableOpacity>
        </View>

        {/* 条款和隐私政策 */}
        <View style={styles.privacyContainer}>
          <Text style={styles.privacyText}>
            By continuing, you agree to our{" "}
            <Text
              style={styles.linkText}
              onPress={() => navigation.navigate("TermsOfUseScreen")}
            >
              Terms of Use
            </Text>{" "}
            and{" "}
            <Text
              style={styles.linkText}
              onPress={() => navigation.navigate("PrivacyPolicyScreen")}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </View>

      {/* 国家选择Modal */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCountryModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t("selectCountry")}</Text>
            </View>
            <FlatList
              data={countries}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.code}
              style={styles.countryList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: fontSize(28),
    color: "#374151",
    fontWeight: "300",
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize(20),
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  loginContent: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: fontSize(28),
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize(16),
    color: "#666",
    textAlign: "center",
    fontWeight: "400",
    lineHeight: 22,
  },
  primaryLoginSection: {
    marginBottom: 24,
  },
  primaryLoginButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF5100",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    shadowColor: "#FF5100",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryLoginText: {
    flex: 1,
    color: "#fff",
    fontSize: fontSize(16),
    fontWeight: "600",
    textAlign: "center",
    marginLeft: -24,
  },
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
  loginButtonText: {
    flex: 1,
    color: "#374151",
    fontSize: fontSize(16),
    fontWeight: "500",
    textAlign: "center",
    marginLeft: -24,
  },
  loginIcon: {
    width: 24,
    height: 24,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: fontSize(14),
    color: "#9ca3af",
    fontWeight: "400",
  },
  secondaryLoginSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 32,
  },
  secondaryLoginButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  secondaryLoginText: {
    color: "#374151",
    fontSize: fontSize(14),
    fontWeight: "500",
    marginLeft: 8,
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
    marginVertical: 20,
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
  linkText: {
    color: "#FF5100",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  privacyContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  privacyText: {
    fontSize: fontSize(13),
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18,
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
    fontSize: fontSize(16),
    color: "#374151",
    fontWeight: "600",
  },
  checkmark: {
    fontSize: fontSize(20),
    color: "#FF6B35",
    fontWeight: "bold",
  },
  // WhatsApp相关样式
  whatsappFormSection: {
    marginBottom: 20,
  },
  whatsappHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  whatsappIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  whatsappTitle: {
    fontSize: fontSize(28),
    fontWeight: "700",
    color: "#25D366",
  },
  whatsappHint: {
    fontSize: fontSize(14),
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  phoneInputContainer: {
    flexDirection: "row",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    overflow: "hidden",
    height: 56,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    height: "100%",
    minWidth: 100,
    justifyContent: "center",
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 6,
  },
  downArrow: {
    fontSize: 10,
    color: "#9CA3AF",
    marginLeft: 4,
  },
  phoneInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    fontSize: fontSize(12),
    paddingRight: 40,
    color: "#111827",
    letterSpacing: 0,
  },
  clearButton: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -12 }],
    height: 24,
    width: 24,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: fontSize(14),
    color: "#6B7280",
    fontWeight: "600",
    textAlign: "center",
  },
  whatsappButton: {
    height: 56,
    backgroundColor: "#25D366",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#25D366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: "#D1D5DB",
    shadowColor: "#000",
    shadowOpacity: 0.1,
  },
  whatsappButtonText: {
    color: "#fff",
    fontSize: fontSize(17),
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  verificationDescription: {
    fontSize: fontSize(14),
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 20,
  },
  codeInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    borderRadius: 25,
    paddingHorizontal: 16,
    fontSize: fontSize(18),
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 4,
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  resendText: {
    fontSize: fontSize(14),
    color: "#666",
  },
  resendLink: {
    fontSize: fontSize(14),
    color: "#25D366",
    fontWeight: "500",
  },
  disabledText: {
    color: "#CCCCCC",
  },
  otherLoginSection: {
    marginBottom: 20,
  },
  // Modal样式
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseButtonText: {
    fontSize: fontSize(18),
    color: "#999",
  },
  modalTitle: {
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
    borderBottomColor: "#F0F0F0",
  },
  countryItemFlag: {
    fontSize: fontSize(24),
    marginRight: 16,
  },
  countryItemContent: {
    flex: 1,
  },
});

export default LoginScreen;
