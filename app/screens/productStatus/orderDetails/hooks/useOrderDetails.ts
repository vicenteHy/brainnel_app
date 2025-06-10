import { useState, useEffect, useCallback } from "react";
import { Alert, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";

import {
  ordersApi,
  OrderDetailsType,
  OrderItemDetails,
  CreateOrderRequest,
} from "../../../../services/api/orders";
import { payApi, PaymentMethod } from "../../../../services/api/payApi";
import { settingApi } from "../../../../services/api/setting";
import { cartApi } from "../../../../services/api/cart";
import useUserStore from "../../../../store/user";
import { useOrderListStore } from "../../../../store/orderList";
import { CountryList } from "../../../../constants/countries";
import { 
  getOrderTransLanguage,
  getAttributeTransLanguage,
  getAttributeNameTransLanguage,
} from "../../../../utils/languageUtils";

import { TabType, LocalCountryData } from "../types";
import { formatPhoneNumber } from "../utils/phoneUtils";

interface UseOrderDetailsParams {
  orderId: string;
  status: number;
}

export const useOrderDetails = ({ orderId, status }: UseOrderDetailsParams) => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { t } = useTranslation();
  const { user } = useUserStore();
  const {
    deleteOrder,
    changeOrder,
    updateOrderShippingInfo,
    cancelOrder,
    confirmOrder,
  } = useOrderListStore();

  // 状态管理
  const [orderDetails, setOrderDetails] = useState<OrderDetailsType>();
  const [isLoading, setIsLoading] = useState(true);
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

  // 国家选择相关状态
  const [countryList, setCountryList] = useState<CountryList[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryList | null>(null);
  const [localSelectedCountry, setLocalSelectedCountry] = useState<LocalCountryData | null>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);

  // 获取订单详情
  const getOrderDetails = async () => {
    try {
      setIsLoading(true);
      const response = await ordersApi.getOrderDetails(orderId);
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
      const savedLocalCountry = await AsyncStorage.getItem("@selected_country");
      if (savedLocalCountry) {
        try {
          const parsedLocalCountry: LocalCountryData = JSON.parse(savedLocalCountry);
          setLocalSelectedCountry(parsedLocalCountry);
          console.log("使用本地存储的国家:", parsedLocalCountry);
        } catch (e) {
          console.error("解析本地存储国家数据失败:", e);
        }
      }

      const response = await settingApi.getSendSmsCountryList();
      if (response && Array.isArray(response)) {
        setCountryList(response);

        if (!savedLocalCountry) {
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

  // 拨打电话
  const callPhone = async (phoneNumber: string) => {
    const url = `tel:${phoneNumber}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(t("error"), t("order.error.phone_open"));
      console.error("拨号失败:", error);
    }
  };

  // 添加到购物车
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
  const reorderHandle = async (orderDetails: OrderDetailsType) => {
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

  // 取消订单
  const handleCancelOrder = async () => {
    try {
      setIsCancelling(true);
      const response = await ordersApi.cancelOrder(orderId);
      if (response) {
        deleteOrder(orderId);
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

  // 聊天处理
  const handleChatNowPress = useCallback(() => {
    if (orderDetails) {
      const firstItem = orderDetails.items[0];
      const productName = getOrderTransLanguage(firstItem) || firstItem.product_name_fr;

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

      navigation.navigate("ChatScreen", {
        product_image_urls: [firstItem.sku_image || firstItem.product_image],
        subject_trans: productName,
        min_price: firstItem.unit_price,
        offer_id: firstItem.offer_id,
      });
    }
  }, [navigation, orderDetails, t, status]);

  // 初始化
  useEffect(() => {
    getOrderDetails();

    // 获取支付方式
    payApi
      .getCountryPaymentMethods()
      .then((res) => {
        if (res && res.current_country_methods) {
          setPaymentMethods(res.current_country_methods);

          setTabs((prev) => {
            const updatedTabs = [...prev];
            const onlineTabIndex = updatedTabs.findIndex(
              (tab) => tab.id === "online"
            );

            if (onlineTabIndex !== -1) {
              const options = res.current_country_methods.map(
                (method) => ({
                  id: method.key,
                  label: method.key.charAt(0).toUpperCase() + method.key.slice(1),
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

  return {
    // 状态
    orderDetails,
    isLoading,
    showPaymentModal,
    selectedPayment,
    currentTab,
    paymentMethods,
    tabs,
    selectedCurrency,
    convertedAmount,
    isConverting,
    isPaymentLoading,
    isPaypalExpanded,
    isWaveExpanded,
    paymentParams,
    showPhoneModal,
    showCancelModal,
    isCancelling,
    countryList,
    selectedCountry,
    localSelectedCountry,
    showCountryModal,
    loadingCountries,

    // 方法
    setShowPaymentModal,
    setSelectedPayment,
    setCurrentTab,
    setSelectedCurrency,
    setIsPaypalExpanded,
    setIsWaveExpanded,
    setPaymentParams,
    setShowPhoneModal,
    setShowCancelModal,
    setSelectedCountry,
    setLocalSelectedCountry,
    setShowCountryModal,
    setConvertedAmount,
    setIsConverting,
    setIsPaymentLoading,

    // 业务逻辑方法
    getOrderDetails,
    loadCountryList,
    callPhone,
    addToCart,
    reorderHandle,
    handleCancelOrder,
    handleChatNowPress,

    // 工具方法
    formatPhoneNumber: (phone: string) => 
      formatPhoneNumber(phone, localSelectedCountry, selectedCountry),
  };
}; 