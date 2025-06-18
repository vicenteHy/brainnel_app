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
  FlatList,
} from "react-native";
import fontSize from "../../utils/fontsizeUtils";
import BackIcon from "../../components/BackIcon";
import { payApi } from "../../services/api/payApi";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { settingApi } from "../../services/api/setting";
import { CountryList } from "../../constants/countries";
import useUserStore from "../../store/user";
import RechargeSummary from "./RechargeSummary";

// 定义本地存储的国家数据类型
interface LocalCountryData {
  code: string;
  flag: string;
  name: string;
  phoneCode: string;
  userCount: number;
  valid_digits?: number[];
}

interface PhoneNumberInputModalProps {
  isVisible: boolean;
  onClose: () => void;
  paymentParams: {
    originalAmount: number;
    amount: number;
    currency: string;
    payment_method: string;
    selectedPriceLabel: string;
  } | null;
  onSubmit: (phoneNumber: string) => Promise<void>;
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
  validDigits,
}: PhoneNumberInputModalProps) => {
  const { t } = useTranslation();
  const { user } = useUserStore();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [localCountryCode, setLocalCountryCode] = useState<string>("+243"); // 默认值
  
  // 国家选择相关状态
  const [countryList, setCountryList] = useState<CountryList[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryList | null>(null);
  const [localSelectedCountry, setLocalSelectedCountry] = useState<LocalCountryData | null>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [currentValidDigits, setCurrentValidDigits] = useState<number[]>(validDigits || [8]);

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

  // 当 validDigits prop 更新时，更新本地状态
  useEffect(() => {
    if (validDigits) {
      setCurrentValidDigits(validDigits);
    }
  }, [validDigits]);

  // 加载国家列表的函数
  const loadCountryList = async () => {
    setLoadingCountries(true);
    try {
      const response = await settingApi.getSendSmsCountryList();
      if (response && Array.isArray(response)) {
        setCountryList(response);
        
        // 如果用户有国家信息，自动选择对应的国家
        if (user?.country_en) {
          const userCountry = response.find(
            (country: CountryList) =>
              country.name_en.toLowerCase() === user.country_en.toLowerCase()
          );
          if (userCountry) {
            setSelectedCountry(userCountry);
            setLocalCountryCode(`+${userCountry.country}`);
            
            // 设置选中国家的 valid_digits
            if (userCountry.valid_digits) {
              setCurrentValidDigits(userCountry.valid_digits);
            }
          }
        }
      }
    } catch (error) {
      console.error("获取国家列表失败:", error);
    } finally {
      setLoadingCountries(false);
    }
  };

  // 获取显示的国家代码
  const getDisplayCountryCode = () => {
    if (loadingCountries) return "...";
    if (localSelectedCountry?.phoneCode) {
      return localSelectedCountry.phoneCode;
    }
    if (selectedCountry?.country) {
      return `+${selectedCountry.country}`;
    }
    return localCountryCode;
  };

  // 格式化电话号码
  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return phone;

    // 移除电话号码中的空格、破折号等
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

    // 如果已经有+号开头，直接返回
    if (cleanPhone.startsWith("+")) {
      return cleanPhone;
    }

    // 获取当前国家代码
    let countryCode = "";
    if (localSelectedCountry?.phoneCode) {
      countryCode = localSelectedCountry.phoneCode;
    } else if (selectedCountry?.country) {
      countryCode = `+${selectedCountry.country}`;
    } else {
      countryCode = localCountryCode;
    }

    return `${countryCode}${cleanPhone}`;
  };

  // 初始化时加载国家列表
  useEffect(() => {
    if (isVisible && paymentParams?.payment_method === "mobile_money") {
      loadCountryList();
    }
  }, [isVisible, paymentParams?.payment_method, user?.country_en]);

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
      currentValidDigits &&
      currentValidDigits.length > 0
    ) {
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, ""); // 移除所有非数字字符
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
      // 如果有onSubmit函数，说明是从订单页面调用的，需要传递电话号码
      if (onSubmit) {
        // 格式化电话号码（仅对mobile_money支付）
        let formattedPhone = phoneNumber;
        if (paymentParams.payment_method === "mobile_money") {
          formattedPhone = formatPhoneNumber(phoneNumber);
        }
        await onSubmit(formattedPhone);
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
                      onPress={() => {
                        console.log('Country code clicked');
                        setShowCountryModal(true);
                      }}
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
                    fontSize: fontSize(16),
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
    backgroundColor: "#00000080",
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
    borderBottomColor: "#ff6f301a",
  },
  title: {
    fontSize: fontSize(22),
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
    backgroundColor: "#000000b3",
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

export default PhoneNumberInputModal;
