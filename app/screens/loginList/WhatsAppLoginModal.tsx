import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginApi } from "../../services/api/login";
import { userApi } from "../../services/api/userApi";
import { settingApi } from "../../services/api/setting";
import useUserStore from "../../store/user";
import useAnalyticsStore from "../../store/analytics";
import { CountryList } from "../../constants/countries";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import fontSize from "../../utils/fontsizeUtils";
import { changeLanguage } from "../../i18n";
import { getCountryTransLanguage } from "../../utils/languageUtils";
import VerificationLimiter from "../../utils/verificationLimiter";

type RootStackParamList = {
  Login: undefined;
  EmailLogin: undefined;
  MainTabs: { screen: string };
  Google: undefined;
  Home: { screen: string };
};

type WhatsAppLoginModalProps = {
  visible: boolean;
  onClose: () => void;
};

type Styles = {
  modalContainer: ViewStyle;
  whatsappLoginContainer: ViewStyle;
  whatsappLoginHeader: ViewStyle;
  whatsappLoginCloseButton: ViewStyle;
  whatsappLoginCloseButtonText: TextStyle;
  whatsappLoginTitle: TextStyle;
  whatsappLoginContent: ViewStyle;
  phoneInputContainer: ViewStyle;
  countryCodeButton: ViewStyle;
  countryCodeText: TextStyle;
  countryCodeArrow: TextStyle;
  phoneInputDivider: ViewStyle;
  phoneInput: TextStyle;
  phoneClearButton: ViewStyle;
  phoneClearButtonText: TextStyle;
  phoneInfoText: TextStyle;
  sendOtpButton: ViewStyle;
  phoneDisabledButton: ViewStyle;
  sendOtpButtonText: TextStyle;
  otpContainer: ViewStyle;
  otpTitle: TextStyle;
  otpSubtitle: TextStyle;
  otpInputContainer: ViewStyle;
  otpInput: TextStyle;
  verifyButton: ViewStyle;
  verifyButtonText: TextStyle;
  resendContainer: ViewStyle;
  resendText: TextStyle;
  resendLink: TextStyle;
  countryModalContainer: ViewStyle;
  countryModalOverlay: ViewStyle;
  countryModalContent: ViewStyle;
  modalHandleContainer: ViewStyle;
  modalHandle: ViewStyle;
  countryModalHeader: ViewStyle;
  countryModalCloseButton: ViewStyle;
  countryModalCloseButtonText: TextStyle;
  countryModalTitle: TextStyle;
  countryList: ViewStyle;
  countryItem: ViewStyle;
  countryItemContent: ViewStyle;
  countryItemName: TextStyle;
  countryCode: TextStyle;
  checkmark: TextStyle;
  phoneNumberErrorText: TextStyle;
};

