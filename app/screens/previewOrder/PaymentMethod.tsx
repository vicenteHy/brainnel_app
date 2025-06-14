import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Modal,
} from "react-native";
import { payApi, PaymentMethodsResponse } from "../../services/api/payApi";
import fontSize from "../../utils/fontsizeUtils";
import BackIcon from "../../components/BackIcon";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import useOrderStore from "../../store/order";
import useCreateOrderStore from "../../store/createOrder";
import { useRoute, RouteProp } from "@react-navigation/native";
import useUserStore from "../../store/user";
import { createOrderDataType } from "../../types/createOrder";
import {
  ordersApi,
  OrderData,
  CreateOrderRequest,
} from "../../services/api/orders";
import { useTranslation } from "react-i18next";
import payMap from "../../utils/payMap";
import PaymentMethodIcon from "../../components/PaymentMethodIcon";
import PaymentIcon from "../../components/PaymentIcon";
import useAnalyticsStore from "../../store/analytics";
import { settingApi } from "../../services/api/setting";
import { PaymentMethodItem } from "./payment/PaymentMethodItem";
import { 
  PaymentMethodRouteParams,
  RootStackParamList,
  PaymentOption,
  PaymentTab,
  AlertModalState,
  ConvertedAmount 
} from "./payment/types";
import { styles } from "./payment/styles";



