import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
  Linking,
  SafeAreaView,
  StatusBar,
  Modal,
  FlatList,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";

// Components
import BackIcon from "../../../components/BackIcon";
import MassageIcon from "../../../components/MassageIcon";
import OrderIcon from "../../../components/OrderIcon";
import InfoIcon from "../../../components/InfoIcon";
import Progress from "../Progress";
import AddressIcon from "../../../components/AddressIcon";
import BrightnessIcon from "../../../components/BrightnessIcon";
import PhoneIcon from "../../../components/PhoneIcon";
import ShoppingBagIcon from "../../../components/ShoppingBagIcon";
import PowerIcon from "../../../components/PowerIcon";
import CardIcon from "../../../components/ShoppingCartIcon";
import WhatsAppIcon from "../../../components/WatchAppIcon";
import IconComponent from "../../../components/IconComponent";
import PhoneNumberInputModal from "../../BalanceScreen/PhoneNumberInputModal";

// Local components
import { PaymentModal } from "./components/PaymentModal";

// Services and utils
import {
  ordersApi,
  OrderDetailsType,
  OrderItemDetails,
} from "../../../services/api/orders";
import { payApi } from "../../../services/api/payApi";
import { useOrderListStore } from "../../../store/orderList";
import { CountryList } from "../../../constants/countries";
import {
  getOrderTransLanguage,
  getAttributeTransLanguage,
  getAttributeNameTransLanguage,
  getCountryTransLanguage,
} from "../../../utils/languageUtils";

