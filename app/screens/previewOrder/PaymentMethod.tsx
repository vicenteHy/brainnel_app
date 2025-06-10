import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { payApi, PaymentMethodsResponse } from "../../services/api/payApi";
import fontSize from "../../utils/fontsizeUtils";
import BackIcon from "../../components/BackIcon";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import widthUtils from "../../utils/widthUtils";
import useOrderStore from "../../store/order";
import useCreateOrderStore from "../../store/createOrder";
import { useRoute, RouteProp } from "@react-navigation/native";
import useUserStore from "../../store/user";
import { createOrderDataType } from "../../types/createOrder";
import {
  ordersApi,
  OrderData,
  CreateOrderRequest,
  Order,
} from "../../services/api/orders";
import { useTranslation } from "react-i18next";
import CircleOutlineIcon from "../../components/CircleOutlineIcon";
import CheckIcon from "../../components/CheckIcon";
import payMap from "../../utils/payMap";
import PaymentMethodIcon from "../../components/PaymentMethodIcon";
import PaymentIcon from "../../components/PaymentIcon";
import { getCurrentLanguage } from "../../i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAnalyticsStore from "../../store/analytics";
import { settingApi } from "../../services/api/setting";

// Define route params type
type PaymentMethodRouteParams = {
  freight_forwarder_address_id?: number;
  isCOD?: boolean;
};
// Define the root navigation params
type RootStackParamList = {
  PreviewOrder: {
    data: Order;
    payMethod: string;
    currency: string;
  };
  Pay: { order_id: string };
  ShippingFee: { freight_forwarder_address_id?: number; isCOD?: boolean };
  PaymentMethod: { freight_forwarder_address_id?: number; isCOD?: boolean };
  PreviewAddress: undefined;
  AddressList: undefined;
  // Add other routes as needed
};
interface PaymentOption {
  id: string;
  label: string;
  icon: string;
  value?: string | string[];
  key?: string;
}
interface PaymentTab {
  id: string;
  label: string;
  options: PaymentOption[];
}

