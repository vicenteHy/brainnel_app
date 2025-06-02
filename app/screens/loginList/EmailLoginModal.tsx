import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Keyboard,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Image
} from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { userApi } from "../../services/api/userApi";
import { settingApi } from "../../services/api/setting";
import useUserStore from "../../store/user";
import useAnalyticsStore from "../../store/analytics";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ForgotEmailPassword } from "./ForgotEmailPassword";
import BackIcon from "../../components/BackIcon";
import fontSize from "../../utils/fontsizeUtils";
import { changeLanguage } from "../../i18n";

// Common email domains list
const EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "mail.com",
  "protonmail.com",
  "qq.com",
  "163.com",
  "126.com",
];

type RootStackParamList = {
  Login: undefined;
  EmailLogin: undefined;
  MainTabs: { screen: string };
  Google: undefined;
  Home: { screen: string };
};

type EmailLoginModalProps = {
  visible: boolean;
  onClose: () => void;
};

const EmailLoginModal = ({ visible, onClose }: EmailLoginModalProps) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setSettings, setUser } = useUserStore();
  const analyticsStore = useAnalyticsStore();

  // 状态管理
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailPasswordError, setEmailPasswordError] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 防止重复关闭
  const isClosing = useRef(false);
  
  // 引用输入框
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  
  // 主动弹出键盘
  const focusEmailInput = () => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  };
  
  const focusPasswordInput = () => {
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  };

  React.useEffect(() => {
    if (visible) {
      // 当模态框显示时，等待动画完成后主动弹出键盘
      const timer = setTimeout(() => {
        focusEmailInput();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // 处理邮箱输入变化
  const handleEmailChange = (text: string) => {
    setEmail(text);

    // Check if it includes @ symbol
    if (text.includes("@")) {
      const [username, domain] = text.split("@");

      if (domain) {
        // If domain part is already entered, filter matching domains
        const filteredDomains = EMAIL_DOMAINS.filter((item) =>
          item.toLowerCase().startsWith(domain.toLowerCase())
        );

        // Generate complete email suggestion list
        const emailSuggestions = filteredDomains.map((d) => `${username}@${d}`);
        setSuggestions(emailSuggestions);
        setShowSuggestions(emailSuggestions.length > 0);
      } else {
        // If only @ is entered, show all domain suggestions
        const emailSuggestions = EMAIL_DOMAINS.map((d) => `${username}@${d}`);
        setSuggestions(emailSuggestions);
        setShowSuggestions(true);
      }
    } else if (text.length > 0) {
      // No @ symbol but has input content, show common email suffix suggestions
      const emailSuggestions = EMAIL_DOMAINS.map((d) => `${text}@${d}`);
      setSuggestions(emailSuggestions);
      setShowSuggestions(true);
    } else {
      // Empty input, don't show suggestions
      setShowSuggestions(false);
    }
  };

  // Select an email suggestion
  const handleSelectSuggestion = (suggestion: string) => {
    setEmail(suggestion);
    setShowSuggestions(false);
  };

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Render a single email suggestion item
  const renderSuggestionItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSelectSuggestion(item)}
    >
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  // Add state for forgot password modal
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Handle forgot password
  const handleForgotPassword = () => {
    // Show forgot password modal
    setShowForgotPasswordModal(true);
  };

  // Handle email login
  const handleEmailContinue = async () => {
    const params = {
      grant_type: "password",
      username: email,
      password: emailPassword,
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
        const data = await settingApi.postFirstLogin(221);
        setSettings(data);
        const user = await userApi.getProfile();
        
        // 根据用户的语言设置切换i18n语言
        if (user.language) {
          await changeLanguage(user.language);
        }
        
        setUser(user);
        setLoading(false);
        
        // 收集邮箱登录成功埋点
        analyticsStore.logLogin(true, "email");
        
        navigation.navigate("MainTabs", { screen: "Home" });
        onClose();
      }
    } catch (error) {
      setLoading(false);
      setError(t("passwordIncorrect"));
      setEmailPasswordError(true);
      
      // 收集邮箱登录失败埋点
      analyticsStore.logLogin(false, "email");
    }
  };

  // 安全地关闭模态框
  const closeEmailLogin = () => {
    console.log("Closing email login modal");
    // 确保键盘关闭
    Keyboard.dismiss();
    // 直接调用关闭回调
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => onClose()}
      statusBarTranslucent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.emailLoginContainer}>
          <View style={styles.emailLoginHeader}>
            <TouchableOpacity
              style={styles.emailLoginCloseButton}
              onPress={() => onClose()}
              activeOpacity={0.7}
            >
              <Text style={styles.emailLoginCloseButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.emailLoginTitle}>{t("logInOrSignUp")}</Text>
          </View>

          <View style={styles.emailLoginContent}>
            <View style={styles.emailInputContainer}>
              <TextInput
                ref={emailInputRef}
                style={styles.emailInput}
                placeholder={t("pleaseEnterEmail")}
                value={email}
                onChangeText={(text) => {
                  handleEmailChange(text);
                  setEmailPasswordError(false);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                maxLength={50}
              />
              {email.length > 0 ? (
                <TouchableOpacity
                  style={styles.emailClearButton}
                  onPress={() => {
                    setEmail("");
                    setShowSuggestions(false);
                    setEmailPasswordError(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emailClearButtonText}>✕</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.emailClearButton}
                  onPress={focusEmailInput}
                  activeOpacity={0.7}
                >
                  <Text style={{fontSize: fontSize(16), color: '#0066FF'}}>⌨️</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Email suffix suggestion list */}
            {showSuggestions && (
              <View style={styles.suggestionsContainer}>
                <FlatList
                  data={suggestions.slice(0, 5)} // Limit to showing 5 suggestions max
                  renderItem={renderSuggestionItem}
                  keyExtractor={(item) => item}
                  style={styles.suggestionsList}
                  keyboardShouldPersistTaps="handled"
                  removeClippedSubviews={true}
                  initialNumToRender={5}
                  maxToRenderPerBatch={5}
                  windowSize={5}
                  getItemLayout={(data, index) => ({
                    length: 44,
                    offset: 44 * index,
                    index,
                  })}
                />
              </View>
            )}

            {/* Password input */}
            <View
              style={[
                styles.passwordContainer,
                emailPasswordError && styles.passwordErrorContainer,
              ]}
            >
              <TextInput
                ref={passwordInputRef}
                style={styles.passwordInput}
                placeholder={t("enterPassword")}
                value={emailPassword}
                onChangeText={(text) => {
                  setEmailPassword(text);
                  setEmailPasswordError(false);
                }}
                secureTextEntry={true}
                autoCapitalize="none"
              />
              {emailPasswordError ? (
                <View style={styles.passwordErrorIcon}>
                  <Text style={styles.passwordErrorIconText}>!</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.emailClearButton}
                  onPress={focusPasswordInput}
                  activeOpacity={0.7}
                >
                  <Text style={{fontSize: fontSize(16), color: '#0066FF'}}>⌨️</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Password error message */}
            {emailPasswordError && (
              <>
                <Text style={styles.passwordErrorText}>
                  {error || t("passwordIncorrect")}
                </Text>

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

            <TouchableOpacity
              style={[
                styles.emailContinueButton,
                (!isValidEmail(email) || !emailPassword || loading) &&
                  styles.emailDisabledButton,
              ]}
              onPress={handleEmailContinue}
              disabled={!isValidEmail(email) || !emailPassword || loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.emailContinueButtonText}>
                  {t("continue")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Add ForgotEmailPassword modal */}
        <ForgotEmailPassword
          visible={showForgotPasswordModal}
          onClose={() => setShowForgotPasswordModal(false)}
          email={email}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    zIndex: 999,
  },
  emailLoginContainer: {
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
  emailLoginHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  emailLoginCloseButton: {
    padding: 8,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  emailLoginCloseButtonText: {
    fontSize: fontSize(18),
    color: "#000",
  },
  emailLoginTitle: {
    flex: 1,
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginRight: 36,
  },
  emailLoginContent: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 50 : 30,
    flex: 1,
  },
  emailInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E1E1E1",
    borderRadius: 25,
    height: 50,
    marginBottom: 20,
  },
  emailInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    fontSize: fontSize(16),
    paddingRight: 36,
  },
  emailClearButton: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -12 }],
    height: 24,
    width: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  emailClearButtonText: {
    fontSize: fontSize(16),
    color: "#999",
    fontWeight: "500",
    textAlign: "center",
  },
  suggestionsContainer: {
    borderWidth: 1,
    borderColor: "#E1E1E1",
    borderRadius: 10,
    marginTop: -10,
    marginBottom: 20,
    maxHeight: 200,
    backgroundColor: "#fff",
  },
  suggestionsList: {
    padding: 8,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  suggestionText: {
    fontSize: fontSize(16),
    color: "#333",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E1E1E1",
    borderRadius: 25,
    height: 50,
    marginBottom: 20,
    position: "relative",
  },
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
  emailContinueButton: {
    height: 50,
    backgroundColor: "#0039CB",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  emailDisabledButton: {
    backgroundColor: "#CCCCCC",
  },
  emailContinueButtonText: {
    color: "#fff",
    fontSize: fontSize(16),
    fontWeight: "600",
  },
});

export default EmailLoginModal; 