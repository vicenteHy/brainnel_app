import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
  Linking,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
  ViewStyle,
  TextStyle,
  ImageStyle,
  StyleProp,
  FlatList,
} from "react-native";

import { useTranslation } from "react-i18next";
import BackIcon from "../../components/BackIcon";
import MassageIcon from "../../components/MassageIcon";
import fontSize from "../../utils/fontsizeUtils";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useRoute, RouteProp } from "@react-navigation/native";
import {
  ordersApi,
  OrderDetailsType,
  OrderItemDetails,
  CreateOrderRequest,
} from "../../services/api/orders";
import { payApi, PaymentMethod } from "../../services/api/payApi";
import { settingApi } from "../../services/api/setting";
import useUserStore from "../../store/user";
import OrderIcon from "../../components/OrderIcon";
import InfoIcon from "../../components/InfoIcon";
import Progress from "./Progress";
import AddressIcon from "../../components/AddressIcon";
import EditIcon from "../../components/ColorfulEditIcon";
import BrightnessIcon from "../../components/BrightnessIcon";
import PhoneIcon from "../../components/PhoneIcon";
import ShoppingBagIcon from "../../components/ShoppingBagIcon";
import PowerIcon from "../../components/PowerIcon";
import CardIcon from "../../components/ShoppingCartIcon";
import WhatsAppIcon from "../../components/WatchAppIcon";
import { useOrderListStore } from "../../store/orderList";
import CircleOutlineIcon from "../../components/CircleOutlineIcon";
import CheckIcon from "../../components/CheckIcon";
import payMap from "../../utils/payMap";
import PhoneNumberInputModal from "../../screens/BalanceScreen/PhoneNumberInputModal";
import { cartApi } from "../../services/api/cart";
import IconComponent from "../../components/IconComponent";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CountryList } from "../../constants/countries";
import {
  getOrderTransLanguage,
  getAttributeTransLanguage,
  getAttributeNameTransLanguage,
  getSubjectTransLanguage,
} from "../../utils/languageUtils";
import { getCountryTransLanguage } from "../../utils/languageUtils";
import Toast from "react-native-toast-message";

// 定义选项类型
interface PaymentOption {
  id: string;
  label: string;
  key: string;
}

// 定义标签页类型
interface TabType {
  id: string;
  label: string;
  options: PaymentOption[];
}

// 定义本地存储的国家数据类型
interface LocalCountryData {
  code: string;
  flag: string;
  name: string;
  country: number | string;
  phoneCode: string;
  userCount: number;
  valid_digits?: number[];
}

type Styles = {
  safeArea: ViewStyle;
  safeAreaContent: ViewStyle;
  container: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  orderStatus: ViewStyle;
  orderStatusContent: ViewStyle;
  orderStatusTitle: ViewStyle;
  orderStatusTitleText: TextStyle;
  orderStatusContentPreview: ViewStyle;
  productItem: ViewStyle;
  orderStatusTitleContainer: ViewStyle;

  productItemImage: ViewStyle;
  productItemInfo: ViewStyle;
  productItemNum: ViewStyle;
  productItemNumText: TextStyle;
  productItemInfoName: ViewStyle;
  productItemInfoNameText: TextStyle;
  productItemInfoSkuText: TextStyle;
  productItemInfoSku: ViewStyle;
  productItemInfoPrice: ViewStyle;
  orderStatusContentPreviewInformation: ViewStyle;
  loadingContainer: ViewStyle;
  orderId: ViewStyle;
  orderIdText: TextStyle;
  orderIdText1: TextStyle;
  TotalText: TextStyle;
  TotalPrice: TextStyle;
  warehouse: ViewStyle;
  recipientTitle: ViewStyle;
  recipientPhoneContainer: ViewStyle;
  recipient: ViewStyle;
  orderStatusContentPreviewInformationText: TextStyle;
  warehousePhone: ViewStyle;
  warehousePhoneText: TextStyle;
  warehousePhoneTextContainer: ViewStyle;
  recipientName: TextStyle;
  recipientPhone: TextStyle;
  dottedLine: ViewStyle;
  orderRemakeText: TextStyle;
  addCard: ViewStyle;
  addCardBox: ViewStyle;
  addCardText: TextStyle;
  bottomButtons: ViewStyle;
  bottomButton1: ViewStyle;
  bottomButton: ViewStyle;
  bottomButtonText: TextStyle;
  bottomButtonText1: TextStyle;
  modalOverlay: ViewStyle;
  modalContent: ViewStyle;
  modalHeader: ViewStyle;
  modalTitle: TextStyle;
  closeButtonContainer: ViewStyle;
  closeButtonText: TextStyle;
  tabContainer: ViewStyle;
  tab: ViewStyle;
  tabActive: ViewStyle;
  tabText: TextStyle;
  tabTextActive: TextStyle;
  paymentOptions: ViewStyle;
  cardContainer: ViewStyle;
  iconRow: ViewStyle;
  imageContainer: ViewStyle;
  paymentIconContainer: ViewStyle;
  paymentIcon: TextStyle;
  checkboxContainer: ViewStyle;
  checkmarkContainer: ViewStyle;
  currencyTitle: TextStyle;
  paypalExpandedContainer: ViewStyle;
  paypalCurrencyContainer: ViewStyle;
  currencyButtonsContainer: ViewStyle;
  currencyButton: ViewStyle;
  currencyButtonActive: ViewStyle;
  currencyButtonText: TextStyle;
  currencyButtonTextActive: TextStyle;
  convertingContainer: ViewStyle;
  convertingText: TextStyle;
  convertedAmountContainer: ViewStyle;
  convertedAmountLabel: TextStyle;
  convertedAmountValue: TextStyle;
  actionButtonsContainer: ViewStyle;
  actionButtons: ViewStyle;
  cancelButton: ViewStyle;
  confirmButton: ViewStyle;
  confirmButtonDisabled: ViewStyle;
  buttonTextDark: TextStyle;
  buttonTextWhite: TextStyle;
  operatorImage: ImageStyle;
  mobileMoneyTextContainer: ViewStyle;
  mobileMoneyImgContainer: ViewStyle;
  mobileMoneyImg: ImageStyle;
  mobileMoneyText: TextStyle;
  outerContainer: ViewStyle;
  flexContainer: ViewStyle;
  imageStyle: ImageStyle;
  verticalAlignEndContent: ViewStyle;
  svgContainer: ViewStyle;
  leftInfo: ViewStyle;
  blueBox: ViewStyle;
  balanceText: TextStyle;
  modalPopup: ViewStyle;
  modalWarningIcon: ViewStyle;
  modalPromptText: TextStyle;
  modalCancelPopup: ViewStyle;
  modalCancelText: TextStyle;
  modalCancelButtonsContainer: ViewStyle;
  modalCancelActionButton: ViewStyle;
  modalCancelButtonOutline: ViewStyle;
  modalCancelButtonFilled: ViewStyle;
  modalCancelButtonOutlineText: TextStyle;
  modalCancelButtonFilledText: TextStyle;
};

