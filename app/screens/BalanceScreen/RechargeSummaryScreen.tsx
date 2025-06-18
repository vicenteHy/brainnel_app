import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Linking,
  Modal,
  FlatList,
} from "react-native";
import fontSize from "../../utils/fontsizeUtils";
import BackIcon from "../../components/BackIcon";
import { payApi } from "../../services/api/payApi";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import AsyncStorage from '@react-native-async-storage/async-storage';
import useUserStore from "../../store/user";
import RechargeSummary from "./RechargeSummary";
import { PAYMENT_SUCCESS_EVENT, PAYMENT_FAILURE_EVENT } from "../../constants/events";
import { settingApi } from "../../services/api/setting";
import { CountryList } from "../../constants/countries";

// 定义本地存储的国家数据类型
interface LocalCountryData {
  code: string;
  flag: string;
  name: string;
  phoneCode: string;
  userCount: number;
  valid_digits?: number[];
}

interface RechargeSummaryScreenProps {
  route: {
    params: {
      paymentParams: {
        originalAmount: number;
        amount: number;
        currency: string;
        payment_method: string;
        selectedPriceLabel: string;
        onCloses?: () => void;
      };
      validDigits?: number[];
    };
  };
}

const RechargeSummaryScreen = () => {
  const { t } = useTranslation();
  const { user } = useUserStore();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { paymentParams, validDigits } = route.params as any;
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localCountryCode, setLocalCountryCode] = useState<string>("+243");
  const [currentValidDigits, setCurrentValidDigits] = useState<number[]>(validDigits || [8]);
  
  // 国家选择相关状态
  const [countryList, setCountryList] = useState<CountryList[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryList | null>(null);
  const [localSelectedCountry, setLocalSelectedCountry] = useState<LocalCountryData | null>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);

  useEffect(() => {
    const fetchCountryCode = async () => {
      try {
        const selectedCountry = await AsyncStorage.getItem('@selected_country');
        if (selectedCountry) {
          const parsed = JSON.parse(selectedCountry);
          if (parsed.phoneCode) {
            setLocalCountryCode(parsed.phoneCode);
          }
        }
      } catch (e) {
        // 读取失败，保持默认
      }
    };
    fetchCountryCode();
  }, []);

  // 添加支付结果监听
  useEffect(() => {
    const handlePaymentSuccess = (data: any) => {
      
      // 导航到充值成功页面
      navigation.navigate('RechargeSuccess', {
        amount: paymentParams?.selectedPriceLabel?.split(' ')[0] || "",
        currency: paymentParams?.currency || user?.currency,
        rechargeId: data.paymentId || data.rechargeId || "",
      });
    };

    const handlePaymentFailure = (data: any) => {
      
      // 导航到充值失败页面
      navigation.navigate('RechargeError', {
        amount: paymentParams?.selectedPriceLabel?.split(' ')[0] || "",
        currency: paymentParams?.currency || user?.currency,
        error: data.error || t("balance.recharge.payment_failed_desc") || "Payment failed, please try again",
        rechargeId: data.rechargeId || "",
      });

      // 重置提交状态
      setIsSubmitting(false);
    };

    // 注册事件监听器
    global.EventEmitter.on(PAYMENT_SUCCESS_EVENT, handlePaymentSuccess);
    global.EventEmitter.on(PAYMENT_FAILURE_EVENT, handlePaymentFailure);

    // 清理函数
    return () => {
      global.EventEmitter.off(PAYMENT_SUCCESS_EVENT, handlePaymentSuccess);
      global.EventEmitter.off(PAYMENT_FAILURE_EVENT, handlePaymentFailure);
    };
  }, [navigation, t, paymentParams, user?.currency]);

  const formatPhoneNumber = (phone: string) => {
    // 移除所有非数字字符
    const cleanPhone = phone.replace(/\D/g, "");
    
    // 如果以0开头，移除0（但不删除，根据之前的需求保留0）
    // const formattedPhone = cleanPhone.startsWith("0") ? cleanPhone.substring(1) : cleanPhone;
    
    // 添加国家代码
    return `${localCountryCode}${cleanPhone}`;
  };

  const getDisplayCountryCode = () => {
    return localCountryCode;
  };

  const handleCountryCodePress = async () => {
    setLoadingCountries(true);
    
    try {
      // 获取国家列表
      const countries = await settingApi.getCountryList();
      setCountryList(countries);
      setShowCountryModal(true);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to load countries",
      });
    } finally {
      setLoadingCountries(false);
    }
  };

  const handlePaySubmit = async () => {
    if (!paymentParams) {
      return;
    }

    // 验证电话号码（对于mobile_money支付）
    if (paymentParams.payment_method === "mobile_money" && !phoneNumber) {
      Toast.show({
        type: "error",
        text1: t("balance.phone_modal.phone_required") || "Phone number is required",
      });
      return;
    }

    // 验证电话号码位数
    if (
      paymentParams.payment_method === "mobile_money" &&
      currentValidDigits &&
      currentValidDigits.length > 0
    ) {
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");
      if (!currentValidDigits.includes(cleanPhoneNumber.length)) {
        Toast.show({
          type: "error",
          text1: `${
            t("order.error.invalid_phone") || "Invalid phone number"
          } (${
            t("order.error.requires_digits") || "Required digits"
          }: ${currentValidDigits.join(", ")})`,
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 准备请求数据
      const rechargeData: any = {
        amount: paymentParams.amount,
        currency: paymentParams.currency,
        payment_method: paymentParams.payment_method,
        type: "recharge",
      };

      // 如果是mobile_money支付，添加extra字段
      if (paymentParams.payment_method === "mobile_money") {
        const formattedPhone = formatPhoneNumber(phoneNumber);
        rechargeData.extra = {
          phone_number: formattedPhone,
        };
      }


      // 调用充值接口
      const response = await payApi.initiateRecharge(rechargeData);
      if (response && response.success) {
        const paymentInfo = response.payment;

        if (paymentParams.payment_method === "wave") {
          try {
            // 显示支付处理提示
            Toast.show({
              type: "info",
              text1: t("balance.recharge.opening_wave") || "Opening Wave app...",
              text2: t("balance.recharge.complete_payment_wave") || "Please complete the payment in Wave app",
              visibilityTime: 3000,
            });

            // 打开Wave应用
            await Linking.openURL(paymentInfo.payment_url);
            
            
          } catch (error) {
            Toast.show({
              type: "error",
              text1: t("error") || "Error",
              text2: t("order.error.wave_app_open") || "Failed to open Wave app",
              visibilityTime: 4000,
            });
          }
        }

        if (paymentParams.payment_method === "mobile_money") {
          if (response.success === true) {
            Toast.show({
              type: "success",
              text1: response.msg || "",
            });
            navigation.reset({
              index: 0,
              routes: [{ name: "MainTabs" }],
            });
            return;
          } else {
            Toast.show({
              type: "error",
              text1: response.msg || "",
            });
          }
        }

        if (paymentParams.payment_method === "paypal") {
          try {
            // 显示支付处理提示
            Toast.show({
              type: "info",
              text1: t("balance.recharge.opening_paypal") || "Opening PayPal...",
              text2: t("balance.recharge.complete_payment_paypal") || "Please complete the payment in PayPal",
              visibilityTime: 3000,
            });

            // 打开PayPal
            await Linking.openURL(paymentInfo.payment_url);
            
            
          } catch (error) {
            Toast.show({
              type: "error",
              text1: t("error") || "Error",
              text2: t("order.error.paypal_app_open") || "Failed to open PayPal",
              visibilityTime: 4000,
            });
          }
        }

        if (paymentParams.payment_method === "bank_card") {
          try {
            // 显示支付处理提示
            Toast.show({
              type: "info",
              text1: t("balance.recharge.opening_payment") || "Opening payment page...",
              text2: t("balance.recharge.complete_payment") || "Please complete the payment",
              visibilityTime: 3000,
            });

            // 打开银行卡支付页面
            await Linking.openURL(paymentInfo.payment_url);
            
            
          } catch (error) {
            Toast.show({
              type: "error",
              text1: t("error") || "Error",
              text2: t("order.error.payment_open") || "Failed to open payment page",
              visibilityTime: 4000,
            });
          }
        }
      } else {
        // 处理失败情况，显示错误消息
        const errorMessage =
          response?.msg ||
          "Une erreur s'est produite lors du traitement de la recharge. Veuillez réessayer.";

        Alert.alert("Erreur", errorMessage);
      }
    } catch (error) {
      // 处理异常

      let errorMessage =
        "Une erreur s'est produite lors du traitement de la recharge. Veuillez réessayer.";

      // 尝试从错误对象中提取更具体的错误信息
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }

      Alert.alert("Erreur", errorMessage);
    } finally {
      // 无论成功失败，都取消提交状态
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon size={fontSize(18)} />
          </TouchableOpacity>
          <Text style={styles.title}>{t("balance.phone_modal.title")}</Text>
        </View>

        <View style={styles.content}>
          {/* 充值金额信息 */}
          <RechargeSummary paymentParams={paymentParams} />

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
                    onPress={handleCountryCodePress}
                  >
                    <Text style={styles.countryCodeText}>
                      {getDisplayCountryCode()}
                    </Text>
                    <Text style={styles.countryCodeArrow}>▼</Text>
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

      {/* 国家选择模态框 */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.countryModalOverlay}>
          <View style={styles.countryModalContent}>
            <View style={styles.countryModalHeader}>
              <Text style={styles.countryModalTitle}>
                {t("balance.phone_modal.select_country") || "Select Country"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowCountryModal(false)}
                style={styles.countryCloseButton}
              >
                <Text style={styles.countryCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingCountries ? (
              <View style={styles.countryLoadingContainer}>
                <ActivityIndicator size="large" color="#FF5100" />
                <Text style={styles.countryLoadingText}>Loading countries...</Text>
              </View>
            ) : (
              <FlatList
                data={countryList}
                keyExtractor={(item) => item.country.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.countryItem,
                      selectedCountry?.country === item.country &&
                        styles.countryItemSelected,
                    ]}
                    onPress={async () => {
                      setSelectedCountry(item);
                      setLocalCountryCode(`+${item.country}`);
                      
                      // 设置选中国家的 valid_digits
                      if (item.valid_digits) {
                        setCurrentValidDigits(item.valid_digits);
                      }
                      
                      // 保存选择的国家到本地存储
                      const countryToSave: LocalCountryData = {
                        code: item.country_code || "",
                        flag: item.flag || "",
                        name: item.name_en,
                        phoneCode: `+${item.country}`,
                        userCount: 0,
                        valid_digits: item.valid_digits
                      };
                      await AsyncStorage.setItem("@selected_country", JSON.stringify(countryToSave));
                      setLocalSelectedCountry(countryToSave);
                      
                      setShowCountryModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.countryItemText,
                        selectedCountry?.country === item.country &&
                          styles.countryItemTextSelected,
                      ]}
                    >
                      {item.name_en} (+{item.country})
                    </Text>
                  </TouchableOpacity>
                )}
                style={styles.countryList}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
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
  backButton: {
    position: "absolute",
    left: 24,
    zIndex: 1,
    padding: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333333",
    flex: 1,
    textAlign: "center",
    letterSpacing: 0.5,
    marginRight: 48,
  },
  content: {
    flex: 1,
    padding: 24,
    backgroundColor: "#f8f9fa",
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
    backgroundColor: "white",
  },
  countryCodeContainer: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 15,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    flexDirection: "row",
    alignItems: "center",
    minWidth: 80,
  },
  countryCodeText: {
    fontSize: fontSize(16),
    color: "#333",
  },
  countryCodeArrow: {
    fontSize: fontSize(10),
    color: "#666",
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
    backgroundColor: "#FF5100",
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    elevation: 3,
    shadowColor: "#FF5100",
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
  // 国家选择模态框样式
  countryModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 10000,
    elevation: 10000,
  },
  countryModalContent: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: "100%",
    maxHeight: "80%",
    minHeight: 400,
  },
  countryModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  countryModalTitle: {
    fontSize: fontSize(18),
    fontWeight: "700",
    color: "#333",
  },
  countryCloseButton: {
    padding: 5,
  },
  countryCloseButtonText: {
    fontSize: fontSize(16),
    fontWeight: "700",
    color: "#007AFF",
  },
  countryLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  countryLoadingText: {
    marginTop: 10,
    fontSize: fontSize(14),
    color: "#666",
  },
  countryList: {
    flex: 1,
  },
  countryItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "white",
  },
  countryItemSelected: {
    backgroundColor: "#FF5100",
  },
  countryItemText: {
    fontSize: fontSize(16),
    fontWeight: "500",
    color: "#333",
  },
  countryItemTextSelected: {
    color: "white",
    fontWeight: "600",
  },
});

export default RechargeSummaryScreen;