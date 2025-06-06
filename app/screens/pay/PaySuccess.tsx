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

// import { useRoute, RouteProp } from "@react-navigation/native";
// import { RootStackParamList } from "../../navigation/types";
// import { payApi } from "../../services/api/payApi";

type RootStackParamList = {
  MainTabs: { screen: string } | undefined;
  PaymentSuccessScreen: undefined;
};

export const PaymentSuccessScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  
  // const route = useRoute<RouteProp<RootStackParamList, 'PaymentSuccessScreen'>>();
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
      <StatusBar barStyle="light-content" backgroundColor="#FF6F30" />
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
                {t("payment.success.view_orders")}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FF6F30",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  successHeader: {
    backgroundColor: "#FF6F30",
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
    color: "#FF6F30",
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
    backgroundColor: "#FF6F30",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
    shadowColor: "#FF6F30",
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
    borderColor: "#FF6F30",
  },
  secondaryButtonText: {
    color: "#FF6F30",
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
    color: "#FF6F30",
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