export const OrderDetails = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { t } = useTranslation();
  const route = useRoute<
    RouteProp<
      {
        OrderDetails: {
          orderId: string;
          status: number;
        };
      },
      "OrderDetails"
    >
  >();
  const [orderDetails, setOrderDetails] = useState<OrderDetailsType>();
  const [isLoading, setIsLoading] = useState(true);
  const {
    deleteOrder,
    changeOrder,
    updateOrderShippingInfo,
    cancelOrder,
    confirmOrder,
  } = useOrderListStore();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState("online");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [tabs, setTabs] = useState<TabType[]>([
    {
      id: "online",
      label: t("order.payment.online"),
      options: [],
    },
    {
      id: "offline",
      label: t("order.payment.offline"),
      options: [
        { id: "cash", label: t("order.payment.cash") || "Cash", key: "cash" },
        {
          id: "bank",
          label: t("order.payment.bank") || "Bank Transfer",
          key: "bank",
        },
      ],
    },
  ]);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [convertedAmount, setConvertedAmount] = useState<
    {
      converted_amount: number;
      item_key: string;
      original_amount: number;
    }[]
  >([]);
  const [isConverting, setIsConverting] = useState(false);
  const { user } = useUserStore();
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isPaypalExpanded, setIsPaypalExpanded] = useState(false);
  const [isWaveExpanded, setIsWaveExpanded] = useState(false);
  const [paymentParams, setPaymentParams] = useState<{
    originalAmount: number;
    amount: number;
    currency: string;
    payment_method: string;
    selectedPriceLabel: string;
    onCloses?: () => void;
  } | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // 添加国家选择相关状态
  const [countryList, setCountryList] = useState<CountryList[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryList | null>(
    null
  );
  const [localSelectedCountry, setLocalSelectedCountry] =
    useState<LocalCountryData | null>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);

  const getOrderDetails = async () => {
    try {
      setIsLoading(true);
      const response = await ordersApi.getOrderDetails(route.params.orderId);
      setOrderDetails(response);
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setIsLoading(false);
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
          console.log("使用本地存储的国家:", parsedLocalCountry);
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

    console.log("原始电话号码:", phone);
    console.log("本地国家数据:", localCountry);
    console.log("API国家数据:", apiCountry);

    // 移除电话号码中的空格、破折号等
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    console.log("清理后的电话号码:", cleanPhone);

    // 如果已经有+号开头，直接返回
    if (cleanPhone.startsWith("+")) {
      console.log("电话号码已包含+号，直接返回:", cleanPhone);
      return cleanPhone;
    }

    // 优先使用本地存储的国家数据的 phoneCode
    let countryCode = "";
    if (localCountry?.phoneCode) {
      // 确保phoneCode包含+号
      countryCode = localCountry.phoneCode.startsWith("+")
        ? localCountry.phoneCode
        : `+${localCountry.phoneCode}`;
      console.log("使用本地国家phoneCode:", countryCode);
    } else if (localCountry?.country) {
      // 如果phoneCode不存在，使用country字段
      countryCode = `+${localCountry.country}`;
      console.log("使用本地国家country字段:", countryCode);
    } else if (apiCountry?.country) {
      countryCode = `+${apiCountry.country}`;
      console.log("使用API国家数据:", countryCode);
    } else {
      // 如果都没有，使用默认的刚果民主共和国代码
      countryCode = "+243";
      console.log("使用默认国家代码:", countryCode);
    }

    // 如果电话号码以0开头，移除0
    const phoneWithoutLeadingZero = cleanPhone.startsWith("0")
      ? cleanPhone.substring(1)
      : cleanPhone;

    console.log("移除前导0后的电话号码:", phoneWithoutLeadingZero);

    const finalPhone = `${countryCode}${phoneWithoutLeadingZero}`;
    console.log("最终格式化的电话号码:", finalPhone);

    return finalPhone;
  };

  // 获取显示的国家代码
  const getDisplayCountryCode = () => {
    if (loadingCountries) return "...";
    if (localSelectedCountry?.phoneCode) {
      // 优先使用phoneCode，确保包含+号
      return localSelectedCountry.phoneCode.startsWith("+")
        ? localSelectedCountry.phoneCode
        : `+${localSelectedCountry.phoneCode}`;
    }
    if (localSelectedCountry?.country) {
      return `+${localSelectedCountry.country}`;
    }
    if (selectedCountry?.country) {
      return `+${selectedCountry.country}`;
    }
    return "+243"; // 默认值，刚果民主共和国
  };

  useEffect(() => {
    getOrderDetails();

    // 获取支付方式
    payApi
      .getCountryPaymentMethods()
      .then((res) => {
        if (res && res.current_country_methods) {
          setPaymentMethods(res.current_country_methods);

          // 更新在线支付选项
          setTabs((prev) => {
            const updatedTabs = [...prev];
            const onlineTabIndex = updatedTabs.findIndex(
              (tab) => tab.id === "online"
            );

            if (onlineTabIndex !== -1) {
              // 将API返回的支付方式转换为选项格式
              const options: PaymentOption[] = res.current_country_methods.map(
                (method) => ({
                  id: method.key,
                  label:
                    method.key.charAt(0).toUpperCase() + method.key.slice(1), // 首字母大写
                  key: method.key,
                })
              );

              updatedTabs[onlineTabIndex].options = options;
            }

            return updatedTabs;
          });
        }
      })
      .catch((error) => {
        console.error("获取支付方式失败:", error);
      });
  }, []);
  //拨打电话
  const callPhone = async (phoneNumber: string) => {
    const url = `tel:${phoneNumber}`;

    try {
      await Linking.openURL(url); // 直接尝试打开拨号界面
    } catch (error) {
      Alert.alert(t("error"), t("order.error.phone_open"));
      console.error("拨号失败:", error);
    }
  };

  const onSelectPayment = (paymentId: string) => {
    if (paymentId !== selectedPayment) {
      setIsPaypalExpanded(false);
      setIsWaveExpanded(false);
    }

    setSelectedPayment(paymentId);

    if (paymentId === "paypal" && paymentId !== selectedPayment) {
      setIsPaypalExpanded(true);
      setIsConverting(true);

      setSelectedCurrency("USD");

      const data = {
        from_currency: orderDetails?.currency || "",
        to_currency: "USD",
        amounts: {
          total_amount: orderDetails?.total_amount || 0,
          domestic_shipping_fee: orderDetails?.domestic_shipping_fee || 0,
          shipping_fee: orderDetails?.shipping_fee || 0,
        },
      };

      payApi
        .convertCurrency(data)
        .then((res) => {
          setConvertedAmount(res.converted_amounts_list);
          setIsConverting(false);
        })
        .catch((error) => {
          console.error("Currency conversion failed:", error);
          setIsConverting(false);
        });
    } else if (paymentId === "wave" && paymentId !== selectedPayment) {
      setIsWaveExpanded(true);
      setIsConverting(true);

      setSelectedCurrency("FCFA");

      const data = {
        from_currency: orderDetails?.currency || "",
        to_currency: "FCFA",
        amounts: {
          total_amount: orderDetails?.total_amount || 0,
          domestic_shipping_fee: orderDetails?.domestic_shipping_fee || 0,
          shipping_fee: orderDetails?.shipping_fee || 0,
        },
      };

      payApi
        .convertCurrency(data)
        .then((res) => {
          setConvertedAmount(res.converted_amounts_list);
          setIsConverting(false);
        })
        .catch((error) => {
          console.error("Currency conversion failed:", error);
          setIsConverting(false);
        });
    }
  };

  const onSelectCurrency = (currency: string) => {
    setSelectedCurrency(currency);
    setIsConverting(true);
    const data = {
      from_currency: orderDetails?.currency || "",
      to_currency: currency,
      amounts: {
        total_amount: orderDetails?.total_amount || 0,
        domestic_shipping_fee: orderDetails?.domestic_shipping_fee || 0,
        shipping_fee: orderDetails?.shipping_fee || 0,
      },
    };
    payApi
      .convertCurrency(data)
      .then((res) => {
        setConvertedAmount(res.converted_amounts_list);
        setIsConverting(false);
      })
      .catch((error) => {
        console.error("Currency conversion failed:", error);
        setIsConverting(false);
      });
  };
  // 确实支付
  const handlePaymentConfirm = async () => {
    if (!selectedPayment || !orderDetails?.order_id) return;

    // 如果是mobile_money支付方式，显示电话号码输入模态框
    if (selectedPayment === "mobile_money") {
      // 先加载国家列表
      await loadCountryList();

      // 准备支付参数
      const params = {
        originalAmount: orderDetails.total_amount,
        amount: orderDetails.total_amount,
        currency: user?.currency,
        payment_method: selectedPayment,
        selectedPriceLabel: orderDetails.total_amount + " " + user?.currency,
        onCloses: () => setShowPaymentModal(false), // 关闭支付模态框
      };

      setPaymentParams(params);
      setShowPhoneModal(true);
      return;
    }

    setIsPaymentLoading(true);

    const paymentData = {
      order_id: orderDetails.order_id,
      payment_method: selectedPayment,
      currency:
        selectedPayment === "paypal"
          ? selectedCurrency
          : selectedPayment === "wave"
          ? "FCFA"
          : user.currency,
      total_amount:
        selectedPayment === "paypal" || selectedPayment === "wave"
          ? convertedAmount.reduce(
              (acc, item) => acc + item.converted_amount,
              0
            )
          : orderDetails?.total_amount || 0,
      actual_amount:
        selectedPayment === "paypal" || selectedPayment === "wave"
          ? convertedAmount.reduce(
              (acc, item) => acc + item.converted_amount,
              0
            )
          : orderDetails?.actual_amount || 0,
      shipping_fee:
        selectedPayment === "paypal" || selectedPayment === "wave"
          ? convertedAmount.find((item) => item.item_key === "shipping_fee")
              ?.converted_amount || 0
          : orderDetails?.shipping_fee || 0,
      domestic_shipping_fee:
        selectedPayment === "paypal" || selectedPayment === "wave"
          ? convertedAmount.find(
              (item) => item.item_key === "domestic_shipping_fee"
            )?.converted_amount || 0
          : orderDetails?.domestic_shipping_fee || 0,
    };
    try {
      await ordersApi.updateOrderPaymentMethod(paymentData);

      const payData = {
        order_id: orderDetails.order_id,
        method: selectedPayment,
        currency:
          selectedPayment === "paypal"
            ? selectedCurrency
            : selectedPayment === "wave"
            ? "FCFA"
            : user.currency,
        amount:
          selectedPayment === "paypal" || selectedPayment === "wave"
            ? convertedAmount.reduce(
                (acc, item) => acc + item.converted_amount,
                0
              )
            : orderDetails?.total_amount || 0,
      };
      payApi
        .getPayInfo(payData)
        .then(async (res) => {
          if (res.success) {
            if (selectedPayment === "balance") {
              setIsPaymentLoading(false);
              setShowPaymentModal(false);
              if (res.success) {
                navigation.navigate("PaymentSuccessScreen", res);
                return;
              } else {
                Alert.alert(t("order.preview.Insufficient_balance"));
                return;
              }
            }
            if (selectedPayment === "wave") {
              setIsPaymentLoading(false);
              setShowPaymentModal(false);
              try {
                // 首先检查是否可以打开Wave应用
                const canOpen = await Linking.canOpenURL(res.payment_url);
                if (canOpen) {
                  // 如果可以打开Wave应用，直接跳转
                  await Linking.openURL(res.payment_url);
                } else {
                  // 如果无法打开应用，提示用户下载或使用网页版
                  await Linking.openURL(res.payment_url);
                }
              } catch (error) {
                console.error("Error opening Wave app:", error);
                Alert.alert(
                  t("error"),
                  t("order.error.wave_app_open") || "Failed to open Wave app"
                );
              }

              return;
            }

            if (selectedPayment === "paypal") {
              setIsPaymentLoading(false);
              setShowPaymentModal(false);

              try {
                // 首先检查是否可以打开Wave应用
                const canOpen = await Linking.canOpenURL(res.payment_url);
                if (canOpen) {
                  // 如果可以打开Wave应用，直接跳转
                  await Linking.openURL(res.payment_url);
                } else {
                  // 如果无法打开应用，提示用户下载或使用网页版
                  await Linking.openURL(res.payment_url);
                }
              } catch (error) {
                console.error("Error opening Wave app:", error);
                Alert.alert(
                  t("error"),
                  t("order.error.wave_app_open") || "Failed to open Wave app"
                );
              }

              return;
            }

            if (selectedPayment === "bank_card") {
              setIsPaymentLoading(false);
              setShowPaymentModal(false);

              try {
                // 首先检查是否可以打开Wave应用
                const canOpen = await Linking.canOpenURL(res.payment_url);
                if (canOpen) {
                  // 如果可以打开Wave应用，直接跳转
                  await Linking.openURL(res.payment_url);
                } else {
                  // 如果无法打开应用，提示用户下载或使用网页版
                  await Linking.openURL(res.payment_url);
                }
              } catch (error) {
                console.error("Error opening Wave app:", error);
                Alert.alert(
                  t("error"),
                  t("order.error.wave_app_open") || "Failed to open Wave app"
                );
              }

              return;
            }

            // navigation.navigate("Pay", {
            //   payUrl: res.payment_url,
            //   method: selectedPayment,
            //   order_id: orderDetails.order_id,
            // });
          } else {
            Alert.alert(t("error"), t("pay.payment_failed"));
          }
        })
        .catch((err) => {
          Alert.alert(t("error"), t("order.error.payment_update"));
          setIsPaymentLoading(false);
        })
        .finally(() => {
          setIsPaymentLoading(false);
        });
    } catch (error) {
      Alert.alert(t("error"), t("order.error.payment_update"));
      setIsPaymentLoading(false);
    }
  };

  // 添加手机号码提交函数
  const handlePhoneSubmit = async (phoneNumber: string) => {
    if (!paymentParams) {
      return;
    }

    // 验证电话号码（添加更严格的验证）
    if (paymentParams.payment_method === "mobile_money") {
      // 检查电话号码是否为空
      if (!phoneNumber || phoneNumber.trim() === "") {
        Toast.show({
          type: "error",
          text1:
            t("balance.phone_modal.phone_required") ||
            "Phone number is required",
        });
        return;
      }

      // 获取当前使用的 validDigits
      const currentValidDigits = selectedCountry?.valid_digits || [8]; // 如果没有设置，使用默认值 [8]

      // 验证电话号码位数
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

    setIsPaymentLoading(true);

    try {
      // 格式化电话号码，添加国家前缀
      const formattedPhone = formatPhoneNumber(
        phoneNumber,
        localSelectedCountry,
        selectedCountry
      );

      // 验证格式化后的电话号码是否符合E.164格式
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(formattedPhone)) {
        Toast.show({
          type: "error",
          text1: t("order.error.invalid_phone"),
        });
        setIsPaymentLoading(false);
        return;
      }

      console.log("发送的电话号码:", formattedPhone);

      // 准备请求数据
      const paymentData = {
        order_id: orderDetails?.order_id || "",
        payment_method: paymentParams.payment_method,
        currency: paymentParams.currency,
        total_amount: paymentParams.amount,
        actual_amount: paymentParams.amount,
        shipping_fee: 0,
        domestic_shipping_fee: 0,
      };

      // 更新订单支付方式
      await ordersApi.updateOrderPaymentMethod(paymentData);

      // 创建支付请求
      const payData = {
        order_id: orderDetails?.order_id || "",
        method: paymentParams.payment_method,
        currency: paymentParams.currency,
        amount: paymentParams.amount,
        extra: { phone_number: formattedPhone },
      };

      const response = await payApi.getPayInfo(payData);
      if (response.success) {
        setShowPhoneModal(false);
        setShowPaymentModal(false);

        // 支付成功后跳转到 ProfileScreen
        Toast.show({
          type: "success",
          text1: response.msg,
        });

        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
      } else {
        Toast.show({
          type: "error",
          text1: response.msg,
        });
      }
    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert(t("error"), t("order.error.payment_update"));
    } finally {
      setIsPaymentLoading(false);
    }
  };

  // 添加购物车

  const addToCart = async (items: OrderItemDetails[]) => {
    const groupedData: {
      [key: string]: {
        offer_id: number;
        skus: { quantity: number; sku_id: string }[];
      };
    } = {};

    items.forEach((item) => {
      const offerId = item.offer_id.toString();

      if (!groupedData[offerId]) {
        groupedData[offerId] = {
          offer_id: item.offer_id,
          skus: [],
        };
      }

      groupedData[offerId].skus.push({
        quantity: item.quantity,
        sku_id: item.sku_id.toString(),
      });
    });

    // 转换为数组格式
    const result = Object.values(groupedData)[0];
    try {
      setIsLoading(true);
      await cartApi(result);
      setIsLoading(false);

      Toast.show({
        type: "success",
        text1: t("order.add_cart_success"),
      });
    } catch (error) {
      setIsLoading(false);
      Alert.alert(t("error"), t("order.error.add_cart"));
    }
  };

  // 重新下单
  const reorderHandel = async (orderDetails: OrderDetailsType) => {
    const data = {
      actual_amount: orderDetails.actual_amount,
      address_id: orderDetails.address_id,
      buyer_message: "",
      create_payment: true,
      currency: orderDetails.currency,
      discount_amount: 0,
      domestic_shipping_fee: orderDetails.domestic_shipping_fee,
      items: orderDetails.items,
      payment_method: orderDetails.payment_method,
      receiver_address: orderDetails.receiver_address,
      shipping_fee: orderDetails.shipping_fee,
      total_amount: orderDetails.total_amount,
    };

    try {
      setIsLoading(true);
      const res = await ordersApi.createOrder(data as CreateOrderRequest);
      navigation.navigate("PreviewOrder", {
        data: res,
        payMethod: res.payment_method,
        currency: res.currency,
        amount: res.actual_amount,
      });
      setIsLoading(false);
    } catch (error) {
      console.error("重新下单失败:", error);
      Alert.alert(t("error"), t("order.error.reorder_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  // 添加确定按钮禁用逻辑函数
  const isConfirmButtonDisabled = () => {
    // 如果没有选择支付方式，禁用按钮
    if (!selectedPayment) {
      return true;
    }

    // 如果正在进行货币转换，禁用按钮
    if (isConverting) {
      return true;
    }

    // 如果选择了Paypal支付方式，但还没有转换结果，禁用按钮
    if (
      selectedPayment === "paypal" &&
      (convertedAmount.length === 0 ||
        !convertedAmount.find((item) => item.item_key === "total_amount"))
    ) {
      return true;
    }

    // 如果选择了Wave支付方式，但还没有转换结果，禁用按钮
    if (
      selectedPayment === "wave" &&
      (convertedAmount.length === 0 ||
        !convertedAmount.find((item) => item.item_key === "total_amount"))
    ) {
      return true;
    }

    // 其他情况下，启用按钮
    return false;
  };

  // 添加取消订单的处理函数
  const handleCancelOrder = async () => {
    try {
      setIsCancelling(true);
      const response = await ordersApi.cancelOrder(route.params.orderId);
      if (response) {
        deleteOrder(route.params.orderId);
        setShowCancelModal(false);
        navigation.goBack();
      }
    } catch (error) {
      console.error("取消订单失败:", error);
      Alert.alert(t("error"), t("order.cancel_failed"));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleChatNowPress = useCallback(() => {
    if (orderDetails) {
      // 使用第一个商品的信息
      const firstItem = orderDetails.items[0];
      const productName =
        getOrderTransLanguage(firstItem) || firstItem.product_name_fr;

      // 根据订单状态获取状态文本
      const getOrderStatusText = (status: number) => {
        switch (status) {
          case 0:
            return t("order.status.waiting_payment");
          case 1:
            return t("order.status.waiting_shipment");
          case 2:
            return t("order.status.in_transit");
          case 3:
            return t("order.status.completed");
          default:
            return t("order.status.unknown");
        }
      };

      const orderStatusText = getOrderStatusText(route.params.status);
      const defaultMessage = `${t(
        "order.status.order_inquiry_prefix"
      )} ${orderStatusText} ${t("order.status.order_inquiry_middle")} ${t(
        "order.status.order_number_prefix"
      )} ${orderDetails.order_id}`;

      navigation.navigate("ChatScreen", {
        product_image_urls: [firstItem.sku_image || firstItem.product_image],
        subject_trans: productName,
        min_price: firstItem.unit_price,
        offer_id: firstItem.offer_id,
        default_message: defaultMessage,
      });
    }
  }, [navigation, orderDetails, t, route.params.status]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.title}>{t("order.details")}</Text>
          <TouchableOpacity onPress={handleChatNowPress}>
            <MassageIcon size={22} />
          </TouchableOpacity>
        </View>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#f77f3a" />
          </View>
        ) : orderDetails ? (
          <View style={styles.container}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 70 }}
            >
              <View style={styles.orderStatus}>
                <View style={styles.orderStatusContent}>
                  <View style={styles.orderStatusTitle}>
                    <OrderIcon size={20} color="#3D3D3D" />
                    <Text style={styles.orderStatusTitleText}>
                      {t("order.status_title")}
                    </Text>
                  </View>

                  <View style={styles.orderStatusContentPreview}>
                    <Progress
                      statuses={route.params.status}
                      labels={[
                        t("order.status.waiting_payment"),
                        t("order.status.waiting_shipment"),
                        t("order.status.in_transit"),
                        t("order.status.completed"),
                      ]}
                    />
                  </View>
                </View>
              </View>
              {/* 订单信息 */}
              <View style={styles.orderStatus}>
                <View style={styles.orderStatusContent}>
                  <View style={styles.orderStatusTitle}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        width: "100%",
                        justifyContent: "space-between",
                      }}
                    >
                      <View style={styles.orderStatusTitleContainer}>
                        <InfoIcon size={20} color="#3D3D3D" />
                        <Text style={styles.orderStatusTitleText}>
                          {t("order.information")}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          payApi
                            .checkPaymentStatus(orderDetails.order_id)
                            .then((res) => {
                              if (res.status === 1) {
                                Toast.show({
                                  type: "success",
                                  text1: t("order.status.payment_success"),
                                });
                              } else {
                                Toast.show({
                                  type: "error",
                                  text1: t("order.status.payment_failed"),
                                });
                              }
                            });
                          console.log("查询支付是否完成");
                        }}
                      >
                        {route.params.status === 0 && (
                          <Text style={{ color: "#f77f3a" }}>
                            {t("order.status.check_payment_result")}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.orderStatusContentPreview}>
                    <View style={styles.orderId}>
                      <Text style={styles.orderIdText}>{t("order.id")}</Text>
                      <Text style={styles.orderIdText1}>
                        {orderDetails.order_id}
                      </Text>
                    </View>
                    <View style={styles.orderId}>
                      <Text style={styles.orderIdText}>
                        {t("order.create_time")}
                      </Text>
                      <Text style={styles.orderIdText1}>
                        {orderDetails.create_time}
                      </Text>
                    </View>
                    <View style={styles.orderId}>
                      <Text style={styles.orderIdText}>
                        {t("order.shipping_type")}
                      </Text>
                      <Text style={styles.orderIdText1}>
                        {orderDetails.shipping_type === 0
                          ? t("order.shipping.sea")
                          : t("order.shipping.air")}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              {/* 配送信息 */}
              <View style={styles.orderStatus}>
                <View style={styles.orderStatusContent}>
                  <View style={styles.orderStatusTitle}>
                    <AddressIcon size={22} color={"#3D3D3D"} />
                    <Text style={styles.orderStatusTitleText}>
                      {t("order.delivery_info")}
                    </Text>
                  </View>
                  <View style={styles.orderStatusContentPreview}>
                    <View style={styles.orderStatusContentPreviewInformation}>
                      <View style={styles.warehouse}>
                        <View style={styles.recipientTitle}>
                          <Text
                            style={
                              styles.orderStatusContentPreviewInformationText
                            }
                          >
                            {t("order.warehouse")}
                          </Text>
                        </View>
                        <View style={styles.recipientTitle}>
                          <Text>{orderDetails.receiver_address}</Text>
                        </View>
                        <View style={styles.recipientTitle}>
                          <View style={styles.warehousePhone}>
                            <View style={styles.warehousePhoneTextContainer}>
                              <BrightnessIcon size={16} color="#3D3D3D" />
                            </View>
                            <View style={styles.warehousePhoneTextContainer}>
                              <Text style={styles.warehousePhoneText}>
                                {t("order.contact_after_payment")}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      <View style={styles.recipient}>
                        <View style={styles.recipientTitle}>
                          <Text
                            style={
                              styles.orderStatusContentPreviewInformationText
                            }
                          >
                            {t("order.recipient")}
                          </Text>
                        </View>
                        <View style={styles.recipientTitle}>
                          <Text style={styles.recipientName}>
                            {orderDetails.receiver_name}
                          </Text>
                        </View>
                        <View style={styles.recipientTitle}>
                          <View style={styles.recipientPhoneContainer}>
                            <PhoneIcon size={16} color="#3D3D3D" />
                            <Text style={styles.recipientPhone}>
                              {formatPhoneNumber(
                                orderDetails.receiver_phone,
                                localSelectedCountry,
                                selectedCountry
                              )}
                            </Text>
                          </View>
                        </View>
                        {/* watchApp */}
                        <View style={styles.recipientTitle}>
                          <View style={styles.recipientPhoneContainer}>
                            <WhatsAppIcon size={16} />
                            <Text style={styles.recipientPhone}>WhatsApp:</Text>
                            <Text style={styles.recipientPhone}>
                              {formatPhoneNumber(
                                orderDetails.receiver_phone,
                                localSelectedCountry,
                                selectedCountry
                              )}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
              {/* 商品信息 */}
              <View style={styles.orderStatus}>
                <View style={styles.orderStatusContent}>
                  <View style={styles.orderStatusTitle}>
                    <ShoppingBagIcon size={16} color="#3D3D3D" />
                    <Text style={styles.orderStatusTitleText}>
                      {t("order.product_info")} ({orderDetails.items.length})
                    </Text>
                  </View>
                  <View style={styles.orderStatusContentPreview}>
                    {orderDetails.items.map((item, index) => (
                      <View style={styles.productItem} key={index}>
                        <View style={styles.productItemImage}>
                          <Image
                            source={{ uri: item.sku_image }}
                            style={{
                              width: "100%",
                              height: "100%",
                              resizeMode: "cover",
                            }}
                          />
                        </View>
                        <View style={styles.productItemInfo}>
                          <View style={styles.productItemInfoName}>
                            <Text style={styles.productItemInfoNameText}>
                              {getOrderTransLanguage(item) ||
                                item.product_name_fr}
                            </Text>
                          </View>
                          <View style={styles.productItemInfoSku}>
                            {item.sku_attributes.map((sku, index) => (
                              <Text
                                key={index}
                                style={styles.productItemInfoSkuText}
                              >
                                {getAttributeNameTransLanguage(sku) ||
                                  sku.attribute_name}
                                :
                                {getAttributeTransLanguage(sku) ||
                                  sku.attribute_value}
                              </Text>
                            ))}
                            {/* <text>{item.product_name}</text> */}
                          </View>
                          <View style={styles.productItemInfoPrice}>
                            <Text
                              style={{
                                color: "#f77f3a",
                                fontSize: fontSize(16),
                                fontWeight: "600",
                              }}
                            >
                              {item.total_price} {orderDetails.currency}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.productItemNum}>
                          <Text style={styles.productItemNumText}>
                            x{item.quantity}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                  <View style={styles.dottedLine}></View>

                  <View style={styles.orderStatusContentPreview}>
                    <TouchableOpacity
                      style={styles.addCard}
                      onPress={() => addToCart(orderDetails.items)}
                    >
                      <View style={styles.addCardBox}>
                        <CardIcon size={16} color="#0098ef" />
                        <Text style={styles.addCardText}>
                          {t("order.add_to_cart")}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              {/* {route.params.status} */}
              {/* 价格信息 */}
              <View style={styles.orderStatus}>
                <View style={styles.orderStatusContent}>
                  <View style={styles.orderStatusTitle}>
                    <PowerIcon size={20} color="#3D3D3D" />
                    <Text style={styles.orderStatusTitleText}>
                      {t("order.price_details")}
                    </Text>
                  </View>
                  <View style={styles.orderStatusContentPreview}>
                    {/* <View style={styles.orderId}>
                      <Text style={styles.orderIdText}>{t("order.subtotal")}</Text>
                      <Text style={styles.orderIdText1}>
                      </Text>
                    </View> */}
                    <View style={styles.orderId}>
                      <Text style={styles.orderIdText}>
                        {t("order.platform_shipping")}
                      </Text>
                      <Text style={styles.orderIdText1}>
                        {orderDetails.domestic_shipping_fee}{" "}
                        {orderDetails.currency}
                      </Text>
                    </View>
                    <View style={styles.orderId}>
                      <Text style={styles.orderIdText}>
                        {t("order.international_shipping")}
                      </Text>
                      <Text style={styles.orderIdText1}>
                        {orderDetails.shipping_fee} {orderDetails.currency}
                      </Text>
                    </View>
                    <View style={styles.dottedLine}></View>
                    <View style={styles.orderId}>
                      <Text style={styles.TotalText}>{t("order.total")}</Text>
                      <Text style={styles.TotalPrice}>
                        {orderDetails.total_amount} {orderDetails.currency}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.orderRemakeText}>
                        + {orderDetails.shipping_fee}{" "}
                        {t("order.estimated_shipping")}({orderDetails.currency})
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
            {/* 代付款 */}
            {route.params.status === 0 && (
              <View style={styles.bottomButtons}>
                <TouchableOpacity
                  style={styles.bottomButton1}
                  onPress={() => {
                    try {
                      cancelOrder(route.params.orderId);
                      Toast.show({
                        type: "success",
                        text1: t("order.cancel_success"),
                      });
                      navigation.goBack();
                    } catch (error) {
                      console.error("取消订单失败:", error);
                      Toast.show({
                        type: "error",
                        text1: t("order.cancel_failed"),
                      });
                    }
                  }}
                >
                  <Text style={styles.bottomButtonText1}>
                    {t("order.cancel")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bottomButton}
                  onPress={() => {
                    setShowPaymentModal(true);
                  }}
                >
                  <Text style={styles.bottomButtonText}>{t("order.pay")}</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* 待发货 */}
            {route.params.status === 1 && (
              <View style={styles.bottomButtons}>
                <TouchableOpacity
                  style={styles.bottomButton1}
                  onPress={() => {
                    callPhone(
                      formatPhoneNumber(
                        orderDetails.receiver_phone,
                        localSelectedCountry,
                        selectedCountry
                      )
                    );
                  }}
                >
                  <Text style={styles.bottomButtonText1}>
                    {t("order.contact_shipping")}
                  </Text>
                </TouchableOpacity>
                {/* <TouchableOpacity
                  style={styles.bottomButton}
                  onPress={() => {
                    changeOrder(route.params.orderId, 2);
                    navigation.goBack();
                  }}
                >
                  <Text style={styles.bottomButtonText}>
                    {t("order.cancel")}
                  </Text>
                </TouchableOpacity> */}
              </View>
            )}
            {/* 代收货 */}
            {route.params.status === 2 && (
              <View style={styles.bottomButtons}>
                <TouchableOpacity
                  style={styles.bottomButton1}
                  onPress={() => {}}
                >
                  <Text style={styles.bottomButtonText1}>
                    {t("order.check_logistics")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bottomButton}
                  onPress={() => {
                    try {
                      confirmOrder(route.params.orderId);
                      Toast.show({
                        type: "success",
                        text1: t("order.confirm_receipt"),
                      });
                      navigation.goBack();
                    } catch (error) {
                      console.error("确认收货失败:", error);
                      Toast.show({
                        type: "error",
                        text1: t("error"),
                      });
                    }
                  }}
                >
                  <Text style={styles.bottomButtonText}>
                    {t("order.confirm_receipt")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {/* 已完成 */}
            {route.params.status === 3 && (
              <View></View>
              // <View style={styles.bottomButtons}>
              //   <TouchableOpacity
              //     style={styles.bottomButton1}
              //     onPress={() => {
              //       addToCart(orderDetails.items);
              //       // navigation.goBack();
              //     }}
              //   >
              //     <Text style={styles.bottomButtonText1}>
              //     {t("order.add_to_cart")}
              //     </Text>
              //   </TouchableOpacity>
              //   <TouchableOpacity style={styles.bottomButton}>
              //     <Text style={styles.bottomButtonText}>
              //     {t("order.reorder")}
              //     </Text>
              //   </TouchableOpacity>
              // </View>
            )}
            {/* 已取消 */}
            {(route.params.status === 3 ||
              route.params.status === 4 ||
              route.params.status === 5 ||
              route.params.status === 6) && (
              <View style={styles.bottomButtons}>
                <TouchableOpacity
                  style={styles.bottomButton1}
                  onPress={() => {
                    addToCart(orderDetails.items);
                  }}
                >
                  <Text style={styles.bottomButtonText1}>
                    {t("order.add_to_cart")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bottomButton}
                  onPress={() => {
                    reorderHandel(orderDetails);
                  }}
                >
                  <Text style={styles.bottomButtonText}>
                    {t("order.reorder")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <Text>{t("order.unable_to_load")}</Text>
        )}
      </View>

      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("order.select_payment")}</Text>
              <TouchableOpacity
                onPress={() => setShowPaymentModal(false)}
                style={styles.closeButtonContainer}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabContainer}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tab,
                    currentTab === tab.id && styles.tabActive,
                  ]}
                  onPress={() => setCurrentTab(tab.id)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      currentTab === tab.id && styles.tabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.paymentOptions}
            >
              {currentTab === "online" ? (
                <>
                  {tabs
                    .find((tab) => tab.id === "online")
                    ?.options.map((option) => (
                      <View key={option.id}>
                        <View style={styles.cardContainer}>
                          <View style={styles.iconRow}>
                            <View style={styles.imageContainer}>
                              {option.key === "balance" ? (
                                <View style={styles.leftInfo}>
                                  <View style={styles.blueBox}>
                                    <Image
                                      source={payMap(option.key) as any}
                                      style={{
                                        width: 80,
                                        height: 30,
                                        resizeMode: "contain",
                                        marginRight: 10,
                                      }}
                                    />
                                  </View>
                                  <Text style={styles.balanceText}>
                                    {t("order.balance_remaining") ||
                                      "Balance remaining"}
                                    {"\n"}
                                    {user.balance}
                                    {user.currency}
                                  </Text>
                                </View>
                              ) : (
                                <View>
                                  <Image
                                    source={payMap(option.key) as any}
                                    style={{
                                      width: 80,
                                      height: 30,
                                      resizeMode: "contain",
                                      marginRight: 10,
                                    }}
                                  />
                                  {option.key === "mobile_money" && (
                                    <View
                                      style={styles.mobileMoneyTextContainer}
                                    >
                                      {paymentMethods.find(
                                        (method) => method.key === option.key
                                      )?.value &&
                                      Array.isArray(
                                        paymentMethods.find(
                                          (method) => method.key === option.key
                                        )?.value
                                      ) ? (
                                        (
                                          paymentMethods.find(
                                            (method) =>
                                              method.key === option.key
                                          )?.value as string[]
                                        ).map((item, index) => (
                                          <View
                                            key={index}
                                            style={
                                              styles.mobileMoneyImgContainer
                                            }
                                          >
                                            <Image
                                              source={payMap(item) as any}
                                              style={styles.mobileMoneyImg}
                                            />
                                          </View>
                                        ))
                                      ) : (
                                        <Text style={styles.mobileMoneyText}>
                                          {
                                            paymentMethods.find(
                                              (method) =>
                                                method.key === option.key
                                            )?.value as string
                                          }
                                        </Text>
                                      )}
                                    </View>
                                  )}
                                </View>
                              )}
                            </View>
                          </View>
                          <TouchableOpacity
                            onPress={() => onSelectPayment(option.id)}
                          >
                            <View style={styles.checkboxContainer}>
                              <CircleOutlineIcon
                                size={fontSize(24)}
                                strokeColor={
                                  selectedPayment === option.id
                                    ? "#007efa"
                                    : "#C6C6C6"
                                }
                                fillColor={
                                  selectedPayment === option.id
                                    ? "#007efa"
                                    : "transparent"
                                }
                              />
                              {selectedPayment === option.id && (
                                <View style={styles.checkmarkContainer}>
                                  <CheckIcon
                                    size={fontSize(12)}
                                    color="#FFFFFF"
                                  />
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        </View>

                        {/* PayPal Currency Selection */}
                        {selectedPayment === "paypal" &&
                          option.id === "paypal" &&
                          isPaypalExpanded && (
                            <View style={styles.paypalExpandedContainer}>
                              <View style={styles.paypalCurrencyContainer}>
                                <Text style={styles.currencyTitle}>
                                  {t("order.select_currency") ||
                                    "Select Currency"}
                                </Text>
                                <View style={styles.currencyButtonsContainer}>
                                  <TouchableOpacity
                                    style={[
                                      styles.currencyButton,
                                      selectedCurrency === "USD" &&
                                        styles.currencyButtonActive,
                                    ]}
                                    onPress={() => onSelectCurrency("USD")}
                                  >
                                    <Text
                                      style={[
                                        styles.currencyButtonText,
                                        selectedCurrency === "USD" &&
                                          styles.currencyButtonTextActive,
                                      ]}
                                    >
                                      USD
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[
                                      styles.currencyButton,
                                      selectedCurrency === "EUR" &&
                                        styles.currencyButtonActive,
                                    ]}
                                    onPress={() => onSelectCurrency("EUR")}
                                  >
                                    <Text
                                      style={[
                                        styles.currencyButtonText,
                                        selectedCurrency === "EUR" &&
                                          styles.currencyButtonTextActive,
                                      ]}
                                    >
                                      EUR
                                    </Text>
                                  </TouchableOpacity>
                                </View>

                                {/* 显示转换后的金额 */}
                                {isConverting ? (
                                  <View style={styles.convertingContainer}>
                                    <ActivityIndicator
                                      size="small"
                                      color="#007efa"
                                    />
                                    <Text style={styles.convertingText}>
                                      {t("order.converting") || "Converting..."}
                                    </Text>
                                  </View>
                                ) : convertedAmount.length > 0 ? (
                                  <View style={styles.convertedAmountContainer}>
                                    <Text style={styles.convertedAmountLabel}>
                                      {t("order.equivalent_amount") ||
                                        "Equivalent Amount:"}
                                    </Text>
                                    <Text style={styles.convertedAmountValue}>
                                      {convertedAmount
                                        .find(
                                          (item) =>
                                            item.item_key === "total_amount"
                                        )
                                        ?.converted_amount.toFixed(2)}{" "}
                                      {selectedCurrency}
                                    </Text>
                                  </View>
                                ) : null}
                              </View>
                            </View>
                          )}

                        {/* Wave Currency Selection */}
                        {selectedPayment === "wave" &&
                          option.id === "wave" &&
                          isWaveExpanded && (
                            <View style={styles.paypalExpandedContainer}>
                              <View style={styles.paypalCurrencyContainer}>
                                <Text style={styles.currencyTitle}>
                                  {t("order.select_currency") ||
                                    "Select Currency"}
                                </Text>
                                <View style={styles.currencyButtonsContainer}>
                                  <View
                                    style={[
                                      styles.currencyButton,
                                      styles.currencyButtonActive,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.currencyButtonText,
                                        styles.currencyButtonTextActive,
                                      ]}
                                    >
                                      FCFA
                                    </Text>
                                  </View>
                                </View>

                                {/* 显示转换后的金额 */}
                                {isConverting ? (
                                  <View style={styles.convertingContainer}>
                                    <ActivityIndicator
                                      size="small"
                                      color="#007efa"
                                    />
                                    <Text style={styles.convertingText}>
                                      {t("order.converting") || "Converting..."}
                                    </Text>
                                  </View>
                                ) : convertedAmount.length > 0 ? (
                                  <View style={styles.convertedAmountContainer}>
                                    <Text style={styles.convertedAmountLabel}>
                                      {t("order.equivalent_amount") ||
                                        "Equivalent Amount:"}
                                    </Text>
                                    <Text style={styles.convertedAmountValue}>
                                      {convertedAmount
                                        .find(
                                          (item) =>
                                            item.item_key === "total_amount"
                                        )
                                        ?.converted_amount.toFixed(2)}{" "}
                                      FCFA
                                    </Text>
                                  </View>
                                ) : null}
                              </View>
                            </View>
                          )}
                      </View>
                    ))}
                </>
              ) : (
                <View style={styles.outerContainer}>
                  {tabs
                    .find((tab) => tab.id === "offline")
                    ?.options.map((option, index) => (
                      <View key={option.id} style={styles.flexContainer}>
                        <View style={styles.imageContainer}>
                          {option.id === "cash" ? (
                            <Image
                              source={require("../../../assets/img/image_c6aa9539.png")}
                              style={{
                                width: 60,
                                height: 22,
                                resizeMode: "cover",
                              }}
                            />
                          ) : (
                            <Image
                              source={require("../../../assets/img/Global 1.png")}
                              style={{
                                width: 60,
                                height: 22,
                                resizeMode: "cover",
                              }}
                            />
                          )}
                        </View>
                        <View style={styles.verticalAlignEndContent}>
                          <View style={styles.svgContainer}>
                            <TouchableOpacity
                              onPress={() => onSelectPayment(option.id)}
                            >
                              <View style={styles.checkboxContainer}>
                                <CircleOutlineIcon
                                  size={fontSize(24)}
                                  strokeColor={
                                    selectedPayment === option.id
                                      ? "#007efa"
                                      : undefined
                                  }
                                  fillColor={
                                    selectedPayment === option.id
                                      ? "#007efa"
                                      : undefined
                                  }
                                />
                                {selectedPayment === option.id && (
                                  <View style={styles.checkmarkContainer}>
                                    <CheckIcon
                                      size={fontSize(12)}
                                      color="#FFFFFF"
                                    />
                                  </View>
                                )}
                              </View>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.actionButtonsContainer}>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowPaymentModal(false)}
                >
                  <Text style={styles.buttonTextDark}>{t("cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    (isConfirmButtonDisabled() || isPaymentLoading) &&
                      styles.confirmButtonDisabled,
                  ]}
                  onPress={handlePaymentConfirm}
                  disabled={isConfirmButtonDisabled() || isPaymentLoading}
                >
                  {isPaymentLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonTextWhite}>
                      {isConverting
                        ? t("order.converting") || "Converting..."
                        : t("order.confirm_payment")}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* PhoneNumberInputModal组件 */}
      <PhoneNumberInputModal
        isVisible={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        paymentParams={paymentParams}
        onSubmit={handlePhoneSubmit}
        onCloses={() => setShowPaymentModal(false)}
        displayCountryCode={getDisplayCountryCode()}
        onCountrySelect={() => setShowCountryModal(true)}
      />

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
              <Text style={styles.modalTitle}>{t("order.preview.select_country_modal")}</Text>
              <TouchableOpacity
                onPress={() => setShowCountryModal(false)}
                style={styles.closeButtonContainer}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={countryList}
              keyExtractor={(item) => item.country.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.cardContainer,
                    selectedCountry?.country === item.country &&
                      styles.currencyButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedCountry(item);
                    setLocalSelectedCountry(null); // 清除本地存储的选择，使用API的数据
                    setShowCountryModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.buttonTextDark,
                      selectedCountry?.country === item.country &&
                        styles.currencyButtonTextActive,
                    ]}
                  >
                    {getCountryTransLanguage(item)} (+{item.country})
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.paymentOptions}
            />
          </View>
        </View>
      </Modal>

      {/* 取消订单确认弹窗 */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalPopup, styles.modalCancelPopup]}>
            <View style={styles.modalWarningIcon}>
              <IconComponent name="exclamation" size={28} color="#FF5100" />
            </View>
            <Text style={[styles.modalPromptText, styles.modalCancelText]}>
              {t("order.confirm_cancel")}
            </Text>
            <View style={styles.modalCancelButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.modalCancelActionButton,
                  styles.modalCancelButtonOutline,
                ]}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalCancelButtonOutlineText}>
                  {t("order.no")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalCancelActionButton,
                  styles.modalCancelButtonFilled,
                ]}
                onPress={handleCancelOrder}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalCancelButtonFilledText}>
                    {t("order.yes")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create<Styles>({
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
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    fontSize: fontSize(16),
    fontWeight: "600",
  },
  orderStatus: {
    paddingInline: 16,
    marginTop: 10,
  },
  orderStatusContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  orderStatusTitle: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#f5f5f5",
    padding: 10,
  },
  orderStatusTitleText: {
    fontSize: fontSize(16),
    fontWeight: "600",
    marginLeft: 10,
  },
  orderStatusContentPreview: {
    padding: 10,
    justifyContent: "center",
  },
  productItem: {
    flexDirection: "row",
    width: "100%",
    borderBottomWidth: 1,
    borderColor: "#f5f5f5",
    padding: 10,
  },
  productItemImage: {
    width: "15%",
    height: 50,
    borderRadius: 10,
  },
  productItemInfo: {
    width: "75%",
    justifyContent: "space-between",
    paddingLeft: 10,
  },
  productItemNum: {
    width: "10%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  productItemNumText: {
    fontSize: fontSize(16),
    color: "#999",
  },
  productItemInfoName: {
    width: "100%",
    paddingVertical: 5,
  },
  productItemInfoNameText: {
    fontSize: fontSize(13),
    fontWeight: "600",
  },
  productItemInfoSkuText: {
    fontSize: fontSize(13),
    color: "#999",
  },
  productItemInfoSku: {
    width: "100%",
    paddingVertical: 5,
  },
  productItemInfoPrice: {
    width: "100%",
    paddingVertical: 5,
  },
  orderStatusContentPreviewInformation: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  orderId: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    width: "100%",
  },
  orderIdText: {
    color: "#999",
    width: "50%",
    fontSize: fontSize(14),
  },
  orderIdText1: {
    width: "50%",
    textAlign: "right",
    fontSize: fontSize(14),
  },
  TotalText: {
    color: "#f77f3a",
    fontSize: fontSize(18),
    fontWeight: "600",
    width: "50%",
  },
  TotalPrice: {
    color: "#f77f3a",
    fontSize: fontSize(18),
    fontWeight: "600",
    width: "50%",
    textAlign: "right",
  },
  warehouse: {
    width: "50%",
  },
  recipientTitle: {
    paddingVertical: 5,
  },
  recipientPhoneContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  recipient: {
    width: "50%",
  },
  orderStatusContentPreviewInformationText: {
    fontSize: fontSize(16),
    fontWeight: "600",
  },
  warehousePhone: {
    padding: 5,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    width: "90%",
    flexDirection: "row",
    alignItems: "center",
  },
  warehousePhoneText: {
    fontSize: fontSize(14),
    fontWeight: "400",
    color: "#3D3D3D",
  },
  warehousePhoneTextContainer: {
    paddingRight: 5,
  },
  recipientName: {
    fontSize: fontSize(16),
    fontWeight: "600",
  },
  recipientPhone: {
    fontSize: fontSize(14),
    fontWeight: "400",
    color: "#3D3D3D",
  },
  dottedLine: {
    width: "100%",
    borderBottomWidth: 2,
    borderColor: "#f5f5f5",
    borderStyle: "dashed",
  },
  orderRemakeText: {
    fontSize: fontSize(14),
    fontWeight: "400",
    color: "#999",
  },
  addCard: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  addCardBox: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#0098ef",
    borderRadius: 10,
    backgroundColor: "#e2f2fd",
    opacity: 0.5,
    flexDirection: "row",
    alignItems: "center",
  },
  addCardText: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "#0098ef",
    marginLeft: 5,
  },
  bottomButtons: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  bottomButton1: {
    padding: 10,
    marginHorizontal: 10,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    flex: 1,
  },
  bottomButton: {
    padding: 10,
    marginHorizontal: 10,
    alignItems: "center",
    backgroundColor: "#fe7f42",
    borderRadius: 5,
    flex: 1,
  },
  bottomButtonText: {
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#fff",
  },
  bottomButtonText1: {
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#999",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: fontSize(18),
    fontWeight: "600",
  },
  closeButtonContainer: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: fontSize(24),
    color: "#999",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#FF5100",
  },
  tabText: {
    fontSize: fontSize(16),
    color: "#666",
  },
  tabTextActive: {
    color: "#FF5100",
    fontWeight: "500",
  },
  paymentOptions: {
    maxHeight: 300,
  },
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
    marginBottom: 10,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  imageContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  paymentIconContainer: {
    marginRight: 10,
  },
  paymentIcon: {
    fontSize: fontSize(24),
    marginRight: 8,
  },
  checkboxContainer: {
    position: "relative",
    width: fontSize(24),
    height: fontSize(24),
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  currencyTitle: {
    fontSize: fontSize(14),
    color: "#666",
    marginBottom: 10,
  },
  paypalExpandedContainer: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    marginTop: -5,
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  paypalCurrencyContainer: {
    padding: 10,
  },
  currencyButtonsContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  currencyButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 10,
  },
  currencyButtonActive: {
    backgroundColor: "#FFF0E8",
    borderColor: "#FF5100",
  },
  currencyButtonText: {
    fontSize: fontSize(14),
    color: "#333",
  },
  currencyButtonTextActive: {
    color: "#FF5100",
    fontWeight: "600",
  },
  convertingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  convertingText: {
    fontSize: fontSize(14),
    color: "#999",
    marginLeft: 10,
  },
  convertedAmountContainer: {
    marginTop: 10,
  },
  convertedAmountLabel: {
    fontSize: fontSize(14),
    color: "#666",
    marginBottom: 5,
  },
  convertedAmountValue: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "#FF5100",
  },
  actionButtonsContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#f5f5f5",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    marginRight: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#999",
    alignItems: "center",
  },
  confirmButton: {
    flex: 1,
    padding: 15,
    marginLeft: 10,
    borderRadius: 25,
    backgroundColor: "#FF5100",
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonTextDark: {
    fontSize: fontSize(16),
    color: "#666",
  },
  buttonTextWhite: {
    fontSize: fontSize(16),
    color: "#fff",
    fontWeight: "600",
  },
  operatorImage: {
    width: 80,
    height: 30,
    resizeMode: "contain",
    marginRight: 10,
  },
  mobileMoneyTextContainer: {
    width: "100%",
    marginTop: 3,
    alignItems: "flex-start",
    flexDirection: "row",
  },
  mobileMoneyImgContainer: {
    width: 60,
    height: 22,
    borderWidth: 0,
    marginRight: 5,
  },
  mobileMoneyImg: {
    width: 60,
    height: 22,
    borderWidth: 0,
  },
  mobileMoneyText: {
    fontSize: fontSize(12),
    color: "#999",
  },
  outerContainer: {
    width: "100%",
  },
  flexContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 50,
    paddingRight: 16,
    paddingLeft: 16,
    backgroundColor: "white",
    borderRadius: 5,
    marginTop: 10,
  },
  imageStyle: {
    width: 60,
    height: 22,
    marginRight: 10,
  },
  verticalAlignEndContent: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    height: "100%",
  },
  svgContainer: {
    width: 24,
    height: 24,
  },
  leftInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  blueBox: {
    flexDirection: "row",
    backgroundColor: "#3955f6",
    paddingHorizontal: 7,
    paddingLeft: 6,
    alignItems: "center",
    borderRadius: 4,
  },
  balanceText: {
    marginLeft: 17,
    fontSize: fontSize(11),
    lineHeight: 14,
    fontWeight: "500",
    color: "#333333",
  },
  modalPopup: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    maxWidth: "80%",
  },
  modalWarningIcon: {
    alignItems: "center",
    marginBottom: 16,
  },
  modalPromptText: {
    fontSize: fontSize(16),
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: fontSize(22),
    fontWeight: "500",
  },
  modalCancelPopup: {
    width: "80%",
    padding: 24,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: fontSize(16),
    color: "#333",
    marginVertical: 16,
    textAlign: "center",
    lineHeight: fontSize(22),
    fontWeight: "500",
  },
  modalCancelButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 24,
  },
  modalCancelActionButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  modalCancelButtonOutline: {
    backgroundColor: "#F5F5F5",
  },
  modalCancelButtonFilled: {
    backgroundColor: "#FF5100",
  },
  modalCancelButtonOutlineText: {
    fontSize: fontSize(16),
    color: "#666",
    fontWeight: "600",
  },
  modalCancelButtonFilledText: {
    fontSize: fontSize(16),
    color: "#FFF",
    fontWeight: "600",
  },
  orderStatusTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});