export const PaymentMethod = () => {
  const { t } = useTranslation();
  const [tabs, setTabs] = useState<PaymentTab[]>([
    {
      id: "online",
      label: t("order.payment.online"),
      options: [],
    },
    {
      id: "offline",
      label: t("order.payment.offline"),
      options: [],
    },
  ]);
  const [currentTab, setCurrentTab] = useState("online");
  const [paymentMethods, setPaymentMethods] =
    useState<PaymentMethodsResponse>();
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route =
    useRoute<RouteProp<Record<string, PaymentMethodRouteParams>, string>>();
  const [isPaypalExpanded, setIsPaypalExpanded] = useState(false);
  const [isCreditCardExpanded, setIsCreditCardExpanded] = useState(false);
  const order = useOrderStore((state) => state.order);
  const [previewOrder, setPreviewOrder] = useState<OrderData>();
  const [loading, setLoading] = useState(false);
  const { user } = useUserStore();
  const [createOrderData, setCreateOrderData] = useState<createOrderDataType>();
  const { items, orderData, setOrderData, resetOrder } = useCreateOrderStore();
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [convertedAmount, setConvertedAmount] = useState<ConvertedAmount[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [exchangeRates] = useState({
    usd: 580.0,
    eur: 655.96,
  });
  const [countryList, setCountryList] = useState<any[]>([]);
  const [userLocalCurrency, setUserLocalCurrency] = useState<string>("");
  const [hasInitializedCurrency, setHasInitializedCurrency] = useState(false);

  // 自定义弹窗状态
  const [alertModal, setAlertModal] = useState<AlertModalState>({
    visible: false,
    title: '',
    message: ''
  });

  // Get isCOD parameter from route
  const isCOD = route.params?.isCOD || false;

  // State to store the original total price (fixed, won't change)
  const [originalTotalPrice, setOriginalTotalPrice] = useState(0);

  // Helper function to get shipping fee - always return actual fee for display
  const getShippingFee = () => {
    return orderData?.shipping_fee || 0;
  };

  // Helper function to get converted shipping fee - always return actual converted fee for display
  const getConvertedShippingFee = () => {
    return convertedAmount.find((item) => item.item_key === "shipping_fee")?.converted_amount || 0;
  };

  // Helper function to get shipping fee for calculation (always return actual fee)
  const getShippingFeeForCalculation = () => {
    return orderData?.shipping_fee || 0;
  };

  // Helper function to get converted shipping fee for calculation (always return actual converted fee)
  const getConvertedShippingFeeForCalculation = () => {
    return convertedAmount.find((item) => item.item_key === "shipping_fee")?.converted_amount || 0;
  };

  // Helper function to get converted total amount for calculation (excluding shipping fee if isCOD is true)
  const getConvertedTotalForCalculation = () => {
    if (isCOD) {
      // If isCOD is true, subtract the shipping fee from the total converted amount
      const totalConverted = convertedAmount.reduce((acc, item) => acc + item.converted_amount, 0);
      const shippingFeeConverted = convertedAmount.find((item) => item.item_key === "shipping_fee")?.converted_amount || 0;
      return totalConverted - shippingFeeConverted;
    }
    return convertedAmount.reduce((acc, item) => acc + item.converted_amount, 0);
  };

  // Helper function to get total amount for calculation (excluding shipping fee if isCOD is true)
  const getTotalForCalculation = () => {
    if (isCOD) {
      // 不计入国际运费
      return Number(
        (
          (previewOrder?.total_amount || 0) +
          (orderData?.domestic_shipping_fee || 0)
        ).toFixed(2)
      );
    }
    return Number(
      (
        (previewOrder?.total_amount || 0) +
        (orderData?.domestic_shipping_fee || 0) +
        getShippingFeeForCalculation()
      ).toFixed(2)
    );
  };

  const toggleExpanded = () => {
    setIsPaypalExpanded(!isPaypalExpanded);
  };

  const handleInitialPaymentSelection = (paymentId: string) => {
    // Handle initial currency conversion for default selected payment method
    if (paymentId === "paypal") {
      setIsPaypalExpanded(true);
      setIsConverting(true);
      setSelectedCurrency("USD");

      const data = {
        from_currency: user.currency,
        to_currency: "USD",
        amounts: {
          total_amount: previewOrder?.total_amount || 0,
          domestic_shipping_fee: createOrderData?.domestic_shipping_fee || 0,
          shipping_fee: createOrderData?.shipping_fee || 0,
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
    } else if (paymentId === "bank_card") {
      setIsCreditCardExpanded(true);
      setIsConverting(true);
      setSelectedCurrency("USD");

      const data = {
        from_currency: user.currency,
        to_currency: "USD",
        amounts: {
          total_amount: previewOrder?.total_amount || 0,
          domestic_shipping_fee: createOrderData?.domestic_shipping_fee || 0,
          shipping_fee: createOrderData?.shipping_fee || 0,
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
    } else if (paymentId === "wave") {
      setIsConverting(true);
      setSelectedCurrency("FCFA");

      const data = {
        from_currency: user.currency,
        to_currency: "FCFA",
        amounts: {
          total_amount: previewOrder?.total_amount || 0,
          domestic_shipping_fee: createOrderData?.domestic_shipping_fee || 0,
          shipping_fee: createOrderData?.shipping_fee || 0,
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
    } else if (paymentId === "mobile_money" || paymentId.includes("mobile_money") || paymentId.includes("Brainnel Pay")) {
      setIsConverting(true);

      const targetCurrency = userLocalCurrency || user.currency;
      const data = {
        from_currency: previewOrder?.currency || "USD",
        to_currency: targetCurrency,
        amounts: {
          total_amount: previewOrder?.total_amount || 0,
          domestic_shipping_fee: createOrderData?.domestic_shipping_fee || 0,
          shipping_fee: createOrderData?.shipping_fee || 0,
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

  const onSelectPayment = (paymentId: string) => {
    if (paymentId === selectedPayment) {
      // If clicking on already selected paypal, toggle expansion
      if (paymentId === "paypal") {
        setIsPaypalExpanded(!isPaypalExpanded);
      }
      // If clicking on already selected credit card, toggle expansion
      if (paymentId === "bank_card") {
        setIsCreditCardExpanded(!isCreditCardExpanded);
      }
      return;
    }

    setSelectedPayment(paymentId);

    // Auto-expand paypal when selecting it
    if (paymentId === "paypal") {
      setIsPaypalExpanded(true);
      setIsCreditCardExpanded(false);
      setIsConverting(true);

      // Reset to USD when selecting PayPal
      setSelectedCurrency("USD");

      const data = {
        from_currency: user.currency,
        to_currency: "USD",
        amounts: {
          total_amount: previewOrder?.total_amount || 0,
          domestic_shipping_fee: createOrderData?.domestic_shipping_fee || 0,
          shipping_fee: createOrderData?.shipping_fee || 0,
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
    } else if (paymentId === "bank_card") {
      // Auto-expand credit card when selecting it
      setIsCreditCardExpanded(true);
      setIsPaypalExpanded(false);
      setIsConverting(true);

      // Reset to USD when selecting Credit Card
      setSelectedCurrency("USD");

      const data = {
        from_currency: user.currency,
        to_currency: "USD",
        amounts: {
          total_amount: previewOrder?.total_amount || 0,
          domestic_shipping_fee: createOrderData?.domestic_shipping_fee || 0,
          shipping_fee: createOrderData?.shipping_fee || 0,
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
    } else if (paymentId === "wave") {
      // Handle wave payment - convert to FCFA
      setIsPaypalExpanded(false);
      setIsCreditCardExpanded(false);
      setIsConverting(true);

      setSelectedCurrency("FCFA");

      const data = {
        from_currency: user.currency,
        to_currency: "FCFA",
        amounts: {
          total_amount: previewOrder?.total_amount || 0,
          domestic_shipping_fee: createOrderData?.domestic_shipping_fee || 0,
          shipping_fee: createOrderData?.shipping_fee || 0,
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
    } else if (paymentId === "mobile_money" || paymentId.includes("mobile_money") || paymentId.includes("Brainnel Pay")) {
      // Handle mobile money (brainnelpay) - convert to user's local currency based on country
      setIsPaypalExpanded(false);
      setIsCreditCardExpanded(false);
      setIsConverting(true);

      const targetCurrency = userLocalCurrency || user.currency;
      const data = {
        from_currency: previewOrder?.currency || "USD",
        to_currency: targetCurrency,
        amounts: {
          total_amount: previewOrder?.total_amount || 0,
          domestic_shipping_fee: createOrderData?.domestic_shipping_fee || 0,
          shipping_fee: createOrderData?.shipping_fee || 0,
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
    } else {
      // Close expansion for other options
      setIsPaypalExpanded(false);
      setIsCreditCardExpanded(false);
    }
  };

  const onSelectCurrency = (currency: string) => {
    setSelectedCurrency(currency);
    setIsConverting(true);
    const data = {
      from_currency: user.currency,
      to_currency: currency,
      amounts: {
        total_amount: previewOrder?.total_amount || 0,
        domestic_shipping_fee: createOrderData?.domestic_shipping_fee || 0,
        shipping_fee: createOrderData?.shipping_fee || 0,
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

  const getPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await payApi.getCountryPaymentMethods();
      setPaymentMethods(response);
      // Map payment methods to tabs
      let paymentMethodsToUse: any[] = [];
      
      // If current_country_methods is empty, use methods from 科特迪瓦 as default
      if (response.current_country_methods.length === 0 && response.other_country_methods.length > 0) {
        const coteIvoireMethods = response.other_country_methods.find(
          country => country.country === 225 || country.country_name === "Côte d'Ivoire"
        );
        if (coteIvoireMethods) {
          paymentMethodsToUse = coteIvoireMethods.payment_methods;
        }
      } else {
        paymentMethodsToUse = response.current_country_methods;
      }
      
      // 为法国添加默认支付方式
      if (user.country_code === 33 && paymentMethodsToUse.length === 0) {
        paymentMethodsToUse = [
          { key: "paypal", name: "PayPal", value: "" },
          { key: "bank_card", name: "Bank Card Payment", value: "" },
          { key: "balance", name: "Balance", value: "" }
        ];
      }

      const onlineMethods = paymentMethodsToUse
        .filter((method: any) => {
          // wave只在科特迪瓦（country_code为225）显示
          if (method.key === "wave") {
            return user.country_code === 225;
          }
          return true;
        })
        .map((method: any) => ({
          id: method.key,
          label: method.name || method.key,
          icon: getPaymentIcon(method.key),
          value: method.value,
          key: method.key,
        }));

      // Offline methods are empty since clicking offline tab navigates directly
      const offlineMethods: PaymentOption[] = [];

      // Update tabs with fetched payment methods
      setTabs([
        {
          id: "online",
          label: t("order.payment.online"),
          options: onlineMethods,
        },
        {
          id: "offline",
          label: t("order.payment.offline"),
          options: offlineMethods,
        },
      ]);

      // If there are payment methods, set the first one as selected by default
      if (onlineMethods.length > 0) {
        setSelectedPayment(onlineMethods[0].id);
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to get payment methods:", error);
      setLoading(false);
    }
  };

  const getPaymentIcon = (key: string): string => {
    switch (key) {
      case "Brainnel Pay(Mobile Money)":
        return "💳";
      case "Wave":
        return "💸";
      case "Paypal":
        return "🅿️";
      case "Bank Card Payment":
        return "💳";
      default:
        return "💰";
    }
  };

  useEffect(() => {
    getPaymentMethods();
    getCountryListAndSetLocalCurrency();
  }, []);

  const getCountryListAndSetLocalCurrency = async () => {
    try {
      const countries = await settingApi.getCountryList();
      setCountryList(countries);
      
      // Find user's country and get its local currency
      const userCountry = countries.find(country => country.country === user.country_code);
      if (userCountry) {
        setUserLocalCurrency(userCountry.currency);
      }
    } catch (error) {
      console.error("Failed to get country list:", error);
    }
  };

  useEffect(() => {
    setLoading(true);
    if (route.params?.freight_forwarder_address_id) {
      const data = {
        country_code: route.params.freight_forwarder_address_id,
        items: items,
      };
      ordersApi
        .getOrders(data)
        .then((res) => {
          setPreviewOrder(res);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
          Alert.alert("Error", "Failed to get preview order");
        });
    }
  }, [route.params?.freight_forwarder_address_id]);

  useEffect(() => {
    setCreateOrderData({
      ...orderData,
      address_id: orderData.address_id,
      domestic_shipping_fee: orderData.domestic_shipping_fee,
      shipping_fee: orderData.shipping_fee,
      transport_type: orderData.transport_type,
      currency: user.currency,
    });
    console.log("orderData", orderData);
  }, [orderData]);

  // Trigger initial currency conversion when all data is loaded
  useEffect(() => {
    if (selectedPayment && previewOrder && createOrderData && !hasInitializedCurrency) {
      handleInitialPaymentSelection(selectedPayment);
      setHasInitializedCurrency(true);
    }
  }, [selectedPayment, previewOrder, createOrderData, userLocalCurrency, hasInitializedCurrency]);

  // 当用户本地货币设置后，如果当前选择的是mobile money，重新进行货币转换
  useEffect(() => {
    if (userLocalCurrency && selectedPayment && (selectedPayment === "mobile_money" || selectedPayment.includes("mobile_money") || selectedPayment.includes("Brainnel Pay")) && previewOrder && createOrderData) {
      setIsConverting(true);
      const data = {
        from_currency: previewOrder.currency || "USD",
        to_currency: userLocalCurrency,
        amounts: {
          total_amount: previewOrder.total_amount || 0,
          domestic_shipping_fee: createOrderData.domestic_shipping_fee || 0,
          shipping_fee: createOrderData.shipping_fee || 0,
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
  }, [userLocalCurrency]);

  // Set original total price when both previewOrder and orderData are available
  useEffect(() => {
    if (previewOrder && orderData && originalTotalPrice === 0) {
      const originalTotal = 
        (previewOrder.total_amount || 0) + 
        (orderData.domestic_shipping_fee || 0) + 
        (isCOD ? 0 : (orderData.shipping_fee || 0));
      setOriginalTotalPrice(originalTotal);
    }
  }, [previewOrder, orderData, originalTotalPrice, isCOD]);

  const handleSubmit = async () => {
    if (!selectedPayment) {
      Alert.alert(t("payment.select_payment"));
      return;
    }
    
    // 检查余额支付时余额是否充足
    console.log("Selected payment method:", selectedPayment);
    console.log("Checking if balance payment:", selectedPayment === "balance");
    
    if (selectedPayment === "balance" || selectedPayment === "soldes" || selectedPayment?.toLowerCase().includes("balance") || selectedPayment?.toLowerCase().includes("soldes")) {
      console.log("进入余额检查逻辑");
      
      const totalAmount = getTotalForCalculation();
      console.log("计算的总金额:", totalAmount);
      console.log("用户余额原始值:", user.balance);
      console.log("用户货币:", user.currency);
      
      // 直接使用数字比较，因为从日志看user.balance已经是数字
      const userBalance = typeof user.balance === 'number' ? user.balance : parseFloat(String(user.balance));
      console.log("解析后的用户余额:", userBalance);
      
      console.log("余额比较:", userBalance, "<", totalAmount, "=", userBalance < totalAmount);
      
      if (isNaN(userBalance) || isNaN(totalAmount)) {
        console.log("余额或总金额解析失败:", { userBalance, totalAmount });
        return;
      }
      
      if (userBalance < totalAmount) {
        console.log("余额不足，显示提示");
        setAlertModal({
          visible: true,
          title: t("payment.insufficient_balance") || "余额不足",
          message: t("payment.insufficient_balance_message") || `当前余额: ${userBalance}${user.currency}\n需要支付: ${totalAmount.toFixed(2)}${user.currency}\n请选择其他支付方式或先充值。`
        });
        return;
      } else {
        console.log("余额充足，继续处理");
      }
    } else {
      console.log("不是余额支付，跳过余额检查");
    }
    const items =
      previewOrder?.items.map((item) => ({
        offer_id: String(item.offer_id),
        cart_item_id: item.cart_item_id,
        sku_id: String(item.sku_id),
        product_name: item.product_name,
        product_name_en: item.product_name_en,
        product_name_ar: item.product_name_ar,
        product_name_fr: item.product_name_fr,
        sku_attributes: item.attributes.map((attr) => ({
          attribute_name: attr.attribute_name,
          attribute_value: attr.value,
        })),
        sku_image: item.sku_image_url,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })) || [];
    if (createOrderData) {
      createOrderData.items = items;
      createOrderData.payment_method = selectedPayment;
      createOrderData.total_amount =
        selectedPayment === "paypal"
          ? getConvertedTotalForCalculation()
          : selectedPayment === "bank_card"
          ? getConvertedTotalForCalculation()
          : selectedPayment === "wave"
          ? getConvertedTotalForCalculation()
          : (selectedPayment === "mobile_money" || selectedPayment?.includes("mobile_money") || selectedPayment?.includes("Brainnel Pay")) && convertedAmount.length > 0
          ? getConvertedTotalForCalculation()
          : getTotalForCalculation();
      createOrderData.actual_amount =
        selectedPayment === "paypal"
          ? getConvertedTotalForCalculation()
          : selectedPayment === "bank_card"
          ? getConvertedTotalForCalculation()
          : selectedPayment === "wave"
          ? getConvertedTotalForCalculation()
          : (selectedPayment === "mobile_money" || selectedPayment?.includes("mobile_money") || selectedPayment?.includes("Brainnel Pay")) && convertedAmount.length > 0
          ? getConvertedTotalForCalculation()
          : getTotalForCalculation();
      createOrderData.currency =
        selectedPayment === "paypal" 
          ? selectedCurrency 
          : selectedPayment === "bank_card"
          ? selectedCurrency
          : selectedPayment === "wave" 
          ? "FCFA" 
          : (selectedPayment === "mobile_money" || selectedPayment?.includes("mobile_money") || selectedPayment?.includes("Brainnel Pay")) 
          ? (userLocalCurrency || user.currency) 
          : user.currency;
      createOrderData.domestic_shipping_fee =
        selectedPayment === "paypal"
          ? convertedAmount.find(
              (item) => item.item_key === "domestic_shipping_fee"
            )?.converted_amount || 0
          : selectedPayment === "bank_card"
          ? convertedAmount.find(
              (item) => item.item_key === "domestic_shipping_fee"
            )?.converted_amount || 0
          : selectedPayment === "wave"
          ? convertedAmount.find(
              (item) => item.item_key === "domestic_shipping_fee"
            )?.converted_amount || 0
          : (selectedPayment === "mobile_money" || selectedPayment?.includes("mobile_money") || selectedPayment?.includes("Brainnel Pay")) && convertedAmount.length > 0
          ? convertedAmount.find(
              (item) => item.item_key === "domestic_shipping_fee"
            )?.converted_amount || 0
          : orderData?.domestic_shipping_fee;
      createOrderData.shipping_fee =
        selectedPayment === "paypal"
          ? getConvertedShippingFeeForCalculation()
          : selectedPayment === "bank_card"
          ? getConvertedShippingFeeForCalculation()
          : selectedPayment === "wave"
          ? getConvertedShippingFeeForCalculation()
          : (selectedPayment === "mobile_money" || selectedPayment?.includes("mobile_money") || selectedPayment?.includes("Brainnel Pay")) && convertedAmount.length > 0
          ? getConvertedShippingFeeForCalculation()
          : getShippingFeeForCalculation();
    }
    setOrderData(createOrderData || {});

    // 收集支付方式确认埋点数据 - 按照指定的字段格式
    const paymentConfirmData = {
      pay_method: selectedPayment,
      offline_payment: currentTab === "offline" ? 0 : 1,
      all_price:
        selectedPayment === "paypal"
          ? getConvertedTotalForCalculation()
          : selectedPayment === "bank_card"
          ? getConvertedTotalForCalculation()
          : selectedPayment === "wave"
          ? getConvertedTotalForCalculation()
          : (selectedPayment === "mobile_money" || selectedPayment?.includes("mobile_money") || selectedPayment?.includes("Brainnel Pay")) && convertedAmount.length > 0
          ? getConvertedTotalForCalculation()
          : getTotalForCalculation(),
      currency: selectedPayment === "paypal" 
        ? selectedCurrency 
        : selectedPayment === "bank_card"
        ? selectedCurrency
        : selectedPayment === "wave" 
        ? "FCFA" 
        : (selectedPayment === "mobile_money" || selectedPayment?.includes("mobile_money") || selectedPayment?.includes("Brainnel Pay")) 
        ? (userLocalCurrency || user.currency) 
        : user.currency,
      pay_product: JSON.stringify(
        previewOrder?.items.map((item) => {
          return {
            offer_id: item.offer_id,
            price: item.unit_price,
            all_price:
              convertedAmount.find((item) => item.item_key === "total_amount")
                ?.converted_amount || item.total_price,
            currency: selectedPayment === "paypal" ? selectedCurrency : selectedPayment === "Bank Card Payment" ? selectedCurrency : selectedPayment === "wave" ? "FCFA" : (selectedPayment === "mobile_money" || selectedPayment?.includes("mobile_money") || selectedPayment?.includes("Brainnel Pay")) && convertedAmount.length > 0 ? (userLocalCurrency || user.currency) : previewOrder.currency,
            sku: item.attributes.map((sku) => {
              return {
                sku_id: item.sku_id,
                value: sku.value,
              };
            }),
            quantity: item.quantity,
            product_name: item.product_name,
            timestamp: new Date().toISOString(),
            product_img: item.sku_image_url,
          };
        })
      ),
      shipping_method: orderData?.transport_type || 0,
      shipping_price_outside: getShippingFeeForCalculation(),
      shipping_price_within: orderData?.domestic_shipping_fee || 0,
      timestamp: new Date().toISOString(),
    };



    // 记录支付方式确认埋点事件
    const analyticsStore = useAnalyticsStore.getState();
    analyticsStore.logPaymentConfirm(paymentConfirmData, "shipping");
    
    console.log("支付确认信息埋点数据:", paymentConfirmData);

    setCreateLoading(true);

    console.log("=== 创建订单请求数据 ===");
    console.log("createOrderData:", JSON.stringify(createOrderData, null, 2));
    console.log("用户信息:", { user, currency: user.currency });
    console.log("订单数据:", { orderData, previewOrder });
    console.log("========================");

    ordersApi
      .createOrder(createOrderData as unknown as CreateOrderRequest)
      .then((res) => {
        setCreateLoading(false);
        console.log("订单创建成功:", res);
        // go to payment preview
        navigation.navigate("PreviewOrder", {
          data: res,
          payMethod: selectedPayment,
          currency: selectedPayment === "paypal" 
        ? selectedCurrency 
        : selectedPayment === "bank_card"
        ? selectedCurrency
        : selectedPayment === "wave" 
        ? "FCFA" 
        : (selectedPayment === "mobile_money" || selectedPayment?.includes("mobile_money") || selectedPayment?.includes("Brainnel Pay")) 
        ? (userLocalCurrency || user.currency) 
        : user.currency,
        });
      })
      .catch((error) => {
        setCreateLoading(false);
        console.error("=== 订单创建错误详情 ===");
        console.error("Error creating order:", error);
        console.error("错误状态码:", error.status);
        console.error("错误数据:", error.data);
        if (error.data && error.data.detail) {
          console.error("详细错误信息:", JSON.stringify(error.data.detail, null, 2));
        }
        console.error("请求的数据:", JSON.stringify(createOrderData, null, 2));
        console.error("========================");
        
        let errorMessage = "创建订单失败";
        if (error.status === 422) {
          errorMessage = "数据验证失败，请检查订单信息";
          if (error.data && error.data.detail) {
            console.log("422错误详情:", error.data.detail);
          }
        }
        
        Alert.alert("错误", errorMessage);
      });
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        <View style={styles.titleContainer}>
          <View style={styles.backIconContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <BackIcon size={20} />
            </TouchableOpacity>
          </View>
          <Text style={styles.titleHeading}>{t("payment.select_payment")}</Text>
        </View>
        <View style={styles.container}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF5100" />
            </View>
          ) : (
            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.mainContent}>
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeaderBottom}>
                    <View style={{ marginRight: 8 }}>
                      <PaymentMethodIcon size={20} color="#000" />
                    </View>
                    <Text style={styles.sectionTitleBottom}>
                      {t("order.preview.payment_method")}
                    </Text>
                  </View>

                  <View style={styles.tabsContainer}>
                    {tabs.map((tab) => (
                      <TouchableOpacity
                        key={tab.id}
                        style={[
                          styles.tabBottom,
                          currentTab === tab.id && styles.activeTab,
                        ]}
                        onPress={() => {
                          if (tab.id === "offline") {
                            navigation.navigate("OfflinePayment");
                          } else {
                            setCurrentTab(tab.id);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.tabText,
                            currentTab === tab.id && styles.activeTabText,
                          ]}
                        >
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.tabContent}>
                    {tabs
                      .find((tab) => tab.id === currentTab)
                      ?.options.map((option) => (
                        <PaymentMethodItem
                          key={option.id}
                          option={option}
                          isSelected={selectedPayment === option.id}
                          onSelect={() => onSelectPayment(option.id)}
                          selectedCurrency={selectedCurrency}
                          onSelectCurrency={onSelectCurrency}
                          exchangeRates={exchangeRates}
                          convertedAmount={convertedAmount}
                          isConverting={isConverting}
                          isPaypalExpanded={isPaypalExpanded}
                          isCreditCardExpanded={isCreditCardExpanded}
                          isCOD={isCOD}
                        />
                      ))}
                  </View>
                </View>
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader1}>
                    <Text style={styles.sectionIcon1}>
                      <PaymentIcon size={20} color="#000" />
                    </Text>
                    <Text style={styles.sectionTitle1}>
                      {t("payment.order_summary")}
                    </Text>
                  </View>
                  <View style={styles.setOrderContent}>
                    <Text style={styles.noCouponsMessage}>
                      {t("payment.product_total")}(
                      {previewOrder?.items?.length || 0} items)
                    </Text>
                    <TouchableOpacity onPress={toggleExpanded}>
                      <Text style={styles.sectionAction}>
                        {isPaypalExpanded
                          ? t("payment.hide_details")
                          : t("payment.view_details")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View
                    style={[
                      styles.orderItems,
                      isPaypalExpanded && styles.orderItemsExpanded,
                    ]}
                  >
                    {previewOrder?.items?.map((item) => (
                      <View key={item.sku_id} style={styles.orderItem}>
                        {item.sku_image_url ? (
                          <Image
                            source={{ uri: item.sku_image_url }}
                            style={styles.itemImage}
                          />
                        ) : (
                          <View style={styles.itemImagePlaceholder} />
                        )}
                        <View style={styles.itemDetails}>
                          <Text style={styles.itemName} numberOfLines={2}>
                            {item.product_name}
                          </Text>
                          {item.sku_attributes?.map((attribute) => (
                            <Text
                              style={styles.itemVariant}
                              key={attribute?.attribute_value}
                              numberOfLines={1}
                            >
                              {attribute?.attribute_name}:{" "}
                              {attribute?.attribute_value}
                            </Text>
                          ))}
                          <Text style={styles.itemQuantity}>
                            {t("payment.qty")}: {item.quantity}
                          </Text>
                        </View>
                        <View style={styles.itemPrices}>
                          <Text style={styles.itemPrice}>
                            ${item?.total_price}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.priceBox}>
                <View style={styles.priceBox1}>
                  <Text>{t("payment.product_total")}</Text>
                  <View>
                    <Text>
                      {selectedPayment === "paypal"
                        ? convertedAmount.find(
                            (item) => item.item_key === "total_amount"
                          )?.converted_amount || 0
                        : selectedPayment === "bank_card"
                        ? convertedAmount.find(
                            (item) => item.item_key === "total_amount"
                          )?.converted_amount || 0
                        : selectedPayment === "wave"
                        ? convertedAmount.find(
                            (item) => item.item_key === "total_amount"
                          )?.converted_amount || 0
                        : (selectedPayment === "mobile_money" || selectedPayment?.includes("mobile_money") || selectedPayment?.includes("Brainnel Pay")) && convertedAmount.length > 0
                        ? convertedAmount.find(
                            (item) => item.item_key === "total_amount"
                          )?.converted_amount || 0
                        : previewOrder?.total_amount || 0}{" "}
                      {selectedPayment === "paypal"
                        ? selectedCurrency === "USD"
                          ? "USD"
                          : "EUR"
                        : selectedPayment === "bank_card"
                        ? selectedCurrency === "USD"
                          ? "USD"
                          : "EUR"
                        : selectedPayment === "wave"
                        ? "FCFA"
                        : (selectedPayment === "mobile_money" || selectedPayment?.includes("mobile_money") || selectedPayment?.includes("Brainnel Pay")) && convertedAmount.length > 0
                        ? (userLocalCurrency || user.currency)
                        : previewOrder?.currency}
                    </Text>
                  </View>
                </View>
                <View style={styles.priceBox1}>
                  <Text>{t("order.shipping.domestic_fee")}</Text>
                  <View>
                    <Text>
                      {selectedPayment === "paypal"
                        ? convertedAmount.find(
                            (item) => item.item_key === "domestic_shipping_fee"
                          )?.converted_amount || 0
                        : selectedPayment === "bank_card"
                        ? convertedAmount.find(
                            (item) => item.item_key === "domestic_shipping_fee"
                          )?.converted_amount || 0
                        : selectedPayment === "wave"
                        ? convertedAmount.find(
                            (item) => item.item_key === "domestic_shipping_fee"
                          )?.converted_amount || 0
                        : (selectedPayment === "mobile_money" || selectedPayment?.includes("mobile_money") || selectedPayment?.includes("Brainnel Pay")) && convertedAmount.length > 0
                        ? convertedAmount.find(
                            (item) => item.item_key === "domestic_shipping_fee"
                          )?.converted_amount || 0
                        : orderData?.domestic_shipping_fee || 0}{" "}
                      {selectedPayment === "paypal"
                        ? selectedCurrency === "USD"
                          ? "USD"
                          : "EUR"
                        : selectedPayment === "bank_card"
                        ? selectedCurrency === "USD"
                          ? "USD"
                          : "EUR"
                        : selectedPayment === "wave"
                        ? "FCFA"
                        : (selectedPayment === "mobile_money" || selectedPayment?.includes("mobile_money") || selectedPayment?.includes("Brainnel Pay")) && convertedAmount.length > 0
                        ? (userLocalCurrency || user.currency)
                        : previewOrder?.currency}
                    </Text>
                  </View>
                </View>
                <View style={styles.priceBox1}>
                  <View style={styles.shippingLabelContainer}>
                    <Text style={styles.shippingLabel}>{t("payment.international_shipping")}</Text>
                  </View>
                  <View style={styles.shippingPriceContainer}>
                    <Text style={styles.shippingPriceText}>
                      {selectedPayment === "paypal"
                        ? getConvertedShippingFee().toFixed(2)
                        : selectedPayment === "bank_card"
                        ? getConvertedShippingFee().toFixed(2)
                        : selectedPayment === "wave"
                        ? getConvertedShippingFee().toFixed(2)
                        : (selectedPayment === "mobile_money" || selectedPayment?.includes("mobile_money") || selectedPayment?.includes("Brainnel Pay")) && convertedAmount.length > 0
                        ? getConvertedShippingFee().toFixed(2)
                        : getShippingFee().toFixed(2)}{" "}
                      {selectedPayment === "paypal"
                        ? selectedCurrency === "USD"
                          ? "USD"
                          : "EUR"
                        : selectedPayment === "bank_card"
                        ? selectedCurrency === "USD"
                          ? "USD"
                          : "EUR"
                        : selectedPayment === "wave"
                        ? "FCFA"
                        : (selectedPayment === "mobile_money" || selectedPayment?.includes("mobile_money") || selectedPayment?.includes("Brainnel Pay")) && convertedAmount.length > 0
                        ? (userLocalCurrency || user.currency)
                        : previewOrder?.currency}
                    </Text>
                    {isCOD && (
                      <View style={styles.cashOnDeliveryContainer}>
                        <Text style={styles.cashOnDeliveryText}>
                          {t("order.preview.Cash_on_delivery") || "货到付款"}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              {/* 实际支付金额 */}
              <View style={styles.actualPaymentBox}>
                <View style={styles.actualPaymentBox1}>
                  <Text
                    style={{
                      fontSize: fontSize(18),
                      fontWeight: "600",
                      color: "#000",
                    }}
                  >
                    {t("payment.total")}
                  </Text>
                  {selectedPayment === "paypal" && (
                      <View style={{ flexDirection: "row" }}>
                        <Text
                          style={{
                            fontSize: fontSize(18),
                            fontWeight: "600",
                            color: "#FF5100",
                          }}
                        >
                          {getConvertedTotalForCalculation().toFixed(2)}{" "}
                          {selectedCurrency === "USD" ? "USD" : "EUR"}
                        </Text>
                      </View>
                    )}
                  {selectedPayment === "bank_card" && (
                      <View style={{ flexDirection: "row" }}>
                        <Text
                          style={{
                            fontSize: fontSize(18),
                            fontWeight: "600",
                            color: "#FF5100",
                          }}
                        >
                          {getConvertedTotalForCalculation().toFixed(2)}{" "}
                          {selectedCurrency === "USD" ? "USD" : "EUR"}
                        </Text>
                      </View>
                    )}
                  {selectedPayment === "wave" && (
                    <View style={{ flexDirection: "row" }}>
                      <Text
                        style={{
                          fontSize: fontSize(18),
                          fontWeight: "600",
                          color: "#FF5100",
                        }}
                      >
                        {getConvertedTotalForCalculation().toFixed(2)}{" "}
                        FCFA
                      </Text>
                    </View>
                  )}
                  {selectedPayment !== "paypal" && selectedPayment !== "bank_card" && selectedPayment !== "wave" && (
                    <Text
                      style={{
                        fontSize: fontSize(18),
                        fontWeight: "600",
                        color: "#FF5100",
                      }}
                    >
                      {(selectedPayment === "mobile_money" || selectedPayment?.includes("mobile_money") || selectedPayment?.includes("Brainnel Pay")) && convertedAmount.length > 0
                        ? getConvertedTotalForCalculation().toFixed(2)
                        : originalTotalPrice.toFixed(2)}{" "}
                      {(selectedPayment === "mobile_money" || selectedPayment?.includes("mobile_money") || selectedPayment?.includes("Brainnel Pay")) && convertedAmount.length > 0
                        ? (userLocalCurrency || user.currency)
                        : previewOrder?.currency}
                    </Text>
                  )}
                </View>
              </View>
            </ScrollView>
          )}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedPayment || createLoading || isConverting || 
                 (selectedPayment === "paypal" && (convertedAmount.length === 0 || !convertedAmount.find(item => item.item_key === "total_amount"))) ||
                 (selectedPayment === "Bank Card Payment" && (convertedAmount.length === 0 || !convertedAmount.find(item => item.item_key === "total_amount"))) ||
                 (selectedPayment === "wave" && (convertedAmount.length === 0 || !convertedAmount.find(item => item.item_key === "total_amount"))) ||
                 ((selectedPayment === "mobile_money" || selectedPayment?.includes("mobile_money") || selectedPayment?.includes("Brainnel Pay")) && convertedAmount.length > 0 && !convertedAmount.find(item => item.item_key === "total_amount"))) &&
                  styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={!selectedPayment || createLoading || isConverting || 
                       (selectedPayment === "paypal" && (convertedAmount.length === 0 || !convertedAmount.find(item => item.item_key === "total_amount"))) ||
                       (selectedPayment === "Bank Card Payment" && (convertedAmount.length === 0 || !convertedAmount.find(item => item.item_key === "total_amount"))) ||
                       (selectedPayment === "wave" && (convertedAmount.length === 0 || !convertedAmount.find(item => item.item_key === "total_amount"))) ||
                       ((selectedPayment === "mobile_money" || selectedPayment?.includes("mobile_money") || selectedPayment?.includes("Brainnel Pay")) && convertedAmount.length > 0 && !convertedAmount.find(item => item.item_key === "total_amount"))}
            >
              {createLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : isConverting ? (
                <Text style={styles.submitButtonText}>
                  {t("payment.converting")}
                </Text>
              ) : (
                <Text style={styles.submitButtonText}>
                  {t("payment.submit_order")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {/* 自定义Alert弹窗 */}
        <Modal
          visible={alertModal.visible}
          transparent
          animationType="fade"
          onRequestClose={() => setAlertModal({ ...alertModal, visible: false })}
        >
          <View style={styles.alertOverlay}>
            <View style={styles.alertContainer}>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{alertModal.title}</Text>
                <Text style={styles.alertMessage}>{alertModal.message}</Text>
                
                <TouchableOpacity
                  style={styles.alertButton}
                  onPress={() => setAlertModal({ ...alertModal, visible: false })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.alertButtonText}>
                    {t("common.ok") || "OK"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};
