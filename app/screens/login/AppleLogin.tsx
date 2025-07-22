import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  Image,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { loginApi, userApi } from '../../services/api';
import useUserStore from '../../store/user';
import useAnalyticsStore from '../../store/analytics';
import { changeLanguage } from '../../i18n';
import fontSize from '../../utils/fontsizeUtils';
import { DeviceFingerprintCollector } from '../../utils/deviceFingerprint';
import { BoostSuccessModal } from '../activity/BoostSuccessModal';

interface AppleLoginButtonProps {
  onLoginStart?: () => void;
  onLoginSuccess?: () => void;
  onLoginError?: (error: any) => void;
  handleFirstLoginSettings?: (response: any) => Promise<void>;
}

export const AppleLoginButton: React.FC<AppleLoginButtonProps> = ({
  onLoginStart,
  onLoginSuccess,
  onLoginError,
  handleFirstLoginSettings,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setUser } = useUserStore();
  const analyticsStore = useAnalyticsStore();
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [boosterUserId, setBoosterUserId] = useState<string>('');

  const handleAppleLogin = async () => {
    console.log("🚀 Apple登录按钮被点击");
    
    if (onLoginStart) {
      onLoginStart();
    }

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
        // 收集设备指纹
        console.log("📱 收集设备指纹信息...");
        const deviceInfo = await DeviceFingerprintCollector.collectSimpleDeviceInfo();
        const fingerprintHash = deviceInfo.fingerprintHash;
        console.log("✅ 设备指纹收集完成:", fingerprintHash);
        
        // 调用后端API进行Apple登录
        console.log("📡 调用后端API进行Apple登录验证...");
        console.log("📤 设备指纹哈希:", fingerprintHash);
        const res = await loginApi.appleLogin(appleUserData, fingerprintHash);
        console.log("✅ 后端Apple登录验证成功:", res);

        // 保存access_token到AsyncStorage
        if (res.access_token) {
          const token = `${res.token_type} ${res.access_token}`;
          await AsyncStorage.setItem("token", token);
          console.log("✅ Token已保存:", token);
        }
        
        // 检查是否有referrer_id且不为0
        if (res.referrer_id && res.referrer_id !== 0) {
          console.log("🎯 检测到referrer_id:", res.referrer_id);
          setBoosterUserId(res.referrer_id.toString());
          setShowBoostModal(true);
        }

        // 处理首次登录设置同步
        if (handleFirstLoginSettings) {
          console.log("⚙️ 检查是否需要同步本地设置...");
          await handleFirstLoginSettings(res);
        } else {
          // 如果没有传入自定义处理函数，使用默认的处理函数
          const { handleLoginSettingsCheck } = await import('../../utils/userSettingsUtils');
          await handleLoginSettingsCheck(res, 'apple');
        }

        console.log("👤 获取用户信息...");
        const user = await userApi.getProfile();
        console.log("✅ 用户信息获取成功:", user);

        // 同步语言设置
        if (user.language) {
          console.log("🌐 同步用户语言设置:", user.language);
          await changeLanguage(user.language);
        }

        setUser(user);

        if (onLoginSuccess) {
          onLoginSuccess();
        }

        // 导航到主页
        console.log("🏠 导航到主页...");
        analyticsStore.logLogin(true, "apple");
        navigation.navigate("MainTabs", { screen: "Home" });
        console.log("✅ Apple登录流程完成");
      } catch (err) {
        console.error("❌ 后端Apple登录验证失败:", err);
        analyticsStore.logLogin(false, "apple");
        Alert.alert("登录失败", "服务器处理Apple登录时出错，请稍后重试");
        if (onLoginError) {
          onLoginError(err);
        }
      }
    } catch (error: any) {
      console.error("❌ Apple登录错误:", error);
      console.error("❌ 错误详情:", JSON.stringify(error, null, 2));

      if (error.code === "ERR_CANCELED") {
        console.log("⏹️ 用户取消Apple登录");
        // 用户取消，不显示错误
      } else {
        console.error("❌ 其他错误:", error.message);
        analyticsStore.logLogin(false, "apple");
        Alert.alert(
          "登录失败",
          `Apple登录出现错误: ${error.message || "未知错误"}`,
        );
      }
      
      if (onLoginError) {
        onLoginError(error);
      }
    }
  };

  // 只在iOS设备上显示Apple登录按钮
  if (Platform.OS !== "ios") {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleAppleLogin}
      >
        <Image
          source={require("../../../assets/img/apple.png")}
          style={styles.loginIcon}
        />
        <Text style={styles.loginButtonText}>Continuer avec Apple</Text>
        <Text style={styles.arrowText}>›</Text>
      </TouchableOpacity>
      
      <BoostSuccessModal
        visible={showBoostModal}
        onClose={() => setShowBoostModal(false)}
        userId={boosterUserId}
        onJouerPress={() => {
          setShowBoostModal(false);
          // 可以在这里添加跳转到游戏页面的逻辑
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  loginIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  loginButtonText: {
    flex: 1,
    color: "#fff",
    fontSize: fontSize(16),
    fontWeight: "500",
    textAlign: "center",
  },
  arrowText: {
    fontSize: fontSize(20),
    color: "#fff",
    marginLeft: 8,
  },
});

// 导出Apple登录相关的工具函数
export const checkAppleLoginAvailability = async (): Promise<boolean> => {
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch (error) {
    console.error("检查Apple登录可用性时出错:", error);
    return false;
  }
};

// 导出Apple登录凭证刷新函数（用于自动登录）
export const refreshAppleCredential = async (user: string) => {
  try {
    const credentialState = await AppleAuthentication.getCredentialStateAsync(user);
    return credentialState === AppleAuthentication.AppleAuthenticationCredentialState.AUTHORIZED;
  } catch (error) {
    console.error("刷新Apple凭证时出错:", error);
    return false;
  }
};