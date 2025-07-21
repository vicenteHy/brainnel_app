import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
import useAnalyticsStore from "../../store/analytics";
import { changeLanguage } from "../../i18n";
import { Country, countries } from "../../constants/countries";
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
  MainTabs: { screen: string };
};

interface WhatsAppLoginProps {
  handleFirstLoginSettings?: (loginResponse: any) => Promise<void>;
}

export const WhatsAppLogin: React.FC<WhatsAppLoginProps> = ({ 
  handleFirstLoginSettings 
}) => {
  const { setUser } = useUserStore();
  const analyticsStore = useAnalyticsStore();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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

  // 默认的处理首次登录设置函数
  const defaultHandleFirstLoginSettings = async (loginResponse: any) => {
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

        // 使用传入的处理函数或默认函数
        const handleSettings = handleFirstLoginSettings || defaultHandleFirstLoginSettings;
        await handleSettings(res);

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
      <View style={styles.container}>
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
    width: '100%',
  },
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
  countryCode: {
    fontSize: fontSize(16),
    color: "#374151",
    fontWeight: "600",
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
  countryList: {
    maxHeight: 400,
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
});

export default WhatsAppLogin;