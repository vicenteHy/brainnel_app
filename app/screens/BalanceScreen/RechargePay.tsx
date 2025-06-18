import React from "react";
import { View, StyleSheet, Alert, SafeAreaView, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { useEffect, useState, useRef } from "react";
import { payApi, PaymentInfoResponse } from "../../services/api/payApi";
import * as Linking from "expo-linking";
import { navigate, navigationRef } from "../../navigation/RootNavigation";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import fontSize from "../../utils/fontsizeUtils";

type RechargePayScreenRouteProp = RouteProp<
  {
    RechargePay: { payUrl: string; method: string; recharge_id: string };
  },
  "RechargePay"
>;

export const RechargePay = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const route = useRoute<RechargePayScreenRouteProp>();
  const navigation = useNavigation();
  const { payUrl, method, recharge_id } = route.params;
  const [payInfo, setPayInfo] = useState<PaymentInfoResponse>();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'completed' | 'failed'>('pending');
  const [mobileMoneyAttempts, setMobileMoneyAttempts] = useState(0);

  // 轮询充值状态
  const pollPaymentStatus = () => {
    console.log("=== 轮询充值状态开始 ===");
    console.log("支付方式:", method);
    console.log("充值ID:", recharge_id);
    console.log("当前支付状态:", paymentStatus);
    
    if (method === "wave" || method === "mobile_money") {
      console.log(`开始${method}充值状态轮询...`);
      console.log("调用API: /api/recharge/" + recharge_id + "/payment-status/");
      
      payApi
        .rechargePaymentStatus(recharge_id)
        .then((res) => {
          console.log(`=== ${method}充值API响应 ===`);
          console.log("完整响应:", JSON.stringify(res, null, 2));
          console.log("支付状态 res.status:", res.status);
          console.log("充值ID res.recharge_id:", res.recharge_id);
          console.log("消息 res.msg:", res.msg);
          console.log("========================");
          
          if (res.status === 1) {
            console.log(`✅ ${method}充值成功！停止轮询并跳转成功页面`);
            setPaymentStatus('completed');
            safeNavigate("PaymentSuccessScreen", { ...res, isRecharge: true });
            stopPolling();
          } else {
            console.log(`⏳ ${method}充值尚未完成，状态:`, res.status);
            console.log("继续轮询...");
          }
        })
        .catch((error) => {
          console.error(`❌ ${method}充值轮询API调用失败:`);
          console.error("错误详情:", error);
          console.error("错误消息:", error.message);
          if (error.response) {
            console.error("响应状态码:", error.response.status);
            console.error("响应数据:", error.response.data);
          }
        });
    } else if (method === "paypal") {
      console.log("开始PayPal充值状态轮询...");
      console.log("调用API: /api/recharge/" + recharge_id + "/payment-status/");
      
      payApi
        .rechargePaymentStatus(recharge_id)
        .then((res) => {
          console.log("=== PayPal充值API响应 ===");
          console.log("完整响应:", JSON.stringify(res, null, 2));
          console.log("支付状态 res.status:", res.status);
          console.log("充值ID res.recharge_id:", res.recharge_id);
          console.log("消息 res.msg:", res.msg);
          console.log("========================");
          
          if (res.status === 1) {
            console.log("✅ PayPal充值成功！停止轮询并跳转成功页面");
            setPaymentStatus('completed');
            safeNavigate("PaymentSuccessScreen", { ...res, isRecharge: true });
            stopPolling();
          } else {
            console.log("⏳ PayPal充值尚未完成，状态:", res.status);
            console.log("继续轮询...");
          }
        })
        .catch((error) => {
          console.error("❌ PayPal充值轮询API调用失败:");
          console.error("错误详情:", error);
          console.error("错误消息:", error.message);
          if (error.response) {
            console.error("响应状态码:", error.response.status);
            console.error("响应数据:", error.response.data);
          }
        });
    }
    
    console.log("=== 轮询充值状态结束 ===");
  };

  // 开始轮询
  const startPolling = () => {
    console.log("🚀 开始轮询充值状态");
    console.log("支付方式:", method);
    console.log("充值ID:", recharge_id);
    
    setPaymentStatus('checking');
    
    // 立即执行一次
    console.log("立即执行第一次轮询...");
    pollPaymentStatus();
    
    // 设置轮询，每3秒执行一次
    if (!pollIntervalRef.current) {
      console.log("设置轮询定时器：每3秒执行一次");
      pollIntervalRef.current = setInterval(pollPaymentStatus, 3000);
    } else {
      console.log("轮询定时器已存在，跳过设置");
    }

    // 设置超时时间：Mobile Money 5秒，其他支付 60秒
    const timeoutDuration = method === "mobile_money" ? 5000 : 60000;
    if (!timeoutRef.current) {
      console.log(`设置超时定时器：${timeoutDuration/1000}秒后停止轮询`);
      timeoutRef.current = setTimeout(() => {
        console.log("⏰ 充值轮询超时！");
        
        if (method === "mobile_money") {
          // Mobile Money轮询超时处理
          console.log(`Mobile Money第${mobileMoneyAttempts + 1}次尝试超时`);
          stopPolling();
          setPaymentStatus('pending'); // 重置为pending状态，允许用户重试
          
          // 如果已经尝试3次，跳转失败页面
          if (mobileMoneyAttempts + 1 >= 3) {
            console.log("Mobile Money已尝试3次，跳转到充值失败页面");
            setPaymentStatus('failed');
            safeNavigate("PayError", { 
              msg: t("recharge.status.mobile_money_max_attempts"),
              recharge_id: recharge_id,
              isRecharge: true
            });
          }
        } else {
          // 其他支付方式的超时处理
          console.log("停止轮询并跳转到充值失败页面");
          stopPolling();
          setPaymentStatus('failed');
          safeNavigate("PayError", { 
            msg: t("recharge.status.timeout_message"),
            recharge_id: recharge_id,
            isRecharge: true
          });
        }
      }, timeoutDuration);
    } else {
      console.log("超时定时器已存在，跳过设置");
    }
  };

  // 停止轮询
  const stopPolling = () => {
    console.log("🛑 停止充值状态轮询");
    
    if (pollIntervalRef.current) {
      console.log("清除轮询定时器");
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    } else {
      console.log("轮询定时器已为空，无需清除");
    }
    
    if (timeoutRef.current) {
      console.log("清除超时定时器");
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    } else {
      console.log("超时定时器已为空，无需清除");
    }
    
    console.log("轮询停止完成");
  };


  // 打开外部浏览器进行支付
  const openExternalPayment = async () => {
    try {
      console.log("=== 准备打开外部浏览器充值 ===");
      console.log("支付方式:", method);
      console.log("充值ID:", recharge_id);
      console.log("支付URL:", payUrl);
      
      // 检查payUrl是否有效
      if (!payUrl || payUrl === 'null' || payUrl === 'undefined') {
        console.error("❌ 支付URL无效:", payUrl);
        Alert.alert(t("common.error"), t("recharge.status.invalid_payment_url"));
        safeNavigate("PayError", {
          msg: t("recharge.status.invalid_payment_url"),
          recharge_id: recharge_id,
          isRecharge: true
        });
        return;
      }
      
      const supported = await Linking.canOpenURL(payUrl);
      console.log("URL是否支持打开:", supported);
      
      if (supported) {
        console.log("开始打开外部浏览器...");
        setLoading(true);
        
        await Linking.openURL(payUrl);
        console.log("✅ 外部浏览器已打开");
        
        // 打开外部浏览器后开始轮询支付状态
        console.log("等待2秒后开始轮询充值状态...");
        setTimeout(() => {
          startPolling();
          setLoading(false);
          console.log("轮询已启动，loading状态已清除");
        }, 2000);
        
      } else {
        console.error("❌ 无法打开支付链接");
        Alert.alert(t("common.error"), t("recharge.status.cannot_open_link"));
        safeNavigate("PayError", {
          msg: t("recharge.status.cannot_open_link"),
          recharge_id: recharge_id,
          isRecharge: true
        });
      }
    } catch (error) {
      console.error("❌ 打开外部浏览器失败:", error);
      console.error("错误详情:", error instanceof Error ? error.message : String(error));
      Alert.alert(t("common.error"), t("recharge.status.open_payment_failed"));
      safeNavigate("PayError", {
        msg: t("recharge.status.open_payment_failed"),
        recharge_id: recharge_id,
        isRecharge: true
      });
    }
  };

  useEffect(() => {
    // PayPal和Wave支付自动打开浏览器
    if (method === "paypal" || method === "wave") {
      console.log(`=== ${method}充值页面加载，自动打开浏览器 ===`);
      openExternalPayment();
    }
    
    // Mobile Money支付不自动开始轮询，等待用户手动确认
    if (method === "mobile_money") {
      console.log("=== Mobile Money充值页面加载，等待用户确认支付 ===");
      setPaymentStatus('pending');
    }

    // 设置处理深度链接的监听器
    const handleDeepLink = ({ url }: { url: string }) => {
      console.log("收到深度链接:", url);
      
      if (
        url.includes("com.brainnel.app://payment-success") ||
        url.includes("myapp://payment-success")
      ) {
        console.log("检测到支付成功深度链接");
        stopPolling();
        setPaymentStatus('checking');
        
        const parsed = Linking.parse(url);
        const params = parsed.queryParams || {};
        
        // 检查是否有PayPal回调参数
        if (params.paymentId && params.PayerID && method === "paypal") {
          console.log("调用PayPal充值回调验证...");
          
          payApi
            .paySuccessCallback(
              params.paymentId as string,
              params.PayerID as string
            )
            .then((res) => {
              console.log("PayPal回调验证结果:", res);
              if (res.status === 1) {
                setPaymentStatus('completed');
                safeNavigate("PaymentSuccessScreen", { ...res, isRecharge: true });
              } else {
                setPaymentStatus('failed');
                safeNavigate("PayError", {
                  msg: res.msg || t("recharge.status.verification_failed"),
                  recharge_id: recharge_id,
                  isRecharge: true
                });
              }
            })
            .catch((error) => {
              console.error("PayPal回调验证错误:", error);
              setPaymentStatus('failed');
              safeNavigate("PayError", { 
                msg: t("recharge.status.verification_failed_contact_support"),
                recharge_id: recharge_id,
                isRecharge: true
              });
            });
        } else if (method === "wave" || method === "mobile_money") {
          // Wave/Mobile Money支付重定向回调处理
          console.log(`检测到${method}充值成功深度链接`);
          console.log(`${method}回调参数:`, params);
          
          // 验证支付状态
          payApi
            .rechargePaymentStatus(recharge_id)
            .then((res) => {
              console.log(`${method}充值状态验证结果:`, res);
              if (res.status === 1) {
                setPaymentStatus('completed');
                safeNavigate("PaymentSuccessScreen", { ...res, isRecharge: true });
              } else {
                setPaymentStatus('failed');
                safeNavigate("PayError", {
                  msg: t("recharge.status.wave_verification_failed"),
                  recharge_id: recharge_id,
                  isRecharge: true
                });
              }
            })
            .catch((error) => {
              console.error(`${method}充值状态验证错误:`, error);
              setPaymentStatus('failed');
              safeNavigate("PayError", { 
                msg: t("recharge.status.wave_verification_failed"),
                recharge_id: recharge_id,
                isRecharge: true
              });
            });
        } else {
          // 其他支付方式或缺少参数，直接跳转成功页面
          setPaymentStatus('completed');
          safeNavigate("PaymentSuccessScreen", { ...params, isRecharge: true });
        }
      } else if (
        url.includes("com.brainnel.app://payment-cancel") ||
        url.includes("myapp://payment-cancel")
      ) {
        console.log("检测到支付取消深度链接");
        stopPolling();
        setPaymentStatus('failed');
        
        safeNavigate("PayError", {
          msg: t("recharge.status.payment_cancelled"),
          recharge_id: recharge_id,
          isRecharge: true
        });
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

  // 重新打开支付
  const retryPayment = () => {
    setPaymentStatus('pending');
    stopPolling();
    if (method === "mobile_money") {
      // Mobile Money不需要打开浏览器，只是重置状态等待用户确认
      console.log("Mobile Money充值重试，等待用户确认");
    } else {
      openExternalPayment();
    }
  };

  // Mobile Money确认支付
  const confirmMobileMoneyPayment = () => {
    const newAttempts = mobileMoneyAttempts + 1;
    console.log(`=== 用户确认Mobile Money充值，第${newAttempts}次尝试，开始轮询 ===`);
    setMobileMoneyAttempts(newAttempts);
    startPolling();
  };

  // 手动检查支付状态
  const checkPaymentStatus = () => {
    console.log("👆 用户手动检查充值状态");
    pollPaymentStatus();
  };


  // 导航辅助函数，尝试使用多种方式导航
  const safeNavigate = (routeName: string, params: any) => {
    console.log("=== safeNavigate 调试信息 ===");
    console.log("目标路由:", routeName);
    console.log("导航参数:", JSON.stringify(params, null, 2));
    console.log("参数类型:", typeof params);
    console.log("==========================");
    
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
            Alert.alert(t("recharge.status.navigation_failed"), t("recharge.status.navigation_failed_message"));
          }
        }, 500);
      }
    }
  };

  const handleGoBack = () => {
    // 停止轮询
    stopPolling();
    
    Alert.alert(
      t("recharge.status.confirm_exit"), 
      t("recharge.status.payment_not_complete_question"),
      [
        { text: t("recharge.status.continue_payment"), style: "cancel" },
        { 
          text: t("common.exit"), 
          style: "destructive",
          onPress: () => {
            safeNavigate("PayError", {
              msg: t("recharge.status.payment_incomplete_retry"),
              recharge_id: recharge_id,
              isRecharge: true
            });
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#007efa" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {method === 'paypal' ? t("recharge.status.paypal_payment") : 
           method === 'wave' ? t("recharge.status.wave_payment") :
           method === 'mobile_money' ? t("recharge.status.mobile_money_payment") : t("recharge.status.payment")}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* 主要内容区域 */}
      <View style={styles.content}>
        {/* 支付状态显示 */}
        <View style={styles.statusContainer}>
          {paymentStatus === 'pending' && (
            <>
              <Ionicons name="card-outline" size={80} color="#007efa" />
              <Text style={styles.statusTitle}>{t("recharge.status.ready_to_pay")}</Text>
              <Text style={styles.statusSubtitle}>
                {method === 'mobile_money' ? 
                  t("recharge.status.mobile_money_ready") +
                  (mobileMoneyAttempts > 0 ? ` (${mobileMoneyAttempts}/3)` : '') : 
                  t("recharge.status.click_button_to_start")
                }
              </Text>
            </>
          )}
          
          {paymentStatus === 'checking' && (
            <>
              <ActivityIndicator size="large" color="#007efa" />
              <Text style={styles.statusTitle}>{t("recharge.status.checking_payment")}</Text>
              <Text style={styles.statusSubtitle}>
                {method === 'mobile_money' ? 
                  t("recharge.status.mobile_money_checking") + ` (${mobileMoneyAttempts}/3)` : 
                  t("recharge.status.verifying_please_wait")
                }
              </Text>
            </>
          )}
          
          {paymentStatus === 'completed' && (
            <>
              <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
              <Text style={[styles.statusTitle, { color: '#4CAF50' }]}>{t("recharge.status.payment_successful")}</Text>
              <Text style={styles.statusSubtitle}>{t("recharge.status.redirecting_to_result")}</Text>
            </>
          )}
          
          {paymentStatus === 'failed' && (
            <>
              <Ionicons name="close-circle" size={80} color="#FF4444" />
              <Text style={[styles.statusTitle, { color: '#FF4444' }]}>{t("recharge.status.payment_failed")}</Text>
              <Text style={styles.statusSubtitle}>{t("recharge.status.retry_or_contact_support")}</Text>
            </>
          )}
        </View>

        {/* 充值信息 */}
        <View style={styles.orderInfo}>
          <Text style={styles.orderTitle}>{t("recharge.status.recharge_info")}</Text>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>{t("recharge.status.recharge_id")}</Text>
            <Text style={styles.orderValue}>{recharge_id}</Text>
          </View>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>{t("recharge.status.payment_method")}</Text>
            <Text style={styles.orderValue}>
              {method === 'paypal' ? 'PayPal' : 
               method === 'wave' ? 'Wave' :
               method === 'mobile_money' ? 'Mobile Money' : t("recharge.status.other")}
            </Text>
          </View>
        </View>

        {/* 操作按钮 */}
        <View style={styles.buttonContainer}>
          {paymentStatus === 'pending' && (
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={method === "mobile_money" ? confirmMobileMoneyPayment : openExternalPayment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons 
                    name={method === "mobile_money" ? "checkmark-outline" : "open-outline"} 
                    size={20} 
                    color="white" 
                  />
                  <Text style={styles.primaryButtonText}>
                    {method === "mobile_money" ? 
                      (mobileMoneyAttempts >= 3 ? 
                        t("recharge.status.max_attempts_reached") : 
                        t("recharge.status.confirm_payment") + (mobileMoneyAttempts > 0 ? ` (${mobileMoneyAttempts + 1}/3)` : '')
                      ) : 
                      t("recharge.status.open_browser_payment")
                    }
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          {paymentStatus === 'checking' && (
            <>
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={checkPaymentStatus}
              >
                <Ionicons name="refresh-outline" size={20} color="#007efa" />
                <Text style={styles.secondaryButtonText}>{t("recharge.status.manual_check")}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.tertiaryButton} 
                onPress={retryPayment}
              >
                <Text style={styles.tertiaryButtonText}>{t("recharge.status.retry_payment")}</Text>
              </TouchableOpacity>
            </>
          )}
          
          {paymentStatus === 'failed' && (
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={retryPayment}
            >
              <Ionicons name="refresh-outline" size={20} color="white" />
              <Text style={styles.primaryButtonText}>{t("recharge.status.retry_payment")}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 提示信息 */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>{t("recharge.status.payment_instructions")}</Text>
          {method === 'mobile_money' ? (
            <>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionBullet}>•</Text>
                <Text style={styles.instructionText}>
                  {t("recharge.status.mobile_money_instruction_1")}
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionBullet}>•</Text>
                <Text style={styles.instructionText}>
                  {t("recharge.status.mobile_money_instruction_2")}
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionBullet}>•</Text>
                <Text style={styles.instructionText}>
                  {t("recharge.status.mobile_money_instruction_3")}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionBullet}>•</Text>
                <Text style={styles.instructionText}>
                  {t("recharge.status.instruction_1", { 
                    paymentMethod: method === 'paypal' ? 'PayPal' : 
                                  method === 'wave' ? 'Wave' : method 
                  })}
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionBullet}>•</Text>
                <Text style={styles.instructionText}>
                  {t("recharge.status.instruction_2")}
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionBullet}>•</Text>
                <Text style={styles.instructionText}>
                  {t("recharge.status.instruction_3")}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    padding: 8,
  },
  headerTitle: {
    fontSize: fontSize(18),
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40, // 平衡左侧返回按钮的宽度
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusTitle: {
    fontSize: fontSize(18),
    fontWeight: '700',
    color: '#1e293b', 
    marginTop: 16,
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: fontSize(12),
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  orderInfo: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  orderTitle: {
    fontSize: fontSize(18),
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  orderLabel: {
    fontSize: fontSize(14),
    color: '#64748b',
    fontWeight: '500',
  },
  orderValue: {
    fontSize: fontSize(14),
    color: '#1e293b',
    fontWeight: '600',
  },
  buttonContainer: {
    marginBottom: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007efa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#007efa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: fontSize(16),
    fontWeight: '600',
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#007efa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: fontSize(16),
    fontWeight: '600',
    color: '#007efa',
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  tertiaryButtonText: {
    fontSize: fontSize(14),
    fontWeight: '500',
    color: '#64748b',
    textDecorationLine: 'underline',
  },
  tipsContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: fontSize(16),
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: fontSize(14),
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 4,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  instructionBullet: {
    fontSize: fontSize(14),
    color: '#64748b',
    marginRight: 8,
    marginTop: 1,
    lineHeight: 20,
  },
  instructionText: {
    fontSize: fontSize(14),
    color: '#64748b',
    lineHeight: 20,
    flex: 1,
    flexWrap: 'wrap',
  },
});