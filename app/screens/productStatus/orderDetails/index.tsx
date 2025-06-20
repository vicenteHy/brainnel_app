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
// PhoneNumberInputModal removed - using PaymentMethod page instead

// Local components
// PaymentModal removed - using direct navigation to PaymentMethod instead

// Services and utils
import {
  ordersApi,
  OrderDetailsType,
  OrderItemDetails,
} from "../../../services/api/orders";
// payApi removed - payment logic moved to PaymentMethod page
import { useOrderListStore } from "../../../store/orderList";
import { CountryList } from "../../../constants/countries";
import {
  getOrderTransLanguage,
  getAttributeTransLanguage,
  getAttributeNameTransLanguage,
  getCountryTransLanguage,
} from "../../../utils/languageUtils";
import { payApi } from "../../../services/api/payApi";

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
    showPhoneModal,
    showCancelModal,
    isCancelling,
    countryList,
    selectedCountry,
    localSelectedCountry,
    showCountryModal,
    loadingCountries,

    // 设置方法
    setShowPhoneModal,
    setShowCancelModal,
    setSelectedCountry,
    setLocalSelectedCountry,
    setShowCountryModal,

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={[styles.title, { color: '#000000' }]}>{t("order.details")}</Text>
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
                    <Text style={[styles.orderStatusTitleText, { color: '#000000' }]}>
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
                        <Text style={[styles.orderStatusTitleText, { color: '#000000' }]}>
                          {t("order.information")}
                        </Text>
                      </View>


                    </View>
                  </View>
                  <View style={styles.orderStatusContentPreview}>
                    <View style={styles.orderInfoItem}>
                      <Text style={[styles.orderInfoLabel, { color: '#666666' }]}>{t("order.id")}</Text>
                      <Text style={[styles.orderInfoValue, { color: '#000000' }]}>
                        {orderDetails.order_no}
                      </Text>
                    </View>
                    <View style={styles.orderInfoItem}>
                      <Text style={[styles.orderInfoLabel, { color: '#666666' }]}>
                        {t("order.create_time")}
                      </Text>
                      <Text style={[styles.orderInfoValue, { color: '#000000' }]}>
                        {orderDetails.create_time}
                      </Text>
                    </View>
                    <View style={styles.orderInfoItem}>
                      <Text style={[styles.orderInfoLabel, { color: '#666666' }]}>
                        {t("order.shipping_type")}
                      </Text>
                      <View style={styles.shippingTypeContainer}>
                        <Text style={[
                          styles.shippingTypeText,
                          orderDetails.shipping_type === 0 
                            ? styles.shippingTypeSea 
                            : styles.shippingTypeAir,
                          { color: orderDetails.shipping_type === 0 ? '#3498db' : '#e74c3c' }
                        ]}>
                          {orderDetails.shipping_type === 0
                            ? t("order.shipping.sea")
                            : t("order.shipping.air")}
                        </Text>
                      </View>
                    </View>
                    
                    
                    {/* 取件码 - 在待发货、运输中、已完成状态时显示 */}
                    {route.params.status >= 1 && route.params.status <= 3 && (
                      <View style={styles.orderInfoItem}>
                        <Text style={[styles.orderInfoLabel, { color: '#666666' }]}>
                          {t("order.verification_code")}
                        </Text>
                        <Text style={[styles.orderInfoValue, { color: '#000000' }]}>
                          {orderDetails.verification_code || '--'}
                        </Text>
                      </View>
                    )}
                    
                    {/* 货架号 - 在待发货、运输中、已完成状态时显示 */}
                    {route.params.status >= 1 && route.params.status <= 3 && (
                      <View style={styles.orderInfoItem}>
                        <Text style={[styles.orderInfoLabel, { color: '#666666' }]}>
                          {t("order.location_code")}
                        </Text>
                        <Text style={[styles.orderInfoValue, { color: '#000000' }]}>
                          {orderDetails.location_code || '--'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* 配送信息 */}
              <View style={styles.orderStatus}>
                <View style={styles.orderStatusContent}>
                  <View style={styles.orderStatusTitle}>
                    <AddressIcon size={20} color={"#f77f3a"} />
                    <Text style={[styles.orderStatusTitleText, { color: '#000000' }]}>
                      {t("order.delivery_info")}
                    </Text>
                  </View>
                  <View style={styles.orderStatusContentPreview}>
                    <View style={styles.deliveryInfoContainer}>
                      <View style={styles.warehouseSection}>
                        <Text style={[styles.sectionTitle, { color: '#000000' }]}>
                          {t("order.warehouse")}
                        </Text>
                        <View style={styles.warehouseInfo}>
                          <Text style={[styles.warehouseAddress, { color: '#666666' }]}>
                            {orderDetails.receiver_address}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.recipientSection}>
                        <Text style={[styles.sectionTitle, { color: '#000000' }]}>
                          {t("order.recipient")}
                        </Text>
                        <View style={styles.recipientInfo}>
                          <Text style={[styles.recipientName, { color: '#000000' }]}>
                            {orderDetails.receiver_name}
                          </Text>
                          <View style={styles.contactMethods}>
                            <View style={styles.contactItem}>
                              <PhoneIcon size={14} color="#666" />
                              <Text style={[styles.contactText, { color: '#666666' }]}>
                                {orderDetails.receiver_phone}
                              </Text>
                            </View>
                            <View style={styles.contactItem}>
                              <WhatsAppIcon size={14} />
                              <Text style={[styles.contactText, { color: '#666666' }]}>
                                {orderDetails.receiver_phone}
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
                    <Text style={[styles.orderStatusTitleText, { color: '#000000' }]}>
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
                            <Text style={[styles.productItemInfoNameText, { color: '#000000' }]}>
                              {getOrderTransLanguage(item) ||
                                item.product_name_fr}
                            </Text>
                            <View style={styles.productItemInfoSku}>
                              {item.sku_attributes.map((sku, index) => (
                                <Text
                                  key={index}
                                  style={[styles.productItemInfoSkuText, { color: '#666666' }]}
                                >
                                  {getAttributeNameTransLanguage(sku) ||
                                    sku.attribute_name}
                                  : {getAttributeTransLanguage(sku) ||
                                    sku.attribute_value}
                                </Text>
                              ))}
                            </View>
                            <View style={styles.productPriceContainer}>
                              <Text style={[styles.productPrice, { color: '#ff6000' }]}>
                                {item.total_price} {orderDetails.currency}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.productItemNum}>
                            <Text style={[styles.productItemNumText, { color: '#666666' }]}>
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
                      <Text style={[styles.addToCartText, { color: '#0098ef' }]}>
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
                    <Text style={[styles.orderStatusTitleText, { color: '#000000' }]}>
                      {t("order.price_details")}
                    </Text>
                  </View>
                  <View style={styles.orderStatusContentPreview}>
                    <View style={styles.priceBreakdown}>
                      <View style={styles.priceItem}>
                        <Text style={[styles.priceLabel, { color: '#666666' }]}>
                          {t("order.platform_shipping")}
                        </Text>
                        <Text style={[styles.priceValue, { color: '#000000' }]}>
                          {orderDetails.domestic_shipping_fee}{" "}
                          {orderDetails.currency}
                        </Text>
                      </View>
                      <View style={styles.priceItem}>
                        <Text style={[styles.priceLabel, { color: '#666666' }]}>
                          {t("order.international_shipping")}
                        </Text>
                        <Text style={[styles.priceValue, { color: '#000000' }]}>
                          {orderDetails.shipping_fee} {orderDetails.currency}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.dottedLine}></View>
                    
                    <View style={styles.totalSection}>
                      <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: '#000000' }]}>{t("order.total")}</Text>
                        <Text style={[styles.totalPrice, { color: '#ff6000' }]}>
                          {orderDetails.total_amount} {orderDetails.currency}
                        </Text>
                      </View>
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
                      console.error("Cancel order failed:", error);
                      Toast.show({
                        type: "error",
                        text1: t("order.cancel_failed"),
                      });
                    }
                  }}
                >
                  <Text style={[styles.bottomButtonText1, { color: '#666666' }]}>
                    {t("order.cancel")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bottomButton}
                  onPress={() => navigation.navigate("PaymentMethod", {
                    orderId: orderDetails.order_id,
                    orderData: orderDetails
                  })}
                >
                  <Text style={[styles.bottomButtonText, { color: '#ffffff' }]}>{t("order.pay")}</Text>
                </TouchableOpacity>
              </View>
            )}

            {(route.params.status === 4 ||
              route.params.status === 5 ||
              route.params.status === 6) && (
              <View style={styles.bottomButtons}>
                <TouchableOpacity
                  style={styles.bottomButton1}
                  onPress={() => addToCart(orderDetails.items)}
                >
                  <Text style={[styles.bottomButtonText1, { color: '#666666' }]}>
                    {t("order.add_to_cart")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bottomButton}
                  onPress={() => reorderHandle(orderDetails)}
                >
                  <Text style={[styles.bottomButtonText, { color: '#ffffff' }]}>
                    {t("order.reorder")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <Text style={{ color: '#666666' }}>{t("order.unable_to_load")}</Text>
        )}
      </View>

      {/* 手机号码输入模态框 - 已移除，使用PaymentMethod页面代替 */}

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
              <Text style={[styles.modalTitle, { color: '#000000' }]}>
                {t("order.preview.select_country_modal")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowCountryModal(false)}
                style={styles.closeButtonContainer}
              >
                <Text style={[styles.closeButtonText, { color: '#666666' }]}>✕</Text>
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
                      { color: selectedCountry?.country === item.country ? '#ff6000' : '#000000' }
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
            <Text style={[styles.modalPromptText, styles.modalCancelText, { color: '#000000' }]}>
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
                <Text style={[styles.modalCancelButtonOutlineText, { color: '#666666' }]}>
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
                  <Text style={[styles.modalCancelButtonFilledText, { color: '#ffffff' }]}>
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