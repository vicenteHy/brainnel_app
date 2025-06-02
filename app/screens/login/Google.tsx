import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { loginApi } from "../../services/api/login";
import { useAuth } from "../../contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const GoogleScreen = () => {
  const navigation = useNavigation<any>();
  const { login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loginUrl, setLoginUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchLoginUrl = async () => {
      try {
        const response = await loginApi.google();


        if (response.url) {
          setLoginUrl(response.url);
        }
      } catch (error) {
        console.error("Failed to fetch login URL:", error);
      }
    };

    fetchLoginUrl();
  }, []);

  const handleNavigationStateChange = async (navState: any) => {
    console.log(navState.url);

    // 检查URL是否包含重定向URI
    if (navState.url.includes("localhost:8000")) {
      try {
        await login();
        navigation.navigate("MainTabs" as never);
      } catch (error) {
        console.error("Login failed:", error);
      }
    }
  };

  if (!loginUrl) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: loginUrl }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        originWhitelist={["*"]}
        incognito={true}
        thirdPartyCookiesEnabled={false}
        userAgent="Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Mobile Safari/537.36"
        onShouldStartLoadWithRequest={(request) => {
          const { url } = request;
          // 拦截 myapp://login-success
          if (url.startsWith("myapp://login-success")) {
            console.log("拦截成功！跳转地址：", url);
            
            // 提取 token 参数
            const urlParams = new URLSearchParams(url.split('?')[1]);
            const token = urlParams.get('token');
            
            // 如果有 token 则登录成功，否则跳转回登录页
            if (token) {
              const tokens = "bearer " + token;
              AsyncStorage.setItem("token", tokens);
              // 登录成功，更新认证状态
              login().then(() => {
                // 跳转到主页
                navigation.replace("MainTabs", { screen: "Home" });
              });
            } else {
              // 登录失败，跳转回登录页
              navigation.replace("Login");
            }
            
            return false; // 阻止 WebView 加载这个链接
          }

          return true; // 其他 URL 继续加载
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  webview: {
    flex: 1,
  },
});
