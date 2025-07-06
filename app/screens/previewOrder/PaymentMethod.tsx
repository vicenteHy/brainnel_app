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
import { logInitiateCheckoutEvent } from "../../services/facebook-events";
import { getOrderTransLanguage } from "../../utils/languageUtils";
import { PaymentMethodItem } from "./payment/PaymentMethodItem";
import { ShippingInsurance } from "../ShippingInsurance";
import { insuranceApi, InsuranceRateResponse } from "../../services/api/insuranceApi";
import { 
  PaymentMethodRouteParams,
  RootStackParamList,
  PaymentOption,
  PaymentTab,
  AlertModalState,
  ConvertedAmount 
} from "./payment/types";
import { styles } from "./payment/styles";
import {
  isUSDPayment,
  isWavePayment,
  isMobileMoneyPayment,
  isBalancePayment,
  isConvertiblePayment,
  getTargetCurrency,
  getConvertedAmountByKey,
  calculateConvertedTotal,
  performCurrencyConversion,
  shouldShowConvertedAmount,
  getDisplayAmount,
} from "./payment/utils";



export const PaymentMethod = () => {
  const { t } = useTranslation();
  const analyticsStore = useAnalyticsStore();
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
  const { items, orderData, setOrderData, resetOrder, cartData } = useCreateOrderStore();
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
  
  // 运费险状态
  const [isShippingInsuranceSelected, setIsShippingInsuranceSelected] = useState(true); // 默认勾选运费险
  const [shippingInsuranceRate, setShippingInsuranceRate] = useState(0.01); // 运费险费率
  const [insuranceRateLoading, setInsuranceRateLoading] = useState(false);
  
  // 组件卸载时清理状态
  useEffect(() => {
    return () => {
      // 清理转换金额状态
      setConvertedAmount([]);
      setHasInitializedCurrency(false);
    };
  }, []);

  // 页面访问统计
  useEffect(() => {
    const analyticsStore = useAnalyticsStore.getState();
    analyticsStore.logPageView('payment_method', 'cart');
    
    return () => {
      analyticsStore.logPageLeave('payment_method');
    };
  }, []);

  // 自定义弹窗状态
  const [alertModal, setAlertModal] = useState<AlertModalState>({
    visible: false,
    title: '',
    message: ''
  });

  // Get isCOD parameter from route
  const isCOD = route.params?.isCOD || 0;
  

  // State to store the original total price (fixed, won't change)
  const [originalTotalPrice, setOriginalTotalPrice] = useState(0);

  // Helper function to get shipping fee - always return actual fee for display
  const getShippingFee = () => {
    return orderData?.shipping_fee || 0;
  };

  // Helper function to get converted shipping fee - always return actual converted fee for display
  const getConvertedShippingFee = () => {
    return getConvertedAmountByKey(convertedAmount, "shipping_fee");
  };

  // Helper function to get shipping fee for calculation (always return actual fee)
  const getShippingFeeForCalculation = () => {
    return orderData?.shipping_fee || 0;
  };

  // Helper function to get converted shipping fee for calculation (always return actual converted fee)
  const getConvertedShippingFeeForCalculation = () => {
    return getConvertedAmountByKey(convertedAmount, "shipping_fee");
  };

  // Helper function to get converted total amount for calculation (excluding shipping fee if isCOD is 1)
  const getConvertedTotalForCalculation = () => {
    let result = calculateConvertedTotal(convertedAmount, isCOD);
    
    // 如果选择了运费险，计算运费险费用
    if (isShippingInsuranceSelected) {
      const insuranceFee = result * shippingInsuranceRate;
      const displayCurrency = getDisplayCurrency();
      
      // 根据货币类型格式化运费险金额
      let formattedInsuranceFee;
      if (selectedPayment && (isMobileMoneyPayment(selectedPayment) || isWavePayment(selectedPayment) || isBalancePayment(selectedPayment)) || displayCurrency === 'FCFA') {
        // 本地货币四舍五入取整数
        formattedInsuranceFee = Math.round(insuranceFee);
      } else {
        // 美金、欧元等保留两位小数
        formattedInsuranceFee = Number(insuranceFee.toFixed(2));
      }
      
      result = Number((result + formattedInsuranceFee).toFixed(2));
    }
    
    return result;
  };

  // Helper function to get total amount for calculation (excluding shipping fee if isCOD is 1)
  const getTotalForCalculation = () => {
    let result;
    if (isCOD === 1) {
      // 不计入国际运费
      result = Number(
        (
          (previewOrder?.total_amount || 0) +
          (orderData?.domestic_shipping_fee || 0)
        ).toFixed(2)
      );
    } else {
      result = Number(
        (
          (previewOrder?.total_amount || 0) +
          (orderData?.domestic_shipping_fee || 0) +
          getShippingFeeForCalculation()
        ).toFixed(2)
      );
    }
    
    // 如果选择了运费险，计算运费险费用
    if (isShippingInsuranceSelected) {
      const insuranceFee = result * shippingInsuranceRate;
      const displayCurrency = getDisplayCurrency();
      
      // 根据货币类型格式化运费险金额
      let formattedInsuranceFee;
      if (selectedPayment && (isMobileMoneyPayment(selectedPayment) || isWavePayment(selectedPayment) || isBalancePayment(selectedPayment)) || displayCurrency === 'FCFA') {
        // 本地货币四舍五入取整数
        formattedInsuranceFee = Math.round(insuranceFee);
      } else {
        // 美金、欧元等保留两位小数
        formattedInsuranceFee = Number(insuranceFee.toFixed(2));
      }
      
      result = Number((result + formattedInsuranceFee).toFixed(2));
    }
    
    return result;
  };

  // Helper function to get the current display currency
  const getDisplayCurrency = () => {
    let currency;
    if (!selectedPayment) {
      currency = previewOrder?.currency || user.currency;
    } else if (shouldShowConvertedAmount(selectedPayment, convertedAmount)) {
      currency = getTargetCurrency(selectedPayment, selectedCurrency, userLocalCurrency, user.currency);
    } else {
      currency = previewOrder?.currency || user.currency;
    }
    
    
    return currency;
  };

  // Helper function to get currency symbol
  const getCurrencySymbol = (currency: string) => {
    // 不需要货币符号，因为后面会显示货币代码
    return "";
  };

  // Helper function to get converted item price
  const getConvertedItemPrice = (item: any) => {
    // 对于订单详情进入的情况，直接使用商品的total_price
    if (route.params?.orderData) {
      const originalItemPrice = item.total_price || 0;
      
      // 如果需要货币转换
      if (selectedPayment && shouldShowConvertedAmount(selectedPayment, convertedAmount)) {
        // 对于订单详情，基于商品总价计算转换比例
        const totalConvertedAmount = getConvertedAmountByKey(convertedAmount, "total_amount");
        const originalProductTotal = previewOrder?.items?.reduce((sum: number, i: any) => sum + (i.total_price || 0), 0) || 0;
        
        if (originalProductTotal > 0 && totalConvertedAmount > 0) {
          const conversionRate = totalConvertedAmount / originalProductTotal;
          const convertedItemPrice = originalItemPrice * conversionRate;
          
          // 本地货币支付方式只显示整数
          if (isMobileMoneyPayment(selectedPayment) || isWavePayment(selectedPayment) || isBalancePayment(selectedPayment)) {
            return Math.round(convertedItemPrice).toString();
          }
          return convertedItemPrice.toFixed(2);
        }
      }
      
      return originalItemPrice.toFixed(2);
    }
    
    // 正常下单流程
    if (selectedPayment && shouldShowConvertedAmount(selectedPayment, convertedAmount)) {
      const totalConvertedAmount = getConvertedAmountByKey(convertedAmount, "total_amount");
      const totalQuantity = getSelectedCartItems().reduce((sum, i) => sum + i.quantity, 0);
      if (totalQuantity > 0) {
        // Calculate the item's proportion of the total based on its value
        const itemProportion = item.total_price / (previewOrder?.total_amount || 1);
        const convertedPrice = totalConvertedAmount * itemProportion;
        
        // 本地货币支付方式只显示整数
        if (isMobileMoneyPayment(selectedPayment) || isWavePayment(selectedPayment) || isBalancePayment(selectedPayment)) {
          return Math.round(convertedPrice).toString();
        }
        return convertedPrice.toFixed(2);
      }
    }
    return item?.total_price?.toFixed(2) || "0.00";
  };

  const toggleExpanded = () => {
    setIsPaypalExpanded(!isPaypalExpanded);
  };

  // Helper function to get actual product total for currency conversion
  const getActualProductTotalForConversion = () => {
    // 对于订单详情进入的情况，使用实际的商品总价
    if (route.params?.orderData && previewOrder?.items) {
      const productTotal = previewOrder.items.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);

      return productTotal;
    }
    // 正常下单流程使用原来的逻辑
    const normalTotal = previewOrder?.total_amount || 0;

    return normalTotal;
  };

  const handleInitialPaymentSelection = async (paymentId: string) => {
    // Handle initial currency conversion for default selected payment method
    if (!isConvertiblePayment(paymentId)) {
      return;
    }

    // Set expansion state based on payment type
    let initialSelectedCurrency = selectedCurrency;
    if (isUSDPayment(paymentId)) {
      if (paymentId === "paypal") {
        setIsPaypalExpanded(true);
      } else if (paymentId === "bank_card") {
        setIsCreditCardExpanded(true);
      }
      initialSelectedCurrency = "USD";
      setSelectedCurrency("USD");
    } else if (isWavePayment(paymentId)) {
      initialSelectedCurrency = userLocalCurrency || "FCFA";
      setSelectedCurrency(initialSelectedCurrency);
    } else if (isMobileMoneyPayment(paymentId)) {
      // Mobile Money 应该使用本地货币
      initialSelectedCurrency = userLocalCurrency || user.currency;
      setSelectedCurrency(initialSelectedCurrency);
    }

    // Perform currency conversion
    setIsConverting(true);
    
    // 使用新的 selectedCurrency 值，而不是旧的 state 值
    const targetCurrency = getTargetCurrency(paymentId, initialSelectedCurrency, userLocalCurrency, user.currency);
    // 统一使用订单货币作为源货币，如果没有订单货币则默认使用 USD
    const sourceCurrency = previewOrder?.currency || 'USD';

    try {
      const convertedAmounts = await performCurrencyConversion(
        sourceCurrency,
        targetCurrency,
        {
          total_amount: getActualProductTotalForConversion(),
          domestic_shipping_fee: createOrderData?.domestic_shipping_fee || orderData?.domestic_shipping_fee || (previewOrder as any)?.domestic_shipping_fee || 0,
          shipping_fee: createOrderData?.shipping_fee || orderData?.shipping_fee || (previewOrder as any)?.shipping_fee || 0,
        }
      );
      
      setConvertedAmount(convertedAmounts);
      setIsConverting(false);
    } catch (error) {
      setIsConverting(false);
    }
  };

  const onSelectPayment = async (paymentId: string) => {
    if (paymentId === selectedPayment) {
      // If clicking on already selected payment, toggle expansion
      if (paymentId === "paypal") {
        setIsPaypalExpanded(!isPaypalExpanded);
      } else if (paymentId === "bank_card") {
        setIsCreditCardExpanded(!isCreditCardExpanded);
      }
      return;
    }

    setSelectedPayment(paymentId);

    // Reset expansion states
    setIsPaypalExpanded(false);
    setIsCreditCardExpanded(false);

    // Handle expansion and currency setting based on payment type
    let newSelectedCurrency = selectedCurrency;
    if (isUSDPayment(paymentId)) {
      if (paymentId === "paypal") {
        setIsPaypalExpanded(true);
      } else if (paymentId === "bank_card") {
        setIsCreditCardExpanded(true);
      }
      newSelectedCurrency = "USD";
      setSelectedCurrency("USD");
    } else if (isWavePayment(paymentId)) {
      newSelectedCurrency = userLocalCurrency || "FCFA";
      setSelectedCurrency(newSelectedCurrency);
    }

    // Perform currency conversion for convertible payment methods
    if (isConvertiblePayment(paymentId)) {
      setIsConverting(true);
      
      // 使用新的 selectedCurrency 值，而不是旧的 state 值
      const targetCurrency = getTargetCurrency(paymentId, newSelectedCurrency, userLocalCurrency, user.currency);
      // 统一使用订单货币作为源货币，如果没有订单货币则默认使用 USD
      const sourceCurrency = previewOrder?.currency || 'USD';

      try {
        const convertedAmounts = await performCurrencyConversion(
          sourceCurrency,
          targetCurrency,
          {
            total_amount: getActualProductTotalForConversion(),
            domestic_shipping_fee: createOrderData?.domestic_shipping_fee || orderData?.domestic_shipping_fee || (previewOrder as any)?.domestic_shipping_fee || 0,
            shipping_fee: createOrderData?.shipping_fee || orderData?.shipping_fee || (previewOrder as any)?.shipping_fee || 0,
          }
        );
        
        setConvertedAmount(convertedAmounts);
        setIsConverting(false);
      } catch (error) {
        setIsConverting(false);
      }
    }
  };

  const onSelectCurrency = async (currency: string) => {
    setSelectedCurrency(currency);
    setIsConverting(true);
    
    try {
      // 统一使用订单货币作为源货币，如果没有订单货币则默认使用 USD
      const sourceCurrency = previewOrder?.currency || 'USD';
      
      const convertedAmounts = await performCurrencyConversion(
        sourceCurrency,
        currency,
        {
          total_amount: getActualProductTotalForConversion(),
          domestic_shipping_fee: createOrderData?.domestic_shipping_fee || orderData?.domestic_shipping_fee || (previewOrder as any)?.domestic_shipping_fee || 0,
          shipping_fee: createOrderData?.shipping_fee || orderData?.shipping_fee || (previewOrder as any)?.shipping_fee || 0,
        }
      );
      
      setConvertedAmount(convertedAmounts);
      setIsConverting(false);
    } catch (error) {
      setIsConverting(false);
    }
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
    // 重置关键状态，确保每次进入页面都从干净的状态开始
    setConvertedAmount([]);
    setHasInitializedCurrency(false);
    setIsConverting(false);
    
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

  // 获取运费险费率
  const getInsuranceRate = async (currency: string) => {
    try {
      setInsuranceRateLoading(true);
      const response = await insuranceApi.getInsuranceRate(currency);
      
      if (response.success) {
        setShippingInsuranceRate(response.data.rate);
      } else {
        setShippingInsuranceRate(response.data.rate);
      }
    } catch (error) {
      console.error("获取运费险费率失败:", error);
    } finally {
      setInsuranceRateLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    
    // 检查是否从OrderDetails传递了订单数据
    if (route.params?.orderData) {
      const existingOrder = route.params.orderData;
      
      
      // 将已存在的订单数据转换为PaymentMethod页面期望的格式
      const previewOrderData = {
        total_amount: existingOrder.total_amount || 0,
        currency: existingOrder.currency || 'USD',
        address: existingOrder.receiver_address || '',
        shipping_fee: existingOrder.shipping_fee || 0,
        shipping_fee_sea: existingOrder.shipping_fee || 0,
        shipping_fee_air: existingOrder.shipping_fee || 0,
        shipping_fee_sea_time: 0,
        shipping_fee_air_time: 0,
        discount_amount: 0,
        actual_amount: existingOrder.actual_amount || existingOrder.total_amount || 0,
        order_id: existingOrder.order_id || '',
        domestic_shipping_fee: existingOrder.domestic_shipping_fee || 0,
        items: existingOrder.items?.map((item: any) => ({
          offer_id: item.offer_id,
          cart_item_id: item.cart_item_id || 0,
          sku_id: item.sku_id,
          product_name: getOrderTransLanguage(item),
          product_name_en: item.product_name_en || '',
          product_name_ar: item.product_name_ar || '',
          product_name_fr: item.product_name_fr || '',
          attributes: item.sku_attributes?.map((attr: any) => ({
            attribute_name: attr.attribute_name,
            attribute_name_trans: attr.attribute_name_trans,
            value: attr.attribute_value,
            value_trans: attr.attribute_value_trans,
          })) || [],
          sku_image_url: item.sku_image || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })) || []
      };
      
      
      setPreviewOrder(previewOrderData);
      
      // 设置创建订单数据
      const createOrderDataFormatted = {
        address_id: existingOrder.address_id || 0,
        domestic_shipping_fee: existingOrder.domestic_shipping_fee || 0,
        shipping_fee: existingOrder.shipping_fee || 0,
        shipping_type: existingOrder.shipping_type || 0, // 修改字段名
        currency: existingOrder.currency || 'USD',
        total_amount: existingOrder.total_amount || 0,
        actual_amount: existingOrder.actual_amount || existingOrder.total_amount || 0,
        items: existingOrder.items || [],
        receiver_address: existingOrder.receiver_address || '',
        payment_method: '',
        create_payment: true,
        buyer_message: '',
        discount_amount: 0,
      };
      
      setCreateOrderData(createOrderDataFormatted);
      
      // 设置orderData用于页面显示
      const orderDataFormatted = {
        address_id: existingOrder.address_id || 0,
        domestic_shipping_fee: existingOrder.domestic_shipping_fee || 0,
        shipping_fee: existingOrder.shipping_fee || 0,
        shipping_type: existingOrder.shipping_type || 0, // 修改字段名
      };
      
      setOrderData(orderDataFormatted);
      setLoading(false);
    } else if (route.params?.freight_forwarder_address_id) {
      // 原有的新订单创建逻辑
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
    } else {
      setLoading(false);
    }
  }, [route.params?.freight_forwarder_address_id, route.params?.orderData]);

  useEffect(() => {
    setCreateOrderData({
      ...orderData,
      address_id: orderData.address_id,
      domestic_shipping_fee: orderData.domestic_shipping_fee,
      shipping_fee: orderData.shipping_fee,
      shipping_type: orderData.shipping_type, // 修改字段名
      currency: user.currency,
    });
  }, [orderData]);

  // Trigger initial currency conversion when all data is loaded
  useEffect(() => {
    // 对于需要本地货币的支付方式，必须等待 userLocalCurrency 加载完成
    const needsLocalCurrency = selectedPayment && (
      isMobileMoneyPayment(selectedPayment) || 
      isWavePayment(selectedPayment) || 
      isBalancePayment(selectedPayment)
    );
    
    const canInitialize = selectedPayment && 
      previewOrder && 
      createOrderData && 
      !hasInitializedCurrency &&
      (!needsLocalCurrency || userLocalCurrency); // 如果需要本地货币，必须等待它加载
    
    if (canInitialize) {
      handleInitialPaymentSelection(selectedPayment);
      setHasInitializedCurrency(true);
      
      // 获取运费险费率
      const displayCurrency = getDisplayCurrency();
      getInsuranceRate(displayCurrency);
    }
  }, [selectedPayment, previewOrder, createOrderData, userLocalCurrency, hasInitializedCurrency]);

  // 当显示货币变化时，重新获取运费险费率
  useEffect(() => {
    if (selectedPayment && previewOrder) {
      const displayCurrency = getDisplayCurrency();
      getInsuranceRate(displayCurrency);
    }
  }, [selectedPayment, selectedCurrency, userLocalCurrency]);

  // 当用户本地货币设置后，如果当前选择的是mobile money，重新进行货币转换
  // 注释掉这个 useEffect，因为它可能导致重复的货币转换
  // 现在统一由上面的 useEffect 处理
  /*
  useEffect(() => {
    if (userLocalCurrency && selectedPayment && isMobileMoneyPayment(selectedPayment) && previewOrder && createOrderData) {
      setIsConverting(true);

      performCurrencyConversion(
        previewOrder.currency || "USD",
        userLocalCurrency,
        {
          total_amount: getActualProductTotalForConversion(),
          domestic_shipping_fee: createOrderData.domestic_shipping_fee || (previewOrder as any)?.domestic_shipping_fee || 0,
          shipping_fee: createOrderData.shipping_fee || (previewOrder as any)?.shipping_fee || 0,
        }
      ).then((convertedAmounts) => {
        setConvertedAmount(convertedAmounts);
        setIsConverting(false);
      }).catch((error) => {
        setIsConverting(false);
      });
    }
  }, [userLocalCurrency]);
  */

  // Helper function to get selected cart items for display
  const getSelectedCartItems = () => {
    // 对于订单详情进入的情况，直接使用 previewOrder.items
    if (route.params?.orderData && previewOrder?.items) {
      return previewOrder.items.map((item: any) => ({
        offer_id: item.offer_id,
        sku_id: item.sku_id,
        product_name: item.product_name,
        sku_image_url: item.sku_image_url,
        // 将订单详情的 attributes 映射为期望的 sku_attributes 格式
        sku_attributes: (item.attributes || []).map((attr: any) => ({
          attribute_name: attr.attribute_name,
          attribute_name_trans: attr.attribute_name_trans || attr.attribute_name,
          value: attr.value,
          value_trans: attr.value_trans || attr.value,
        })),
        quantity: item.quantity,
        total_price: item.total_price,
      }));
    }
    
    // 正常购物车流程
    const selectedItems: any[] = [];
    cartData.forEach((cartItem) => {
      cartItem.skus.forEach((sku) => {
        if (sku.selected === 1) {
          selectedItems.push({
            offer_id: cartItem.offer_id,
            sku_id: sku.sku_id,
            product_name: cartItem.subject_trans || cartItem.subject,
            sku_image_url: sku.attributes[0]?.sku_image_url || cartItem.product_image,
            sku_attributes: sku.attributes,
            quantity: sku.quantity,
            total_price: sku.price * sku.quantity,
          });
        }
      });
    });
    return selectedItems;
  };

  // Helper function to get product total price (sum of all item total_price)
  const getProductTotalPrice = () => {
    return getSelectedCartItems().reduce((sum, item) => sum + item.total_price, 0);
  };

  // Helper function to get converted product total price
  const getConvertedProductTotalPrice = () => {
    // 对于订单详情进入的情况，直接使用商品的total_price相加
    if (route.params?.orderData && previewOrder?.items) {
      const originalProductTotal = previewOrder.items.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);
      
      // 如果需要货币转换
      if (selectedPayment && shouldShowConvertedAmount(selectedPayment, convertedAmount)) {
        // 对于订单详情进入，直接返回转换后的商品总价
        const totalConvertedAmount = getConvertedAmountByKey(convertedAmount, "total_amount");
        return totalConvertedAmount;
      }
      
      return originalProductTotal;
    }
    
    // 正常下单流程
    if (selectedPayment && shouldShowConvertedAmount(selectedPayment, convertedAmount)) {
      return getConvertedAmountByKey(convertedAmount, "total_amount");
    }
    return getProductTotalPrice();
  };
  
  // Helper function to format amount based on payment method
  const formatAmount = (amount: number, includeDecimals: boolean = true) => {
    // 本地货币支付方式只显示整数
    if (selectedPayment && (isMobileMoneyPayment(selectedPayment) || isWavePayment(selectedPayment) || isBalancePayment(selectedPayment))) {
      return Math.round(amount).toString();
    }
    return includeDecimals ? amount.toFixed(2) : amount.toString();
  };
  
  // Helper function to format display amount
  const formatDisplayAmount = (paymentMethod: string, convertedAmount: ConvertedAmount[], originalAmount: number, amountKey?: string) => {
    const amount = getDisplayAmount(paymentMethod, convertedAmount, originalAmount, amountKey);
    return formatAmount(amount);
  };

  // Set original total price when both previewOrder and orderData are available
  useEffect(() => {
    if (previewOrder && orderData && originalTotalPrice === 0) {
      let originalTotal = 
        (previewOrder.total_amount || 0) + 
        (orderData.domestic_shipping_fee || 0) + 
        (isCOD === 1 ? 0 : (orderData.shipping_fee || 0));
      
      // 如果选择了运费险，加入运费险费用
      if (isShippingInsuranceSelected) {
        const insuranceFee = originalTotal * shippingInsuranceRate;
        const displayCurrency = getDisplayCurrency();
        
        // 根据货币类型格式化运费险金额
        let formattedInsuranceFee;
        if (selectedPayment && (isMobileMoneyPayment(selectedPayment) || isWavePayment(selectedPayment) || isBalancePayment(selectedPayment)) || displayCurrency === 'FCFA') {
          // 本地货币四舍五入取整数
          formattedInsuranceFee = Math.round(insuranceFee);
        } else {
          // 美金、欧元等保留两位小数
          formattedInsuranceFee = Number(insuranceFee.toFixed(2));
        }
        
        originalTotal = Number((originalTotal + formattedInsuranceFee).toFixed(2));
      }
      
      setOriginalTotalPrice(originalTotal);
    }
  }, [previewOrder, orderData, originalTotalPrice, isCOD, isShippingInsuranceSelected, shippingInsuranceRate]);

  // 当运费险选择状态改变时，重新计算原始总价
  useEffect(() => {
    if (previewOrder && orderData) {
      let originalTotal = 
        (previewOrder.total_amount || 0) + 
        (orderData.domestic_shipping_fee || 0) + 
        (isCOD === 1 ? 0 : (orderData.shipping_fee || 0));
      
      // 如果选择了运费险，加入运费险费用
      if (isShippingInsuranceSelected) {
        const insuranceFee = originalTotal * shippingInsuranceRate;
        const displayCurrency = getDisplayCurrency();
        
        // 根据货币类型格式化运费险金额
        let formattedInsuranceFee;
        if (selectedPayment && (isMobileMoneyPayment(selectedPayment) || isWavePayment(selectedPayment) || isBalancePayment(selectedPayment)) || displayCurrency === 'FCFA') {
          // 本地货币四舍五入取整数
          formattedInsuranceFee = Math.round(insuranceFee);
        } else {
          // 美金、欧元等保留两位小数
          formattedInsuranceFee = Number(insuranceFee.toFixed(2));
        }
        
        originalTotal = Number((originalTotal + formattedInsuranceFee).toFixed(2));
      }
      
      setOriginalTotalPrice(originalTotal);
    }
  }, [isShippingInsuranceSelected, shippingInsuranceRate]);

  const handleSubmit = async () => {
    if (!selectedPayment) {
      Alert.alert(t("payment.select_payment"));
      return;
    }
    
    // 只有在从购物车进入（创建新订单）时才检查购物车数据
    if (!(route.params?.orderId && route.params?.orderData)) {
      if (!cartData || cartData.length === 0) {
        Alert.alert("错误", "购物车数据不存在，请重新从购物车进入");
        return;
      }
    }
    
    // 检查余额支付时余额是否充足
    
    if (isBalancePayment(selectedPayment)) {
      const totalAmount = getTotalForCalculation();
      
      // 直接使用数字比较，因为从日志看user.balance已经是数字
      const userBalance = typeof user.balance === 'number' ? user.balance : parseFloat(String(user.balance));
      
      if (isNaN(userBalance) || isNaN(totalAmount)) {
        return;
      }
      
      if (userBalance < totalAmount) {
        setAlertModal({
          visible: true,
          title: t("payment.insufficient_balance") || "余额不足",
          message: t("payment.insufficient_balance_message") || `当前余额: ${formatAmount(userBalance)}${user.currency}\n需要支付: ${formatAmount(totalAmount)}${user.currency}\n请选择其他支付方式或先充值。`
        });
        return;
      }
    }
    // 检查是否是从OrderDetails跳转过来的（已存在订单）还是创建新订单
    if (!(route.params?.orderId && route.params?.orderData)) {
      // 创建新订单：从购物车数据构建订单商品信息，包含正确的翻译字段
      const items = [];
      cartData.forEach((cartItem) => {
        cartItem.skus.forEach((sku) => {
          if (sku.selected === 1) {
            // 计算换算后的单价和总价
            let convertedUnitPrice = sku.price;
            let convertedTotalPrice = sku.price * sku.quantity;
            
            // 如果是需要货币转换的支付方式且有转换数据
            if (isConvertiblePayment(selectedPayment) && convertedAmount.length > 0) {
              // 获取商品总额的转换比例
              const totalConvertedAmount = getConvertedAmountByKey(convertedAmount, "total_amount");
              const originalTotalAmount = previewOrder?.total_amount || 0;
              
              if (originalTotalAmount > 0) {
                const conversionRate = totalConvertedAmount / originalTotalAmount;
                convertedUnitPrice = Number((sku.price * conversionRate).toFixed(2));
                convertedTotalPrice = Number((sku.price * sku.quantity * conversionRate).toFixed(2));
              }
            }
            
            items.push({
              offer_id: String(cartItem.offer_id),
              cart_item_id: sku.cart_item_id,
              sku_id: String(sku.sku_id),
              product_name: cartItem.subject_trans || cartItem.subject, // 使用翻译字段
              product_name_en: cartItem.subject_trans_en || '',
              product_name_ar: cartItem.subject_trans_ar || '',
              product_name_fr: cartItem.subject_trans || cartItem.subject, // subject_trans是法语
              sku_attributes: sku.attributes.map((attr) => ({
                attribute_name: attr.attribute_name,
                attribute_name_trans: attr.attribute_name_trans,
                attribute_name_trans_en: attr.attribute_name_trans_en,
                attribute_name_trans_ar: attr.attribute_name_trans_ar,
                attribute_value: attr.value,
                attribute_value_trans: attr.value_trans,
                attribute_value_trans_en: attr.value_trans_en,
                attribute_value_trans_ar: attr.value_trans_ar,
              })),
              sku_image: sku.attributes[0]?.sku_image_url || cartItem.product_image,
              quantity: sku.quantity,
              unit_price: convertedUnitPrice,
              total_price: convertedTotalPrice,
            });
          }
        });
      });
      
      if (createOrderData) {
      createOrderData.items = items;
      createOrderData.payment_method = selectedPayment;
      createOrderData.total_amount = shouldShowConvertedAmount(selectedPayment, convertedAmount)
        ? getConvertedTotalForCalculation()
        : getTotalForCalculation();
      createOrderData.actual_amount = shouldShowConvertedAmount(selectedPayment, convertedAmount)
        ? getConvertedTotalForCalculation()
        : getTotalForCalculation();
      createOrderData.currency = getTargetCurrency(selectedPayment, selectedCurrency, userLocalCurrency, user.currency);
      createOrderData.domestic_shipping_fee = shouldShowConvertedAmount(selectedPayment, convertedAmount)
        ? getConvertedAmountByKey(convertedAmount, "domestic_shipping_fee")
        : orderData?.domestic_shipping_fee || 0;
      createOrderData.shipping_fee = shouldShowConvertedAmount(selectedPayment, convertedAmount)
        ? getConvertedShippingFeeForCalculation()
        : getShippingFeeForCalculation();
      // 添加is_cod参数
      createOrderData.is_cod = isCOD;
      // 添加运费险参数
      createOrderData.is_protection = isShippingInsuranceSelected ? 1 : 0;
      
      // 计算运费险金额（基础金额不含运费险费用）
      let baseAmountWithoutInsurance;
      if (isCOD === 1) {
        // COD情况：不计入国际运费
        baseAmountWithoutInsurance = shouldShowConvertedAmount(selectedPayment, convertedAmount)
          ? (getConvertedAmountByKey(convertedAmount, "total_amount") + getConvertedAmountByKey(convertedAmount, "domestic_shipping_fee"))
          : ((previewOrder?.total_amount || 0) + (orderData?.domestic_shipping_fee || 0));
      } else {
        // 非COD情况：包含所有费用
        baseAmountWithoutInsurance = shouldShowConvertedAmount(selectedPayment, convertedAmount)
          ? (getConvertedAmountByKey(convertedAmount, "total_amount") + getConvertedAmountByKey(convertedAmount, "domestic_shipping_fee") + getConvertedShippingFeeForCalculation())
          : ((previewOrder?.total_amount || 0) + (orderData?.domestic_shipping_fee || 0) + getShippingFeeForCalculation());
      }
      
      // 运费险金额 = 基础金额（不含运费险）* 费率
      if (isShippingInsuranceSelected) {
        const insuranceAmount = baseAmountWithoutInsurance * shippingInsuranceRate;
        const targetCurrency = getTargetCurrency(selectedPayment, selectedCurrency, userLocalCurrency, user.currency);
        
        // 根据货币类型格式化运费险金额
        if (isMobileMoneyPayment(selectedPayment) || isWavePayment(selectedPayment) || isBalancePayment(selectedPayment) || targetCurrency === 'FCFA') {
          // 本地货币（FCFA等）四舍五入取整数
          createOrderData.protection_amount = Math.round(insuranceAmount);
        } else {
          // 美金、欧元等保留两位小数
          createOrderData.protection_amount = Number(insuranceAmount.toFixed(2));
        }
      } else {
        createOrderData.protection_amount = 0;
      }
      
    }
    setOrderData(createOrderData || {});

    setCreateLoading(true);

    // 原有的创建新订单逻辑
    ordersApi
      .createOrder(createOrderData as unknown as CreateOrderRequest)
      .then((res) => {
        
        setCreateLoading(false);
        
        // 准备结账事件数据
        const checkoutEventData = {
          pay_method: selectedPayment,
          offline_payment: currentTab === "offline" ? 1 : 0,
          total_price: createOrderData.total_amount,
          total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
          currency: createOrderData.currency,
          sku_details: items.map(item => ({
            sku_id: item.sku_id,
            price: item.unit_price,
            quantity: item.quantity,
            sku_img: item.sku_image_url
          })),
          shipping_fee: createOrderData.shipping_fee || 0,
          domestic_shipping_fee: createOrderData.domestic_shipping_fee || 0
        };
        
        analyticsStore.logInitiateCheckout(checkoutEventData, "payment");
        
        // 记录 Facebook InitiateCheckout 事件
        logInitiateCheckoutEvent(
          {
            orderId: res.order_id, // 新创建的订单ID
            totalPrice: createOrderData.total_amount,
            totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
            currency: createOrderData.currency,
            offlinePayment: currentTab === "offline",
            shippingFee: createOrderData.shipping_fee || 0,
            domesticShippingFee: createOrderData.domestic_shipping_fee || 0
          },
          checkoutEventData.sku_details,
          selectedPayment
        );
        
        // go to payment preview
        navigation.navigate("PreviewOrder", {
          data: res,
          payMethod: selectedPayment,
          currency: getTargetCurrency(selectedPayment, selectedCurrency, userLocalCurrency, user.currency),
        });
      })
      .catch((error) => {
        setCreateLoading(false);
        console.error("=== 创建订单失败 ===");
        console.error("错误详情:", error);
        
        let errorMessage = "创建订单失败";
        if (error.status === 422) {
          errorMessage = "数据验证失败，请检查订单信息";
        }
        
        Alert.alert("错误", errorMessage);
      });
    
    } else {
      // 更新现有订单的支付方式
      
      // 准备更新的商品价格数据
      const updatedItems = route.params.orderData.items?.map((item: any, index: number) => {
        let convertedUnitPrice = item.unit_price;
        let convertedTotalPrice = item.total_price;
        
        // 如果是需要货币转换的支付方式且有转换数据
        if (isConvertiblePayment(selectedPayment) && convertedAmount.length > 0) {
          // 获取商品总额的转换比例
          const totalConvertedAmount = getConvertedAmountByKey(convertedAmount, "total_amount");
          const originalTotalAmount = previewOrder?.total_amount || 0;
          
          if (originalTotalAmount > 0) {
            const conversionRate = totalConvertedAmount / originalTotalAmount;
            
            convertedUnitPrice = Number((item.unit_price * conversionRate).toFixed(2));
            convertedTotalPrice = Number((item.total_price * conversionRate).toFixed(2));
          }
        }
        
        return {
          order_item_id: item.order_item_id,
          unit_price: convertedUnitPrice,
          total_price: convertedTotalPrice,
        };
      }) || [];

      const targetCurrency = getTargetCurrency(selectedPayment, selectedCurrency, userLocalCurrency, user.currency);
      const shouldShowConverted = shouldShowConvertedAmount(selectedPayment, convertedAmount);
      
      
      // 计算运费险参数
      
      const is_protection = isShippingInsuranceSelected ? 1 : 0;
      let protection_amount = 0;
      
      if (isShippingInsuranceSelected) {
        // 计算基础金额（不含运费险）
        let baseAmountWithoutInsurance;
        if (isCOD === 1) {
          // COD情况：不计入国际运费
          baseAmountWithoutInsurance = shouldShowConverted
            ? (getConvertedAmountByKey(convertedAmount, "total_amount") + getConvertedAmountByKey(convertedAmount, "domestic_shipping_fee"))
            : ((previewOrder?.total_amount || 0) + (route.params.orderData.domestic_shipping_fee || 0));
        } else {
          // 非COD情况：包含所有费用
          baseAmountWithoutInsurance = shouldShowConverted
            ? (getConvertedAmountByKey(convertedAmount, "total_amount") + getConvertedAmountByKey(convertedAmount, "domestic_shipping_fee") + getConvertedShippingFeeForCalculation())
            : ((previewOrder?.total_amount || 0) + (route.params.orderData.domestic_shipping_fee || 0) + getShippingFeeForCalculation());
        }
        
        const insuranceAmount = baseAmountWithoutInsurance * shippingInsuranceRate;
        
        // 根据货币类型格式化运费险金额
        if (isMobileMoneyPayment(selectedPayment) || isWavePayment(selectedPayment) || isBalancePayment(selectedPayment) || targetCurrency === 'FCFA') {
          // 本地货币（FCFA等）四舍五入取整数
          protection_amount = Math.round(insuranceAmount);
        } else {
          // 美金、欧元等保留两位小数
          protection_amount = Number(insuranceAmount.toFixed(2));
        }
      }
      

      const paymentData = {
        order_id: route.params.orderId,
        payment_method: selectedPayment,
        currency: targetCurrency,
        total_amount: shouldShowConverted
          ? getConvertedTotalForCalculation()
          : getTotalForCalculation(),
        actual_amount: shouldShowConverted
          ? getConvertedTotalForCalculation()
          : getTotalForCalculation(),
        shipping_fee: shouldShowConverted
          ? getConvertedShippingFeeForCalculation()
          : getShippingFeeForCalculation(),
        domestic_shipping_fee: shouldShowConverted
          ? getConvertedAmountByKey(convertedAmount, "domestic_shipping_fee")
          : route.params.orderData.domestic_shipping_fee || 0,
        is_protection: is_protection,
        protection_amount: protection_amount,
        items: updatedItems,
      };
      

      ordersApi
        .updateOrderPaymentMethod(paymentData)
        .then(() => {
          setCreateLoading(false);
          
          // 更新订单数据中的商品价格
          const updatedOrderData = {
            ...route.params!.orderData,
            payment_method: selectedPayment,
            currency: paymentData.currency,
            total_amount: paymentData.total_amount,
            actual_amount: paymentData.actual_amount,
            shipping_fee: paymentData.shipping_fee,
            domestic_shipping_fee: paymentData.domestic_shipping_fee,
            items: route.params!.orderData.items?.map((item: any, index: number) => ({
              ...item,
              unit_price: updatedItems[index]?.unit_price || item.unit_price,
              total_price: updatedItems[index]?.total_price || item.total_price,
            })),
          };
          
          
          // 准备结账事件数据
          const checkoutEventData = {
            order_id: route.params.orderId,
            pay_method: selectedPayment,
            offline_payment: currentTab === "offline" ? 1 : 0,
            total_price: updatedOrderData.total_amount,
            total_quantity: updatedOrderData.items.reduce((sum, item) => sum + item.quantity, 0),
            currency: paymentData.currency,
            sku_details: updatedOrderData.items.map(item => ({
              sku_id: item.sku_id,
              price: item.unit_price,
              quantity: item.quantity,
              sku_img: item.sku_image_url
            })),
            shipping_fee: paymentData.shipping_fee,
            domestic_shipping_fee: paymentData.domestic_shipping_fee
          };
          
          analyticsStore.logInitiateCheckout(checkoutEventData, "payment");
          
          // 记录 Facebook InitiateCheckout 事件
          logInitiateCheckoutEvent(
            {
              orderId: route.params.orderId,
              totalPrice: updatedOrderData.total_amount,
              totalQuantity: updatedOrderData.items.reduce((sum, item) => sum + item.quantity, 0),
              currency: paymentData.currency,
              offlinePayment: currentTab === "offline",
              shippingFee: paymentData.shipping_fee,
              domesticShippingFee: paymentData.domestic_shipping_fee
            },
            checkoutEventData.sku_details,
            selectedPayment
          );
          
          // 跳转到支付预览页面
          navigation.navigate("PreviewOrder", {
            data: updatedOrderData,
            payMethod: selectedPayment,
            currency: paymentData.currency,
          });
        })
        .catch((error) => {
          console.error("订单更新失败:", error);
          setCreateLoading(false);
          Alert.alert("错误", "更新支付方式失败");
        });
    }
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        <View style={styles.titleContainer}>
          <View style={styles.backIconContainer}>
            <TouchableOpacity onPress={() => {
              // 如果是从订单详情进入的，返回到首页
              if (route.params?.orderId && route.params?.orderData) {
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'MainTabs',
                      state: {
                        routes: [
                          { name: 'Home' }
                        ],
                        index: 0
                      }
                    }
                  ],
                });
              } else {
                navigation.goBack();
              }
            }}>
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
                          userLocalCurrency={userLocalCurrency}
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
                      {getSelectedCartItems().length} items)
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
                    {getSelectedCartItems().map((item) => (
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
                          {item.sku_attributes?.map((attribute, index) => (
                            <Text
                              style={styles.itemVariant}
                              key={`${attribute?.attribute_name}-${index}`}
                              numberOfLines={1}
                            >
                              {attribute?.attribute_name_trans || attribute?.attribute_name}:{" "}
                              {attribute?.value_trans || attribute?.value}
                            </Text>
                          ))}
                          <Text style={styles.itemQuantity}>
                            {t("payment.qty")}: {item.quantity}
                          </Text>
                        </View>
                        <View style={styles.itemPrices}>
                          <Text style={styles.itemPrice}>
                            {getConvertedItemPrice(item)} {getDisplayCurrency()}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.priceBox}>
                <View style={styles.priceBox1}>
                  <Text style={{color: '#000'}}>{t("payment.product_total")}</Text>
                  <View>
                    <Text style={{color: '#000'}}>
                      {formatAmount(getConvertedProductTotalPrice())}{" "}
                      {getDisplayCurrency()}
                    </Text>
                  </View>
                </View>
                <View style={styles.priceBox1}>
                  <Text style={{color: '#000'}}>{t("order.shipping.domestic_fee")}</Text>
                  <View>
                    <Text style={{color: '#000'}}>
                      {selectedPayment ? formatDisplayAmount(selectedPayment, convertedAmount, orderData?.domestic_shipping_fee || 0, "domestic_shipping_fee") : formatAmount(orderData?.domestic_shipping_fee || 0)}{" "}
                      {getDisplayCurrency()}
                    </Text>
                  </View>
                </View>
                <View style={styles.priceBox1}>
                  <View style={styles.shippingLabelContainer}>
                    <Text style={styles.shippingLabel}>{t("payment.international_shipping")}</Text>
                  </View>
                  <View style={styles.shippingPriceContainer}>
                    <Text style={styles.shippingPriceText}>
                      {formatAmount(selectedPayment && shouldShowConvertedAmount(selectedPayment, convertedAmount) 
                        ? getConvertedShippingFee() 
                        : getShippingFee())}{" "}
                      {getDisplayCurrency()}
                    </Text>
                    {isCOD === 1 && (
                      <View style={styles.cashOnDeliveryContainer}>
                        <Text style={styles.cashOnDeliveryText}>
                          {t("order.preview.Cash_on_delivery") || "货到付款"}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                
                {/* 运费险组件 */}
                <ShippingInsurance
                  isSelected={isShippingInsuranceSelected}
                  onToggle={setIsShippingInsuranceSelected}
                  fee={shippingInsuranceRate}
                  currency={getDisplayCurrency()}
                />
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
                  <Text
                    style={{
                      fontSize: fontSize(18),
                      fontWeight: "600",
                      color: "#FF5100",
                    }}
                  >
                    {formatAmount(selectedPayment && shouldShowConvertedAmount(selectedPayment, convertedAmount)
                      ? getConvertedTotalForCalculation()
                      : originalTotalPrice)}{" "}
                    {getDisplayCurrency()}
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedPayment || createLoading || isConverting || 
                 (isConvertiblePayment(selectedPayment) && 
                  (convertedAmount.length === 0 || !getConvertedAmountByKey(convertedAmount, "total_amount")))) &&
                  styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={!selectedPayment || createLoading || isConverting || 
                       (isConvertiblePayment(selectedPayment) && 
                        (convertedAmount.length === 0 || !getConvertedAmountByKey(convertedAmount, "total_amount")))}
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
