import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import fontSize from "../../utils/fontsizeUtils";
import { WhatsAppLogin } from '../../components/login/WhatsAppLogin';
import { handleLoginSettingsCheck } from "../../utils/userSettingsUtils";

type RootStackParamList = {
  Login: undefined;
  MainTabs: { screen: string };
};

export const WhatsAppLoginScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 关闭页面
  const handleClose = () => {
    navigation.goBack();
  };

  // 处理首次登录设置同步
  const handleFirstLoginSettings = async (loginResponse: any) => {
    await handleLoginSettingsCheck(loginResponse, 'whatsapp');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {/* 头部导航 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleClose}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>WhatsApp Login</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* WhatsApp登录内容 */}
        <View style={styles.content}>
          <WhatsAppLogin 
            handleFirstLoginSettings={handleFirstLoginSettings}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
});

export default WhatsAppLoginScreen;