// Local modules
import { useOrderDetails } from "./hooks/useOrderDetails";
import { getDisplayCountryCode } from "./utils/phoneUtils";
import { styles } from "./styles";

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

  const {
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

    // 设置方法
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
    loadCountryList,
    callPhone,
    addToCart,
    reorderHandle,
    handleCancelOrder,
    handleChatNowPress,
    formatPhoneNumber,
  } = useOrderDetails({
    orderId: route.params.orderId,
    status: route.params.status,
  });

  const { cancelOrder, confirmOrder } = useOrderListStore();

  // 支付相关逻辑
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

  // 确认支付
  const handlePaymentConfirm = async () => {
    if (!selectedPayment || !orderDetails?.order_id) return;

    // 如果是mobile_money支付方式，显示电话号码输入模态框
    if (selectedPayment === "mobile_money") {
      await loadCountryList();

      const params = {
        originalAmount: orderDetails.total_amount,
        amount: orderDetails.total_amount,
        currency: orderDetails.currency,
        payment_method: selectedPayment,
        selectedPriceLabel: orderDetails.total_amount + " " + orderDetails.currency,
        onCloses: () => setShowPaymentModal(false),
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
          : orderDetails.currency,
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
            : orderDetails.currency,
        amount:
          selectedPayment === "paypal" || selectedPayment === "wave"
            ? convertedAmount.reduce(
                (acc, item) => acc + item.converted_amount,
                0
              )
            : orderDetails?.total_amount || 0,
      };

      const res = await payApi.getPayInfo(payData);
      
      if (res.success) {
        setIsPaymentLoading(false);
        setShowPaymentModal(false);

        if (selectedPayment === "balance") {
          navigation.navigate("PaymentSuccessScreen", res);
          return;
        }

        if (["wave", "paypal", "bank_card"].includes(selectedPayment)) {
          try {
            const canOpen = await Linking.canOpenURL(res.payment_url);
            if (canOpen) {
              await Linking.openURL(res.payment_url);
            } else {
              await Linking.openURL(res.payment_url);
            }
          } catch (error) {
            console.error("Error opening payment app:", error);
            Alert.alert(
              t("error"),
              t("order.error.wave_app_open") || "Failed to open payment app"
            );
          }
          return;
        }
      } else {
        Alert.alert(t("error"), t("pay.payment_failed"));
      }
    } catch (error) {
      Alert.alert(t("error"), t("order.error.payment_update"));
    } finally {
      setIsPaymentLoading(false);
    }
  };

  // 手机号码提交
  const handlePhoneSubmit = async (phoneNumber: string) => {
    if (!paymentParams) return;

    if (paymentParams.payment_method === "mobile_money") {
      if (!phoneNumber || phoneNumber.trim() === "") {
        Toast.show({
          type: "error",
          text1: t("balance.phone_modal.phone_required") || "Phone number is required",
        });
        return;
      }

      const currentValidDigits = selectedCountry?.valid_digits || [8];
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");
      if (!currentValidDigits.includes(cleanPhoneNumber.length)) {
        Toast.show({
          type: "error",
          text1: `${t("order.error.invalid_phone") || "Invalid phone number"} (${
            t("order.error.requires_digits") || "Required digits"
          }: ${currentValidDigits.join(", ")})`,
        });
        return;
      }
    }

    setIsPaymentLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);

      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(formattedPhone)) {
        Toast.show({
          type: "error",
          text1: t("order.error.invalid_phone"),
        });
        setIsPaymentLoading(false);
        return;
      }

      const paymentData = {
        order_id: orderDetails?.order_id || "",
        payment_method: paymentParams.payment_method,
        currency: paymentParams.currency,
        total_amount: paymentParams.amount,
        actual_amount: paymentParams.amount,
        shipping_fee: 0,
        domestic_shipping_fee: 0,
      };

      await ordersApi.updateOrderPaymentMethod(paymentData);

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

  // 添加确定按钮禁用逻辑函数
  const isConfirmButtonDisabled = () => {
    if (!selectedPayment) return true;
    if (isConverting) return true;
    
    if (
      selectedPayment === "paypal" &&
      (convertedAmount.length === 0 ||
        !convertedAmount.find((item) => item.item_key === "total_amount"))
    ) {
      return true;
    }

    if (
      selectedPayment === "wave" &&
      (convertedAmount.length === 0 ||
        !convertedAmount.find((item) => item.item_key === "total_amount"))
    ) {
      return true;
    }

    return false;
  };

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
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {/* 订单状态 */}
              <View style={styles.orderStatus}>
                <View style={styles.orderStatusContent}>
                  <View style={styles.orderStatusTitle}>
                    <OrderIcon size={20} color="#f77f3a" />
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
                    <View style={styles.orderInfoHeader}>
                      <View style={styles.orderStatusTitleContainer}>
                        <InfoIcon size={20} color="#f77f3a" />
                        <Text style={styles.orderStatusTitleText}>
                          {t("order.information")}
                        </Text>
                      </View>

                      {route.params.status === 0 && (
                        <TouchableOpacity
                          style={styles.checkPaymentButton}
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
                          }}
                        >
                          <Text style={styles.checkPaymentText}>
                            {t("order.status.check_payment_result")}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <View style={styles.orderStatusContentPreview}>
                    <View style={styles.orderInfoItem}>
                      <Text style={styles.orderInfoLabel}>{t("order.id")}</Text>
                      <Text style={styles.orderInfoValue}>
                        {orderDetails.order_no}
                      </Text>
                    </View>
                    <View style={styles.orderInfoItem}>
                      <Text style={styles.orderInfoLabel}>
                        {t("order.create_time")}
                      </Text>
                      <Text style={styles.orderInfoValue}>
                        {orderDetails.create_time}
                      </Text>
                    </View>
                    <View style={styles.orderInfoItem}>
                      <Text style={styles.orderInfoLabel}>
                        {t("order.shipping_type")}
                      </Text>
                      <View style={styles.shippingTypeContainer}>
                        <Text style={[
                          styles.shippingTypeText,
                          orderDetails.shipping_type === 0 
                            ? styles.shippingTypeSea 
                            : styles.shippingTypeAir
                        ]}>
                          {orderDetails.shipping_type === 0
                            ? t("order.shipping.sea")
                            : t("order.shipping.air")}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* 配送信息 */}
              <View style={styles.orderStatus}>
                <View style={styles.orderStatusContent}>
                  <View style={styles.orderStatusTitle}>
                    <AddressIcon size={20} color={"#f77f3a"} />
                    <Text style={styles.orderStatusTitleText}>
                      {t("order.delivery_info")}
                    </Text>
                  </View>
                  <View style={styles.orderStatusContentPreview}>
                    <View style={styles.deliveryInfoContainer}>
                      <View style={styles.warehouseSection}>
                        <Text style={styles.sectionTitle}>
                          {t("order.warehouse")}
                        </Text>
                        <View style={styles.warehouseInfo}>
                          <Text style={styles.warehouseAddress}>
                            {orderDetails.receiver_address}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.recipientSection}>
                        <Text style={styles.sectionTitle}>
                          {t("order.recipient")}
                        </Text>
                        <View style={styles.recipientInfo}>
                          <Text style={styles.recipientName}>
                            {orderDetails.receiver_name}
                          </Text>
                          <View style={styles.contactMethods}>
                            <View style={styles.contactItem}>
                              <PhoneIcon size={14} color="#666" />
                              <Text style={styles.contactText}>
                                {formatPhoneNumber(orderDetails.receiver_phone)}
                              </Text>
                            </View>
                            <View style={styles.contactItem}>
                              <WhatsAppIcon size={14} />
                              <Text style={styles.contactText}>
                                {formatPhoneNumber(orderDetails.receiver_phone)}
                              </Text>
                            </View>
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
                    <ShoppingBagIcon size={18} color="#f77f3a" />
                    <Text style={styles.orderStatusTitleText}>
                      {t("order.product_info")} ({orderDetails.items.length})
                    </Text>
                  </View>
                  <View style={styles.orderStatusContentPreview}>
                    <View style={styles.productsList}>
                      {orderDetails.items.map((item, index) => (
                        <View style={styles.productItem} key={index}>
                          <View style={styles.productItemImage}>
                            <Image
                              source={{ uri: item.sku_image }}
                              style={styles.productImage}
                            />
                          </View>
                          <View style={styles.productItemInfo}>
                            <Text style={styles.productItemInfoNameText}>
                              {getOrderTransLanguage(item) ||
                                item.product_name_fr}
                            </Text>
                            <View style={styles.productItemInfoSku}>
                              {item.sku_attributes.map((sku, index) => (
                                <Text
                                  key={index}
                                  style={styles.productItemInfoSkuText}
                                >
                                  {getAttributeNameTransLanguage(sku) ||
                                    sku.attribute_name}
                                  : {getAttributeTransLanguage(sku) ||
                                    sku.attribute_value}
                                </Text>
                              ))}
                            </View>
                            <View style={styles.productPriceContainer}>
                              <Text style={styles.productPrice}>
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

                    <TouchableOpacity
                      style={styles.addToCartButton}
                      onPress={() => addToCart(orderDetails.items)}
                    >
                      <CardIcon size={16} color="#0098ef" />
                      <Text style={styles.addToCartText}>
                        {t("order.add_to_cart")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* 价格信息 */}
              <View style={styles.orderStatus}>
                <View style={styles.orderStatusContent}>
                  <View style={styles.orderStatusTitle}>
                    <PowerIcon size={20} color="#f77f3a" />
                    <Text style={styles.orderStatusTitleText}>
                      {t("order.price_details")}
                    </Text>
                  </View>
                  <View style={styles.orderStatusContentPreview}>
                    <View style={styles.priceBreakdown}>
                      <View style={styles.priceItem}>
                        <Text style={styles.priceLabel}>
                          {t("order.platform_shipping")}
                        </Text>
                        <Text style={styles.priceValue}>
                          {orderDetails.domestic_shipping_fee}{" "}
                          {orderDetails.currency}
                        </Text>
                      </View>
                      <View style={styles.priceItem}>
                        <Text style={styles.priceLabel}>
                          {t("order.international_shipping")}
                        </Text>
                        <Text style={styles.priceValue}>
                          {orderDetails.shipping_fee} {orderDetails.currency}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.dottedLine}></View>
                    
                    <View style={styles.totalSection}>
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>{t("order.total")}</Text>
                        <Text style={styles.totalPrice}>
                          {orderDetails.total_amount} {orderDetails.currency}
                        </Text>
                      </View>
                      <Text style={styles.shippingNote}>
                        + {orderDetails.shipping_fee}{" "}
                        {t("order.estimated_shipping")}({orderDetails.currency})
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* 底部按钮 */}
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
                  onPress={() => setShowPaymentModal(true)}
                >
                  <Text style={styles.bottomButtonText}>{t("order.pay")}</Text>
                </TouchableOpacity>
              </View>
            )}

            {route.params.status === 1 && (
              <View style={styles.bottomButtons}>
                <TouchableOpacity
                  style={styles.bottomButton1}
                  onPress={() => {
                    callPhone(formatPhoneNumber(orderDetails.receiver_phone));
                  }}
                >
                  <Text style={styles.bottomButtonText1}>
                    {t("order.contact_shipping")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

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

            {(route.params.status === 3 ||
              route.params.status === 4 ||
              route.params.status === 5 ||
              route.params.status === 6) && (
              <View style={styles.bottomButtons}>
                <TouchableOpacity
                  style={styles.bottomButton1}
                  onPress={() => addToCart(orderDetails.items)}
                >
                  <Text style={styles.bottomButtonText1}>
                    {t("order.add_to_cart")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bottomButton}
                  onPress={() => reorderHandle(orderDetails)}
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

      {/* 支付模态框 */}
      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        tabs={tabs}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        selectedPayment={selectedPayment}
        onSelectPayment={onSelectPayment}
        paymentMethods={paymentMethods}
        selectedCurrency={selectedCurrency}
        onSelectCurrency={onSelectCurrency}
        convertedAmount={convertedAmount}
        isConverting={isConverting}
        isPaypalExpanded={isPaypalExpanded}
        isWaveExpanded={isWaveExpanded}
        onConfirm={handlePaymentConfirm}
        isPaymentLoading={isPaymentLoading}
        isConfirmButtonDisabled={isConfirmButtonDisabled()}
      />

      {/* 手机号码输入模态框 */}
      <PhoneNumberInputModal
        isVisible={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        paymentParams={paymentParams}
        onSubmit={handlePhoneSubmit}
        onCloses={() => setShowPaymentModal(false)}
        displayCountryCode={getDisplayCountryCode(
          loadingCountries,
          localSelectedCountry,
          selectedCountry
        )}
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
              <Text style={styles.modalTitle}>
                {t("order.preview.select_country_modal")}
              </Text>
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
                    setLocalSelectedCountry(null);
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