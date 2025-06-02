import { View, StyleSheet, Alert } from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { useEffect, useState, useRef } from "react";
import { payApi, PaymentInfoResponse } from "../../services/api/payApi";
import { WebView } from "react-native-webview";
import * as Linking from "expo-linking";
import { navigate, navigationRef } from "../../navigation/RootNavigation";

type PayScreenRouteProp = RouteProp<
  {
    Pay: { payUrl: string; method: string; order_id: string };
  },
  "Pay"
>;

export const Pay = () => {
  const [loading, setLoading] = useState(true);
  const route = useRoute<PayScreenRouteProp>();
  const navigation = useNavigation();
  const { payUrl } = route.params;
  const [payInfo, setPayInfo] = useState<PaymentInfoResponse>();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 轮询 wavePay 状态
  const pollWavePayStatus = () => {
    payApi
      .wavePay(route.params.order_id)
      .then((res) => {
        console.log(res);
        if (res.pay_status === 1) {
          safeNavigate("PaymentSuccessScreen", res);
          // 支付状态为1，停止轮询和超时定时器
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }
      })
      .catch((error) => {
        console.error("WavePay 轮询错误:", error);
      });
  };

  // 开始轮询
  const startPolling = () => {
    // 立即执行一次
    pollWavePayStatus();
    // 设置轮询，每2秒执行一次
    if (!pollIntervalRef.current) {
      pollIntervalRef.current = setInterval(pollWavePayStatus, 2000);
    }

    // 设置50秒超时
    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        // 超时处理：停止轮询并导航到错误页面
        stopPolling();
        safeNavigate("PayError", {});
      }, 50000); // 50秒
    }
  };

  // 停止轮询
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    // 设置处理深度链接的监听器
    const handleDeepLink = ({ url }: { url: string }) => {
      if (
        url.includes("myapp://payment-success") ||
        url.includes("exp://192.168.0.101:8084/--/payment-success")
      ) {
        const parsed = Linking.parse(url);
        const params = parsed.queryParams || {};
        navigate("PaymentSuccessScreen", params);
      }
    };

    // 添加深度链接事件监听器
    const subscription = Linking.addEventListener("url", handleDeepLink);

    return () => {
      // 清理订阅
      subscription.remove();
      // 清理轮询
      stopPolling();
    };
  }, []);

  const handleNavigationStateChange = (navState: any) => {
    // 检查URL是否包含支付成功的回调参数
    const { url } = navState;
    if (url && url.includes("payment_success=true")) {
      // 如果网页URL中包含成功参数，可以在这里处理
      Alert.alert("检测到支付成功！");
    }
  };

  // 导航辅助函数，尝试使用多种方式导航
  const safeNavigate = (routeName: string, params: any) => {
    try {
      // 尝试使用组件内的navigation
      // @ts-ignore 忽略可能的类型错误
      navigation.navigate(routeName, params);
    } catch (e) {
      try {
        // 尝试使用全局navigation
        navigate(routeName, params);
      } catch (e) {
        // 最后尝试使用setTimeout延迟导航
        setTimeout(() => {
          try {
            // @ts-ignore 忽略可能的类型错误
            navigation.navigate(routeName, params);
          } catch (e) {
            Alert.alert("导航失败", "无法跳转到目标页面");
          }
        }, 500);
      }
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {payUrl ? (
        <WebView
          source={{ uri: payUrl }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          originWhitelist={["*"]}
          userAgent="Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Mobile Safari/537.36"
          onShouldStartLoadWithRequest={(request) => {
            // wave 轮询处理
            if (route.params.method === "wave") {
              // 开始轮询 wavePay 状态
              startPolling();
            }

            // 检查URL是否包含支付成功的参数 paypal
            if (route.params.method === "paypal") {
              const { url } = request;
              if (url) {
                // 解析参数
                const parsed = Linking.parse(url);
                const params = parsed.queryParams || {};

                // 检查是否存在paymentId参数并且不为null
                if (params.paymentId && params.paymentId !== "null") {
                  if (params.PayerID && params.PayerID !== "null") {
                    payApi
                      .paySuccessCallback(
                        params.paymentId as string,
                        params.PayerID as string
                      )
                      .then((res) => {
                        if (res.status === 1) {
                          // 尝试跳转到支付成功页面
                          safeNavigate("PaymentSuccessScreen", params);
                        } else {
                          safeNavigate("PayError", params);
                        }
                      });
                  }

                  return false; // 不在WebView中加载
                } else {
                  // console.log("未检测到有效的paymentId，导航到支付失败页面");
                  // Alert.alert("支付失败");
                  // // 尝试跳转到支付失败页面
                  // safeNavigate('PayError', params);
                  // return false; // 不在WebView中加载
                }
              }
            }

            // 允许所有其他请求
            return true;
          }}
        />
      ) : (
        <View>{/* Add fallback content here */}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
});
