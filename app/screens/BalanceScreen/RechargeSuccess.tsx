import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  BackHandler,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import fontSize from "../../utils/fontsizeUtils";

type RootStackParamList = {
  MainTabs: { screen: string } | undefined;
  RechargeSuccess: {
    amount?: string;
    currency?: string;
    rechargeId?: string;
  };
};

interface RechargeSuccessRouteParams {
  amount?: string;
  currency?: string;
  rechargeId?: string;
}

export const RechargeSuccess = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { t } = useTranslation();
  
  // 获取路由参数
  const params = route.params as RechargeSuccessRouteParams || {};
  const {
    amount = "0",
    currency = "FCFA",
    rechargeId = ""
  } = params;

  // 处理系统返回，返回到首页
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.reset({
          index: 0,
          routes: [{ 
            name: 'MainTabs',
            params: { screen: 'Profile' }
          }],
        });
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
            {t("balance.recharge.success.title") || "充值成功！"}
          </Text>
          
          <Text style={styles.successSubtitle}>
            {t("balance.recharge.success.subtitle") || "您的账户余额已成功增加"}
          </Text>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Recharge Details Card */}
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>
              {t("balance.recharge.success.details") || "充值详情"}
            </Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {t("balance.recharge.success.amount") || "充值金额"}
              </Text>
              <Text style={styles.detailValue}>{amount} {currency}</Text>
            </View>
            
            {rechargeId && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {t("balance.recharge.success.transaction_id") || "交易号"}
                </Text>
                <Text style={styles.detailValue}>{rechargeId}</Text>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {t("balance.recharge.success.status") || "状态"}
              </Text>
              <Text style={styles.detailValueSuccess}>
                {t("balance.recharge.success.completed") || "已完成"}
              </Text>
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>💰</Text>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>
                  {t("balance.recharge.success.balance_updated") || "余额已更新"}
                </Text>
                <Text style={styles.infoSubtitle}>
                  {t("balance.recharge.success.balance_message") || "您现在可以使用新增的余额进行购物"}
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
                {t("balance.recharge.success.continue_shopping") || "继续购物"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                navigation.reset({
                  index: 0,
                  routes: [{ 
                    name: 'MainTabs',
                    params: { screen: 'Profile' }
                  }],
                });
              }}
            >
              <Text style={styles.secondaryButtonText}>
                {t("balance.recharge.success.view_balance") || "查看余额"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tips Section */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>
              {t("balance.recharge.success.tips_title") || "温馨提示"}
            </Text>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                {t("balance.recharge.success.tip_1") || "余额充值后立即生效，可用于购买商品"}
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                {t("balance.recharge.success.tip_2") || "您可以在个人中心查看余额变动记录"}
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                {t("balance.recharge.success.tip_3") || "如有任何问题，请联系客服获得帮助"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  detailsCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
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
  cardTitle: {
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.2,
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
  detailValueSuccess: {
    fontSize: fontSize(14),
    color: "#4CAF50",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
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