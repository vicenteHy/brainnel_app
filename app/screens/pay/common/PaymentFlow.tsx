import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
  AppState,
  AppStateStatus
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Linking from 'expo-linking';
import fontSize from '../../../utils/fontsizeUtils';
import { navigate } from '../../../navigation/RootNavigation';
import { usePaymentPolling, PaymentType, PaymentMethod, PaymentStatus } from './hooks/usePaymentPolling';
import { useDeepLinkHandler } from './hooks/useDeepLinkHandler';
import { getPaymentConfig } from './paymentConfig';

interface PaymentFlowProps {
  paymentType: PaymentType;
  paymentId: string;
  payUrl: string;
  method: PaymentMethod;
}

export const PaymentFlow: React.FC<PaymentFlowProps> = ({
  paymentType,
  paymentId,
  payUrl,
  method
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [hasOpenedPayment, setHasOpenedPayment] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  
  const config = getPaymentConfig(paymentType);

  // 导航辅助函数
  const safeNavigate = useCallback((routeName: string, params: any) => {
    console.log("=== safeNavigate 调试信息 ===");
    console.log("目标路由:", routeName);
    console.log("导航参数:", JSON.stringify(params, null, 2));
    console.log("==========================");

    try {
      // @ts-ignore 忽略可能的类型错误
      navigation.navigate(routeName, params);
    } catch (e) {
      try {
        navigate(routeName, params);
      } catch (e) {
        setTimeout(() => {
          try {
            // @ts-ignore 忽略可能的类型错误
            navigation.navigate(routeName, params);
          } catch (e) {
            Alert.alert(
              t(`${config.translationPrefix}.navigation_failed`),
              t(`${config.translationPrefix}.navigation_failed_message`)
            );
          }
        }, 500);
      }
    }
  }, [navigation, t, config.translationPrefix]);

  // 处理支付成功
  const handleSuccess = useCallback((response: any) => {
    setPaymentStatus('completed');
    safeNavigate(config.successRoute, response);
  }, [safeNavigate, config.successRoute]);

  // 处理支付错误
  const handleError = useCallback((errorData: any) => {
    setPaymentStatus('failed');
    safeNavigate(config.errorRoute, errorData);
  }, [safeNavigate, config.errorRoute]);

  // 处理支付取消 - 所有支付方式都跳转到失败页面
  const handleCancel = useCallback(() => {
    stopPolling();
    
    // 所有支付方式的取消都跳转到失败页面
    safeNavigate(config.errorRoute, {
      msg: t(`${config.translationPrefix}.payment_cancelled`),
      [config.idFieldName]: paymentId,
      ...(paymentType === 'recharge' && { isRecharge: true })
    });
  }, [paymentType, paymentId, safeNavigate, stopPolling, t, config]);

  // 处理超时
  const handleTimeout = useCallback(() => {
    if (method === "mobile_money") {
      console.log(`Mobile Money支付查询超时`);
      setPaymentStatus('pending');
      
      // 显示未付款提示
      Alert.alert(
        t(`${config.translationPrefix}.mobile_money_not_paid`),
        t(`${config.translationPrefix}.mobile_money_not_paid_message`),
        [{ text: t("common.ok") }]
      );
    } else {
      console.log("支付查询超时，显示重新支付按钮");
      setPaymentStatus('pending');
      // 不再自动跳转失败页面，让用户决定下一步
    }
  }, [method, t, config.translationPrefix]);

  // 使用轮询 hook
  const { startPolling, stopPolling, checkPaymentStatus } = usePaymentPolling({
    paymentType,
    paymentId,
    method,
    onSuccess: handleSuccess,
    onTimeout: handleTimeout
  });

  // 使用深度链接处理 hook
  useDeepLinkHandler({
    paymentType,
    paymentId,
    method,
    onSuccess: handleSuccess,
    onError: handleError,
    onCancel: handleCancel,
    stopPolling,
    setPaymentStatus
  });

  // 打开外部浏览器进行支付
  const openExternalPayment = async () => {
    try {
      console.log(`=== 准备打开外部浏览器${paymentType === 'order' ? '支付' : '充值'} ===`);
      console.log("支付方式:", method);
      console.log(`${paymentType === 'order' ? '订单' : '充值'}ID:`, paymentId);
      console.log("支付URL:", payUrl);
      console.log("当前平台:", Platform.OS);

      // 检查payUrl是否有效
      if (!payUrl || payUrl === 'null' || payUrl === 'undefined') {
        console.error("❌ 支付URL无效:", payUrl);
        Alert.alert(t("common.error"), t(`${config.translationPrefix}.invalid_payment_url`));
        safeNavigate(config.errorRoute, {
          msg: t(`${config.translationPrefix}.invalid_payment_url`),
          [config.idFieldName]: paymentId,
          ...(paymentType === 'recharge' && { isRecharge: true })
        });
        return;
      }

      // Android平台对Wave支付使用不同的处理逻辑
      if (Platform.OS === 'android' && method === 'wave') {
        console.log("Android平台Wave支付：直接打开URL");
        setLoading(true);

        try {
          await Linking.openURL(payUrl);
          console.log("✅ Wave支付URL已在Android上打开");
          setHasOpenedPayment(true);
          setLoading(false);
          // 不再自动开始轮询，等待用户切回app
        } catch (linkingError) {
          console.error("❌ Android Wave支付URL打开失败:", linkingError);
          setLoading(false);
          Alert.alert(t("common.error"), t(`${config.translationPrefix}.cannot_open_link`));
          safeNavigate(config.errorRoute, {
            msg: t(`${config.translationPrefix}.cannot_open_link`),
            [config.idFieldName]: paymentId,
            ...(paymentType === 'recharge' && { isRecharge: true })
          });
        }
        return;
      }

      // PayPal支付：直接打开URL
      if (method === 'paypal') {
        console.log("PayPal支付：直接打开支付URL");
        setLoading(true);

        try {
          await Linking.openURL(payUrl);
          console.log("✅ PayPal支付URL已打开");
          setHasOpenedPayment(true);
          setLoading(false);
          // 不再自动开始轮询，等待用户切回app
        } catch (linkingError) {
          console.error("❌ PayPal支付URL打开失败:", linkingError);
          setLoading(false);
          Alert.alert(t("common.error"), t(`${config.translationPrefix}.cannot_open_link`));
          safeNavigate(config.errorRoute, {
            msg: t(`${config.translationPrefix}.cannot_open_link`),
            [config.idFieldName]: paymentId,
            ...(paymentType === 'recharge' && { isRecharge: true })
          });
        }
        return;
      }

      // 其他平台或支付方式
      const supported = await Linking.canOpenURL(payUrl);
      console.log("URL是否支持打开:", supported);

      if (supported) {
        console.log("开始打开外部浏览器...");
        setLoading(true);

        await Linking.openURL(payUrl);
        console.log("✅ 外部浏览器已打开");
        setHasOpenedPayment(true);
        setLoading(false);
        // 不再自动开始轮询，等待用户切回app
      } else {
        console.error("❌ 无法打开支付链接");
        Alert.alert(t("common.error"), t(`${config.translationPrefix}.cannot_open_link`));
        safeNavigate(config.errorRoute, {
          msg: t(`${config.translationPrefix}.cannot_open_link`),
          [config.idFieldName]: paymentId,
          ...(paymentType === 'recharge' && { isRecharge: true })
        });
      }
    } catch (error) {
      console.error("❌ 打开外部浏览器失败:", error);
      setLoading(false);
      Alert.alert(t("common.error"), t(`${config.translationPrefix}.open_payment_failed`));
      safeNavigate(config.errorRoute, {
        msg: t(`${config.translationPrefix}.open_payment_failed`),
        [config.idFieldName]: paymentId,
        ...(paymentType === 'recharge' && { isRecharge: true })
      });
    }
  };

  // 监听App状态变化
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log(`=== App状态变化：${appStateRef.current} -> ${nextAppState} ===`);
      
      // 从后台切换到前台
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log("App从后台切换到前台");
        
        // 如果已经打开过支付页面且未在轮询，则开始轮询
        if (hasOpenedPayment && paymentStatus !== 'checking' && paymentStatus !== 'completed') {
          console.log("开始轮询支付状态...");
          
          // Mobile Money 需要特殊处理
          if (method === 'mobile_money') {
            // 直接开始轮询，不显示提示
            setPaymentStatus('checking');
            startPolling();
          } else {
            // 其他支付方式
            setPaymentStatus('checking');
            startPolling();
          }
        }
      }
      
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [hasOpenedPayment, paymentStatus, startPolling]);

  // 组件挂载时的处理
  useEffect(() => {
    if (method === "paypal" || method === "wave" || method === "bank_card") {
      console.log(`=== ${method}${paymentType === 'order' ? '支付' : '充值'}页面加载，自动打开浏览器 ===`);
      openExternalPayment();
    }

    if (method === "mobile_money") {
      console.log(`=== Mobile Money${paymentType === 'order' ? '支付' : '充值'}页面加载 ===`);
      setPaymentStatus('pending');
      setHasOpenedPayment(true); // Mobile Money直接标记为已开始支付
    }

    return () => {
      stopPolling();
    };
  }, []);

  // 重新打开支付
  const retryPayment = () => {
    setPaymentStatus('pending');
    stopPolling();
    if (method === "mobile_money") {
      console.log("Mobile Money支付重试，等待用户确认");
    } else {
      openExternalPayment();
    }
  };


  // 返回处理 - 所有支付方式都跳转到失败页面
  const handleGoBack = () => {
    stopPolling();

    Alert.alert(
      t(`${config.translationPrefix}.confirm_exit`),
      t(`${config.translationPrefix}.payment_not_complete_question`),
      [
        { text: t(`${config.translationPrefix}.continue_payment`), style: "cancel" },
        {
          text: t("common.exit"),
          style: "destructive",
          onPress: () => {
            // 所有支付方式的退出都跳转到失败页面
            safeNavigate(config.errorRoute, {
              msg: t(`${config.translationPrefix}.payment_incomplete_retry`),
              [config.idFieldName]: paymentId,
              ...(paymentType === 'recharge' && { isRecharge: true })
            });
          }
        }
      ]
    );
  };

  // 获取支付方式显示名称
  const getPaymentMethodTitle = () => {
    const methodTitles = {
      paypal: t(`${config.translationPrefix}.paypal_payment`),
      wave: t(`${config.translationPrefix}.wave_payment`),
      mobile_money: t(`${config.translationPrefix}.mobile_money_payment`),
      bank_card: t(`${config.translationPrefix}.bank_card_payment`)
    };
    return methodTitles[method] || t(`${config.translationPrefix}.payment`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#007efa" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getPaymentMethodTitle()}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 主要内容区域 */}
      <View style={styles.content}>
        {/* 支付状态显示 */}
        <View style={styles.statusContainer}>
          {paymentStatus === 'pending' && (
            <>
              <Ionicons name="card-outline" size={80} color="#007efa" />
              <Text style={styles.statusTitle}>{t(`${config.translationPrefix}.ready_to_pay`)}</Text>
              <Text style={styles.statusSubtitle}>
                {method === 'mobile_money'
                  ? t(`${config.translationPrefix}.mobile_money_instruction_2`)
                  : t(`${config.translationPrefix}.click_button_to_start`)
                }
              </Text>
            </>
          )}

          {paymentStatus === 'checking' && (
            <>
              <ActivityIndicator size="large" color="#007efa" />
              <Text style={styles.statusTitle}>{t(`${config.translationPrefix}.checking_payment`)}</Text>
              <Text style={styles.statusSubtitle}>
                {t(`${config.translationPrefix}.verifying_please_wait`)}
              </Text>
            </>
          )}

          {paymentStatus === 'completed' && (
            <>
              <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
              <Text style={[styles.statusTitle, { color: '#4CAF50' }]}>
                {t(`${config.translationPrefix}.payment_successful`)}
              </Text>
              <Text style={styles.statusSubtitle}>
                {t(`${config.translationPrefix}.redirecting_to_result`)}
              </Text>
            </>
          )}

          {paymentStatus === 'failed' && (
            <>
              <Ionicons name="close-circle" size={80} color="#FF4444" />
              <Text style={[styles.statusTitle, { color: '#FF4444' }]}>
                {t(`${config.translationPrefix}.payment_failed`)}
              </Text>
              <Text style={styles.statusSubtitle}>
                {t(`${config.translationPrefix}.retry_or_contact_support`)}
              </Text>
            </>
          )}
        </View>

        {/* 订单/充值信息 */}
        <View style={styles.orderInfo}>
          <Text style={styles.orderTitle}>
            {t(`${config.translationPrefix}.${paymentType === 'order' ? 'order_info' : 'recharge_info'}`)}
          </Text>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>
              {t(`${config.translationPrefix}.${paymentType === 'order' ? 'order_number' : 'recharge_id'}`)}
            </Text>
            <Text style={styles.orderValue}>{paymentId}</Text>
          </View>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>{t(`${config.translationPrefix}.payment_method`)}</Text>
            <Text style={styles.orderValue}>
              {method === 'paypal' ? 'PayPal' :
               method === 'wave' ? 'Wave' :
               method === 'mobile_money' ? 'Mobile Money' :
               method === 'bank_card' ? 'Bank Card' : t(`${config.translationPrefix}.other`)}
            </Text>
          </View>
        </View>

        {/* 操作按钮 */}
        <View style={styles.buttonContainer}>
          {paymentStatus === 'pending' && (
            <>
              {/* Mobile Money不显示按钮，其他支付方式显示按钮 */}
              {method !== "mobile_money" && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={openExternalPayment}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons
                        name={hasOpenedPayment ? "refresh-outline" : "open-outline"}
                        size={20}
                        color="white"
                      />
                      <Text style={styles.primaryButtonText}>
                        {hasOpenedPayment 
                          ? t(`${config.translationPrefix}.retry_payment`)
                          : t(`${config.translationPrefix}.open_browser_payment`)
                        }
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}

          {paymentStatus === 'checking' && (
            <>
              {/* 所有支付方式都只显示正在检查的按钮，不显示手动查询 */}
              <TouchableOpacity
                style={[styles.primaryButton, { opacity: 0.7 }]}
                disabled={true}
              >
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.primaryButtonText}>
                  {t(`${config.translationPrefix}.checking_payment`)}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {paymentStatus === 'failed' && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={retryPayment}
            >
              <Ionicons name="refresh-outline" size={20} color="white" />
              <Text style={styles.primaryButtonText}>
                {t(`${config.translationPrefix}.retry_payment`)}
              </Text>
            </TouchableOpacity>
          )}

          {/* 取消支付按钮 */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>
              {t(`${config.translationPrefix}.cancel_payment`)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 提示信息 */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>{t(`${config.translationPrefix}.payment_instructions`)}</Text>
          {method === 'mobile_money' ? (
            <>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionBullet}>•</Text>
                <Text style={styles.instructionText}>
                  {t(`${config.translationPrefix}.mobile_money_instruction_1`)}
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionBullet}>•</Text>
                <Text style={styles.instructionText}>
                  {t(`${config.translationPrefix}.mobile_money_instruction_2`)}
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionBullet}>•</Text>
                <Text style={styles.instructionText}>
                  {t(`${config.translationPrefix}.mobile_money_instruction_3`)}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionBullet}>•</Text>
                <Text style={styles.instructionText}>
                  {t(`${config.translationPrefix}.instruction_1`, {
                    paymentMethod: method === 'paypal' ? 'PayPal' :
                                  method === 'wave' ? 'Wave' :
                                  method === 'bank_card' ? 'Bank Card' : method
                  })}
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionBullet}>•</Text>
                <Text style={styles.instructionText}>
                  {t(`${config.translationPrefix}.instruction_2`)}
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
    width: 40,
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
  cancelButton: {
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: fontSize(16),
    fontWeight: '600',
    color: '#666666',
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