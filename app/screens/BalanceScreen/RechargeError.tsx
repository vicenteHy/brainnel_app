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
import fontSize from "../../utils/fontsizeUtils";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get('window'); 

type RechargeErrorStackParamList = {
  MainTabs: { screen: string } | undefined;
  RechargeError: { 
    amount?: string;
    currency?: string;
    errorReason?: string;
    rechargeId?: string;
  };
  RechargeScreen: undefined;
};

interface RechargeErrorRouteParams {
  amount?: string;
  currency?: string;
  errorReason?: string;
  rechargeId?: string;
  error?: string;
}

export const RechargeError = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RechargeErrorStackParamList>>();
  const route = useRoute();
  const { t } = useTranslation();
  
  // 获取路由参数
  const params = route.params as RechargeErrorRouteParams || {};
  const {
    amount = "0",
    currency = "FCFA",
    errorReason = t("balance.recharge.error.payment_interrupted") || "充值过程中断",
    rechargeId = "",
    error
  } = params;

  // 使用error参数或默认错误原因
  const displayErrorReason = error || errorReason;

  const goToHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ 
        name: 'MainTabs',
        params: { screen: 'Home' }
      }],
    });
  };

  const handleRetryRecharge = () => {
    // 返回到个人中心，用户可以重新打开充值页面
    navigation.reset({
      index: 0,
      routes: [{ 
        name: 'MainTabs',
        params: { screen: 'Profile' }
      }],
    });
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
        navigation.reset({
          index: 0,
          routes: [{ 
            name: 'MainTabs',
            params: { screen: 'Home' }
          }],
        });
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
          <Text style={styles.errorTitle}>
            {t("balance.recharge.error.title") || "充值失败"}
          </Text>
          <Text style={styles.errorSubtitle}>
            {t("balance.recharge.error.subtitle") || "您的充值无法完成"}
          </Text>
          <Text style={styles.errorMessage}>
            {t("balance.recharge.error.message") || "充值未成功，请检查您的支付方式或网络连接后重试"}
          </Text>
        </View>

        {/* Recharge Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>
            {t("balance.recharge.error.details") || "充值详情"}
          </Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {t("balance.recharge.error.amount") || "充值金额"}
            </Text>
            <Text style={styles.detailValue}>{amount} {currency}</Text>
          </View>
          
          {rechargeId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {t("balance.recharge.error.transaction_id") || "交易号"}
              </Text>
              <Text style={styles.detailValue}>{rechargeId}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {t("balance.recharge.error.failure_reason") || "失败原因"}
            </Text>
            <Text style={styles.detailValueError}>{displayErrorReason}</Text>
          </View>
        </View>

        {/* What Happened Section */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {t("balance.recharge.error.what_happened") || "发生了什么？"}
          </Text>
          <Text style={styles.infoMessage}>
            {t("balance.recharge.error.what_happened_message") || "不用担心，您的账户余额没有发生变化。您可以重新尝试充值或联系客服获得帮助。"}
          </Text>
        </View>

        {/* Next Steps Section */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>
            {t("balance.recharge.error.next_steps") || "下一步操作"}
          </Text>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>
              {t("balance.recharge.error.step_1") || "检查您的支付方式和网络连接"}
            </Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>
              {t("balance.recharge.error.step_2") || "如果可能，尝试不同的支付方式"}
            </Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>
              {t("balance.recharge.error.step_3") || "如果问题持续存在，请联系客服"}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleRetryRecharge}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {t("balance.recharge.error.retry_recharge") || "重新充值"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.secondaryButtonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={goToHome}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>
              {t("balance.recharge.error.back_to_home") || "返回首页"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={contactSupport}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>
              {t("balance.recharge.error.contact_support") || "联系客服"}
            </Text>
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

  // Info Card Styles
  infoCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  infoMessage: {
    fontSize: fontSize(14),
    color: "#64748b",
    lineHeight: 20,
  },

  // Steps Card Styles
  stepsCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  stepsTitle: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF5100",
    color: "white",
    fontSize: fontSize(12),
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 24,
    marginRight: 12,
    marginTop: 2,
  },
  stepText: {
    flex: 1,
    fontSize: fontSize(14),
    color: "#64748b",
    lineHeight: 20,
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
    backgroundColor: "#FF5100",
    width: "100%",
    shadowColor: "#FF5100",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#FF5100",
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
    color: "#FF5100",
  },
}); 