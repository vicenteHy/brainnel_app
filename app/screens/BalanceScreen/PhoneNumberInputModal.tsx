import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  BackHandler,
  Alert,
  Linking,
} from "react-native";
import fontSize from "../../utils/fontsizeUtils";
import BackIcon from "../../components/BackIcon";
import { payApi } from "../../services/api/payApi";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PhoneNumberInputModalProps {
  isVisible: boolean;
  onClose: () => void;
  paymentParams: {
    originalAmount: number;
    amount: number;
    currency: string;
    payment_method: string;
    selectedPriceLabel: string;
    onCloses?: () => void;
  } | null;
  onSubmit: (phoneNumber: string) => Promise<void>;
  onCloses?: () => void;
  displayCountryCode?: string;
  onCountrySelect?: () => void;
  validDigits?: number[];
}

type RootStackParamList = {
  Pay: { payUrl: string; method: string; order_id: string };
};

const PhoneNumberInputModal = ({
  isVisible,
  onClose,
  paymentParams,
  onSubmit,
  onCloses,
  displayCountryCode,
  onCountrySelect,
  validDigits,
}: PhoneNumberInputModalProps) => {
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [localCountryCode, setLocalCountryCode] = useState<string>("+243"); // 默认值

  useEffect(() => {
    const fetchCountryCode = async () => {
      try {
        const selectedCountry = await AsyncStorage.getItem('@selected_country');
        if (selectedCountry) {
          const parsed = JSON.parse(selectedCountry);
          if (parsed.country) {
            setLocalCountryCode(parsed.country);
          }
        }
      } catch (e) {
        // 读取失败，保持默认
      }
    };
    fetchCountryCode();

    const backAction = () => {
      if (isVisible) {
        onClose();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [isVisible, onClose]);

  const handlePaySubmit = async () => {
    if (!paymentParams) return;

    // 验证电话号码（对于mobile_money支付）
    if (paymentParams.payment_method === "mobile_money" && !phoneNumber) {
      Toast.show({
        type: "error",
        text1:
          t("balance.phone_modal.phone_required") || "Phone number is required",
      });
      return;
    }

    // 验证电话号码位数
    if (
      paymentParams.payment_method === "mobile_money" &&
      validDigits &&
      validDigits.length > 0
    ) {
      if (!validDigits.includes(phoneNumber.length)) {
        Toast.show({
          type: "error",
          text1: `${
            t("order.error.invalid_phone") || "Invalid phone number"
          } (${
            t("order.error.requires_digits") || "Required digits"
          }: ${validDigits.join(", ")})`,
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 如果有onSubmit函数，说明是从订单页面调用的，需要传递电话号码
      if (onSubmit) {
        await onSubmit(phoneNumber);
      } else {
        // 原来的充值逻辑
        const data = {
          amount: paymentParams.amount,
          currency: paymentParams.currency,
          payment_method: paymentParams.payment_method,
        };

        const res = await payApi.initiateRecharge(data);

        if (paymentParams.payment_method === "wave") {
          try {
            // 首先检查是否可以打开Wave应用
            const canOpen = await Linking.canOpenURL(res.payment.payment_url);
            if (canOpen) {
              // 如果可以打开Wave应用，直接跳转
              await Linking.openURL(res.payment.payment_url);
            } else {
              // 如果无法打开应用，提示用户下载或使用网页版
              await Linking.openURL(res.payment.payment_url);
            }
          } catch (error) {
            console.error("Error opening Wave app:", error);
            Toast.show({
              type: "error",
              text1:
                t("order.error.wave_app_open") || "Failed to open Wave app",
            });
          }
          return;
        }

        if (paymentParams.payment_method === "paypal") {
          try {
            // 首先检查是否可以打开Wave应用
            const canOpen = await Linking.canOpenURL(res.payment.payment_url);
            if (canOpen) {
              // 如果可以打开Wave应用，直接跳转
              await Linking.openURL(res.payment.payment_url);
            } else {
              // 如果无法打开应用，提示用户下载或使用网页版
              await Linking.openURL(res.payment.payment_url);
            }
          } catch (error) {
            console.error("Error opening Wave app:", error);
            Toast.show({
              type: "error",
              text1:
                t("order.error.wave_app_open") || "Failed to open Wave app",
            });
          }
          return;
        }

        // 成功后关闭所有模态窗口
        onClose();
        if (onCloses) {
          onCloses();
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      Toast.show({
        type: "error",
        text1: t("balance.phone_modal.payment_failed") || "Payment failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{t("balance.phone_modal.title")}</Text>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Text style={styles.backButtonText}>
                <BackIcon size={fontSize(18)} />
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.paymentConfirmContainer}>
            {/* 充值金额信息 */}
            <View style={styles.paymentSummaryCard}>
              <Text style={styles.paymentSummaryTitle}>
                {t("balance.phone_modal.recharge_summary")}
              </Text>

              <View style={styles.paymentSummaryRow}>
                <Text style={styles.paymentSummaryLabel}>
                  {t("balance.phone_modal.amount")}
                </Text>
                <Text style={styles.paymentSummaryValue}>
                  {paymentParams?.selectedPriceLabel || ""}
                </Text>
              </View>

              {paymentParams?.payment_method === "wave" && (
                <View style={styles.paymentSummaryRow}>
                  <Text style={styles.paymentSummaryLabel}>
                    Montant converti:
                  </Text>
                  <Text style={styles.paymentSummaryValueHighlight}>
                    {paymentParams?.amount.toFixed(2)} FCFA
                  </Text>
                </View>
              )}

              {paymentParams?.currency !== "FCFA" &&
                paymentParams?.payment_method !== "wave" && (
                  <View style={styles.paymentSummaryRow}>
                    <Text style={styles.paymentSummaryLabel}>
                      {t("balance.phone_modal.converted_amount")}
                    </Text>
                    <Text style={styles.paymentSummaryValueHighlight}>
                      {paymentParams?.currency === "USD" ? "$" : "€"}
                      {paymentParams?.amount.toFixed(2) || "0.00"}
                    </Text>
                  </View>
                )}

              <View style={styles.paymentSummaryRow}>
                <Text style={styles.paymentSummaryLabel}>
                  {t("balance.phone_modal.payment_method")}
                </Text>
                <Text style={styles.paymentSummaryValue}>
                  {paymentParams?.payment_method || "Non sélectionné"}
                </Text>
              </View>
            </View>

            {/* 电话号码输入 */}

            {paymentParams?.payment_method === "mobile_money" && (
              <>
                <View style={styles.phoneInputContainer}>
                  <Text style={styles.phoneInputLabel}>
                    {t("balance.phone_modal.phone_number")}
                  </Text>
                  <View style={styles.phoneInputWrapper}>
                    <TouchableOpacity
                      style={styles.countryCodeContainer}
                      onPress={onCountrySelect}
                    >
                      <Text style={styles.countryCodeText}>
                        {displayCountryCode || localCountryCode}
                      </Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.phoneInput}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      returnKeyType="done"
                      placeholder={t("balance.phone_modal.enter_phone")}
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                <View style={styles.supportedOperatorsContainer}>
                  <Text style={styles.supportedOperatorsTitle}>
                    {t("balance.phone_modal.supported_operators")}
                  </Text>
                  <View style={styles.operatorsRow}>
                    <Image
                      source={require("../../../assets/img/image_7337a807.png")}
                      style={styles.operatorSmallIcon}
                    />
                    <Image
                      source={require("../../../assets/img/image_96b927ad.png")}
                      style={styles.operatorSmallIcon}
                    />
                    <Image
                      source={require("../../../assets/img/image_1fee7e8b.png")}
                      style={styles.operatorSmallIcon}
                    />
                  </View>
                </View>
              </>
            )}

            {/* 支付按钮 */}
            <TouchableOpacity
              style={[
                styles.payButton,
                (isSubmitting ||
                  (paymentParams?.payment_method === "mobile_money" &&
                    !phoneNumber)) &&
                  styles.payButtonDisabled,
              ]}
              onPress={handlePaySubmit}
              disabled={
                isSubmitting ||
                (paymentParams?.payment_method === "mobile_money" &&
                  !phoneNumber)
              }
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.payButtonText}>
                  {t("balance.phone_modal.pay")}{" "}
                  {paymentParams?.payment_method === "wave"
                    ? paymentParams.amount.toFixed(2) + " FCFA"
                    : paymentParams?.currency === "FCFA"
                    ? paymentParams.originalAmount.toLocaleString() +
                      " " +
                      paymentParams.currency
                    : paymentParams?.currency === "USD"
                    ? "$" + paymentParams?.amount.toFixed(2)
                    : paymentParams?.amount.toFixed(2) + " €"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 模态框内的 Toast 组件 */}
        <Toast
          config={{
            error: (props) => (
              <View
                style={{
                  backgroundColor: "#FF5100",
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 8,
                  marginHorizontal: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 9999,
                  elevation: 9999,
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 16,
                    textAlign: "center",
                  }}
                >
                  {props.text1}
                </Text>
              </View>
            ),
          }}
          position="top"
          topOffset={50}
          visibilityTime={3000}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    height: "80%",
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: "auto",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    paddingBottom: 16,
    position: "relative",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 111, 48, 0.1)",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333333",
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  backButton: {
    position: "absolute",
    left: 24,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: fontSize(14),
    color: "#007AFF",
    fontWeight: "500",
  },
  paymentConfirmContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  paymentSummaryCard: {
    backgroundColor: "#f5f9ff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  paymentSummaryTitle: {
    fontSize: fontSize(18),
    fontWeight: "700",
    marginBottom: 15,
    color: "#333",
  },
  paymentSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  paymentSummaryLabel: {
    fontSize: fontSize(14),
    color: "#666",
  },
  paymentSummaryValue: {
    fontSize: fontSize(14),
    fontWeight: "500",
    color: "#333",
  },
  paymentSummaryValueHighlight: {
    fontSize: fontSize(14),
    fontWeight: "600",
    color: "#ff5100",
  },
  phoneInputContainer: {
    marginBottom: 20,
  },
  phoneInputLabel: {
    fontSize: fontSize(16),
    fontWeight: "500",
    marginBottom: 10,
    color: "#333",
  },
  phoneInputWrapper: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 25,
    overflow: "hidden",
  },
  countryCodeContainer: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 15,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#ddd",
  },
  countryCodeText: {
    fontSize: fontSize(16),
    color: "#333",
  },
  countryCodeArrow: {
    fontSize: fontSize(12),
    color: "#999",
    marginLeft: 5,
  },
  phoneInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: fontSize(16),
    color: "#333",
  },
  supportedOperatorsContainer: {
    marginBottom: 30,
  },
  supportedOperatorsTitle: {
    fontSize: fontSize(16),
    fontWeight: "500",
    marginBottom: 10,
    color: "#333",
  },
  operatorsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  operatorSmallIcon: {
    width: 70,
    height: 26,
    resizeMode: "contain",
    marginRight: 15,
  },
  payButton: {
    backgroundColor: "#FF6F30",
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    elevation: 3,
    shadowColor: "#FF6F30",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  payButtonDisabled: {
    backgroundColor: "#cccccc",
    opacity: 0.7,
    elevation: 0,
    shadowOpacity: 0,
  },
  payButtonText: {
    color: "white",
    fontSize: fontSize(16),
    fontWeight: "700",
  },
});

export default PhoneNumberInputModal;
