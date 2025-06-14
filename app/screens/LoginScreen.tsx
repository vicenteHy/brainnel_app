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


