import React from "react";
import { View, Platform } from "react-native";
import LoginScreen from "./loginList";

export default function LoginScreenWrapper() {
  return (
    <View style={{ flex: 1 }}>
      <LoginScreen />
    </View>
  );
}

// 手机号登录样式
const phoneLoginContainer = {
  position: "absolute",
  top: Platform.OS === "ios" ? 60 : 40,
  height: "80%",
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: "#fff",
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.1,
  shadowRadius: 5,
  elevation: 5,
  zIndex: 10,
};
