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
  ScrollView,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import fontSize from "../../utils/fontsizeUtils";
import { loginApi } from "../../services/api/login";
import { userApi } from "../../services";
import useUserStore from "../../store/user";
import useAnalyticsStore from "../../store/analytics";
import { settingApi } from "../../services/api/setting";
import { changeLanguage } from "../../i18n";
import { Country, countries } from "../../constants/countries";
import { AppleLoginButton } from '../login/AppleLogin';
import { GoogleLoginButton } from '../login/GoogleLogin';
import { handleLoginSettingsCheck } from "../../utils/userSettingsUtils";
import { AUTH_EVENTS } from '../../contexts/AuthContext';
import { DeviceFingerprintCollector } from '../../utils/deviceFingerprint';


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
  PhoneLoginScreen: undefined;
  TermsOfUseScreen: undefined;
  PrivacyPolicyScreen: undefined;
  MainTabs: { screen: string };
  Google: undefined;
  Home: { screen: string };
};

export const LoginScreen = () => {
  const { setUser, setSettings } = useUserStore();
  const analyticsStore = useAnalyticsStore();
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

  // 页面访问统计
  useEffect(() => {
    const analyticsStore = useAnalyticsStore.getState();
    analyticsStore.logPageView('login_list', 'app');
    
    return () => {
      analyticsStore.logPageLeave('login_list');
    };
  }, []);

  // 关闭主屏幕
  const handleClose = () => {
    navigation.goBack();
  };

  // 处理首次登录设置同步（使用新的通用函数）
  const handleFirstLoginSettings = async (loginResponse: any) => {
    await handleLoginSettingsCheck(loginResponse, 'whatsapp');
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
    console.log("[WhatsApp] handleVerifyWhatsAppCode 开始执行");
    console.log("[WhatsApp] 验证码:", verificationCode);
    
    if (!verificationCode || verificationCode.length !== 4) {
      console.log("[WhatsApp] 验证码格式错误，长度:", verificationCode?.length);
      Alert.alert(t("error"), "请输入4位验证码");
      return;
    }

    try {
      setLoading(true);
      const countryCode = selectedCountry?.phoneCode || "+225";
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;

      console.log("[WhatsApp] 验证验证码 - 完整号码:", fullPhoneNumber);
      console.log("[WhatsApp] 验证验证码 - 验证码:", verificationCode);

      // 收集设备指纹
      console.log("📱 收集设备指纹信息...");
      const deviceInfo = await DeviceFingerprintCollector.collectSimpleDeviceInfo();
      const fingerprintHash = deviceInfo.fingerprintHash;
      console.log("✅ 设备指纹收集完成:", fingerprintHash);

      const res = await loginApi.verifyWhatsappOtp({
        phone_number: fullPhoneNumber,
        code: verificationCode,
        fingerprint_hash: fingerprintHash,
      });

      if (res.access_token) {
        const token = res.token_type + " " + res.access_token;
        await AsyncStorage.setItem("token", token);

        // 无论是否首次登录都进行设置检查
        await handleFirstLoginSettings(res);

        const user = await userApi.getProfile();
        if (user.language) {
          await changeLanguage(user.language);
        }

        setUser(user);
        setLoading(false);

        // 发出登录成功事件通知
        console.log('[WhatsApp] 准备发出登录成功事件');
        console.log('[WhatsApp] global.EventEmitter 存在:', !!global.EventEmitter);
        if (global.EventEmitter) {
          console.log('[WhatsApp] 发送 LOGIN_SUCCESS 事件');
          global.EventEmitter.emit(AUTH_EVENTS.LOGIN_SUCCESS);
        } else {
          console.error('[WhatsApp] global.EventEmitter 不存在！');
        }

        // 记录登录成功埋点
        console.log("[WhatsApp] 准备发送登录成功埋点");
        analyticsStore.logLogin(true, "whatsapp");
        console.log("[WhatsApp] 登录成功埋点已调用");
        
        console.log('[WhatsApp] 准备导航到 MainTabs');
        // 使用与苹果/谷歌登录相同的导航方式
        navigation.navigate("MainTabs", { screen: "Home" });
        console.log('[WhatsApp] 导航命令已发送');
      }
    } catch (error) {
      console.error("[WhatsApp] 验证码验证失败:", error);
      Alert.alert(t("error"), t("whatsapp.code_error"));
      setLoading(false);
      // 记录登录失败埋点
      console.log("[WhatsApp] 准备发送登录失败埋点");
      analyticsStore.logLogin(false, "whatsapp");
      console.log("[WhatsApp] 登录失败埋点已调用");
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
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.safeAreaContent}>
      
      {/* 头部导航 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleClose}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Login</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* 登录内容区域 */}
      <ScrollView 
        style={styles.loginContent}
        contentContainerStyle={styles.loginContentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        
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
                placeholderTextColor="#999"
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
          <GoogleLoginButton 
            handleFirstLoginSettings={handleFirstLoginSettings}
          />

          {/* Apple登录 - 只在iOS显示 */}
          <AppleLoginButton 
            handleFirstLoginSettings={handleFirstLoginSettings}
          />

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
      </ScrollView>

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
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 20 : 15,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: fontSize(24),
    color: "#000",
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
  loginContentContainer: {
    paddingBottom: 40,
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
  whatsappIconBg: {
    backgroundColor: "#25D366",
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
  errorText: {
    color: "#ef4444",
    fontSize: fontSize(14),
    marginTop: 8,
    marginBottom: 8,
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
  // 国家选择模态框样式
  countryModalContainer: {
    flex: 1,
    backgroundColor: "#00000080",
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
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  countryItemFlag: {
    fontSize: fontSize(24),
    marginRight: 12,
  },
  countryItemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countryItemName: {
    fontSize: fontSize(16),
    color: "#374151",
  },
  countryItemCode: {
    fontSize: fontSize(16),
    color: "#374151",
    fontWeight: "600",
  },
  countryCode: {
    fontSize: fontSize(16),
    color: "#374151",
    fontWeight: "600",
  },
  countryList: {
    maxHeight: 400,
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
    fontSize: fontSize(20),
    marginRight: 6,
  },
  downArrow: {
    fontSize: fontSize(10),
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
    color: "#000",
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
    backgroundColor: "#00000080",
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
});

export default LoginScreen;
