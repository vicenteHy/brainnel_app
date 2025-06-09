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
  Alert
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
import { loginApi } from "../../services/api/login";
import { userApi } from "../../services";
import useUserStore from "../../store/user";

// 使用标准的ES6模块导入
let GoogleSignin: any = null;
let statusCodes: any = null;

try {
  const googleSigninModule = require("@react-native-google-signin/google-signin");
  GoogleSignin = googleSigninModule.GoogleSignin;
  statusCodes = googleSigninModule.statusCodes;
} catch (error) {
  console.log("Google Sign-in模块导入错误:", error);
}

// import { LoginManager, AccessToken, Settings } from "react-native-fbsdk-next";

const isDevelopment = __DEV__; // 开发模式检测
const isSimulator = Platform.OS === 'ios' && Platform.isPad === false && __DEV__;

// 配置 Google 登录 - 自动从 GoogleService-Info.plist 读取配置
if (GoogleSignin && !isSimulator) {
  try {
    GoogleSignin.configure({
      // 不指定 iosClientId，让 SDK 自动从 GoogleService-Info.plist 读取
      webClientId: "449517618313-av37nffa7rqkefu0ajh5auou3pb0mt51.apps.googleusercontent.com", // Web Client ID
      scopes: ["profile", "email"],
      offlineAccess: false,
      forceCodeForRefreshToken: false,
    });
  } catch (error) {
    console.log("Google Sign-in模块配置错误:", error);
  }
}

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
  const { setUser } = useUserStore();
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 全新的状态管理方式
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);

  // 防止多次触发
  const isProcessingEmail = useRef(false);
  const isProcessingPhone = useRef(false);

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
      handleClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [emailModalVisible, phoneModalVisible]);

  // 关闭主屏幕
  const handleClose = () => {
    if (isModal && onClose) {
      onClose();
    } else {
      navigation.goBack();
    }
  };

  // 处理谷歌登录
  const handleGoogleLogin = async () => {
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
        
        console.log("👤 获取用户信息...");
        const user = await userApi.getProfile();
        console.log("✅ 用户信息获取成功:", user);
        
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
  };
  const [userInfo, setUserInfo] = useState<any>(null);

  // useEffect(() => {
  //   // 确保在 App 启动时初始化 SDK。这通常在您的 App.js 的顶层完成。
  //   // 如果您在 app.json 中配置了 Facebook App ID，这里可以省略 Settings.setAppID 和 Settings.setDisplayName
  //   Settings.initializeSDK();

  //   // 在应用程序启动时检查是否已经登录（可选）
  //   AccessToken.getCurrentAccessToken().then(data => {
  //     if (data) {
  //       console.log("已登录 Facebook，Token:", data.accessToken);
  //       // 可以尝试获取用户信息
  //       // fetchFacebookProfile(data.accessToken);
  //     }
  //   });

  // }, []);


  // 辅助函数：获取 Facebook 用户资料 (可选，需要 'public_profile' 权限)
  // const fetchFacebookProfile = async (token:string) => {
  //   try {
  //     const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${token}`);
  //     const profile = await response.json();
  //     setUserInfo(profile);
  //     console.log('Facebook User Info:', profile);
  //   } catch (error) {
  //     console.error('获取 Facebook 用户资料错误:', error);
  //     Alert.alert("获取资料失败", "无法从 Facebook 获取用户详细资料，请检查网络或权限设置。");
  //   }
  // };

  // 处理Facebook登录
  const handleFacebookLogin = async () => {
    // try {
    //   // 可选: 先退出登录，确保每次都是全新登录 (主要用于测试)
    //   // await LoginManager.logOut();

    //   const result = await LoginManager.logInWithPermissions([
    //     "public_profile",
    //     "email",
    //   ]);

    //   if (result.isCancelled) {
    //     Alert.alert("登录取消", "用户取消了 Facebook 登录。");
    //     return;
    //   }

    //   const data = await AccessToken.getCurrentAccessToken();
    //   // 确保 accessToken 存在且为字符串
    //   if (!data || !data.accessToken) {
    //     Alert.alert("登录失败", "无法获取有效的 Facebook AccessToken。");
    //     return;
    //   }

    //   const tokenString = data.accessToken.toString();
    //   console.log("Facebook Access Token:", tokenString);

    //   // 直接获取 Facebook 用户信息并打印
    //   await fetchFacebookProfile(tokenString);

    //   // 移除之前的 Alert, 因为 fetchFacebookProfile 内部会处理打印和可能的错误提示
    //   // 如果 fetchFacebookProfile 成功，信息已在控制台，如果失败，它会 Alert
    //   // 可以选择在这里加一个通用成功提示，表明流程已执行
    //   Alert.alert("操作完成", "已尝试 Facebook 登录并获取用户信息，请查看控制台输出。");

    // } catch (error: any) {
    //   console.error("Facebook 登录或获取资料时发生错误:", error);
    //   let errorMessage = "发生未知错误";
    //   if (error && typeof error.message === 'string') {
    //     errorMessage = error.message;
    //   }
    //   Alert.alert("登录错误", `Facebook 操作失败：${errorMessage}`);
    // }
  };

  // 处理Apple登录
  const handleAppleLogin = () => {
    // 处理Apple登录
  };


  // 显示邮箱登录
  const showEmailModal = () => {
    if (isProcessingEmail.current) return;

    isProcessingEmail.current = true;
    // 确保手机模态框已关闭
    setPhoneModalVisible(false);

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
    // 确保邮箱模态框已关闭
    setEmailModalVisible(false);

    // 延迟打开手机模态框，避免冲突
    setTimeout(() => {
      setPhoneModalVisible(true);
      isProcessingPhone.current = false;
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

  // 处理忘记密码
  const handleForgotPassword = () => {
    // 处理忘记密码
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <View style={styles.safeAreaContent}>
        {/* 顶部蓝色背景区域 */}
        <View style={styles.blueHeader}>
          <Text style={styles.logo}>brainnel</Text>
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>💰</Text>
              </View>
              <Text style={styles.featureText}>{t("wholesalePrice")}</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>🚚</Text>
              </View>
              <Text style={styles.featureText}>{t("fastShipping")}</Text>
            </View>
          </View>
        </View>

        {/* 登录区域 */}
        <View style={styles.loginContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.subtitle}>{t("loginSubtitle")}</Text>
          </View>

          {/* 主要登录按钮 - Google */}
          <TouchableOpacity
            style={[styles.loginButton, styles.primaryButton]}
            onPress={handleGoogleLogin}
          >
            <View style={[styles.loginButtonIcon, styles.googleIcon]}>
              <Image
                source={require("../../../assets/img/google.png")}
                style={{ width: 24, height: 24 }}
              />
            </View>
            <Text style={[styles.loginButtonText, styles.primaryButtonText]}>
              使用 Google 继续
            </Text>
          </TouchableOpacity>

          {/* 分隔线 */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>或</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 其他登录方式 */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleFacebookLogin}
          >
            <View style={[styles.loginButtonIcon, styles.facebookIcon]}>
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: fontSize(16) }}>f</Text>
            </View>
            <Text style={styles.loginButtonText}>
              使用 Facebook 登录
            </Text>
          </TouchableOpacity>

          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleAppleLogin}
            >
              <View style={[styles.loginButtonIcon, styles.appleIconBg]}>
                {/* @ts-ignore */}
                <Icon name="apple" size={18} color="#fff" />
              </View>
              <Text style={styles.loginButtonText}>
                使用 Apple 登录
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.loginButton} onPress={showEmailModal}>
            <View style={styles.loginButtonIcon}>
              {/* @ts-ignore */}
              <Icon name="envelope" size={18} color="#666" />
            </View>
            <Text style={styles.loginButtonText}>使用邮箱登录</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={showPhoneModal}>
            <View style={styles.loginButtonIcon}>
              {/* @ts-ignore */}
              <Icon name="phone" size={18} color="#666" />
            </View>
            <Text style={styles.loginButtonText}>使用手机号登录</Text>
          </TouchableOpacity>

          {/* 忘记密码 */}
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>{t("forgotPassword")}</Text>
          </TouchableOpacity>

          {/* 服务条款 */}
          <View style={styles.termsContainer}>
            <Text style={styles.terms}>
              {t("termsText")}{" "}
              <Text style={styles.link}>{t("termsOfUse")}</Text>
            </Text>
            <Text style={styles.terms}>
              {t("and")} <Text style={styles.link}>{t("privacyPolicy")}</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* 邮箱登录模态框 - 直接渲染 */}
      <EmailLoginModal visible={emailModalVisible} onClose={hideEmailModal} />

      {/* 手机登录模态框 - 直接渲染 */}
      <PhoneLoginModal visible={phoneModalVisible} onClose={hidePhoneModal} />
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
    right: 15,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  closeButtonText: {
    color: "#fff",
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
});

export default LoginScreen;
