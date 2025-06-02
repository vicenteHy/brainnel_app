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
import useBurialPointStore from "../../store/burialPoint";
import { CountryList } from "../../constants/countries";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ForgotPhonePassword } from "./ForgotPhonePassword";
import fontSize from "../../utils/fontsizeUtils";
import { changeLanguage } from "../../i18n";
import { getCountryTransLanguage } from "../../utils/languageUtils";

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
  const burialPointStore = useBurialPointStore();

  // Phone login state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [phoneNumberError, setPhoneNumberError] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  // Add state for forgot password modal
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  // Countries
  const [countryList, setCountryList] = useState<CountryList[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryList>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate phone number against valid_digits
  const validatePhoneNumber = (phoneNum: string) => {
    if (
      !selectedCountry ||
      !selectedCountry.valid_digits ||
      selectedCountry.valid_digits.length === 0
    ) {
      return true; // No validation if no valid_digits available
    }

    return selectedCountry.valid_digits.includes(phoneNum.length);
  };

  // Handle phone number input with validation
  const handlePhoneNumberChange = (text: string) => {
    setPhoneNumber(text);
    if (text.length > 0) {
      setPhoneNumberError(!validatePhoneNumber(text));
      setPhoneNumberError(false);
      // todo 防止重复关闭
    } else {
      setPhoneNumberError(false);
    }
    setPasswordError(false);
  };

  // useEffect替换为普通函数
  React.useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  // 加载国家列表和选中的国家
  const loadData = async () => {
    try {
      const res = await settingApi.getSendSmsCountryList();

      setCountryList(res);

      const savedCountry = await AsyncStorage.getItem("@selected_country");
      if (savedCountry) {
        try {
          const parsedCountry = JSON.parse(savedCountry);
          const item = res.find(
            (item) => item.country === parsedCountry.country
          );
          setSelectedCountry(item);
        } catch (e) {
          console.error("Error parsing stored country", e);
        }
      }
    } catch (error) {
      console.error("Failed to load country data", error);
    }
  };

  // Select country
  const handleCountrySelect = (country: CountryList) => {
    setSelectedCountry(country);
    setShowCountryModal(false);

    // Save selected country to AsyncStorage
    AsyncStorage.setItem("@selected_country", JSON.stringify(country));
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

  // 忘记密码
  const handleForgotPassword = () => {
    // Open forgot password modal
    setShowForgotPasswordModal(true);
  };

  // Handle phone login
  const handlePhoneContinue = async () => {
    // Validate phone number before proceeding

    // todo 防止重复关闭
    // if (!validatePhoneNumber(phoneNumber)) {
    //   setPhoneNumberError(true);
    //   return;
    // }

    const params = {
      grant_type: "password",
      username: phoneNumber,
      password: password,
      client_id: "2",
      client_secret: "",
      scope: "",
    };
    try {
      setLoading(true);
      const res = await userApi.login(params);
      if (res.access_token) {
        const token = res.token_type + " " + res.access_token;
        await AsyncStorage.setItem("token", token);
        if (res.first_login) {
          const data = await settingApi.postFirstLogin(
            selectedCountry?.country || 221
          );
          setSettings(data);
        }
        const user = await userApi.getProfile();

        // 根据用户的语言设置切换i18n语言
        if (user.language) {
          await changeLanguage(user.language);
        }

        setUser(user);
        setLoading(false);
        
        // 收集登录成功埋点
        burialPointStore.logLogin(true, "phone");
        
        navigation.replace("MainTabs", { screen: "Home" });
        onClose();
      }
    } catch (error) {
      setError("用户名或密码错误");
      setLoading(false);
      setPasswordError(true);
      
      // 收集登录失败埋点
      burialPointStore.logLogin(false, "phone");
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
                maxLength={15}
              />
              {phoneNumber.length > 0 ? (
                <TouchableOpacity
                  style={styles.phoneClearButton}
                  onPress={() => {
                    setPhoneNumber("");
                    setPhoneNumberError(false);
                    setPasswordError(false);
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
                {t("invalidPhoneNumber")}
                {selectedCountry?.valid_digits &&
                  `(${t("requiresDigits")}: ${selectedCountry.valid_digits.join(
                    ", "
                  )})`}
              </Text>
            )}

            {/* Password input */}
            <View
              style={[
                styles.phoneInputContainer,
                passwordError && styles.passwordErrorContainer,
              ]}
            >
              <TextInput
                style={styles.passwordInput}
                placeholder={t("enterPassword")}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError(false);
                }}
                secureTextEntry={true}
                autoCapitalize="none"
              />
              {passwordError && (
                <View style={styles.passwordErrorIcon}>
                  <Text style={styles.passwordErrorIconText}>!</Text>
                </View>
              )}
            </View>

            {/* Password error message */}
            {passwordError && (
              <>
                <Text style={styles.passwordErrorText}>{error}</Text>

                <TouchableOpacity
                  style={styles.forgotPasswordLink}
                  onPress={handleForgotPassword}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotPasswordLinkText}>
                    {t("forgotPassword")}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <Text
              style={[styles.phoneInfoText, passwordError && { marginTop: 5 }]}
            ></Text>

            <TouchableOpacity
              style={[
                styles.phoneContinueButton,
                (phoneNumberError || !phoneNumber.trim() || !password) &&
                  styles.phoneDisabledButton,
              ]}
              onPress={handlePhoneContinue}
              disabled={phoneNumberError || !phoneNumber.trim() || !password}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.phoneContinueButtonText}>
                  {t("continue")}
                </Text>
              )}
            </TouchableOpacity>
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

        {/* Add ForgotPhonePassword modal */}
        <ForgotPhonePassword
          visible={showForgotPasswordModal}
          onClose={() => setShowForgotPasswordModal(false)}
          selectedCountry={selectedCountry}
          phoneNumber={phoneNumber}
        />
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
