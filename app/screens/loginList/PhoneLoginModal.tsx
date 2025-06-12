import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Keyboard,
  Modal,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  ForgotPassword: undefined;
};

type PhoneLoginModalProps = {
  visible: boolean;
  onClose: () => void;
};

// Define the styles type
type Styles = {
  phoneLoginContainer: ViewStyle;
  phoneLoginHeader: ViewStyle;
  phoneLoginCloseButton: ViewStyle;
  phoneLoginCloseButtonText: TextStyle;
  phoneLoginTitle: TextStyle;
  phoneLoginContent: ViewStyle;
  phoneInputContainer: ViewStyle;
  countrySelectRow: ViewStyle;
  countrySelectContent: ViewStyle;
  countryFlag: TextStyle;
  flag: ImageStyle;
  countryName: TextStyle;
  countryCode: TextStyle;
  downArrow: TextStyle;
  phoneInput: TextStyle;
  phoneClearButton: ViewStyle;
  phoneClearButtonText: TextStyle;
  phoneInfoText: TextStyle;
  phoneContinueButton: ViewStyle;
  phoneDisabledButton: ViewStyle;
  phoneContinueButtonText: TextStyle;
  passwordInput: TextStyle;
  passwordErrorContainer: ViewStyle;
  passwordErrorIcon: ViewStyle;
  passwordErrorIconText: TextStyle;
  passwordErrorText: TextStyle;
  forgotPasswordLink: ViewStyle;
  forgotPasswordLinkText: TextStyle;
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
  countryItemFlag: TextStyle;
  countryItemContent: ViewStyle;
  countryItemName: TextStyle;
  countryItemCode: TextStyle;
  modalContainer: ViewStyle;
  checkmark: TextStyle;
  countryCodeButton: ViewStyle;
  countryCodeFlag: ImageStyle;
  countryCodeText: TextStyle;
  countryCodeArrow: TextStyle;
  phoneInputDivider: ViewStyle;
  phoneNumberErrorText: TextStyle;
};

