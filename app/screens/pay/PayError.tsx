import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  BackHandler,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import fontSize from "../../utils/fontsizeUtils";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get('window'); 

type PayErrorStackParamList = {
  MainTabs: { screen: string } | undefined;
  PayError: { 
    orderNumber?: string;
    amount?: string;
    currency?: string;
    errorReason?: string;
    orderData?: any;
  };
  PaymentMethod: { orderData?: any } | undefined;
  PreviewOrder: { orderData?: any } | undefined;
  OrderList: undefined;
  OrderDetails: { orderId?: string } | undefined;
  ConfirmOrder: { orderData?: any } | undefined;
};

interface PayErrorRouteParams {
  order_no?: string;
  order_id?: string;
  recharge_id?: string;
  amount?: string;
  currency?: string;
  errorReason?: string;
  orderData?: any;
  msg?: string;
  isRecharge?: boolean;
}

export const PayError = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PayErrorStackParamList>>();
  const route = useRoute();
  const { t } = useTranslation();

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
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
  
  // 获取路由参数
  const params = route.params as PayErrorRouteParams || {};
  
  // 添加调试日志
  console.log("=== PayError 组件调试信息 ===");
  console.log("完整路由参数:", JSON.stringify(params, null, 2));
  console.log("参数类型:", typeof params);
  console.log("参数键:", Object.keys(params));
  
  const {
    order_no,
    order_id,
    recharge_id,
    amount = "0",
    currency = "FCFA",
    errorReason = t("payment.error.payment_interrupted"),
    orderData,
    msg,
    isRecharge = false
  } = params;
  
  console.log("解析后的参数:");
  console.log("- order_no:", order_no);
  console.log("- order_id:", order_id);
  console.log("- amount:", amount);
  console.log("- currency:", currency);
  console.log("- errorReason:", errorReason);
  console.log("- msg:", msg);
  console.log("- orderData:", orderData);
  console.log("========================");

  // 根据类型使用不同的ID
  const realOrderNumber = isRecharge 
    ? (recharge_id || ("RCH" + Date.now()))
    : (order_no || order_id || ("ONL" + Date.now()));

  const goToHome = () => {
    handleGoBack();
  };

  const handleRetryPayment = () => {
    goToHome();
  };

  const viewOrderDetails = () => {
    console.log("PayError - viewOrderDetails clicked");
    console.log("PayError - params:", params);
    console.log("PayError - isRecharge:", isRecharge);
    console.log("PayError - order_no:", order_no);
    console.log("PayError - order_id:", order_id);
    console.log("PayError - recharge_id:", recharge_id);
    console.log("PayError - realOrderNumber:", realOrderNumber);
    
    if (isRecharge) {
      // 充值失败，跳转到余额页面查看充值记录
      console.log("PayError - Recharge failed, going to Balance tab");
      navigation.reset({
        index: 0,
        routes: [{ 
          name: 'MainTabs',
          params: { screen: 'Balance' }
        }],
      });
    } else {
      // 订单支付失败，原有逻辑
      // 检查是否有真实的订单号，优先使用order_id
      if (order_id) {
        console.log("PayError - Navigating to OrderDetails with order_id:", order_id);
        navigation.navigate("OrderDetails", { orderId: order_id, status: 0 });
      } else if (order_no) {
        console.log("PayError - Navigating to OrderDetails with order_no:", order_no);
        navigation.navigate("OrderDetails", { orderId: order_no, status: 0 });
      } else {
        console.log("PayError - No valid order number, going to My tab");
        // 没有订单号时，返回个人中心查看订单列表
        navigation.reset({
          index: 0,
          routes: [{ 
            name: 'MainTabs',
            params: { screen: 'My' }
          }],
        });
      }
    }
  };

  const contactSupport = () => {
    navigation.reset({
      index: 0,
      routes: [{ 
        name: 'MainTabs',
        params: { screen: 'Chat' }
      }],
    });
  };

  // 处理系统返回，返回到首页
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleGoBack();
        return true;
      };

      const backHandler = BackHandler;
      const subscription = backHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        subscription?.remove();
      };
    }, [navigation])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Error Icon and Title */}
        <View style={styles.errorHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="close-circle" size={80} color="#FF4444" />
          </View>
          <Text style={styles.errorTitle}>{t("payment.error.title")}</Text>
          <Text style={styles.errorSubtitle}>{t("payment.error.subtitle")}</Text>
          <Text style={styles.errorMessage}>{t("payment.error.message")}</Text>
        </View>

        {/* Order/Recharge Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>{isRecharge ? t("recharge.details") : t("order.details")}</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{isRecharge ? t("recharge.error.recharge_number") : t("payment.error.order_number")}</Text>
            <Text style={styles.detailValue}>{realOrderNumber}</Text>
          </View>
          
          {amount && amount !== "0" && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t("payment.error.amount")}</Text>
              <Text style={styles.detailValue}>{amount} {currency}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("payment.error.failure_reason")}</Text>
            <Text style={styles.detailValueError}>{errorReason}</Text>
          </View>
        </View>



        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleRetryPayment}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>{t("payment.error.back_to_home")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.secondaryButtonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={viewOrderDetails}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>{isRecharge ? t("recharge.error.view_recharge_details") : t("payment.error.view_order_details")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={contactSupport}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>{t("payment.error.contact_support")}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  
  // Error Header Styles
  errorHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
    backgroundColor: "white",
  },
  iconContainer: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 50,
    backgroundColor: "#fef2f2",
  },
  errorTitle: {
    fontSize: fontSize(28),
    fontWeight: "700",
    color: "#FF4444",
    textAlign: "center",
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: fontSize(16),
    color: "#64748b",
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "500",
  },
  errorMessage: {
    fontSize: fontSize(14),
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  // Card Styles
  detailsCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  detailLabel: {
    fontSize: fontSize(14),
    color: "#64748b",
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: fontSize(14),
    color: "#1e293b",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
  detailValueError: {
    fontSize: fontSize(14),
    color: "#FF4444",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },



  // Button Styles
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  secondaryButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 12,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: 52,
  },
  primaryButton: {
    backgroundColor: "#007efa",
    width: "100%",
    shadowColor: "#007efa",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#007efa",
    width: "48%",
    paddingHorizontal: 12,
  },
  primaryButtonText: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "white",
  },
  secondaryButtonText: {
    fontSize: fontSize(14),
    fontWeight: "600",
    color: "#007efa",
  },
});
