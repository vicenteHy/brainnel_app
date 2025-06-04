import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Platform,
  Image,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AddressIcon from "../../components/AddressIcon";
import BackIcon from "../../components/BackIcon";
import widthUtils from "../../utils/widthUtils";
import FileEditIcon from "../../components/FileEditIcon";
import PlusIcon from "../../components/PlusIconIcon";
import {
  addressApi,
  addressData,
  AddressItem,
} from "../../services/api/addressApi";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { eventBus } from "../../utils/eventBus";
import LocationPinIcon from "../../components/LocationPinIcon";
import fontSize from "../../utils/fontsizeUtils";
import {
  ordersApi,
  OrderData,
  AddressDataItem,
  DomesticShippingFeeData,
} from "../../services/api/orders";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { payApi, PaymentMethodsResponse } from "../../services/api/payApi";
import useOrderStore from '../../store/order';
import { useTranslation } from 'react-i18next';


interface PaymentOption {
  id: string;
  label: string;
  icon: string;
  value?: string | string[];
}

interface PaymentTab {
  id: string;
  label: string;
  options: PaymentOption[];
}

const PaymentMethodItem = ({ option, isSelected, onSelect }: { 
  option: PaymentOption; 
  isSelected: boolean; 
  onSelect: () => void; 
}) => (
  <TouchableOpacity
    style={[
      styles.paymentOption,
      isSelected && styles.paymentSelected
    ]}
    onPress={onSelect}
  >
    <View style={styles.paymentContent}>
      <View style={styles.defaultPaymentContainer}>
        <Text style={styles.paymentIcon}>{option.icon}</Text>
        <Text style={styles.paymentLabel}>{option.label}</Text>
      </View>
      {Array.isArray(option.value) && option.value.length > 0 && (
        <View style={styles.operatorContainer}>
          {option.value.map((op: string) => (
            <View key={op} style={styles.operatorBox}>
              <Text style={styles.operatorText}>{op}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
    <View style={styles.radioButton}>
      <View style={[
        styles.radioInner,
        isSelected && styles.radioInnerSelected
      ]} />
    </View>
  </TouchableOpacity>
);

export function Recipient({
  route,
}: {
  route: { params: { items: { cart_item_id: number }[] } };
}) {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [showModal, setShowModal] = useState(false);
  const [orderData, setOrderData] = useState<OrderData>();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    whatsapp: "",
    sameAsPhone: false,
    setDefault: false,
  });
  const setOrder = useOrderStore(state => state.setOrder);
  const [shippingMethod, setShippingMethod] = useState("sea");
  const [warehouse, setWarehouse] = useState<number>();
  const [arrival, setArrival] = useState("-");
  const [addressList, setAddressList] = useState<AddressItem[]>();
  const [defaultAddress, setDefaultAddress] = useState<addressData>();
  const [addressId, setAddressId] = useState<number>();
  const [freightForwarderAddress, setFreightForwarderAddress] =
    useState<AddressDataItem>();
  const [domesticShippingFee, setDomesticShippingFee] =
    useState<DomesticShippingFeeData>();
  const [tabs, setTabs] = useState<PaymentTab[]>([
    {
      id: "online",
      label: "Online Payment",
      options: []
    },
    {
      id: "offline",
      label: "Offline Payment",
      options: []
    }
  ]);
  const [currentTab, setCurrentTab] = useState("online");
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodsResponse>();
  const { t } = useTranslation();

  const getAddress = async () => {
    const response = await addressApi.addressesDefault();
    setAddressId(response.address_id);
    setDefaultAddress(response);
  };

  const getAddressList = async () => {
    const response = await addressApi.getAddress();
    setAddressList(response.items);
  };

  const getOrders = async () => {
    const country = (await AsyncStorage.getItem("@selected_country")) as string;
    setWarehouse(JSON.parse(country).name);
    const params = route.params;
    const data = {
      items: params.items,
    };
    const response = await ordersApi.getOrders(data);
    setOrderData(response);
  };

  const getFreightForwarderAddress = async () => {
    const response = await ordersApi.freightForwarderAddress(1);
    setWarehouse(response.current_country_address.country as number);
    setFreightForwarderAddress(response);
  };

  const getDomesticShippingFee = async () => {
    const data = {
      items: route.params.items,
    };
    const response = await ordersApi.calcDomesticShippingFee(data);
    // 转换响应数据以匹配 DomesticShippingFeeData 类型
    const domesticShippingFeeData: DomesticShippingFeeData = {
      total_shipping_fee: response.total_shipping_fee_air || 0,
      currency: response.currency || '',
      // 添加其他必要的属性
    };
    setDomesticShippingFee(domesticShippingFeeData);
  };

  const getPaymentMethods = async () => {
    try {
      const response = await payApi.getCountryPaymentMethods();
      setPaymentMethods(response);
      // 设置默认支付方式选项
      setTabs([
        {
          id: "online",
          label: "Online Payment",
          options: response.current_country_methods.map(method => ({
            id: method.key,
            label: method.key,
            icon: getPaymentIcon(method.key),
            value: method.value
          }))
        },
        {
          id: "offline",
          label: "Offline Payment",
          options: []
        }
      ]);
    } catch (error) {
      console.error('获取支付方式失败:', error);
    }
  };

  const getPaymentIcon = (key: string): string => {
    switch (key) {
      case 'Brainnel Pay(Mobile Money)':
        return '💳';
      case 'Wave':
        return '💸';
      case 'Paypal':
        return '🅿️';
      case 'Bank Card Payment':
        return '💳';
      default:
        return '💰';
    }
  };

  useEffect(() => {
    getAddress();
    getAddressList();
    getOrders();
    getFreightForwarderAddress();
    getDomesticShippingFee();
    getPaymentMethods();
    const listener = (data: any) => {
      if (data.type === "add") {
        data.address_id = new Date().getTime();
        setAddressList((prevList) => [data, ...(prevList || [])]);
      } else {
        console.log(data);
      }
    };
    eventBus.on("address-added", listener);
    return () => {
      eventBus.off("address-added", listener);
    };
  }, []);

  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [currency, setCurrency] = useState("usd");
  const [actualPayment, setActualPayment] = useState<string | null>(null);
  const [mobileNumber, setMobileNumber] = useState("");
  const [countryCode, setCountryCode] = useState("225");

  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [appliedCoupons, setAppliedCoupons] = useState<{
    code: string;
    name: string;
    discount: number;
    type: 'percent' | 'fixed';
  }[]>([]);
  const [orderTotal, setOrderTotal] = useState(121.97);
  const [originalTotal] = useState(121.97);
  const [subtotal] = useState(96.47);
  const [domesticShipping] = useState(25.5);
  const [internationalShipping] = useState(45.0);

  const validCoupons: {
    [key: string]: {
      discount: number;
      type: 'percent' | 'fixed';
      name: string;
    };
  } = {
    WELCOME10: { discount: 10, type: "percent", name: "Welcome 10% Off" },
    SAVE20: { discount: 20, type: "fixed", name: "$20 Off" },
    FREESHIP: { discount: 25.5, type: "fixed", name: "Free Domestic Shipping" },
  };

  const addCoupon = (code: string) => {
    if (appliedCoupons.find((c) => c.code === code)) {
      alert("This coupon is already applied.");
      return;
    }

    const couponInfo = validCoupons[code];
    const newCoupons = [
      ...appliedCoupons,
      {
        code: code,
        name: couponInfo.name,
        discount: couponInfo.discount,
        type: couponInfo.type,
      },
    ];

    setAppliedCoupons(newCoupons);
    updateTotalWithDiscounts(newCoupons);
  };

  const removeCoupon = (code: string) => {
    const newCoupons = appliedCoupons.filter((c) => c.code !== code);
    setAppliedCoupons(newCoupons);
    updateTotalWithDiscounts(newCoupons);
  };

  const updateTotalWithDiscounts = (coupons: typeof appliedCoupons) => {
    let totalDiscount = 0;

    coupons.forEach((coupon) => {
      if (coupon.type === "percent") {
        totalDiscount += (subtotal * coupon.discount) / 100;
      } else {
        totalDiscount += coupon.discount;
      }
    });

    totalDiscount = Math.min(totalDiscount, subtotal + domesticShipping);
    const newTotal = originalTotal - totalDiscount;
    setOrderTotal(newTotal);
  };

  const isCouponApplied = (code: string) => {
    return appliedCoupons.some((c) => c.code === code);
  };

  // 判断有没有地址
  const addRessHandel = () => {
    if (defaultAddress) {
      setShowModal(true);
    } else {
      navigation.navigate("AddRess");
    }
  };
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const deleteAddress = async (address_id: number) => {
    setAddressList(
      addressList?.filter((item) => item.address_id !== address_id)
    );
    addressApi.deleteAddress(address_id);
  };
  const changeCountryHandel = async (value: number) => {
    const data = {
      items: route.params.items,
      country_code: value,
    };
    const response = await ordersApi.calcShippingFee(data);
    if (orderData) {
      setOrderData({
        ...orderData,
        shipping_fee_sea: response?.total_shipping_fee_sea,
        shipping_fee_air: response?.total_shipping_fee_air,
      });
    }
  };
  // 创建订单
  const createOrder = async () => {
    
    if (!defaultAddress) {
      Alert.alert(t('order.preview.login_required'), t('order.preview.add_recipient_required'));
      return;
    }
    if (!selectedPayment) {
      Alert.alert(t('order.preview.login_required'), t('order.preview.select_payment_required'));
      return;
    }  

    console.log(orderData)

    // 构建订单数据
    const submitOrderData = {

      address_id: defaultAddress.address_id,
      transport_type: shippingMethod === "sea" ? 1 : 2,
      
      items: orderData?.items.map(item => ({
        offer_id: item.offer_id,
        cart_item_id: item.cart_item_id,
        sku_id: item.sku_id,
        product_name: item.product_name,
        product_name_en: item.product_name_en,
        product_name_ar: item.product_name_ar,
        product_name_fr: item.product_name_fr,
        product_image: item.sku_image_url,
        sku_attributes: item.attributes.map(attr => ({
          attribute_name: attr.attribute_name,
          attribute_value: attr.value
        })),
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      })) || [],
      buyer_message: "",
      payment_method: selectedPayment,
      create_payment: true,
      total_amount: orderData?.total_amount || 0,
      actual_amount: (
        (orderData?.total_amount ?? 0) +
        (shippingMethod === 'sea' 
          ? orderData?.shipping_fee_sea ?? 0 
          : orderData?.shipping_fee_air ?? 0) +
        (domesticShippingFee?.total_shipping_fee ?? 0)
      ),
      discount_amount: 0,
      shipping_fee: shippingMethod === 'sea' 
        ? orderData?.shipping_fee_sea ?? 0 
        : orderData?.shipping_fee_air ?? 0,
      domestic_shipping_fee: domesticShippingFee?.total_shipping_fee || 0,
      currency: domesticShippingFee?.currency || 'USD',
      receiver_address: `${defaultAddress.country} ${defaultAddress.province || ''} ${defaultAddress.city || ''} ${defaultAddress.detail_address || ''}`
    };
    setOrder(submitOrderData);
    navigation.navigate('ConfirmOrder');
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <BackIcon size={20} />
          </TouchableOpacity>
          <Text style={styles.title}>Checkout</Text>
        </View>

        {/* Recipient Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>👤</Text>
            <Text style={styles.sectionTitle}>Recipient Information</Text>
          </View>

          {defaultAddress && (
            <View style={styles.recipientInfo}>
              <View style={styles.recipientInfoIcon}>
                <AddressIcon size={25} />
              </View>
              <View style={styles.recipientInfoText}>
                <Text style={{ fontSize: fontSize(16), color: "#a0a5ab" }}>
                  {defaultAddress?.receiver_first_name} .{" "}
                  {defaultAddress?.receiver_last_name}
                </Text>
                <Text style={{ fontSize: fontSize(20), paddingVertical: 4 }}>
                  {defaultAddress?.country}
                </Text>
                <Text style={{ fontSize: fontSize(16), color: "#a0a5ab" }}>
                  {defaultAddress?.receiver_phone}
                </Text>
              </View>
            </View>
          )}
          <TouchableOpacity style={styles.addRecipient} onPress={addRessHandel}>
            <Text style={styles.addRecipientIcon}>＋</Text>
            <Text style={styles.addRecipientText}>
              Add Recipient Information
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.border}></View>

        {/* Shipping Method */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🚢</Text>
            <Text style={styles.sectionTitle}>Shipping Method</Text>
          </View>
          <View style={styles.shippingOptions}>
            {[
              {
                id: "sea",
                label: "Sea Shipping",
                icon: "🚢",
                detail: "Economical",
              },
              {
                id: "air",
                label: "Air Shipping",
                icon: "✈️",
                detail: "Express",
              },
            ].map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.shippingCard,
                  shippingMethod === option.id && styles.shippingCardSelected,
                ]}
                onPress={() => {
                  setShippingMethod(option.id);
                }}
              >
                {index === 0 && (
                  <View style={styles.locationPin}>
                    <LocationPinIcon size={20} />
                  </View>
                )}
                <Text style={styles.shippingIcon}>{option.icon}</Text>
                <Text style={styles.shippingLabel}>{option.label}</Text>
                <Text style={styles.shippingDetail}>{option.detail}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.border}></View>

        {/* Warehouse Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🏭</Text>
            <Text style={styles.sectionTitle}>Delivery Warehouse</Text>
          </View>
          <View style={{ marginTop: 12 }}>
            <View style={styles.selectBox}>
              <Text style={styles.selectLabel}>Select a warehouse:</Text>
              <View style={styles.selectWrapper}>
                <Picker
                  selectedValue={warehouse}
                  onValueChange={(value) => {
                    setWarehouse(value);
                    changeCountryHandel(value);
                  }}
                >
                  {freightForwarderAddress?.other_addresses.map(
                    (item, index) => (
                      <Picker.Item
                        label={item.country}
                        value={item.country_code}
                        key={index}
                      />
                    )
                  )}
                </Picker>
              </View>
            </View>

            {warehouse && (
              <View style={styles.shippingInfo}>
                <Text style={styles.shippingInfoRow}>
                  <Text style={styles.shippingInfoLabel}>
                    Estimated Arrival:{" "}
                  </Text>
                  <Text style={{ flex: 1, textAlign: "left", marginLeft: 10 }}>
                    {shippingMethod === "sea"
                      ? orderData?.shipping_fee_sea_time
                      : orderData?.shipping_fee_air_time}
                  </Text>
                </Text>

                <View style={styles.shippingInfoRow}>
                  <Text style={styles.shippingInfoLabel}>
                    International Fee:{" "}
                  </Text>
                  <Text
                    style={{
                      color: "#ff6000",
                      flex: 1,
                      textAlign: "left",
                      marginLeft: 10,
                      fontWeight: "600",
                    }}
                  >
                    {shippingMethod === "sea"
                      ? orderData?.shipping_fee_sea
                      : orderData?.shipping_fee_air}
                  </Text>

                  <Text style={{ color: "#ff6000" }}>(Cash on Delivery)</Text>
                </View>
              </View>
            )}
          </View>
        </View>
        <View style={styles.border}></View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>💳</Text>
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
          
          {/* 选项卡 */}
          <View style={styles.tabContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabButton,
                  currentTab === tab.id && styles.tabButtonActive
                ]}
                onPress={() => setCurrentTab(tab.id)}
              >
                <Text style={[
                  styles.tabText,
                  currentTab === tab.id && styles.tabTextActive
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 支付选项 */}
          <View style={styles.paymentOptions}>
            {tabs.find(tab => tab.id === currentTab)?.options.map((option) => (
              <PaymentMethodItem
                key={option.id}
                option={option}
                isSelected={selectedPayment === option.id}
                onSelect={() => setSelectedPayment(option.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.border}></View>

        <View style={styles.section}>
          <View style={styles.section1}>
            <View style={styles.sectionHeader1}>
              <Text style={styles.sectionIcon1}>📦</Text>
              <Text style={styles.sectionTitle1}>Order Summary</Text>
            </View>

            <View style={styles.setOrderContent}>
              <Text style={styles.noCouponsMessage}>
                Products({orderData?.items.length} items)
              </Text>
              <TouchableOpacity onPress={toggleExpanded}>
                <Text style={styles.sectionAction}>
                  {expanded ? "Hide Details" : "View Details"}
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={[styles.orderItems, expanded && styles.orderItemsExpanded]}
            >
              {orderData?.items.map((item) => (
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
                    {item.attributes.map((attribute) => (
                      <Text
                        style={styles.itemVariant}
                        key={attribute?.value}
                        numberOfLines={1}
                      >
                        {attribute?.attribute_name}: {attribute?.value}
                      </Text>
                    ))}
                    <Text style={styles.itemQuantity}>
                      Qty: {item.quantity}
                    </Text>
                  </View>

                  <View style={styles.itemPrices}>
                    <Text style={styles.itemPrice}>${item?.total_price}</Text>
                    <Text style={styles.itemShipping}>
                      {/* +${item?.shipping.toFixed(2)} domestic */}
                    </Text>
                    <Text style={styles.shippingNote}>
                      Supplier to warehouse shipping
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.border}></View>
        <View style={styles.section}>
          <View style={styles.section1}>
            <View style={styles.sectionHeader1}>
              <Text style={styles.sectionIcon1}>🎟️</Text>
              <Text style={styles.sectionTitle1}>Coupons</Text>
              <TouchableOpacity onPress={() => setCouponModalVisible(true)}>
                <Text style={[styles.sectionAction, { marginRight: 12 }]}>
                  Select
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionContent}>
              {appliedCoupons.length === 0 ? (
                <Text style={styles.noCouponsMessage}>
                  No coupons applied. Click "Select" to browse available
                  coupons.
                </Text>
              ) : null}

              <View style={styles.appliedCoupons}>
                {appliedCoupons.map((coupon) => (
                  <View key={coupon.code} style={styles.couponTag}>
                    <Text style={styles.couponTagName}>{coupon.name}</Text>
                    <Text style={styles.couponTagDiscount}>
                      {coupon.type === "percent"
                        ? `${coupon.discount}% Off`
                        : `$${coupon.discount.toFixed(2)} Off`}
                    </Text>
                    <TouchableOpacity onPress={() => removeCoupon(coupon.code)}>
                      <Text style={styles.couponDelete}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.priceBox}>
              <View style={styles.priceBox1}>
                <Text>Subtotal</Text>
                <Text>{orderData?.total_amount}</Text>
              </View>
              <View style={styles.priceBox1}>
                <Text>Domestic Shipping</Text>
                {domesticShippingFee?.currency ? (
                  <Text>{domesticShippingFee?.total_shipping_fee}</Text>
                ) : (
                  <Text>{t('order.preview.calculating')}</Text>
                )}
              </View>

              <View style={styles.priceBox1}>
                <Text>Estimated International Shipping</Text>
                <Text>
                  {shippingMethod === "sea"
                    ? orderData?.shipping_fee_sea
                    : orderData?.shipping_fee_air}
                </Text>
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
                  Total
                </Text>
                <Text
                  style={{
                    fontSize: fontSize(18),
                    fontWeight: "600",
                    color: "#ff6000",
                  }}
                >
                  {(
                    (orderData?.total_amount ?? 0) +
                    (shippingMethod === "sea"
                      ? orderData?.shipping_fee_sea ?? 0
                      : orderData?.shipping_fee_air ?? 0) +
                    (domesticShippingFee?.total_shipping_fee ?? 0)
                  ).toFixed(2)}
                </Text>
              </View>
              <View style={styles.remarks}>
                <Text style={styles.remarksText}>
                  + $
                  {shippingMethod === "sea"
                    ? orderData?.shipping_fee_sea
                    : orderData?.shipping_fee_air}{" "}
                  Estimated International Shipping
                </Text>
              </View>
            </View>

            {/* Coupon Modal */}
            <Modal
              visible={couponModalVisible}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setCouponModalVisible(false)}
            >
              <View style={styles.couponModal}>
                <View style={styles.couponModalContainer}>
                  <View style={styles.couponModalHeader}>
                    <Text style={styles.couponModalTitle}>
                      Available Coupons
                    </Text>
                    <TouchableOpacity
                      onPress={() => setCouponModalVisible(false)}
                    >
                      <Text style={styles.couponModalClose}>×</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.couponModalBody}>
                    <View style={styles.availableCoupons}>
                      <View style={styles.couponCard}>
                        <View style={styles.couponInfo}>
                          <Text style={styles.couponName}>Welcome 10% Off</Text>
                          <Text style={styles.couponDiscount}>
                            10% off your total order
                          </Text>
                          <Text style={styles.couponExpiry}>
                            Valid until: 31/12/2023
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.couponUseBtn,
                            isCouponApplied("WELCOME10") &&
                              styles.couponUsedBtn,
                          ]}
                          onPress={() => addCoupon("WELCOME10")}
                          disabled={isCouponApplied("WELCOME10")}
                        >
                          <Text style={styles.couponUseBtnText}>
                            {isCouponApplied("WELCOME10") ? "Used" : "Use"}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.couponCard}>
                        <View style={styles.couponInfo}>
                          <Text style={styles.couponName}>$20 Off</Text>
                          <Text style={styles.couponDiscount}>
                            $20 off your order over $100
                          </Text>
                          <Text style={styles.couponExpiry}>
                            Valid until: 30/11/2023
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.couponUseBtn,
                            isCouponApplied("SAVE20") && styles.couponUsedBtn,
                          ]}
                          onPress={() => addCoupon("SAVE20")}
                          disabled={isCouponApplied("SAVE20")}
                        >
                          <Text style={styles.couponUseBtnText}>
                            {isCouponApplied("SAVE20") ? "Used" : "Use"}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.couponCard}>
                        <View style={styles.couponInfo}>
                          <Text style={styles.couponName}>
                            Free Domestic Shipping
                          </Text>
                          <Text style={styles.couponDiscount}>
                            Free domestic shipping on your order
                          </Text>
                          <Text style={styles.couponExpiry}>
                            Valid until: 15/12/2023
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.couponUseBtn,
                            isCouponApplied("FREESHIP") && styles.couponUsedBtn,
                          ]}
                          onPress={() => addCoupon("FREESHIP")}
                          disabled={isCouponApplied("FREESHIP")}
                        >
                          <Text style={styles.couponUseBtnText}>
                            {isCouponApplied("FREESHIP") ? "Used" : "Use"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </ScrollView>
                </View>
              </View>
            </Modal>
          </View>
        </View>

        {/* Modal 表单 */}
        <Modal visible={showModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.formContainer}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>选择收件人</Text>
              </View>

              <View style={styles.formBody}>
                <View style={styles.container1}>
                  <View style={styles.recipientSelectionContainer}>
                    <View style={styles.recipientSelectorContainer}>
                      <View>
                        <ScrollView
                          style={{ height: 300 }}
                          showsVerticalScrollIndicator={false}
                        >
                          {addressList?.map((item) => (
                            <View key={item.address_id}>
                              <TouchableOpacity
                                onPress={() => {
                                  setAddressId(item.address_id);
                                }}
                              >
                                <View
                                  style={[
                                    styles.userCardContainer,
                                    addressId === item.address_id
                                      ? styles.addressItemSelected
                                      : styles.addressItemNoSelected,
                                  ]}
                                >
                                  <View style={styles.userInfoCard}>
                                    <View style={styles.userCardInfo2}>
                                      <Text
                                        style={styles.userCardInfo}
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                      >
                                        {item.country}{" "}
                                        {item.receiver_first_name} .{" "}
                                        {item.receiver_last_name}
                                      </Text>
                                      <Text
                                        style={styles.userCardInfo1}
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                      >
                                        {item.receiver_phone}
                                      </Text>
                                      <View style={styles.addressEmit}>
                                        <Text>设置默认地址</Text>
                                        <TouchableOpacity
                                          onPress={() =>
                                            deleteAddress(item.address_id)
                                          }
                                        >
                                          <Text>删除</Text>
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                    {item.is_default === 1 && (
                                      <View style={styles.centeredBoxWithText}>
                                        <Text
                                          style={styles.blueHeadingTextStyle}
                                        >
                                          默认
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                  <TouchableOpacity
                                    onPress={() => {
                                      setShowModal(false),
                                        navigation.navigate("AddRess", {
                                          address: item,
                                        });
                                    }}
                                  >
                                    <View style={styles.svgContainer}>
                                      <FileEditIcon size={24} />
                                    </View>
                                  </TouchableOpacity>
                                </View>
                              </TouchableOpacity>
                            </View>
                          ))}
                        </ScrollView>

                        <TouchableOpacity
                          onPress={() => {
                            setShowModal(false), navigation.navigate("AddRess");
                          }}
                        >
                          <View style={styles.cardContainerWithTextAndIcon1}>
                            <View style={styles.addCardRecipientText}>
                              <PlusIcon size={24} />

                              <Text style={styles.addCard}>新增收件人</Text>
                            </View>
                          </View>
                        </TouchableOpacity>

                        {/* Placeholder for additional button component */}
                      </View>
                    </View>

                    <View style={styles.actionButtonsContainer}>
                      {/* Cancel Button */}
                      <TouchableOpacity
                        style={styles.cancelButtonStyle}
                        onPress={() => setShowModal(false)}
                      >
                        <Text style={styles.cancelButtonText}>取消</Text>
                      </TouchableOpacity>

                      {/* Confirm Button */}
                      <TouchableOpacity
                        style={styles.confirmButtonStyle}
                        onPress={() => {
                          setShowModal(false),
                            setDefaultAddress(
                              addressList?.find(
                                (item) => item.address_id === addressId
                              )
                            );
                        }}
                      >
                        <Text style={styles.confirmButtonText}>确认</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.border}></View>

        <TouchableOpacity
          style={styles.bottomButton}
          disabled={!domesticShippingFee?.currency}
          onPress={createOrder}
        >
          <View style={styles.bottomButtonContent}>
            <Text style={styles.bottomButtonText}>
              {domesticShippingFee?.currency ? "确认订单" : "报价中..."}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    elevation: 3,
  },
  back: { fontSize: fontSize(20), marginRight: 16 },
  title: {
    fontSize: fontSize(18),
    fontWeight: "500",
    flex: 1,
    textAlign: "center",
  },

  section: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingLeft: 16,
    paddingRight: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 12,
  },
  sectionIcon: { marginRight: 8, fontSize: fontSize(18) },
  sectionTitle: { flex: 1, fontSize: fontSize(15), fontWeight: "500" },
  sectionAction: {
    color: "#ff6000",
    fontSize: fontSize(13),
    fontWeight: "500",
  },
  paymentOptions: {
    marginTop: 12,
    flexDirection: 'column',
  },
  recipientInfo: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    width: "100%",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  recipientInfoIcon: {
    marginRight: 12,
  },
  recipientInfoText: {
    flex: 1,
    fontSize: fontSize(18),
  },

  addRecipient: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 6,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  addRecipientIcon: {
    fontSize: fontSize(20),
    color: "#ff6000",
    marginRight: 6,
  },
  addRecipientText: { fontSize: fontSize(14), color: "#666" },

  shippingOptions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    marginTop: 12,
  },
  shippingCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  shippingCardSelected: { borderColor: "#ff6000", backgroundColor: "#fff8f3" },
  shippingIcon: { fontSize: fontSize(22), marginBottom: 6 },
  shippingLabel: { fontSize: fontSize(14), fontWeight: "500" },
  shippingDetail: { fontSize: fontSize(12), color: "#888", marginTop: 3 },

  selectBox: { marginBottom: 12 },
  selectLabel: { fontSize: fontSize(14), marginBottom: 6, color: "#666" },
  selectWrapper: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  shippingInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 6,
  },
  shippingInfoRow: {
    fontSize: fontSize(13),
    marginBottom: 6,
    color: "#333",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  shippingInfoLabel: {
    color: "#777",
    fontWeight: "500",
    fontSize: fontSize(13),
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  formContainer: {
    width: "90%",
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  closeButton: { fontSize: fontSize(20), color: "#555" },
  formTitle: {
    flex: 1,
    fontSize: fontSize(16),
    fontWeight: "500",
    textAlign: "center",
  },

  formBody: { padding: 16 },
  formGroup: { marginBottom: 16 },
  formLabel: { marginBottom: 6, fontSize: fontSize(14), color: "#666" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 12,
    fontSize: fontSize(14),
    backgroundColor: "#fff",
  },

  checkboxRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  checkboxLabel: { marginLeft: 8, fontSize: fontSize(13), color: "#666" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  formFooter: { padding: 16 },
  confirmButton: { backgroundColor: "#0945b5", borderRadius: 6, padding: 14 },
  confirmText: {
    color: "#fff",
    textAlign: "center",
    fontSize: fontSize(15),
    fontWeight: "500",
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    backgroundColor: '#fff',
    width: '100%',
  },
  paymentSelected: {
    backgroundColor: '#fff8f3',
    borderColor: '#ff8c47',
  },

  paymentIcon: { fontSize: fontSize(24), marginRight: 8 },
  paymentLabel: { fontSize: fontSize(16), fontWeight: '500' },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
    marginRight: 4,
  },
  tabButtonActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: fontSize(14),
    color: '#666',
  },
  tabTextActive: {
    color: '#000',
    fontWeight: '500',
  },
  mobileForm: { marginTop: 12 },
  countryCode: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
  },

  currencyButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginRight: 10,
    backgroundColor: "#fff",
  },
  currencyButtonSelected: {
    borderColor: "#ff6000",
    backgroundColor: "#fff8f3",
  },

  actualPaymentBox: {
    padding: 12,
    borderRadius: 6,
    backgroundColor: "#fff8f4",
  },
  actualPaymentBox1: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  remarks: {
    marginTop: 6,
  },
  remarksText: {
    color: "#666",
    fontSize: fontSize(16),
    fontWeight: "500",
  },

  section1: {
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
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
  setOrderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  sectionTitle1: {
    fontSize: fontSize(15),
    fontWeight: "500",
    flex: 1,
  },
  sectionAction1: {
    color: "#ff6000",
    fontSize: fontSize(13),
    fontWeight: "500",
  },
  sectionContent: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  noCouponsMessage: {
    color: "#888",
    fontSize: fontSize(13),
    marginBottom: 10,
  },

  // Applied coupons styles
  appliedCoupons: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  couponTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff8f3",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#ff6000",
    borderRadius: 4,
    padding: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  couponTagName: {
    color: "#ff6000",
    fontWeight: "500",
    marginRight: 8,
    fontSize: fontSize(13),
  },
  couponTagDiscount: {
    color: "#ff6000",
    fontSize: fontSize(13),
  },
  couponDelete: {
    color: "#777",
    fontSize: fontSize(16),
    marginLeft: 8,
  },

  // Coupon modal styles
  couponModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  couponModalContainer: {
    backgroundColor: "#fff",
    width: "90%",
    maxHeight: "80%",
    borderRadius: 12,
    overflow: "hidden",
  },
  couponModalHeader: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  couponModalTitle: {
    fontSize: fontSize(16),
    fontWeight: "500",
  },
  couponModalClose: {
    fontSize: fontSize(20),
    color: "#777",
  },
  couponModalBody: {
    padding: 15,
  },

  // Available coupons styles
  availableCoupons: {
    gap: 12,
  },
  couponCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#fff8f3",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#ff6000",
    borderRadius: 8,
  },
  couponInfo: {
    flex: 1,
  },
  couponName: {
    fontWeight: "500",
    color: "#ff6000",
    fontSize: fontSize(15),
    marginBottom: 3,
  },
  couponDiscount: {
    fontSize: fontSize(13),
    color: "#666",
  },
  couponExpiry: {
    fontSize: fontSize(11),
    color: "#999",
    marginTop: 4,
  },
  couponUseBtn: {
    backgroundColor: "#ff6000",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 4,
    fontWeight: "500",
    marginLeft: 10,
  },
  couponUsedBtn: {
    backgroundColor: "#ccc",
  },
  couponUseBtnText: {
    color: "white",
    fontSize: fontSize(13),
    fontWeight: "500",
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
    color: "#ff6000",
    fontSize: fontSize(15),
    marginBottom: 5,
  },
  itemShipping: {
    fontSize: fontSize(12),
    color: "#777",
  },
  shippingNote: {
    fontSize: fontSize(11),
    color: "#888",
    marginTop: 2,
    fontStyle: "italic",
  },
  priceBox: {
    borderRadius: 10,
  },
  priceBox1: {
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  container1: {
    width: "100%",
  },
  recipientSelectionContainer: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  recipientSelectorContainer: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  recipientSelectionTitle: {
    alignSelf: "center",
    fontSize: fontSize(20),
    lineHeight: fontSize(22),
    fontFamily: "PingFang SC",
    fontWeight: "600",
    color: "black",
  },
  userCardContainer1: {
    marginTop: 20,
  },
  addressItemSelected: {
    borderColor: "#002fa7",
    borderWidth: 2,
  },
  addressItemNoSelected: {
    borderColor: "#d0d0d0",
    borderWidth: 2,
  },
  userCardContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
    paddingTop: 15,
    paddingRight: 10,
    paddingBottom: 10,
    paddingLeft: 11,
    backgroundColor: "white",
    borderRadius: 5,
    marginBottom: 10,
  },
  userInfoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    flex: 1,
    marginRight: 8,
  },
  userCardInfo2: {
    flex: 1,
    marginRight: 8,
  },
  userCardInfo: {
    fontSize: fontSize(18),
    lineHeight: fontSize(22),
    fontFamily: "PingFang SC",
    fontWeight: "500",
    color: "black",
    flex: 1,
  },
  userCardInfo1: {
    fontSize: fontSize(18),
    lineHeight: fontSize(22),
    fontFamily: "PingFang SC",
    fontWeight: "500",
    color: "#6b7280",
    marginTop: 10,
    flex: 1,
    width: "100%",
  },
  centeredBoxWithText: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    height: 26,
    paddingRight: 11,
    paddingLeft: 11,
    marginLeft: 8,
    backgroundColor: "#edf3ff",
    borderRadius: 5,
  },
  blueHeadingTextStyle: {
    fontSize: fontSize(13),
    fontFamily: "PingFang SC",
    fontWeight: "500",
    color: "#002fa7",
  },
  svgContainer: {
    width: widthUtils(24, 24).width,
    height: widthUtils(24, 24).height,
    color: "#0051ff",
    marginLeft: "auto",
  },
  addressEmit: {
    paddingTop: 10,
    flexDirection: "row",
    gap: 10,
  },
  cardContainerWithTextAndIcon: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
    paddingTop: 16,
    paddingRight: 10,
    paddingBottom: 19,
    paddingLeft: 11,
    marginTop: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 5,
  },
  cardContainerWithTextAndIcon1: {
    gap: 8,
    justifyContent: "space-between",
    width: "100%",
    paddingTop: 16,
    paddingRight: 10,
    paddingBottom: 19,
    paddingLeft: 11,
    marginTop: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderStyle: "dashed",
    borderRadius: 5,
    alignItems: "center",
    flexDirection: "row",
  },
  addCardRecipientText: {
    width: "100%",
    textAlign: "center",
    fontSize: fontSize(16),
    lineHeight: fontSize(22),
    fontFamily: "PingFang SC",
    fontWeight: "500",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  addCard: {
    alignItems: "center",
    color: "#002fa7",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    width: "100%",
    justifyContent: "center",
    gap: 20,
  },
  cancelButtonStyle: {
    width: "40%",
    height: widthUtils(50, 160).height,
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Source Han Sans CN",
    fontSize: fontSize(16),
    lineHeight: fontSize(22),
    fontWeight: "500",
    color: "#333333",
    backgroundColor: "#f2f3f5",
    borderRadius: 25,
  },
  confirmButtonStyle: {
    width: "40%",
    height: widthUtils(50, 160).height,
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Source Han Sans CN",
    fontSize: fontSize(16),
    lineHeight: fontSize(22),
    fontWeight: "500",
    color: "white",
    backgroundColor: "#002fa7",
    borderRadius: 25,
  },
  cancelButtonText: {
    fontFamily: "Source Han Sans CN",
    fontSize: fontSize(16),
    lineHeight: fontSize(22),
    fontWeight: "500",
    color: "#333333",
  },
  confirmButtonText: {
    fontFamily: "Source Han Sans CN",
    fontSize: fontSize(16),
    lineHeight: fontSize(22),
    fontWeight: "500",
    color: "white",
  },
  locationPin: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
  },
  border: {
    height: 6,
    backgroundColor: "#f5f5f5",
    marginTop: 12,
  },
  bottomButton: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  bottomButtonContent: {
    backgroundColor: "#ff611a",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 25,
  },
  bottomButtonText: {
    color: "#fff",
    fontSize: fontSize(16),
    fontWeight: "500",
  },
  paymentContent: {
    flex: 1,
  },
  brainnelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLogo: {
    height: 30,
    width: 100,
    resizeMode: 'contain',
  },
  paymentDescription: {
    fontSize: fontSize(12),
    color: '#666',
    marginLeft: 8,
  },
  operatorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  operatorBox: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  soldesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceText: {
    marginLeft: 8,
    fontSize: fontSize(14),
    color: '#666',
  },
  cardTypesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  cardTypeIcon: {
    height: 24,
    width: 36,
    resizeMode: 'contain',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
  radioInnerSelected: {
    backgroundColor: '#ff8c47',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTypeBox: {
    padding: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  cardTypeText: {
    fontSize: fontSize(12),
    color: '#666',
  },
  defaultPaymentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  operatorText: {
    fontSize: fontSize(12),
    color: '#666',
  },
});
