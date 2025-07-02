import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  SafeAreaView,
  BackHandler,
  Modal,
  FlatList,
  Linking,
} from "react-native";
import useCreateOrderStore from "../../store/createOrder";
import BackIcon from "../../components/BackIcon";
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
  CommonActions,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState, useEffect } from "react";
import useUserStore from "../../store/user";
import { Order } from "../../services/api/orders";
import { payApi } from "../../services/api/payApi";
import { settingApi } from "../../services/api/setting";
import { CountryList } from "../../constants/countries";
import { useTranslation } from "react-i18next";
import fontSize from "../../utils/fontsizeUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCountryTransLanguage } from "../../utils/languageUtils";
import { ordersApi } from "../../services/api/orders";
import Toast from "react-native-toast-message";
import useAnalyticsStore from "../../store/analytics";

// 移除不必要的映射，直接使用API返回的country字段作为电话区号
const getPhoneCodeFromCountry = (countryCode: number): string => {
  return `+${countryCode}`;
};

// 验证E.164格式的电话号码
const isValidE164PhoneNumber = (phoneNumber: string): boolean => {
  // E.164格式：+[国家代码][电话号码]，总长度不超过15位
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
};

// 定义本地存储的国家数据类型
interface LocalCountryData {
  code: string;
  flag: string;
  country: number;
  name: string;
  phoneCode: string;
  userCount: number;
  valid_digits?: number[];
}

// Define the param list for navigation
type RootStackParamList = {
  PreviewOrder: {
    data: Order;
    payMethod: string;
    currency: string;
    fromOrderDetails?: boolean; // 添加标记，标识是否从订单详情页进入
  };
  Pay: { payUrl: string; method: string; order_id: string };
  OrderDetails: { orderId?: number };
  PaymentSuccessScreen: any;
  MainTabs: { screen: string } | undefined;
  PayError: { msg?: string; order_id?: string; order_no?: string; amount?: string; currency?: string };
};