const PhoneLoginModal = ({ visible, onClose }: PhoneLoginModalProps) => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setSettings, setUser } = useUserStore();
  const analyticsStore = useAnalyticsStore();

  // Phone login state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [phoneNumberError, setPhoneNumberError] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState("");
  const [showCountryModal, setShowCountryModal] = useState(false);
  // Countries
  const [countryList, setCountryList] = useState<CountryList[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryList>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate phone number with 8-11 digits
  const validatePhoneNumber = (phoneNum: string) => {
    const cleanNumber = phoneNum.replace(/\D/g, '');
    return cleanNumber.length >= 8 && cleanNumber.length <= 11;
  };

  // Handle phone number input with validation
  const handlePhoneNumberChange = (text: string) => {
    console.log('[PhoneLogin] 输入手机号:', text);
    // Only allow digits
    const numericText = text.replace(/\D/g, '');
    console.log('[PhoneLogin] 过滤后手机号:', numericText);
    setPhoneNumber(numericText);
    if (numericText.length > 0) {
      const isValid = validatePhoneNumber(numericText);
      console.log('[PhoneLogin] 手机号验证结果:', isValid, '长度:', numericText.length);
      setPhoneNumberError(!isValid);
    } else {
      setPhoneNumberError(false);
    }
    setOtpError(false);
  };

  // useEffect替换为普通函数
  React.useEffect(() => {
    console.log('[PhoneLogin] Modal可见性变化:', visible);
    if (visible) {
      console.log('[PhoneLogin] Modal打开，加载数据');
      loadData();
    } else {
      console.log('[PhoneLogin] Modal关闭，重置状态');
      // 重置所有状态
      setPhoneNumber("");
      setOtpCode("");
      setPassword("");
      setOtpError(false);
      setPhoneNumberError(false);
      setShowOtpInput(false);
      setShowPasswordInput(false);
      setOtpSent(false);
      setCountdown(0);
      setError(null);
    }
  }, [visible]);

  // 加载国家列表和选中的国家
  const loadData = async () => {
    console.log('[PhoneLogin] 开始加载国家数据');
    try {
      const res = await settingApi.getSendSmsCountryList();
      console.log('[PhoneLogin] 获取国家列表成功，数量:', res.length);

      setCountryList(res);

      const savedCountry = await AsyncStorage.getItem("@selected_country");
      console.log('[PhoneLogin] 从存储获取的国家:', savedCountry);
      if (savedCountry) {
        try {
          const parsedCountry = JSON.parse(savedCountry);
          console.log('[PhoneLogin] 解析的国家数据:', parsedCountry);
          const item = res.find(
            (item) => item.country === parsedCountry.country
          );
          console.log('[PhoneLogin] 匹配到的国家:', item);
          setSelectedCountry(item);
        } catch (e) {
          console.error("[PhoneLogin] 解析存储的国家数据错误:", e);
        }
      } else {
        console.log('[PhoneLogin] 未找到存储的国家，使用默认');
      }
    } catch (error) {
      console.error("[PhoneLogin] 加载国家数据失败:", error);
    }
  };

  // Select country
  const handleCountrySelect = (country: CountryList) => {
    console.log('[PhoneLogin] 选择国家:', country);
    setSelectedCountry(country);
    setShowCountryModal(false);

    // Save selected country to AsyncStorage
    AsyncStorage.setItem("@selected_country", JSON.stringify(country));
    console.log('[PhoneLogin] 保存国家到存储:', country);
  };

  // Render country list item - with performance optimization
  const renderCountryItem = useCallback(
    ({ item }: { item: CountryList }) => (
      <TouchableOpacity
        style={styles.countryItem}
        onPress={() => handleCountrySelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.countryItemContent}>
          <Text style={styles.countryCode}>+{item.country}</Text>
          {/* <Image source={flagMap.get(item.name_en)} style={styles.flag} /> */}
          <Text style={[styles.countryName]}>
            {getCountryTransLanguage(item)}
          </Text>
        </View>
        {/* Add checkmark for selected country */}
        {selectedCountry && selectedCountry.country === item.country && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </TouchableOpacity>
    ),
    [selectedCountry]
  );


  // Send OTP code
  const handleSendOtp = async () => {
    console.log('[PhoneLogin] 准备发送验证码');
    console.log('[PhoneLogin] 当前手机号:', phoneNumber);
    console.log('[PhoneLogin] 选择的国家:', selectedCountry);
    
    if (!validatePhoneNumber(phoneNumber)) {
      console.log('[PhoneLogin] 手机号验证失败');
      setPhoneNumberError(true);
      return;
    }

    const fullPhoneNumber = `+${selectedCountry?.country || ''}${phoneNumber}`;
    
    // 检查发送限制
    console.log('[PhoneLogin] 🔒 检查发送限制...');
    const limitCheck = await VerificationLimiter.canSendVerification(fullPhoneNumber);
    if (!limitCheck.allowed) {
      console.log('[PhoneLogin] ❌ 发送被限制:', limitCheck.reason);
      setError(limitCheck.reason || "发送频率过快，请稍后再试");
      setPhoneNumberError(true);
      return;
    }
    console.log('[PhoneLogin] ✅ 发送限制检查通过');

    try {
      setLoading(true);
      console.log('[PhoneLogin] 完整手机号:', fullPhoneNumber);
      console.log('[PhoneLogin] 开始调用发送验证码API');
      
      const response = await userApi.sendOtp(fullPhoneNumber);
      console.log('[PhoneLogin] 发送验证码API响应:', response);
      
      // 记录发送
      await VerificationLimiter.recordAttempt(fullPhoneNumber);
      console.log('[PhoneLogin] 📝 记录发送');
      
      setOtpSent(true);
      setShowOtpInput(true);
      setLoading(false);
      setCountdown(60);
      console.log('[PhoneLogin] 验证码发送成功，开始倒计时');
      
      // Start countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            console.log('[PhoneLogin] 倒计时结束');
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('[PhoneLogin] 发送验证码失败:', error);
      
      // 记录发送尝试
      await VerificationLimiter.recordAttempt(fullPhoneNumber);
      console.log('[PhoneLogin] 📝 记录发送尝试');
      
      setError("发送验证码失败，请重试");
      setLoading(false);
      setPhoneNumberError(true);
    }
  };

  // Verify OTP and login
  const handleVerifyOtp = async () => {
    console.log('[PhoneLogin] 准备验证OTP');
    console.log('[PhoneLogin] 输入的验证码:', otpCode);
    console.log('[PhoneLogin] 验证码长度:', otpCode?.length);
    
    if (!otpCode || otpCode.length !== 6) {
      console.log('[PhoneLogin] 验证码格式错误');
      setOtpError(true);
      setError("请输入6位验证码");
      return;
    }

    try {
      setLoading(true);
      const fullPhoneNumber = `+${selectedCountry?.country || ''}${phoneNumber}`;
      console.log('[PhoneLogin] 验证的完整手机号:', fullPhoneNumber);
      console.log('[PhoneLogin] 开始调用验证OTP API');
      
      const res = await userApi.verifyOtp(fullPhoneNumber, otpCode);
      console.log('[PhoneLogin] 验证OTP API响应:', res);
      
      if (res.access_token) {
        console.log('[PhoneLogin] 获取到access_token，登录成功');
        const token = res.token_type + " " + res.access_token;
        console.log('[PhoneLogin] 保存token:', token);
        await AsyncStorage.setItem("token", token);
        
        if (res.first_login) {
          console.log('[PhoneLogin] 首次登录，获取设置');
          const data = await settingApi.postFirstLogin(
            selectedCountry?.country || 221
          );
          console.log('[PhoneLogin] 首次登录设置:', data);
          setSettings(data);
        }
        
        console.log('[PhoneLogin] 获取用户信息');
        const user = await userApi.getProfile();
        console.log('[PhoneLogin] 用户信息:', user);

        // 根据用户的语言设置切换i18n语言
        if (user.language) {
          console.log('[PhoneLogin] 切换语言到:', user.language);
          await changeLanguage(user.language);
        }

        setUser(user);
        setLoading(false);
        
        // 收集登录成功埋点
        console.log('[PhoneLogin] 记录登录成功埋点');
        analyticsStore.logLogin(true, "phone");
        
        console.log('[PhoneLogin] 跳转到主页');
        navigation.replace("MainTabs", { screen: "Home" });
        onClose();
      } else {
        console.log('[PhoneLogin] API响应中没有access_token');
      }
    } catch (error) {
      console.error('[PhoneLogin] 验证OTP失败:', error);
      setError("验证码错误或已过期");
      setLoading(false);
      setOtpError(true);
      
      // 收集登录失败埋点
      console.log('[PhoneLogin] 记录登录失败埋点');
      analyticsStore.logLogin(false, "phone");
    }
  };

  // Password login
  const handlePasswordLogin = async () => {
    console.log('[PhoneLogin] 准备密码登录');
    console.log('[PhoneLogin] 手机号:', phoneNumber);
    console.log('[PhoneLogin] 密码长度:', password?.length);

    if (!validatePhoneNumber(phoneNumber)) {
      console.log('[PhoneLogin] 手机号验证失败');
      setPhoneNumberError(true);
      return;
    }

    if (!password || password.length < 6) {
      console.log('[PhoneLogin] 密码验证失败');
      setError("密码至少6位");
      setOtpError(true);
      return;
    }

    try {
      setLoading(true);
      const fullPhoneNumber = `+${selectedCountry?.country || ''}${phoneNumber}`;
      console.log('[PhoneLogin] 密码登录完整手机号:', fullPhoneNumber);

      const params = {
        grant_type: "password",
        username: fullPhoneNumber,
        password: password,
        client_id: "2",
        client_secret: "",
        scope: "",
      };
      console.log('[PhoneLogin] 密码登录请求参数:', params);

      const res = await userApi.login(params);
      console.log('[PhoneLogin] 密码登录API响应:', res);

      if (res.access_token) {
        console.log('[PhoneLogin] 密码登录成功');
        const token = res.token_type + " " + res.access_token;
        await AsyncStorage.setItem("token", token);
        
        if (res.first_login) {
          const data = await settingApi.postFirstLogin(
            selectedCountry?.country || 221
          );
          setSettings(data);
        }
        
        const user = await userApi.getProfile();
        if (user.language) {
          await changeLanguage(user.language);
        }

        setUser(user);
        setLoading(false);
        
        analyticsStore.logLogin(true, "phone");
        navigation.replace("MainTabs", { screen: "Home" });
        onClose();
      }
    } catch (error) {
      console.error('[PhoneLogin] 密码登录失败:', error);
      setError("用户名或密码错误");
      setLoading(false);
      setOtpError(true);
      analyticsStore.logLogin(false, "phone");
    }
  };

  // 引用输入框
  const phoneInputRef = useRef<TextInput>(null);

  // 主动弹出键盘
  const focusPhoneInput = () => {
    if (phoneInputRef.current) {
      phoneInputRef.current.focus();
    }
  };

  React.useEffect(() => {
    if (visible) {
      // 当模态框显示时，等待动画完成后主动弹出键盘
      const timer = setTimeout(() => {
        focusPhoneInput();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => onClose()}
      statusBarTranslucent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.phoneLoginContainer}>
          <View style={styles.phoneLoginHeader}>
            <TouchableOpacity
              style={styles.phoneLoginCloseButton}
              onPress={() => onClose()}
              activeOpacity={0.7}
            >
              <Text style={styles.phoneLoginCloseButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.phoneLoginTitle}>{t("logInOrSignUp")}</Text>
          </View>

          <View style={styles.phoneLoginContent}>
            {/* Country Selector Row - Now removed as we integrated it into the phone input */}

            <View style={styles.phoneInputContainer}>
              <TouchableOpacity
                style={styles.countryCodeButton}
                onPress={() => setShowCountryModal(true)}
              >
                {/* {selectedCountry?.name_en && (
                  <Image 
                    source={flagMap.get(selectedCountry.name_en)} 
                    style={styles.countryCodeFlag} 
                  />
                )} */}
                <Text style={styles.countryCodeText}>
                  +{selectedCountry?.country}
                </Text>
                <Text style={styles.countryCodeArrow}>▼</Text>
              </TouchableOpacity>
              <View style={styles.phoneInputDivider} />
              <TextInput
                ref={phoneInputRef}
                style={styles.phoneInput}
                placeholder={t("phoneNumber")}
                value={phoneNumber}
                onChangeText={handlePhoneNumberChange}
                keyboardType="phone-pad"
                autoFocus
                maxLength={11}
              />
              {phoneNumber.length > 0 ? (
                <TouchableOpacity
                  style={styles.phoneClearButton}
                  onPress={() => {
                    setPhoneNumber("");
                    setPhoneNumberError(false);
                    setOtpError(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.phoneClearButtonText}>✕</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.phoneClearButton}
                  onPress={focusPhoneInput}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: fontSize(16), color: "#0066FF" }}>
                    ⌨️
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Phone number error message */}
            {phoneNumberError && (
              <Text style={styles.phoneNumberErrorText}>
                手机号必须为8-11位数字
              </Text>
            )}

            {/* Switch to password login button - positioned below phone input */}
            {!showOtpInput && !showPasswordInput && (
              <TouchableOpacity
                style={styles.switchToPasswordButton}
                onPress={() => {
                  console.log('[PhoneLogin] 切换到密码登录');
                  setShowPasswordInput(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.switchToPasswordText}>
                  使用密码登录
                </Text>
              </TouchableOpacity>
            )}

            {/* OTP input - only show when OTP is sent */}
            {showOtpInput && (
              <>
                <View
                  style={[
                    styles.phoneInputContainer,
                    otpError && styles.passwordErrorContainer,
                  ]}
                >
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="请输入6位验证码"
                    value={otpCode}
                    onChangeText={(text) => {
                      console.log('[PhoneLogin] 输入验证码:', text);
                      const numericText = text.replace(/\D/g, '').slice(0, 6);
                      console.log('[PhoneLogin] 过滤后验证码:', numericText);
                      setOtpCode(numericText);
                      setOtpError(false);
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus={showOtpInput}
                  />
                  {otpError && (
                    <View style={styles.passwordErrorIcon}>
                      <Text style={styles.passwordErrorIconText}>!</Text>
                    </View>
                  )}
                </View>

                {/* OTP error message */}
                {otpError && (
                  <Text style={styles.passwordErrorText}>{error}</Text>
                )}

                {/* Resend OTP */}
                {countdown === 0 ? (
                  <TouchableOpacity
                    style={styles.forgotPasswordLink}
                    onPress={async () => {
                      console.log('[PhoneLogin] 🔄 用户点击重新发送验证码');
                      
                      const fullPhoneNumber = `+${selectedCountry?.country || ''}${phoneNumber}`;
                      
                      // 检查重发限制
                      console.log('[PhoneLogin] 🔒 检查重发限制...');
                      const limitCheck = await VerificationLimiter.canSendVerification(fullPhoneNumber);
                      if (!limitCheck.allowed) {
                        console.log('[PhoneLogin] ❌ 重发被限制:', limitCheck.reason);
                        setError(limitCheck.reason || "重发频率过快，请稍后再试");
                        return;
                      }
                      console.log('[PhoneLogin] ✅ 重发限制检查通过');
                      
                      setOtpCode("");
                      setOtpError(false);
                      setError(null);
                      handleSendOtp();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotPasswordLinkText}>
                      重新发送验证码
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.countdownText}>
                    {countdown}秒后可重新发送
                  </Text>
                )}
              </>
            )}

            {/* Password input - only show when password login is selected */}
            {showPasswordInput && (
              <>
                <View
                  style={[
                    styles.phoneInputContainer,
                    otpError && styles.passwordErrorContainer,
                  ]}
                >
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="请输入密码"
                    value={password}
                    onChangeText={(text) => {
                      console.log('[PhoneLogin] 输入密码长度:', text.length);
                      setPassword(text);
                      setOtpError(false);
                    }}
                    secureTextEntry={true}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password"
                    textContentType="password"
                    importantForAutofill="yes"
                    keyboardType="default"
                    autoFocus={showPasswordInput}
                  />
                  {otpError && (
                    <View style={styles.passwordErrorIcon}>
                      <Text style={styles.passwordErrorIconText}>!</Text>
                    </View>
                  )}
                </View>

                {/* Password error message */}
                {otpError && (
                  <Text style={styles.passwordErrorText}>{error}</Text>
                )}
              </>
            )}

            <Text
              style={[styles.phoneInfoText, otpError && { marginTop: 5 }]}
            >
              {!showOtpInput && !showPasswordInput ? "我们将向您发送验证码短信" : ""}
            </Text>

            <TouchableOpacity
              style={[
                styles.phoneContinueButton,
                (showOtpInput
                  ? (otpError || !otpCode.trim() || otpCode.length !== 6)
                  : showPasswordInput
                  ? (otpError || !password.trim() || password.length < 6)
                  : (phoneNumberError || !phoneNumber.trim())) &&
                  styles.phoneDisabledButton,
              ]}
              onPress={
                showOtpInput 
                  ? handleVerifyOtp 
                  : showPasswordInput 
                  ? handlePasswordLogin 
                  : handleSendOtp
              }
              disabled={
                showOtpInput
                  ? (otpError || !otpCode.trim() || otpCode.length !== 6)
                  : showPasswordInput
                  ? (otpError || !password.trim() || password.length < 6)
                  : (phoneNumberError || !phoneNumber.trim())
              }
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.phoneContinueButtonText}>
                  {showOtpInput 
                    ? "验证并登录" 
                    : showPasswordInput 
                    ? "密码登录" 
                    : "发送验证码"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Switch back to OTP login when in password mode */}
            {showPasswordInput && (
              <TouchableOpacity
                style={styles.switchLoginTypeButton}
                onPress={() => {
                  console.log('[PhoneLogin] 切换到验证码登录');
                  setShowPasswordInput(false);
                  setPassword("");
                  setOtpError(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.switchLoginTypeText}>
                  使用验证码登录
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Country selection modal */}
          <Modal
            visible={showCountryModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowCountryModal(false)}
            hardwareAccelerated={true}
            statusBarTranslucent={true}
            presentationStyle="overFullScreen"
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
                  removeClippedSubviews={true}
                  initialNumToRender={10}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                  getItemLayout={(data, index) => ({
                    length: 69,
                    offset: 69 * index,
                    index,
                  })}
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
  phoneLoginContainer: {
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
  phoneLoginHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  phoneLoginCloseButton: {
    padding: 8,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  phoneLoginCloseButtonText: {
    fontSize: fontSize(18),
    color: "#000",
  },
  phoneLoginTitle: {
    flex: 1,
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginRight: 36,
  },
  phoneLoginContent: {
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
  countrySelectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E1E1E1",
    borderRadius: 25,
    height: 50,
    marginBottom: 15,
    paddingHorizontal: 16,
    backgroundColor: "#F7F7F7",
  },
  countrySelectContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  countryFlag: {
    fontSize: fontSize(22),
    marginRight: 12,
  },
  flag: {
    width: 24,
    height: 24,
    marginRight: 16,
  },
  countryName: {
    fontSize: fontSize(16),
    color: "#333",
    marginRight: 10,
    flex: 1,
  },
  countryCode: {
    fontSize: fontSize(15),
    color: "#666",
    marginRight: 10,
    width: 40,
    textAlign: "center",
  },
  downArrow: {
    fontSize: fontSize(12),
    color: "#666",
  },
  countryCodeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: "100%",
    minWidth: 80,
    justifyContent: "space-between",
  },
  countryCodeFlag: {
    width: 20,
    height: 20,
    marginRight: 4,
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
  },
  phoneContinueButton: {
    height: 50,
    backgroundColor: "#0039CB",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  phoneDisabledButton: {
    backgroundColor: "#CCCCCC",
  },
  phoneContinueButtonText: {
    color: "#fff",
    fontSize: fontSize(16),
    fontWeight: "600",
  },
  // Phone number error
  phoneNumberErrorText: {
    color: "#FF3B30",
    fontSize: fontSize(14),
    marginTop: -12,
    marginBottom: 16,
    paddingHorizontal: 5,
  },
  // Password styling
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    fontSize: fontSize(16),
  },
  passwordErrorContainer: {
    borderColor: "#FF3B30",
  },
  passwordErrorIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  passwordErrorIconText: {
    color: "white",
    fontWeight: "bold",
    fontSize: fontSize(16),
  },
  passwordErrorText: {
    color: "#FF3B30",
    fontSize: fontSize(14),
    marginTop: -12,
    marginBottom: 16,
    paddingHorizontal: 5,
  },
  forgotPasswordLink: {
    alignItems: "center",
    marginTop: 5,
  },
  forgotPasswordLinkText: {
    color: "#0066FF",
    fontSize: fontSize(14),
  },
  countdownText: {
    color: "#666",
    fontSize: fontSize(14),
    textAlign: "center",
    marginTop: 5,
  },
  switchLoginTypeButton: {
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 8,
  },
  switchLoginTypeText: {
    color: "#0066FF",
    fontSize: fontSize(14),
    textDecorationLine: "underline",
  },
  switchToPasswordButton: {
    alignSelf: "flex-end",
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  switchToPasswordText: {
    color: "#0066FF",
    fontSize: fontSize(12),
    textDecorationLine: "underline",
  },
  // Country modal styles
  countryModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    zIndex: 999,
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
  countryItemFlag: {
    fontSize: fontSize(24),
    marginRight: 16,
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
  countryItemCode: {
    fontSize: fontSize(14),
    color: "#666",
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    zIndex: 999,
  },
  checkmark: {
    fontSize: fontSize(20),
    color: "#0066FF",
    fontWeight: "bold",
    marginRight: 10,
  },
});

export default PhoneLoginModal;