const WhatsAppLoginModal = ({ visible, onClose }: WhatsAppLoginModalProps) => {
  const { t, i18n } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setSettings, setUser } = useUserStore();
  const analyticsStore = useAnalyticsStore();

  // States
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [phoneNumberError, setPhoneNumberError] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countryList, setCountryList] = useState<CountryList[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryList>();
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate phone number (8-11 digits)
  const validatePhoneNumber = (phoneNum: string) => {
    const length = phoneNum.length;
    return length >= 8 && length <= 11;
  };

  // Handle phone number input with validation
  const handlePhoneNumberChange = (text: string) => {
    setPhoneNumber(text);
    if (text.length > 0) {
      setPhoneNumberError(!validatePhoneNumber(text));
    } else {
      setPhoneNumberError(false);
    }
    setError(null);
  };

  // Load data when modal opens
  React.useEffect(() => {
    if (visible) {
      console.log("📱 WhatsApp登录模态框打开，开始加载数据");
      loadData();
    }
  }, [visible]);

  // Load country list and selected country
  const loadData = async () => {
    try {
      console.log("🌍 开始加载国家列表...");
      const res = await settingApi.getSendSmsCountryList();
      console.log("✅ 国家列表加载成功，共", res.length, "个国家");
      setCountryList(res);

      console.log("💾 检查本地保存的国家设置...");
      const savedCountry = await AsyncStorage.getItem("@selected_country");
      if (savedCountry) {
        try {
          const parsedCountry = JSON.parse(savedCountry);
          console.log("📱 找到本地保存的国家:", parsedCountry);
          const item = res.find(
            (item) => item.country === parsedCountry.country
          );
          if (item) {
            console.log("✅ 设置选中国家:", item);
            setSelectedCountry(item);
          } else {
            console.log("❌ 本地保存的国家在列表中未找到");
          }
        } catch (e) {
          console.error("❌ 解析本地保存国家失败:", e);
        }
      } else {
        console.log("ℹ️ 没有找到本地保存的国家设置");
      }
    } catch (error) {
      console.error("❌ 加载国家数据失败:", error);
    }
  };

  // Select country
  const handleCountrySelect = (country: CountryList) => {
    console.log("🌍 用户选择国家:", country);
    setSelectedCountry(country);
    setShowCountryModal(false);
    AsyncStorage.setItem("@selected_country", JSON.stringify(country));
    console.log("💾 国家选择已保存到本地存储");
  };

  // Render country list item
  const renderCountryItem = useCallback(
    ({ item }: { item: CountryList }) => (
      <TouchableOpacity
        style={styles.countryItem}
        onPress={() => handleCountrySelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.countryItemContent}>
          <Text style={styles.countryCode}>+{item.country}</Text>
          <Text style={[styles.countryItemName]}>
            {getCountryTransLanguage(item)}
          </Text>
        </View>
        {selectedCountry && selectedCountry.country === item.country && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </TouchableOpacity>
    ),
    [selectedCountry]
  );

  // Send WhatsApp OTP
  const handleSendOtp = async () => {
    console.log("🚀 WhatsApp发送OTP按钮被点击");
    console.log("📱 输入的手机号:", phoneNumber);
    console.log("🌍 选中的国家代码:", selectedCountry?.country);
    console.log("🌐 当前语言:", i18n.language);
    
    if (!validatePhoneNumber(phoneNumber)) {
      console.log("❌ 手机号验证失败，长度:", phoneNumber.length);
      setPhoneNumberError(true);
      return;
    }
    
    console.log("✅ 手机号验证通过");
    
    const fullPhoneNumber = `+${selectedCountry?.country}${phoneNumber}`;
    
    // 检查发送限制
    console.log("🔒 检查发送限制...");
    const limitCheck = await VerificationLimiter.canSendVerification(fullPhoneNumber);
    if (!limitCheck.allowed) {
      console.log("❌ 发送被限制:", limitCheck.reason);
      setError(limitCheck.reason || "发送频率过快，请稍后再试");
      return;
    }
    console.log("✅ 发送限制检查通过");
    
    // 检查API配置
    console.log("🔧 API配置检查:");
    console.log("  - 基础URL: https://api.brainnel.com/backend");
    console.log("  - 请求路径: /api/users/send-whatsapp-otp/");
    console.log("  - 完整URL: https://api.brainnel.com/backend/api/users/send-whatsapp-otp/");
    console.log("  - 超时设置: 150000ms (150秒)");

    try {
      setLoading(true);
      setError(null);
      
      console.log("📞 完整手机号:", fullPhoneNumber);
      
      const requestData = {
        phone_number: fullPhoneNumber,
        language: i18n.language || "zh"
      };
      console.log("📡 发送WhatsApp OTP请求数据:", JSON.stringify(requestData, null, 2));
      
      // 添加请求开始时间记录
      const requestStartTime = Date.now();
      console.log("⏰ 请求开始时间:", new Date(requestStartTime).toISOString());
      
      const response = await loginApi.sendWhatsappOtp(requestData);
      const requestEndTime = Date.now();
      const requestDuration = requestEndTime - requestStartTime;
      console.log("⏰ 请求结束时间:", new Date(requestEndTime).toISOString());
      console.log("⏱️ 请求耗时:", requestDuration + "ms");
      console.log("✅ WhatsApp OTP发送成功:", JSON.stringify(response, null, 2));
      
      // 记录发送
      await VerificationLimiter.recordAttempt(fullPhoneNumber);
      console.log("📝 记录发送");
      
      setShowOtpInput(true);
      setLoading(false);
      console.log("🎉 切换到OTP输入界面");
      Alert.alert(t("whatsapp.verification_code_sent"), t("whatsapp.check_whatsapp"));
    } catch (error: any) {
      console.error("❌ 发送WhatsApp OTP失败:", error);
      console.error("❌ 错误详情:", JSON.stringify(error, null, 2));
      
      // 记录发送尝试
      await VerificationLimiter.recordAttempt(fullPhoneNumber);
      console.log("📝 记录发送尝试");
      
      let errorMessage = t("whatsapp.login_failed");
      
      if (error.code === 'ECONNABORTED') {
        console.error("⏰ 请求超时 - API可能不存在或服务器响应缓慢");
        errorMessage = t("whatsapp.login_failed");
      } else if (error.response) {
        console.error("📊 响应状态:", error.response.status);
        console.error("📊 响应数据:", JSON.stringify(error.response.data, null, 2));
        
        if (error.response.status === 404) {
          errorMessage = t("whatsapp.login_failed");
        } else if (error.response.status >= 500) {
          errorMessage = t("whatsapp.login_failed");
        } else if (error.response.status === 422) {
          errorMessage = t("whatsapp.phone_error");
        }
      } else if (error.request) {
        console.error("📡 请求信息:", JSON.stringify(error.request, null, 2));
        console.error("❌ 没有收到响应");
        errorMessage = t("whatsapp.login_failed");
      } else {
        console.error("❌ 错误配置:", error.message);
      }
      
      setLoading(false);
      setError(errorMessage);
    }
  };

  // Verify WhatsApp OTP
  const handleVerifyOtp = async () => {
    console.log("🔐 WhatsApp验证OTP按钮被点击");
    console.log("📱 输入的验证码:", otpCode);
    console.log("📞 手机号:", `+${selectedCountry?.country}${phoneNumber}`);
    
    if (!otpCode.trim()) {
      console.log("❌ 验证码为空");
      setError(t("whatsapp.enter_code"));
      return;
    }
    
    console.log("✅ 验证码验证通过，开始验证流程");

    try {
      setOtpLoading(true);
      setError(null);
      
      const fullPhoneNumber = `+${selectedCountry?.country}${phoneNumber}`;
      const requestData = {
        phone_number: fullPhoneNumber,
        code: otpCode
      };
      console.log("📡 发送WhatsApp OTP验证请求数据:", JSON.stringify(requestData, null, 2));
      
      const res = await loginApi.verifyWhatsappOtp(requestData);
      console.log("✅ WhatsApp OTP验证成功:", JSON.stringify(res, null, 2));

      if (res.access_token) {
        console.log("🔑 获取到access_token，开始保存token");
        const token = `${res.token_type} ${res.access_token}`;
        await AsyncStorage.setItem("token", token);
        console.log("✅ Token已保存:", token);
        
        if (res.first_login) {
          console.log("🆕 检测到首次登录，开始同步本地设置");
          const countryCode = selectedCountry?.country || 221;
          console.log("🌍 使用国家代码:", countryCode);
          
          const data = await settingApi.postFirstLogin(countryCode);
          console.log("✅ 首次登录设置创建成功:", JSON.stringify(data, null, 2));
          setSettings(data);
        } else {
          console.log("ℹ️ 非首次登录，跳过设置同步");
        }
        
        console.log("👤 获取用户信息...");
        const user = await userApi.getProfile();
        console.log("✅ 用户信息获取成功:", JSON.stringify(user, null, 2));
        
        if (user.language) {
          console.log("🌐 同步用户语言设置:", user.language);
          await changeLanguage(user.language);
          console.log("✅ 语言设置同步完成");
        }
        
        setUser(user);
        setOtpLoading(false);
        
        console.log("📊 记录登录成功埋点");
        analyticsStore.logLogin(true, "whatsapp");
        
        console.log("🏠 导航到主页...");
        navigation.replace("MainTabs", { screen: "Home" });
        onClose();
        console.log("🎉 WhatsApp登录流程完成");
      } else {
        console.error("❌ 响应中没有access_token");
        setOtpLoading(false);
        setError(t("whatsapp.login_failed"));
      }
    } catch (error: any) {
      console.error("❌ 验证WhatsApp OTP失败:", error);
      console.error("❌ 错误详情:", JSON.stringify(error, null, 2));
      
      if (error.response) {
        console.error("📊 响应状态:", error.response.status);
        console.error("📊 响应头:", JSON.stringify(error.response.headers, null, 2));
        console.error("📊 响应数据:", JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error("📡 请求信息:", JSON.stringify(error.request, null, 2));
        console.error("❌ 没有收到响应");
      } else {
        console.error("❌ 错误配置:", error.message);
      }
      
      setOtpLoading(false);
      setError(t("whatsapp.code_error"));
      
      console.log("📊 记录登录失败埋点");
      analyticsStore.logLogin(false, "whatsapp");
    }
  };

  // Handle OTP input change
  const handleOtpChange = (text: string) => {
    console.log("⌨️ 用户输入验证码:", text);
    setOtpCode(text);
    setError(null);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    console.log("🔄 用户点击重新发送验证码");
    
    const fullPhoneNumber = `+${selectedCountry?.country}${phoneNumber}`;
    
    // 检查重发限制
    console.log("🔒 检查重发限制...");
    const limitCheck = await VerificationLimiter.canSendVerification(fullPhoneNumber);
    if (!limitCheck.allowed) {
      console.log("❌ 重发被限制:", limitCheck.reason);
      setError(limitCheck.reason || "重发频率过快，请稍后再试");
      return;
    }
    console.log("✅ 重发限制检查通过");
    
    setOtpCode("");
    setError(null);
    handleSendOtp();
  };

  // Reset modal state when closing
  const handleClose = () => {
    console.log("❌ 关闭WhatsApp登录模态框");
    setPhoneNumber("");
    setOtpCode("");
    setShowOtpInput(false);
    setPhoneNumberError(false);
    setError(null);
    setLoading(false);
    setOtpLoading(false);
    onClose();
  };

  const phoneInputRef = useRef<TextInput>(null);
  const otpInputRef = useRef<TextInput>(null);

  // Focus phone input when modal opens
  React.useEffect(() => {
    if (visible && !showOtpInput) {
      const timer = setTimeout(() => {
        phoneInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible, showOtpInput]);

  // Focus OTP input when OTP screen shows
  React.useEffect(() => {
    if (showOtpInput) {
      const timer = setTimeout(() => {
        otpInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showOtpInput]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.whatsappLoginContainer}>
          <View style={styles.whatsappLoginHeader}>
            <TouchableOpacity
              style={styles.whatsappLoginCloseButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.whatsappLoginCloseButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.whatsappLoginTitle}>
              {showOtpInput ? t("whatsapp.verification_title") : t("whatsapp.title")}
            </Text>
          </View>

          <View style={styles.whatsappLoginContent}>
            {!showOtpInput ? (
              // Phone number input screen
              <>
                <View style={styles.phoneInputContainer}>
                  <TouchableOpacity
                    style={styles.countryCodeButton}
                    onPress={() => setShowCountryModal(true)}
                  >
                    <Text style={styles.countryCodeText}>
                      +{selectedCountry?.country || "1"}
                    </Text>
                    <Text style={styles.countryCodeArrow}>▼</Text>
                  </TouchableOpacity>
                  <View style={styles.phoneInputDivider} />
                  <TextInput
                    ref={phoneInputRef}
                    style={styles.phoneInput}
                    placeholder={t("whatsapp.phone_placeholder")}
                    value={phoneNumber}
                    onChangeText={handlePhoneNumberChange}
                    keyboardType="phone-pad"
                    autoFocus
                    maxLength={11}
                  />
                  {phoneNumber.length > 0 && (
                    <TouchableOpacity
                      style={styles.phoneClearButton}
                      onPress={() => {
                        setPhoneNumber("");
                        setPhoneNumberError(false);
                        setError(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.phoneClearButtonText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {phoneNumberError && (
                  <Text style={styles.phoneNumberErrorText}>
                    {t("whatsapp.phone_error")}
                  </Text>
                )}

                {error && (
                  <Text style={styles.phoneNumberErrorText}>{error}</Text>
                )}

                <Text style={styles.phoneInfoText}>
                  {t("whatsapp.info_text")}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.sendOtpButton,
                    (phoneNumberError || !phoneNumber.trim()) &&
                      styles.phoneDisabledButton,
                  ]}
                  onPress={handleSendOtp}
                  disabled={phoneNumberError || !phoneNumber.trim() || loading}
                  activeOpacity={0.7}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.sendOtpButtonText}>{t("whatsapp.send_code")}</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              // OTP verification screen
              <View style={styles.otpContainer}>
                <Text style={styles.otpTitle}>{t("whatsapp.enter_code")}</Text>
                <Text style={styles.otpSubtitle}>
                  {t("whatsapp.code_sent_info", {
                    countryCode: selectedCountry?.country,
                    phoneNumber: phoneNumber
                  })}
                </Text>

                <View style={styles.otpInputContainer}>
                  <TextInput
                    ref={otpInputRef}
                    style={styles.otpInput}
                    placeholder={t("whatsapp.code_placeholder")}
                    value={otpCode}
                    onChangeText={handleOtpChange}
                    keyboardType="number-pad"
                    maxLength={4}
                    autoFocus
                  />
                </View>

                {error && (
                  <Text style={styles.phoneNumberErrorText}>{error}</Text>
                )}

                <TouchableOpacity
                  style={[
                    styles.verifyButton,
                    !otpCode.trim() && styles.phoneDisabledButton,
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={!otpCode.trim() || otpLoading}
                  activeOpacity={0.7}
                >
                  {otpLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.verifyButtonText}>{t("whatsapp.connect")}</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.resendContainer}>
                  <Text style={styles.resendText}>{t("whatsapp.resend_text")}</Text>
                  <TouchableOpacity onPress={handleResendOtp}>
                    <Text style={styles.resendLink}>{t("whatsapp.resend_link")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Country selection modal */}
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
                  <Text style={styles.countryModalTitle}>
                    {t("selectCountry")}
                  </Text>
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
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create<Styles>({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  whatsappLoginContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  whatsappLoginHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  whatsappLoginCloseButton: {
    padding: 8,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  whatsappLoginCloseButtonText: {
    fontSize: fontSize(18),
    color: "#000",
  },
  whatsappLoginTitle: {
    flex: 1,
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginRight: 36,
  },
  whatsappLoginContent: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 50 : 30,
    flex: 1,
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E1E1E1",
    borderRadius: 25,
    height: 50,
    marginBottom: 20,
    position: "relative",
  },
  countryCodeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: "100%",
    minWidth: 80,
    justifyContent: "space-between",
  },
  countryCodeText: {
    fontSize: fontSize(15),
    color: "#333",
  },
  countryCodeArrow: {
    fontSize: fontSize(10),
    color: "#666",
    marginLeft: 2,
  },
  phoneInputDivider: {
    width: 1,
    height: "60%",
    backgroundColor: "#E1E1E1",
  },
  phoneInput: {
    flex: 1,
    height: "100%",
    paddingLeft: 10,
    paddingRight: 36,
    fontSize: fontSize(16),
  },
  phoneClearButton: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -12 }],
    height: 24,
    width: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  phoneClearButtonText: {
    fontSize: fontSize(16),
    color: "#999",
    fontWeight: "500",
    textAlign: "center",
  },
  phoneInfoText: {
    fontSize: fontSize(14),
    color: "#666",
    marginBottom: 32,
    lineHeight: 20,
    textAlign: "center",
  },
  sendOtpButton: {
    height: 50,
    backgroundColor: "#25D366",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  phoneDisabledButton: {
    backgroundColor: "#CCCCCC",
  },
  sendOtpButtonText: {
    color: "#fff",
    fontSize: fontSize(16),
    fontWeight: "600",
  },
  otpContainer: {
    alignItems: "center",
  },
  otpTitle: {
    fontSize: fontSize(22),
    fontWeight: "600",
    color: "#000",
    marginBottom: 10,
  },
  otpSubtitle: {
    fontSize: fontSize(14),
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 20,
  },
  otpInputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#E1E1E1",
    borderRadius: 25,
    height: 50,
    paddingHorizontal: 16,
    fontSize: fontSize(16),
    textAlign: "center",
    letterSpacing: 2,
  },
  verifyButton: {
    height: 50,
    backgroundColor: "#25D366",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: fontSize(16),
    fontWeight: "600",
  },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  resendText: {
    fontSize: fontSize(14),
    color: "#666",
    marginRight: 5,
  },
  resendLink: {
    fontSize: fontSize(14),
    color: "#25D366",
    fontWeight: "600",
  },
  phoneNumberErrorText: {
    color: "#FF3B30",
    fontSize: fontSize(14),
    marginTop: -12,
    marginBottom: 16,
    paddingHorizontal: 5,
    textAlign: "center",
  },
  // Country modal styles
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
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  countryModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  countryModalCloseButton: {
    padding: 4,
  },
  countryModalCloseButtonText: {
    fontSize: fontSize(18),
    color: "#999",
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
    borderBottomColor: "#F0F0F0",
  },
  countryItemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  countryItemName: {
    fontSize: fontSize(16),
    color: "#333",
  },
  countryCode: {
    fontSize: fontSize(15),
    color: "#666",
    marginRight: 10,
    width: 40,
    textAlign: "center",
  },
  checkmark: {
    fontSize: fontSize(20),
    color: "#25D366",
    fontWeight: "bold",
    marginRight: 10,
  },
});

export default WhatsAppLoginModal;