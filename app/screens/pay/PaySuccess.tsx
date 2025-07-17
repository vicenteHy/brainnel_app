import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  BackHandler,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import fontSize from "../../utils/fontsizeUtils";
import { Ionicons } from "@expo/vector-icons";

import { useRoute, RouteProp } from "@react-navigation/native";
import { logPurchaseEvent } from "../../services/facebook-events";
import { ordersApi } from "../../services/api/orders";
import useUserStore from "../../store/user";
import { useState } from "react";
// import { RootStackParamList } from "../../navigation/types";
// import { payApi } from "../../services/api/payApi";

type RootStackParamList = {
  MainTabs: { screen: string } | undefined;
  PaymentSuccessScreen: { order_id?: string; order_no?: string; recharge_id?: string; isRecharge?: boolean; [key: string]: any };
  OrderDetails: { orderId?: number; status?: number };
  RechargeDetails: { rechargeId?: string };
  Status: { status: number | null };
  Balance: undefined;
};

export const PaymentSuccessScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const { user } = useUserStore();
  
  const route = useRoute<RouteProp<RootStackParamList, 'PaymentSuccessScreen'>>();

  // 自定义返回处理函数
  const handleGoBack = () => {
    navigation.reset({
      index: 0,
      routes: [{ 
        name: 'MainTabs',
        params: { screen: 'Home' }
      }],
    });
  };

  // 设置自定义返回处理
  React.useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false, // 禁用手势返回
      headerLeft: () => (
        <TouchableOpacity onPress={handleGoBack} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
  // const { paymentId, PayerID } = route.params;
  // console.log("paymentId", paymentId);
  // console.log("PayerID", PayerID);

  // useEffect(() => {
  //   if (paymentId && PayerID) {
  //     payApi.paySuccessCallback(paymentId, PayerID).then((res) => {
  //       console.log("res", res);
  //     });
  //   }
  // }, [paymentId, PayerID]);

  // 获取订单详情并触发 Facebook Purchase 事件
  useEffect(() => {
    const fetchOrderAndLogPurchase = async () => {
      // 只处理订单支付成功，不处理充值
      if (route.params?.isRecharge) {
        console.log('[PaymentSuccess] 充值支付成功，不触发 Purchase 事件');
        return;
      }

      const { order_id, order_no, orderId, payment_method } = route.params || {};
      const finalOrderId = order_id || order_no || orderId;
      
      console.log('[PaymentSuccess] 检查订单ID参数:', {
        order_id,
        order_no, 
        orderId,
        finalOrderId,
        allParams: route.params
      });
      
      if (!finalOrderId) {
        console.log('[PaymentSuccess] 没有订单ID，无法触发 Purchase 事件');
        console.log('[PaymentSuccess] 可用的路由参数:', Object.keys(route.params || {}));
        return;
      }

      try {
        console.log('[PaymentSuccess] 获取订单详情，订单ID:', finalOrderId);
        
        // 获取订单详情
        const orderDetail = await ordersApi.getOrderDetails(finalOrderId);
        
        if (orderDetail && orderDetail.order_id) {
          console.log('[PaymentSuccess] 订单详情获取成功:', {
            orderId: orderDetail.order_id,
            totalAmount: orderDetail.total_amount,
            currency: orderDetail.currency,
            itemCount: orderDetail.items?.length
          });

          // 构建 SKU 详情数组
          const skuDetails = orderDetail.items?.map((item: any) => ({
            sku_id: item.sku_id,
            price: item.unit_price,
            quantity: item.quantity,
            sku_img: item.sku_image || item.sku_image_url
          })) || [];

          // 构建订单信息
          const orderInfo = {
            orderId: orderDetail.order_id,
            orderNo: orderDetail.order_no,
            totalPrice: orderDetail.total_amount,
            totalQuantity: orderDetail.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
            currency: orderDetail.currency || user.currency || 'USD'
          };

          // 触发 Facebook Purchase 事件
          console.log('[PaymentSuccess] 触发 Facebook Purchase 事件');
          logPurchaseEvent(
            orderInfo,
            skuDetails,
            payment_method || orderDetail.payment_method || 'unknown'
          );
          
        } else {
          console.log('[PaymentSuccess] 订单详情获取失败或数据不完整');
        }
      } catch (error) {
        console.error('[PaymentSuccess] 获取订单详情失败:', error);
      }
    };

    // 延迟一秒执行，确保页面已经完全加载
    const timer = setTimeout(() => {
      fetchOrderAndLogPurchase();
    }, 1000);

    return () => clearTimeout(timer);
  }, [route.params, user.currency]);

  // 处理系统返回，返回到首页
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleGoBack();
        return true; // 阻止默认返回行为
      };

      // 监听硬件返回按钮（Android）
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        backHandler.remove();
      };
    }, [navigation])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.successIconContainer}>
            <View style={styles.successIcon}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>
          </View>
          
          <Text style={styles.successTitle}>
            {t("payment.success.title")}
          </Text>
          
          <Text style={styles.successSubtitle}>
            {t("payment.success.subtitle")}
          </Text>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📦</Text>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>
                  {t("payment.success.shipping_info")}
                </Text>
                <Text style={styles.infoSubtitle}>
                  {t("payment.success.contact_message")}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                navigation.reset({
                  index: 0,
                  routes: [{ 
                    name: 'MainTabs',
                    params: { screen: 'Home' }
                  }],
                });
              }}
            >
              <Text style={styles.primaryButtonText}>
                {t("payment.success.back_to_home")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                const isRecharge = route.params?.isRecharge;
                
                if (isRecharge) {
                  // 充值支付，跳转到余额详情页面
                  navigation.navigate("Balance");
                } else {
                  // 订单支付，参考PayError.tsx的逻辑跳转到订单详情页面
                  const { order_id, order_no, orderId } = route.params || {};
                  
                  console.log('🔍 支付成功页面 - 准备跳转到订单详情');
                  console.log('🔍 - route.params:', route.params);
                  console.log('🔍 - order_id:', order_id);
                  console.log('🔍 - order_no:', order_no);
                  console.log('🔍 - orderId:', orderId);
                  
                  // 参考PayError.tsx的逻辑：优先使用order_id，然后是order_no
                  if (order_id) {
                    console.log('🔍 - 使用order_id跳转到订单详情:', order_id);
                    navigation.navigate("OrderDetails", { orderId: order_id, status: 1 });
                  } else if (order_no) {
                    console.log('🔍 - 使用order_no跳转到订单详情:', order_no);
                    navigation.navigate("OrderDetails", { orderId: order_no, status: 1 });
                  } else if (orderId) {
                    console.log('🔍 - 使用orderId跳转到订单详情:', orderId);
                    navigation.navigate("OrderDetails", { orderId: orderId.toString(), status: 1 });
                  } else {
                    console.log('🔍 - 未找到任何订单ID，跳转到订单列表');
                    // 如果真的没有订单ID，跳转到订单列表页面
                    navigation.navigate("Status", { status: null });
                  }
                }
              }}
            >
              <Text style={styles.secondaryButtonText}>
                {route.params?.isRecharge ? t("recharge.success.view_details") : t("payment.success.view_orders")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tips Section */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>
              {t("payment.success.tips_title")}
            </Text>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                {t("payment.success.tip_1")}
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                {t("payment.success.tip_2")}
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                {t("payment.success.tip_3")}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 任务完成弹窗 */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#4CAF50",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  successHeader: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
    paddingBottom: 60,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  checkIcon: {
    fontSize: fontSize(32),
    color: "#4CAF50",
    fontWeight: "bold",
  },
  successTitle: {
    fontSize: fontSize(24),
    fontWeight: "700",
    color: "white",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.5,
  },
  successSubtitle: {
    fontSize: fontSize(16),
    color: "white",
    textAlign: "center",
    opacity: 0.9,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    lineHeight: 22,
  },
  contentSection: {
    flex: 1,
    marginTop: -30,
    backgroundColor: "#f8f9fa",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoIcon: {
    fontSize: fontSize(24),
    marginRight: 16,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.2,
  },
  infoSubtitle: {
    fontSize: fontSize(14),
    color: "#666666",
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  buttonContainer: {
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: "#FF5100",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
    shadowColor: "#FF5100",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: "white",
    fontSize: fontSize(16),
    fontWeight: "600",
    textAlign: "center",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderColor: "#FF5100",
  },
  secondaryButtonText: {
    color: "#FF5100",
    fontSize: fontSize(16),
    fontWeight: "600",
    textAlign: "center",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.3,
  },
  tipsSection: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.2,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: fontSize(16),
    color: "#4CAF50",
    marginRight: 12,
    marginTop: 2,
    fontWeight: "bold",
  },
  tipText: {
    flex: 1,
    fontSize: fontSize(14),
    color: "#666666",
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});
