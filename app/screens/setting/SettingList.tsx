import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import BackIcon from "../../components/BackIcon";
import fontSize from "../../utils/fontsizeUtils";
import LeftArrowIcon from "../../components/DownArrowIcon";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState, useEffect } from "react";
import { settingApi, MySetting } from "../../services/api/setting";
import { RootStackParamList } from "../../navigation/types";
import { eventBus } from "../../utils/eventBus";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import useUserStore from "../../store/user";
import { useAuth } from "../../contexts/AuthContext";
import { userApi } from "../../services/api/userApi";

import { avatarCacheService } from "../../services/avatarCacheService";

export const SettingList = () => {
  const { t } = useTranslation();
  const [mySetting, setMySetting] = useState<MySetting>();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, clearUser, setUser } = useUserStore();
  const { logout } = useAuth();
  const getMySetting = async () => {
    try {
      const res = await settingApi.getMySetting();
      setMySetting(res);
    } catch (error) {
      console.warn('Failed to get user settings:', error);
      // 第三方登录已经处理了首次登录设置，这里只记录错误
      // 如果仍然是404错误，说明可能存在其他问题
      if (error.status === 404) {
        console.warn('用户设置不存在，可能需要重新登录或联系支持');
      }
    }
  };

  useEffect(() => {
    // 静默获取设置数据，不显示加载动画
    if (user?.user_id) {
      getMySetting();
    }
    const refreshSetting = () => {
      getMySetting();
    };
    eventBus.on("refreshSetting", refreshSetting);
    return () => {
      eventBus.off("refreshSetting", refreshSetting);
    };
  }, []);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 简单的测试函数
  const testLogout = () => {
    console.log("Test logout function called!");
  };

  const handleLogout = async () => {
    console.log("Logout button pressed"); // 添加调试日志
    setIsLoggingOut(true);
    try {
      // 保存当前国家设置，避免重新选择
      const savedCountry = await AsyncStorage.getItem('@selected_country');
      
      // 调用退出登录接口
      await userApi.logout();
      console.log("API logout successful");

      // 清除用户状态
      clearUser();
      console.log("User state cleared");

      // 清除认证状态
      await logout();
      console.log("Auth state cleared");

      // 清除所有头像缓存
      await avatarCacheService.clearAllCache();
      console.log("Avatar cache cleared");

      // 清除所有AsyncStorage数据
      await AsyncStorage.clear();
      console.log("AsyncStorage cleared");

      // 恢复国家设置，避免重新选择
      if (savedCountry) {
        await AsyncStorage.setItem('@selected_country', savedCountry);
        console.log("Country setting restored");
      }

      // 重新获取用户信息（此时应该是未登录状态）
      try {
        const profile = await userApi.getProfile();
        setUser(profile);
        console.log("Profile fetched after logout");
      } catch (error) {
        // 如果获取失败，说明已经成功退出登录
        console.log(
          "Successfully logged out - profile fetch failed as expected"
        );
      }

      // 直接导航到主页面，不需要重新选择国家
      navigation.navigate("MainTabs");
      console.log("Navigated to MainTabs");
    } catch (error) {
      console.error("Logout error:", error);
      
      // 保存当前国家设置（在清除之前获取）
      const savedCountry = await AsyncStorage.getItem('@selected_country');
      
      // 即使接口调用失败，也要清除本地状态
      clearUser();
      await logout();
      await avatarCacheService.clearAllCache();
      await AsyncStorage.clear();
      
      // 恢复国家设置
      if (savedCountry) {
        await AsyncStorage.setItem('@selected_country', savedCountry);
      }
      
      navigation.navigate("MainTabs");
    } finally {
      setIsLoggingOut(false);
    }
    // Alert.alert(
    //   t("settings.logout_confirm_title"),
    //   t("settings.logout_confirm_message"),
    //   [
    //     {
    //       text: t("common.cancel"),
    //       style: "cancel",
    //     },
    //     {
    //       text: t("settings.logout"),
    //       style: "destructive",
    //       onPress: async () => {
    //         console.log("Logout confirmed"); // 添加调试日志

    //       },
    //     },
    //   ]
    // );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={1}>
            <BackIcon size={fontSize(24)} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("settings.title")}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate("Info")}
            activeOpacity={1}
          >
            <Text style={{color: '#000000'}}>{t("settings.profile")}</Text>
            <Text>
              <LeftArrowIcon size={fontSize(20)} color="#acacac" />
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (mySetting?.language && mySetting?.currency) {
                navigation.navigate("AddressList");
              }
            }}
            style={styles.item}
            activeOpacity={1}
          >
            <Text style={{color: '#000000'}}>{t("settings.my_address")}</Text>
            <Text>
              <LeftArrowIcon size={fontSize(20)} color="#acacac" />
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              navigation.navigate("PrivacyPolicyScreen");
            }}
            activeOpacity={1}
          >
            <Text style={{color: '#000000'}}>{t("settings.privacy_policy")}</Text>
            <Text>
              <LeftArrowIcon size={fontSize(20)} color="#acacac" />
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.item}
            onPress={() => {
              navigation.navigate("TermsOfUseScreen");
            }}
            activeOpacity={1}
          >
            <Text style={{color: '#000000'}}>{t("settings.terms_of_use")}</Text>
            <Text>
              <LeftArrowIcon size={fontSize(20)} color="#acacac" />
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate("CountrySetting", { mySetting });
            }}
            style={styles.item}
            activeOpacity={1}
          >
            <Text style={{color: '#000000'}}>{t("settings.language_currency")}</Text>
            <Text>
              <LeftArrowIcon size={fontSize(20)} color="#acacac" />
            </Text>
          </TouchableOpacity>
        </View>
        {user?.user_id && (
          <View style={styles.logoutContainer}>
            <TouchableOpacity
              style={[
                styles.logoutButton,
                isLoggingOut && styles.logoutButtonDisabled,
              ]}
              onPress={() => {
                console.log("Logout button touched!"); // 添加简单的测试日志
                handleLogout(); // 暂时使用测试函数
              }}
              disabled={isLoggingOut}
              activeOpacity={1}
            >
              {isLoggingOut ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.logoutButtonText}>
                    {t("common.loading")}
                  </Text>
                </View>
              ) : (
                <Text style={styles.logoutButtonText}>
                  {t("settings.logout")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    backgroundColor: "#f8f8f8",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#000000",
  },
  placeholder: {
    width: 24,
  },
  content: {
    backgroundColor: "#fff",
    borderBottomWidth: 10,
    borderBottomColor: "#f8f8f8",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  logoutContainer: {
    padding: 20,
    backgroundColor: "#fff",
  },
  logoutButton: {
    backgroundColor: "#FF5100",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: fontSize(16),
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutButtonDisabled: {
    backgroundColor: "#ccc",
  },
  loadingWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: "#00000033",
    alignItems: "center",
    justifyContent: "center",
  },
});
