import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
  ImageBackground,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import fontSize from "../../utils/fontsizeUtils";
import useAnalyticsStore from "../../store/analytics";
import { AppleLoginButton } from "../login/AppleLogin";
import { GoogleLoginButton } from "../login/GoogleLogin";



type RootStackParamList = {
  Login: undefined;
  EmailLogin: undefined;
  PhoneLoginScreen: undefined;
  TermsOfUseScreen: undefined;
  PrivacyPolicyScreen: undefined;
  MainTabs: { screen: string };
  Google: undefined;
  Home: { screen: string };
  WhatsAppLogin: undefined;
};

export const LoginScreen = () => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      {/* 头部导航带背景图 */}
      <ImageBackground
        source={require("../../../assets/img/loginBg.png")}
        style={styles.headerBackground}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeAreaHeader}>
          <View style={styles.headerOverlay}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={handleClose}>
                <Text style={styles.backButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Se connecter ou s'inscrire</Text>
              <View style={styles.headerSpacer} />
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>

      {/* 登录内容卡片 */}
      <View style={styles.cardContainer}>
          <ScrollView 
            style={styles.loginContent}
            contentContainerStyle={styles.loginContentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* 登录按钮区域 */}
            <View style={styles.loginButtonsSection}>
              {/* Apple登录 - 使用集成的登录组件 */}
              {Platform.OS === 'ios' && (
                <View style={styles.appleButtonWrapper}>
                  <AppleLoginButton 
                    onLoginStart={() => console.log('Apple login started')}
                    onLoginSuccess={() => console.log('Apple login success')}
                    onLoginError={(error) => console.error('Apple login error:', error)}
                  />
                </View>
              )}

              {/* Google登录 - 使用集成的登录组件 */}
              <View style={styles.googleButtonWrapper}>
                <GoogleLoginButton />
              </View>

              {/* 其他登录选项 */}
              <View style={styles.otherOptionsContainer}>
                {/* 手机号登录 */}
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => navigation.navigate("PhoneLoginScreen")}
                >
                  <Image
                    source={require("../../../assets/img/phone.png")}
                    style={styles.optionIcon}
                  />
                  <Text style={styles.optionText}>Téléphone</Text>
                </TouchableOpacity>

                {/* 邮箱登录 */}
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => navigation.navigate("EmailLogin")}
                >
                  <Image
                    source={require("../../../assets/img/email.png")}
                    style={[styles.optionIcon, styles.emailIcon]}
                  />
                  <Text style={styles.optionText}>E-mail</Text>
                </TouchableOpacity>

                {/* WhatsApp登录 */}
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => navigation.navigate("WhatsAppLogin")}
                >
                  <Image
                    source={require("../../../assets/img/whatsapp.png")}
                    style={styles.optionIcon}
                  />
                  <Text style={styles.optionText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 条款和隐私政策 */}
            <View style={styles.privacyContainer}>
              <Text style={styles.privacyText}>
                En continuant, vous acceptez nos{" "}
                <Text
                  style={styles.linkText}
                  onPress={() => navigation.navigate("TermsOfUseScreen")}
                >
                  Conditions d'utilisation
                </Text>{" "}
                et notre{" "}
                <Text
                  style={styles.linkText}
                  onPress={() => navigation.navigate("PrivacyPolicyScreen")}
                >
                  Politique de confidentialité
                </Text>
                .
              </Text>
            </View>
          </ScrollView>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeAreaHeader: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBackground: {
    width: '100%',
    height: 550,
  },
  headerOverlay: {
    flex: 1,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  header: { 
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 0 : 30,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: fontSize(32),
    color: "#fff",
    fontWeight: '300',
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize(18),
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginRight: 40,
  },
  headerSpacer: {
    width: 0,
  },
  loginContent: {
    flex: 1,
  },
  loginContentContainer: {
    flexGrow: 1,
    paddingTop: 10,
  },
  imageSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  backgroundIllustration: {
    width: '100%',
    height: 380,
  },
  loginButtonsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  appleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  appleButtonText: {
    flex: 1,
    color: '#fff',
    fontSize: fontSize(16),
    fontWeight: '500',
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleButtonText: {
    flex: 1,
    color: '#000',
    fontSize: fontSize(16),
    fontWeight: '500',
    textAlign: 'center',
  },
  arrowText: {
    fontSize: fontSize(20),
    color: '#666',
    marginLeft: 8,
  },
  appleButtonWrapper: {
    width: '100%',
  },
  googleButtonWrapper: {
    width: '100%',
  },
  otherOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
  },
  optionButton: {
    alignItems: 'center',
  },
  optionIcon: {
    width: 50,
    height: 50,
    marginBottom: 8,
  },
  emailIcon: {
    width: 50,
    height: 50,
  },
  optionText: {
    fontSize: fontSize(14),
    color: '#000',
    fontWeight: '400',
  },
  privacyContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  privacyText: {
    fontSize: fontSize(12),
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
  },
  linkText: {
    color: "#FF6B35",
    fontWeight: "400",
    textDecorationLine: "underline",
  },
  phoneIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  phoneIcon: {
    width: 28,
    height: 28,
    tintColor: '#fff',
  },
  whatsappIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#25D366',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  whatsappIcon: {
    width: 28,
    height: 28,
    tintColor: '#fff',
  },
});

export default LoginScreen;
