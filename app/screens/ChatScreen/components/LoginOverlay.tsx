import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { t } from "../../../i18n";
import fontSize from "../../../utils/fontsizeUtils";

interface LoginOverlayProps {
  onLoginPress: () => void;
}

export const LoginOverlay: React.FC<LoginOverlayProps> = ({ onLoginPress }) => {
  return (
    <View style={styles.loginOverlay}>
      <View style={styles.blurContainer}>
        <View style={styles.loginPromptContainer}>
          <View style={styles.loginIcon}>
            <Text style={styles.loginIconText}>💬</Text>
          </View>
          <Text style={styles.loginPromptTitle}>
            {t("chat.login_required_title", "请先登录")}
          </Text>
          <Text style={styles.loginPromptSubtitle}>
            {t("chat.login_required_subtitle", "登录后即可使用聊天功能")}
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={onLoginPress}>
            <Text style={styles.loginButtonText}>
              {t("chat.login_now", "立即登录")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loginOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffffe6",
    backdropFilter: "blur(10px)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  blurContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:
      Platform.OS === "android" ? "#fffffff2" : "transparent",
  },
  loginPromptContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: "80%",
  },
  loginIcon: {
    width: 80,
    height: 80,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#007a6c1a",
    borderRadius: 40,
  },
  loginIconText: {
    fontSize: fontSize(40),
    fontWeight: "bold",
    color: "#007a6c",
  },
  loginPromptTitle: {
    fontSize: fontSize(24),
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  loginPromptSubtitle: {
    fontSize: fontSize(16),
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: "#007a6c",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 160,
  },
  loginButtonText: {
    color: "white",
    fontSize: fontSize(18),
    fontWeight: "700",
    textAlign: "center",
  },
});