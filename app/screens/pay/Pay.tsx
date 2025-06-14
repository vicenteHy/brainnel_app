import { View, StyleSheet, Alert, SafeAreaView, TouchableOpacity, Text } from "react-native";
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
        safeNavigate("PayError", { order_id: route.params.order_id });
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

  const handleGoBack = () => {
    // 停止轮询
    stopPolling();
    
    // 导航到支付失败页面，提示用户支付未完成
    safeNavigate("PayError", {
      msg: "支付未完成，您可以稍后重试",
      order_id: route.params.order_id
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* 返回按钮 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {route.params.method === 'paypal' ? 'PayPal支付' : 
           route.params.method === 'wave' ? 'Wave支付' : '支付'}
        </Text>
      </View>
      
      <View style={{ flex: 1 }}>
        {payUrl ? (
        <WebView
          source={{ uri: payUrl }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            
            // 网络连接错误或其他加载错误，导航到支付失败页面
            if (nativeEvent.code === -1004 || nativeEvent.code === -1009) {
              // -1004: 无法连接服务器, -1009: 网络连接中断
              safeNavigate("PayError", {
                msg: "网络连接失败，请检查您的网络设置",
                order_id: route.params.order_id
              });
            } else {
              // 其他错误
              safeNavigate("PayError", {
                msg: nativeEvent.description || "支付页面加载失败",
                order_id: route.params.order_id
              });
            }
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView HTTP error:', nativeEvent);
            
            // HTTP错误（如404, 500等），导航到支付失败页面
            safeNavigate("PayError", {
              msg: `支付页面加载失败 (${nativeEvent.statusCode})`,
              order_id: route.params.order_id
            });
          }}
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
                          safeNavigate("PaymentSuccessScreen", res);
                        } else {
                          safeNavigate("PayError", res);
                        }
                      })
                      .catch((error) => {
                        console.error("PayPal callback error:", error);
                        safeNavigate("PayError", { 
                          msg: "Payment callback failed",
                          order_id: route.params.order_id 
                        });
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

            // 检查银行卡支付的结果
            if (route.params.method === "bank_card") {
              const { url } = request;
              if (url) {
                // 检查URL中是否包含支付成功或失败的标识
                if (url.includes("payment_success=true") || url.includes("success") || url.includes("completed")) {
                  // 支付成功
                  safeNavigate("PaymentSuccessScreen", { success: true });
                  return false;
                } else if (url.includes("payment_success=false") || url.includes("cancel") || url.includes("error") || url.includes("failed")) {
                  // 支付失败或取消
                  safeNavigate("PayError", { 
                    msg: "Bank card payment failed",
                    order_id: route.params.order_id 
                  });
                  return false;
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007efa',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    textAlign: 'center',
    marginRight: 50, // 平衡左侧返回按钮的宽度
  },
});