const PaymentMethodItem = ({
  option,
  isSelected,
  onSelect,
  selectedCurrency,
  onSelectCurrency,
  exchangeRates,
  convertedAmount,
  isConverting,
  isPaypalExpanded,
  isCreditCardExpanded,
}: {
  option: PaymentOption;
  isSelected: boolean;
  onSelect: () => void;
  selectedCurrency?: string;
  onSelectCurrency?: (currency: string) => void;
  exchangeRates?: {
    usd: number;
    eur: number;
  };
  convertedAmount?: {
    converted_amount: number;
    item_key: string;
    original_amount: number;
  }[];
  isConverting?: boolean;
  isPaypalExpanded?: boolean;
  isCreditCardExpanded?: boolean;
}) => {
  const { t } = useTranslation();
  const { user } = useUserStore();
  
  return (
    <View>
      <TouchableOpacity style={styles.cardContainer} onPress={onSelect}>
        {option.key === "balance" ? (
          <View style={styles.leftInfo}>
            <View style={styles.blueBox}>
              <Image
                source={payMap(option.key) as any}
                style={styles.operatorImage}
              />
            </View>
            <Text style={styles.balanceText}>
              {t("balance.recharge.balance_remaining") || "Balance remaining"}
              {"\n"}
              {user.balance}
              {user.currency}
            </Text>
          </View>
        ) : (
          <View style={styles.iconRow}>
            <View style={styles.imageContainer}>
              <Image
                source={payMap(option.key || option.id) as any}
                style={styles.operatorImage}
              />
              {option.key === "mobile_money" && option.value && (
                <View style={styles.mobileMoneyTextContainer}>
                  {Array.isArray(option.value) ? (
                    option.value.map((item, index) => (
                      <View key={index} style={styles.mobileMoneyImgContainer}>
                        <Image
                          source={payMap(item) as any}
                          style={styles.mobileMoneyImg}
                        />
                      </View>
                    ))
                  ) : (
                    <Text style={styles.mobileMoneyText}>{option.value}</Text>
                  )}
                </View>
              )}
            </View>
          </View>
        )}
        <View style={styles.checkboxContainer}>
          <CircleOutlineIcon
            size={fontSize(24)}
            strokeColor={isSelected ? "#007efa" : "#C6C6C6"}
            fillColor={isSelected ? "#007efa" : "transparent"}
          />
          {isSelected && (
            <View style={styles.checkmarkContainer}>
              <CheckIcon size={fontSize(12)} color="#FFFFFF" />
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Show currency selector directly under PayPal when selected and expanded */}
      {isSelected &&
        option.key === "paypal" &&
        isPaypalExpanded &&
        selectedCurrency &&
        onSelectCurrency &&
        exchangeRates && (
          <View style={styles.paypalExpandedContainer}>
            <View style={styles.paypalCurrencyContainer}>
              <Text style={styles.currencyTitle}>
                {t("order.select_currency") || "Select Currency"}
              </Text>
              <View style={styles.currencyButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.currencyButton,
                    selectedCurrency === "USD" && styles.currencyButtonActive,
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
                    selectedCurrency === "EUR" && styles.currencyButtonActive,
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

              {/* Display converted amount */}
              {isConverting ? (
                <View style={styles.convertingContainer}>
                  <ActivityIndicator size="small" color="#007efa" />
                  <Text style={styles.convertingText}>
                    {t("order.converting") || "Converting..."}
                  </Text>
                </View>
              ) : convertedAmount && convertedAmount.length > 0 ? (
                <View style={styles.convertedAmountContainer}>
                  <Text style={styles.convertedAmountLabel}>
                    {t("order.equivalent_amount") || "Equivalent Amount:"}
                  </Text>
                  <Text style={styles.convertedAmountValue}>
                    {convertedAmount
                      .reduce((acc, item) => acc + item.converted_amount, 0)
                      .toFixed(2)}{" "}
                    {selectedCurrency}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

      {/* Show currency selector for Credit Card when selected and expanded */}
      {isSelected &&
        (option.key === "bank_card" || option.id === "bank_card") &&
        isCreditCardExpanded &&
        selectedCurrency &&
        onSelectCurrency &&
        exchangeRates && (
          <View style={styles.paypalExpandedContainer}>
            <View style={styles.paypalCurrencyContainer}>
              <Text style={styles.currencyTitle}>
                {t("order.select_currency") || "Select Currency"}
              </Text>
              <View style={styles.currencyButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.currencyButton,
                    selectedCurrency === "USD" && styles.currencyButtonActive,
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
                    selectedCurrency === "EUR" && styles.currencyButtonActive,
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

              {/* Display converted amount */}
              {isConverting ? (
                <View style={styles.convertingContainer}>
                  <ActivityIndicator size="small" color="#007efa" />
                  <Text style={styles.convertingText}>
                    {t("order.converting") || "Converting..."}
                  </Text>
                </View>
              ) : convertedAmount && convertedAmount.length > 0 ? (
                <View style={styles.convertedAmountContainer}>
                  <Text style={styles.convertedAmountLabel}>
                    {t("order.equivalent_amount") || "Equivalent Amount:"}
                  </Text>
                  <Text style={styles.convertedAmountValue}>
                    {convertedAmount
                      .reduce((acc, item) => acc + item.converted_amount, 0)
                      .toFixed(2)}{" "}
                    {selectedCurrency}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

    </View>
  );
};

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
  const [convertedAmount, setConvertedAmount] = useState<
    { converted_amount: number; item_key: string; original_amount: number }[]
  >([]);
  const [isConverting, setIsConverting] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [exchangeRates] = useState({
    usd: 580.0,
    eur: 655.96,
  });
  const [countryList, setCountryList] = useState<any[]>([]);
  const [userLocalCurrency, setUserLocalCurrency] = useState<string>("");
  const [hasInitializedCurrency, setHasInitializedCurrency] = useState(false);

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
      let paymentMethodsToUse = [];
      
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
      
      const onlineMethods = paymentMethodsToUse.map(
        (method: any) => ({
          id: method.key,
          label: method.name || method.key,
          icon: getPaymentIcon(method.key),
          value: method.value,
          key: method.key,
        })
      );

      // For now, use an empty array for offline methods as they're not in the API response
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

    ordersApi
      .createOrder(createOrderData as unknown as CreateOrderRequest)
      .then((res) => {
        setCreateLoading(false);
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
        console.error("Error creating order:", error);
        Alert.alert("Error", "Failed to create order");
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
              <ActivityIndicator size="large" color="#FF6F30" />
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
                        onPress={() => setCurrentTab(tab.id)}
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
                            color: "#FF6F30",
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
                            color: "#FF6F30",
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
                          color: "#FF6F30",
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
                        color: "#FF6F30",
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
      </View>
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  sectionIcon: {
    fontSize: fontSize(20),
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#000",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingHorizontal: 15,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#FF6F30",
  },
  tabText: {
    fontSize: fontSize(16),
    color: "#666",
  },
  tabTextActive: {
    color: "#FF6F30",
    fontWeight: "500",
  },
  paymentOptions: {
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
    marginBottom: 10,
  },
  paymentSelected: {
    backgroundColor: "#FFF0E8",
    borderWidth: 1,
    borderColor: "#FF6F30",
  },
  paymentContent: {
    flex: 1,
  },
  defaultPaymentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentIcon: {
    fontSize: fontSize(24),
    marginRight: 8,
  },
  paymentLabel: {
    fontSize: fontSize(16),
    fontWeight: "500",
  },
  operatorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  operatorBox: {
    backgroundColor: "#fff",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  operatorText: {
    fontSize: fontSize(12),
    color: "#666",
  },
  radioButton: {
    width: widthUtils(20, 20).width,
    height: widthUtils(20, 20).height,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: widthUtils(12, 12).width,
    height: widthUtils(12, 12).height,
    borderRadius: 6,
    backgroundColor: "transparent",
  },
  radioInnerSelected: {
    backgroundColor: "#FF6F30",
  },
  titleContainer: {
    width: "100%",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    backgroundColor: "#fff",
  },
  backIconContainer: {
    position: "absolute",
    left: 15,
    backgroundColor: "#fff",
  },
  titleHeading: {
    fontWeight: "600",
    fontSize: fontSize(18),
    lineHeight: 22,
    fontFamily: "PingFang SC",
    color: "black",
  },
  // Order Summary Styles
  section: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginTop: 15,
  },
  section1: {
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
  },
  sectionHeader1: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  sectionIcon1: {
    fontSize: fontSize(18),
    marginRight: 10,
    color: "#666",
  },
  sectionTitle1: {
    fontSize: fontSize(15),
    fontWeight: "500",
    flex: 1,
  },
  setOrderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  sectionAction: {
    color: "#FF6F30",
    fontSize: fontSize(13),
    fontWeight: "500",
  },
  noCouponsMessage: {
    color: "#888",
    fontSize: fontSize(13),
  },
  orderItems: {
    maxHeight: 0,
    overflow: "hidden",
  },
  orderItemsExpanded: {
    maxHeight: 1000, // Arbitrary large number to accommodate all items
  },
  orderItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  itemImage: {
    width: widthUtils(70, 70).width,
    height: widthUtils(70, 70).height,
    borderRadius: 6,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  itemImagePlaceholder: {
    width: widthUtils(70, 70).width,
    height: widthUtils(70, 70).height,
    borderRadius: 6,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#f1f1f1",
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSize(14),
    lineHeight: 18,
  },
  itemVariant: {
    fontSize: fontSize(12),
    color: "#666",
    backgroundColor: "#f7f7f7",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  itemQuantity: {
    fontSize: fontSize(12),
    color: "#666",
    marginTop: 4,
  },
  itemPrices: {
    alignItems: "flex-end",
    fontSize: fontSize(13),
    color: "#555",
  },
  itemPrice: {
    fontWeight: "600",
    color: "#FF6F30",
    fontSize: fontSize(15),
    marginBottom: 5,
  },
  priceBox: {
    borderRadius: 10,
    marginTop: 15,
    paddingHorizontal: 15,
  },
  priceBox1: {
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  actualPaymentBox: {
    padding: 12,
    borderRadius: 6,
    backgroundColor: "#fff8f4",
    marginTop: 15,
    marginHorizontal: 15,
    marginBottom: 20,
  },
  actualPaymentBox1: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  submitButtonContainer: {
    paddingRight: 11,
    paddingLeft: 11,
    marginTop: 20,
    marginBottom: 20,
  },
  primaryButtonStyle: {
    width: "100%",
    height: widthUtils(50, 50).height,
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "600",
    fontSize: fontSize(16),
    lineHeight: 22,
    fontFamily: "PingFang SC",
    color: "white",
    backgroundColor: "#002fa7",
    borderWidth: 0,
    borderRadius: 25,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: fontSize(16),
    lineHeight: 22,
    fontFamily: "PingFang SC",
  },
  selectedCountryText: {
    padding: 0,
    margin: 0,
    fontWeight: "500",
    fontSize: fontSize(16),
    lineHeight: 22,
    fontFamily: "PingFang SC",
    color: "#646472",
  },
  disabledButtonStyle: {
    backgroundColor: "#ccc",
  },
  currencySelectorContainer: {
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginTop: 5,
    marginBottom: 15,
  },
  currencySelectorTitle: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "#000",
    marginBottom: 15,
  },
  currencyOptions: {
    flexDirection: "row",
    marginBottom: 15,
  },
  currencyOption: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 4,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCurrencyOption: {
    borderColor: "#002fa7",
    backgroundColor: "#fff",
  },
  currencyText: {
    fontSize: fontSize(16),
    fontWeight: "500",
    color: "#000",
  },
  exchangeRateContainer: {
    marginBottom: 15,
  },
  exchangeRateText: {
    fontSize: fontSize(14),
    color: "#666",
    marginBottom: 5,
  },
  totalContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  totalText: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "#FF6F30",
  },
  loadingIndicator: {
    marginLeft: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    position: "relative",
  },
  backButton: {
    padding: 5,
    position: "absolute",
    left: 10,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: fontSize(20),
    fontWeight: "600",
    textAlign: "center",
  },
  paymentContainer: {
    padding: 15,
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 15,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#FF6F30",
  },
  bottomBar: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#f5f5f5",
  },
  submitButton: {
    width: "100%",
    height: widthUtils(50, 50).height,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FF6F30",
    borderRadius: 25,
  },
  submitButtonText: {
    color: "white",
    fontSize: fontSize(16),
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  scrollContent: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  sectionContainer: {
    padding: 15,
  },
  sectionHeaderBottom: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionIconBottom: {
    fontSize: fontSize(20),
    marginRight: 8,
  },
  sectionTitleBottom: {
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#000",
  },
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  tabBottom: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#FF6F30",
  },
  activeTabText: {
    color: "#FF6F30",
    fontWeight: "500",
  },
  tabContent: {
    marginBottom: 15,
  },
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
    marginBottom: 10,
    minHeight: 60,
  },
  leftInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  blueBox: {
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    width: widthUtils(30, 80).width,
    height: widthUtils(30, 30).height,
    backgroundColor: "#3955f6",
  },
  operatorImage: {
    width: widthUtils(30, 80).width,
    height: widthUtils(30, 30).height,
    borderRadius: 4,
    resizeMode: "contain",
  },
  balanceText: {
    fontSize: fontSize(14),
    fontWeight: "500",
    color: "#030303",
    marginLeft: 10,
    lineHeight: 18,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  imageContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  mobileMoneyTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  mobileMoneyImgContainer: {
    width: widthUtils(30, 80).width,
    height: widthUtils(30, 30).height,
    borderWidth: 0,
    marginRight: 5,
  },
  mobileMoneyImg: {
    width: widthUtils(30, 80).width,
    height: widthUtils(30, 30).height,
    borderWidth: 0,
    resizeMode: "contain",
  },
  mobileMoneyText: {
    fontSize: fontSize(16),
    fontWeight: "500",
    color: "#000",
  },
  checkboxContainer: {
    position: "relative",
    width: fontSize(24),
    height: fontSize(24),
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
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
  currencyTitle: {
    fontSize: fontSize(14),
    color: "#666",
    marginBottom: 10,
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
    borderColor: "#FF6F30",
  },
  currencyButtonText: {
    fontSize: fontSize(14),
    color: "#333",
  },
  currencyButtonTextActive: {
    color: "#FF6F30",
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
    color: "#FF6F30",
  },
  shippingFeeAmountRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  warningIconContainer: {
    padding: 5,
  },
  warningIcon: {
    fontSize: fontSize(16),
    color: "#FF6F30",
  },
  cashOnDeliveryContainer: {
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: "#fff4f0",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#FF6F30",
    alignSelf: "flex-start",
  },
  cashOnDeliveryText: {
    fontSize: fontSize(12),
    color: "#FF6F30",
    fontWeight: "500",
  },
  shippingLabelContainer: {
    flex: 1,
    paddingRight: 10,
  },
  shippingLabel: {
    fontSize: fontSize(14),
    color: "#333",
    lineHeight: 20,
  },
  shippingPriceContainer: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
  shippingPriceText: {
    fontSize: fontSize(14),
    color: "#333",
    textAlign: "right",
    marginBottom: 2,
  },
});