export const PreviewOrder = () => {
  const { orderData, setOrderData } = useCreateOrderStore();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [countryList, setCountryList] = useState<CountryList[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryList | null>(
    null
  );
  const [localSelectedCountry, setLocalSelectedCountry] =
    useState<LocalCountryData | null>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const route = useRoute<RouteProp<RootStackParamList, "PreviewOrder">>();
  const [loading, setLoading] = useState(false);
  const { user } = useUserStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (!user.user_id) {
      return Alert.alert(t("order.preview.login_required"));
    }
    if (route.params.payMethod === "mobile_money") {
      setShowPhoneInput(true);
      // 获取国家列表
      loadCountryList();
    } else {
      setShowPhoneInput(false);
    }
  }, [route.params.payMethod, user.user_id, t]);

  // 重新验证电话号码（当国家数据加载完成后调用）
  const revalidatePhoneNumber = () => {
    if (phoneNumber && phoneNumber.length > 0) {
      const isValid = validatePhoneNumber(phoneNumber);
      setPhoneNumberError(!isValid);
    }
  };

  // 获取国家列表
  const loadCountryList = async () => {
    setLoadingCountries(true);
    try {
      // 首先尝试读取本地存储的国家数据
      const savedLocalCountry = await AsyncStorage.getItem("@selected_country");
      if (savedLocalCountry) {
        try {
          const parsedLocalCountry: LocalCountryData =
            JSON.parse(savedLocalCountry);
          setLocalSelectedCountry(parsedLocalCountry);
        } catch (e) {
          console.error("解析本地存储国家数据失败:", e);
        }
      }

      const response = await settingApi.getSendSmsCountryList();
      
      if (response && Array.isArray(response)) {
        setCountryList(response);

        // 如果没有本地存储的国家，则使用API返回的数据进行匹配
        if (!savedLocalCountry) {
          // 如果用户有国家信息，自动选择对应的国家
          if (user?.country_en) {
            const userCountry = response.find(
              (country: CountryList) =>
                country.name_en.toLowerCase() === user.country_en.toLowerCase()
            );
            if (userCountry) {
              setSelectedCountry(userCountry);
            }
          }
        }

        // 国家数据加载完成后，重新验证电话号码
        setTimeout(() => {
          revalidatePhoneNumber();
        }, 100);
      }
    } catch (error) {
      console.error("获取国家列表失败:", error);
    } finally {
      setLoadingCountries(false);
    }
  };

  // 格式化电话号码
  const formatPhoneNumber = (
    phone: string,
    localCountry: LocalCountryData | null,
    apiCountry: CountryList | null
  ): string => {
    if (!phone) return phone;

    // 移除电话号码中的空格、破折号等
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

    // 如果已经有+号开头，直接返回
    if (cleanPhone.startsWith("+")) {
      return cleanPhone;
    }

    // 优先使用本地存储的国家数据的 phoneCode
    let countryCode = "";
    if (localCountry?.phoneCode) {
      countryCode = localCountry.phoneCode;
    } else if (localCountry?.country) {
      // 如果本地国家数据没有phoneCode，但有country字段，则生成phoneCode
      countryCode = getPhoneCodeFromCountry(localCountry.country);
    } else if (apiCountry?.country) {
      countryCode = getPhoneCodeFromCountry(apiCountry.country);
    } else {
      return phone; // 如果都没有，返回原始电话号码
    }

    const formattedResult = `${countryCode}${cleanPhone}`;
    return formattedResult;
  };

  // 处理系统返回键
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // 如果是从订单详情页进入的，返回到订单详情页
        if (route.params?.fromOrderDetails) {
          navigation.goBack();
        } else {
          // 否则重置导航栈并返回到首页
          navigation.reset({
            index: 0,
            routes: [
              {
                name: "MainTabs",
                params: { screen: "Home" },
              },
            ],
          });
        }
        return true; // 返回true表示已处理返回事件
      };

      // 添加返回键监听（Android）
      const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => {
        backHandler.remove();
      };
    }, [navigation, route.params?.fromOrderDetails])
  );

  // 验证电话号码位数
  const validatePhoneNumber = (
    phoneNum: string,
    countryData?: LocalCountryData | CountryList | null
  ) => {
    if (!phoneNum) return true; // 空号码不显示错误

    let currentCountryData = countryData || selectedCountry;

    // 如果没有selectedCountry，但有localSelectedCountry，则从countryList中找到对应的完整数据
    if (!currentCountryData && localSelectedCountry) {
      const foundCountry = countryList.find(
        (country) => country.country === localSelectedCountry.country
      );
      if (foundCountry) {
        currentCountryData = foundCountry;
      } else {
        currentCountryData = localSelectedCountry;
      }
    }

    // 特殊处理：如果当前使用的是localSelectedCountry，但它没有valid_digits，
    // 尝试从API数据中找到对应的完整数据
    if (
      currentCountryData === localSelectedCountry &&
      !currentCountryData?.valid_digits &&
      countryList.length > 0 &&
      localSelectedCountry
    ) {
      const foundCountry = countryList.find(
        (country) => country.country === localSelectedCountry.country
      );
      if (foundCountry) {
        currentCountryData = foundCountry;
      }
    }

    // 如果输入了电话号码但没有选择国家，返回false显示错误
    if (!currentCountryData) {
      return false;
    }

    // 如果没有valid_digits验证规则，则通过验证
    if (
      !currentCountryData?.valid_digits ||
      !Array.isArray(currentCountryData.valid_digits)
    ) {
      return true;
    }

    const isValid = currentCountryData.valid_digits.includes(phoneNum.length);

    return isValid;
  };

  // 处理电话号码输入
  const handlePhoneNumberChange = (text: string) => {
    setPhoneNumber(text);
    if (text.length > 0) {
      const isValid = validatePhoneNumber(text);
      setPhoneNumberError(!isValid);
    } else {
      setPhoneNumberError(false);
    }
  };

  const handleSubmit = () => {
    if (showPhoneInput && !phoneNumber) {
      Alert.alert(t("error"), t("order.preview.phone_required"));
      return;
    }

    if (showPhoneInput && !localSelectedCountry && !selectedCountry) {
      Alert.alert(t("error"), t("order.preview.select_country"));
      return;
    }

    // 验证电话号码位数（针对mobile_money支付）
    if (showPhoneInput && phoneNumber) {
      // 使用validatePhoneNumber函数来确保验证逻辑一致
      if (!validatePhoneNumber(phoneNumber)) {
        // 获取当前国家数据用于错误提示
        let currentCountryData = localSelectedCountry || selectedCountry;
        if (
          currentCountryData === localSelectedCountry &&
          !currentCountryData?.valid_digits &&
          countryList.length > 0 &&
          localSelectedCountry
        ) {
          const foundCountry = countryList.find(
            (country) => country.country === localSelectedCountry.country
          );
          if (foundCountry) {
            currentCountryData = foundCountry;
          }
        }

        Toast.show({
          type: "error",
          text1: `${
            t("order.preview.phone_format_error") || "电话号码位数不正确"
          } ${
            currentCountryData?.valid_digits
              ? `(${
                  t("order.preview.requires_digits") || "要求位数"
                }: ${currentCountryData.valid_digits.join(", ")})`
              : ""
          }`,
        });
        return;
      }
    }


    // 格式化电话号码，添加国家前缀
    const formattedPhone =
      showPhoneInput && phoneNumber
        ? formatPhoneNumber(phoneNumber, localSelectedCountry, selectedCountry)
        : "";

    // 验证格式化后的电话号码是否符合E.164格式
    if (
      showPhoneInput &&
      formattedPhone &&
      !isValidE164PhoneNumber(formattedPhone)
    ) {
      Alert.alert(
        t("error"),
        t("order.preview.phone_format_error") ||
          "电话号码格式不正确，必须为E.164格式 (例如 +237...)"
      );
      return;
    }

    const data = {
      order_id: route.params.data.order_id,
      method: route.params.payMethod,
      currency: route.params.currency
        ? route.params.currency
        : route.params.data.currency,
      amount: route.params.data.actual_amount,
      ...(showPhoneInput &&
        formattedPhone && {
          extra: { phone_number: formattedPhone },
        }),
    };

    // 准备支付结账埋点数据的基础信息
    const prepareCheckoutData = (success: number) => ({
      is_suc: success,
      all_price: route.params.data.actual_amount,
      currency: route.params.currency ? route.params.currency : route.params.data.currency,
      shipping_method: orderData?.transport_type || 0,
      shipping_price_outside: route.params.data.shipping_fee || 0,
      shipping_price_within: route.params.data.domestic_shipping_fee || 0,
      pay_product: JSON.stringify({
        order_id: route.params.data.order_id,
        payment_method: route.params.payMethod,
        items: route.params.data.items?.map(item => ({
          offer_id: item.offer_id,
          sku_id: item.sku_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })) || [],
        phone_number: formattedPhone || undefined,
      }),
      timestamp: new Date().toISOString(),
    });

    setLoading(true);

    payApi
      .getPayInfo(data)
      .then(async (res) => {
        if (res.success) {

          if (route.params.payMethod === "wave") {
            // Wave支付直接跳转到Pay页面，让Pay页面处理外部应用跳转和轮询
            console.log("Wave支付: 跳转到Pay页面进行统一处理");
            navigation.navigate("Pay", {
              payUrl: res.payment_url,
              method: "wave",
              order_id: route.params.data.order_id.toString()
            });
            return;
          }

          if (route.params.payMethod === "balance") {
            setLoading(false);
            navigation.navigate("PaymentSuccessScreen", res);
            return;
          }

          if (route.params.payMethod === "mobile_money") {
            try {
              // Mobile Money支付跳转到统一轮询页面
              navigation.navigate("Pay", {
                payUrl: res.payment_url,
                method: "mobile_money",
                order_id: route.params.data.order_id.toString()
              });
            } catch (error) {
              console.error("Error opening Mobile Money payment:", error);
              Alert.alert(
                t("error"),
                t("order.error.mobile_money_open") || "Failed to open Mobile Money payment"
              );
              // 打开失败时跳转到支付失败页面
              navigation.navigate("PayError", {
                order_id: route.params.data.order_id?.toString(),
                order_no: route.params.data.order_no,
                amount: route.params.data.actual_amount?.toString(),
                currency: route.params.data.currency
              });
            }
            return;
          }

          if (route.params.payMethod === "paypal") {
            try {
              // 跳转到支付页面处理PayPal支付
              navigation.navigate("Pay", {
                payUrl: res.payment_url,
                method: "paypal",
                order_id: route.params.data.order_id.toString()
              });
            } catch (error) {
              console.error("Error opening PayPal payment:", error);
              Alert.alert(
                t("error"),
                t("order.error.paypal_open") || "Failed to open PayPal payment"
              );
              // 打开失败时跳转到支付失败页面
              navigation.navigate("PayError", {
                order_id: route.params.data.order_id?.toString(),
                order_no: route.params.data.order_no,
                amount: route.params.data.actual_amount?.toString(),
                currency: route.params.data.currency
              });
            }
            return;
          }

          if (route.params.payMethod === "bank_card") {
            try {
              // 跳转到支付页面处理银行卡支付
              navigation.navigate("Pay", {
                payUrl: res.payment_url,
                method: "bank_card",
                order_id: route.params.data.order_id.toString()
              });
            } catch (error) {
              console.error("Error opening bank card payment:", error);
              Alert.alert(
                t("error"),
                t("order.error.bank_card_open") || "Failed to open bank card payment"
              );
              // 打开失败时跳转到支付失败页面
              navigation.navigate("PayError", {
                order_id: route.params.data.order_id?.toString(),
                order_no: route.params.data.order_no,
                amount: route.params.data.actual_amount?.toString(),
                currency: route.params.data.currency
              });
            }
            return;
          }
        } else {

          setLoading(false);
          // API返回失败时，跳转到支付失败页面
          navigation.navigate("PayError", { 
            msg: res.msg,
            order_id: route.params.data.order_id?.toString(),
            order_no: route.params.data.order_no,
            amount: route.params.data.actual_amount?.toString(),
            currency: route.params.data.currency
          });
        }
      })
      .catch((err) => {
        setLoading(false);
        
        // 支付请求失败的埋点数据收集
        const checkoutErrorData = prepareCheckoutData(0);
        const analyticsStore = useAnalyticsStore.getState();
        analyticsStore.logCheckout(checkoutErrorData, "preview");
        
        console.log("支付结账错误埋点数据:", checkoutErrorData);

        // 网络请求失败时，跳转到支付失败页面
        navigation.navigate("PayError", { 
          msg: t("order.preview.payment_failed"),
          order_id: route.params.data.order_id?.toString(),
          order_no: route.params.data.order_no,
          amount: route.params.data.actual_amount?.toString(),
          currency: route.params.data.currency
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // 获取显示的国家代码
  const getDisplayCountryCode = () => {
    if (loadingCountries) return "...";

    if (localSelectedCountry?.phoneCode) {
      return localSelectedCountry.phoneCode;
    }
    if (localSelectedCountry?.country) {
      return getPhoneCodeFromCountry(localSelectedCountry.country);
    }
    if (selectedCountry?.country) {
      return getPhoneCodeFromCountry(selectedCountry.country);
    }
    return "+225"; // 默认值改为科特迪瓦
  };

  // 获取翻译后的支付方式名称
  const getPaymentMethodName = (payMethod: string) => {
    switch (payMethod) {
      case "mobile_money":
        // 根据选择的国家显示运营商名称
        const operatorName = getOperatorNameByCountry();
        if (operatorName) {
          return `${t("order.preview.mobile_money")}（${operatorName}）`;
        }
        return t("order.preview.mobile_money");
      case "wave":
        return t("order.preview.wave");
      case "balance":
        return t("order.preview.balance");
      case "bank_transfer":
        return t("order.preview.bank_transfer");
      case "cash":
        return t("order.preview.cash");
      default:
        return payMethod;
    }
  };

  // 根据国家获取运营商名称
  const getOperatorNameByCountry = () => {
    const currentCountry = localSelectedCountry || selectedCountry;
    if (!currentCountry) return null;
    
    // 根据国家代码返回主要运营商名称
    const countryCode = currentCountry.country;
    const operatorMap: { [key: number]: string } = {
      225: "Orange/MTN", // 科特迪瓦
      221: "Orange/Free", // 塞内加尔
      237: "MTN/Orange", // 喀麦隆
      229: "MTN/Moov", // 贝宁
      228: "Moov/Togocel", // 多哥
      224: "MTN/Orange", // 几内亚
      226: "Orange/Moov", // 布基纳法索
      223: "Orange/Malitel", // 马里
      243: "Vodacom/Airtel", // 刚果民主共和国
      242: "MTN/Airtel", // 刚果共和国
      241: "Airtel/Moov", // 加蓬
      33: "Orange/SFR", // 法国
    };
    
    return operatorMap[countryCode] || null;
  };

  return (
    <SafeAreaView style={[styles.safeArea]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        <View style={styles.container}>
          <View style={styles.titleContainer}>
            <View style={styles.backIconContainer}>
              <TouchableOpacity
                onPress={() => {
                  // 如果是从订单详情页进入的，返回到订单详情页
                  if (route.params?.fromOrderDetails) {
                    navigation.goBack();
                  } else {
                    // 否则重置导航栈并返回到首页
                    navigation.reset({
                      index: 0,
                      routes: [
                        {
                          name: "MainTabs",
                          params: { screen: "Home" },
                        },
                      ],
                    });
                  }
                }}
              >
                <BackIcon size={fontSize(20)} />
              </TouchableOpacity>
            </View>

            <Text style={styles.titleHeading}>
              {t("order.preview.pay_now")}
            </Text>
          </View>

          <ScrollView style={styles.scrollContainer}>
            <View style={styles.mainContent}>
              {/* Payment Method Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t("order.preview.payment_method")}
                </Text>
                <View style={styles.paymentMethodContainer}>
                  <Text style={styles.paymentMethodText}>
                    {getPaymentMethodName(route.params.payMethod)}
                  </Text>
                </View>

                {showPhoneInput && (
                  <View style={styles.phoneInputContainer}>
                    <Text style={styles.phoneInputLabel}>
                      {t("order.preview.enter_phone")}
                    </Text>

                    {/* 电话号码输入行 - 国家选择器在左侧 */}
                    <View style={styles.phoneInputRow}>
                      {/* 国家代码选择器 */}
                      <TouchableOpacity
                        style={styles.countryCodeSelector}
                        onPress={() => setShowCountryModal(true)}
                        disabled={loadingCountries}
                      >
                        <Text style={styles.countryCodeText}>
                          {getDisplayCountryCode()}
                        </Text>
                        <Text style={styles.countryCodeArrow}>▼</Text>
                      </TouchableOpacity>

                      {/* 分隔线 */}
                      <View style={styles.phoneSeparator} />

                      {/* 电话号码输入框 */}
                      <TextInput
                        style={styles.phoneInput}
                        value={phoneNumber}
                        onChangeText={handlePhoneNumberChange}
                        placeholder={t("order.preview.phone_placeholder")}
                        placeholderTextColor="#9CA3AF"
                        keyboardType="phone-pad"
                      />
                    </View>

                    {/* 电话号码错误提示 */}
                    {phoneNumberError && (
                      <Text style={styles.phoneNumberErrorText}>
                        {!localSelectedCountry && !selectedCountry
                          ? t("order.preview.select_country") || "请先选择国家"
                          : `${
                              t("order.preview.phone_format_error") ||
                              "电话号码位数不正确"
                            } ${
                              (localSelectedCountry || selectedCountry)
                                ?.valid_digits
                                ? `(${
                                    t("order.preview.requires_digits") ||
                                    "要求位数"
                                  }: ${(
                                    localSelectedCountry || selectedCountry
                                  )?.valid_digits?.join(", ")})`
                                : ""
                            }`}
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Order Info Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t("order.preview.payment_info")}
                </Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>
                    {t("order.preview.name")}
                  </Text>
                  <Text style={styles.infoValue}>
                    {route.params?.data.receiver_name ||
                      t("order.preview.not_available")}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>
                    {t("order.preview.phone")}
                  </Text>
                  <Text style={styles.infoValue}>
                    {route.params?.data.receiver_phone ||
                      t("order.preview.not_available")}
                  </Text>
                </View>

                {route.params.data?.whatsapp_number && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>
                      {t("order.preview.whatsapp")}
                    </Text>
                    <Text style={styles.infoValue}>
                      {route.params.data?.whatsapp_number}
                    </Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>
                    {t("order.preview.country")}
                  </Text>
                  <Text style={styles.infoValue}>
                    {route.params?.data.receiver_country ||
                      t("order.preview.not_available")}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>
                    {t("order.preview.shipping_address")}
                  </Text>
                  <Text style={styles.infoValue}>
                    {route.params?.data.receiver_address ||
                      t("order.preview.not_available")}
                  </Text>
                </View>
              </View>

              {/* Order Summary Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t("order.preview.order_total")}
                </Text>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    {t("order.preview.total_amount")}
                  </Text>
                  <Text style={styles.totalValue}>
                    {route.params.data.actual_amount}{" "}
                    {route.params.data.currency}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.submitButtonContainer}>
            <TouchableOpacity
              style={[
                styles.primaryButtonStyle,
                (!showPhoneInput ||
                  (showPhoneInput &&
                    phoneNumber &&
                    !phoneNumberError &&
                    (localSelectedCountry || selectedCountry))) &&
                !loading
                  ? {}
                  : styles.disabledButtonStyle,
              ]}
              onPress={() => {
                handleSubmit();
              }}
              disabled={
                (showPhoneInput &&
                  (!phoneNumber ||
                    phoneNumberError ||
                    (!localSelectedCountry && !selectedCountry))) ||
                loading
              }
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>
                  {t("order.preview.confirm_payment")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 国家选择模态框 */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("order.preview.select_country_modal")} 
              </Text>
              <TouchableOpacity
                onPress={() => setShowCountryModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={countryList}
              keyExtractor={(item) => item.country.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    selectedCountry?.country === item.country &&
                      styles.selectedCountryItem,
                  ]}
                  onPress={() => {
                    setSelectedCountry(item);
                    setLocalSelectedCountry(null); // 清除本地存储的选择，使用API的数据
                    setShowCountryModal(false);
                    // 重新验证电话号码
                    if (phoneNumber) {
                      setPhoneNumberError(
                        !validatePhoneNumber(phoneNumber, item)
                      );
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.countryItemText,
                      selectedCountry?.country === item.country &&
                        styles.selectedCountryItemText,
                    ]}
                  >
                    {getCountryTransLanguage(item)} (
                    {getPhoneCodeFromCountry(item.country)})
                  </Text>
                </TouchableOpacity>
              )}
              style={[styles.countryList]}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  safeAreaContent: {
    flex: 1,
    paddingTop: 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mainContent: {
    padding: 20,
    paddingBottom: 20,
  },
  submitButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  primaryButtonStyle: {
    width: "100%",
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FF5100",
    borderWidth: 0,
    borderRadius: 16,
    shadowColor: "#FF5100",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 0,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: fontSize(16),
    lineHeight: 22,
    fontFamily: 'System',
    letterSpacing: 0.3,
  },
  disabledButtonStyle: {
    backgroundColor: "#cccccc",
    shadowOpacity: 0,
    elevation: 0,
  },
  titleContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backIconContainer: {
    position: "absolute",
    left: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  titleHeading: {
    fontWeight: "600",
    fontSize: fontSize(20),
    lineHeight: 28,
    fontFamily: 'System',
    color: "#1a1a1a",
    letterSpacing: 0.3,
  },
  section: {
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 0,
  },
  sectionTitle: {
    fontSize: fontSize(16),
    fontWeight: "600",
    marginBottom: 16,
    color: "#1a1a1a",
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
  paymentMethodContainer: {
    backgroundColor: "#fff4f0",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF5100",
  },
  paymentMethodText: {
    fontSize: fontSize(16),
    color: "#FF5100",
    fontWeight: "600",
    fontFamily: 'System',
  },
  phoneInputContainer: {
    marginTop: 16,
  },
  phoneInputLabel: {
    fontSize: fontSize(14),
    marginBottom: 8,
    color: "#666666",
    fontWeight: "500",
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: fontSize(14),
    color: "#333333",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: fontSize(14),
    color: "#666666",
    flex: 1,
    fontWeight: "500",
    fontFamily: 'System',
  },
  infoValue: {
    fontSize: fontSize(14),
    color: "#1a1a1a",
    flex: 2,
    textAlign: "right",
    fontFamily: 'System',
    lineHeight: 20,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#fff4f0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF5100",
    marginTop: 8,
  },
  totalLabel: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "#1a1a1a",
    fontFamily: 'System',
  },
  totalValue: {
    fontSize: fontSize(20),
    fontWeight: "700",
    color: "#FF5100",
    fontFamily: 'System',
  },
  phoneInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  countryCodeSelector: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: 80,
    backgroundColor: "#ffffff",
    borderRightWidth: 1,
    borderRightColor: "#e8e8e8",
  },
  countryCodeText: {
    fontSize: fontSize(16),
    color: "#333333",
    fontWeight: "500",
    marginRight: 5,
    fontFamily: 'System',
  },
  countryCodeArrow: {
    fontSize: fontSize(12),
    color: "#666666",
  },
  phoneSeparator: {
    width: 1,
    height: 30,
    backgroundColor: "#e8e8e8",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000080",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: "100%",
    maxHeight: "80%",
    minHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  modalTitle: {
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#1a1a1a",
    fontFamily: 'System',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalCloseText: {
    fontSize: fontSize(16),
    fontWeight: "500",
    color: "#FF5100",
  },
  countryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    flexDirection: "row",
    alignItems: "center",
  },
  selectedCountryItem: {
    backgroundColor: "#fff4f0",
    borderLeftWidth: 4,
    borderLeftColor: "#FF5100",
  },
  countryItemText: {
    fontSize: fontSize(16),
    color: "#333333",
    flex: 1,
    fontFamily: 'System',
  },
  countryList: {
    flex: 1,
    minHeight: 0,
    maxHeight: '100%',
  },
  selectedCountryItemText: {
    color: "#FF5100",
    fontWeight: "600",
  },
  phoneNumberErrorText: {
    color: "#ff4444",
    fontSize: fontSize(12),
    marginTop: 6,
    fontFamily: 'System',
    fontWeight: "400",
  },
});
