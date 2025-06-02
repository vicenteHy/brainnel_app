import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  SafeAreaView,
  Alert,
  Platform,
  StatusBar,
  Image,
} from "react-native";
import { useState, useEffect } from "react";
import fontSize from "../../utils/fontsizeUtils";
import LocationPinIcon from "../../components/LocationPinIcon";
import ShipIcon from "../../components/ShipIcon";
import PlaneIcon from "../../components/PlaneIcon";
import DeliveryIcon from "../../components/DeliveryIcon";
import WarehouseIcon from "../../components/WarehouseIcon";
import PaymentIcon from "../../components/PaymentIcon";
import DropdownIcon from "../../components/DropdownIcon";
import {
  AddressDataItem,
  Address,
  CartShippingFeeData,
  DomesticShippingFeeData,
} from "../../services/api/orders";
import usePreviewShippingStore from "../../store/previewShipping";
import BackIcon from "../../components/BackIcon";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import useCreateOrderStore from "../../store/createOrder";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import useUserStore from "../../store/user";
import { useTranslation } from "react-i18next";
import { getCurrentLanguage } from "../../i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useBurialPointStore from "../../store/burialPoint";

type RootStackParamList = {
  ShippingFee: { cart_item_id: any; totalAmount?: number; isFei?: boolean };
  PaymentMethod: { freight_forwarder_address_id: number; isFei?: boolean };
};
type ShippingFeeParams = {
  cart_item_id: any;
  totalAmount: number;
};

export const ShippingFee = () => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "ShippingFee">>();
  const {
    fetchFreightForwarderAddress,
    state,
    calculateShippingFee,
    calculateDomesticShippingFee,
    clearShippingFees,
  } = usePreviewShippingStore();
  const [shippingMethod, setShippingMethod] = useState("sea");
  const [warehouse, setWarehouse] = useState<string>();
  const [freightForwarderAddress, setFreightForwarderAddress] =
    useState<AddressDataItem>();

  const [shippingFeeData, setShippingFeeData] = useState<CartShippingFeeData>();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWarehouseLabel, setSelectedWarehouseLabel] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<Address>();
  const [domesticShippingFeeData, setDomesticShippingFeeData] =
    useState<DomesticShippingFeeData>();
  const [isShippingFeeLoading, setIsShippingFeeLoading] = useState(false);
  const [count, setCount] = useState<string>();

  const { setOrderData, orderData, items } = useCreateOrderStore();
  const [countryCode, setCountryCode] = useState<number>();
  const userStore = useUserStore();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(false);

  const getFreightForwarderAddress = async () => {
    const transportMode = shippingMethod === "sea" ? 0 : 1;
    await fetchFreightForwarderAddress(transportMode);
  };

  useEffect(() => {
    getFreightForwarderAddress();
  }, []);

  useEffect(() => {
    if (state.freightForwarderAddress) {
      console.log(state.freightForwarderAddress.other_addresses);

      setFreightForwarderAddress(state.freightForwarderAddress);
      // Set the first item as default
      if (
        state.freightForwarderAddress.other_addresses &&
        state.freightForwarderAddress.other_addresses.length > 0
      ) {
        const firstItem = state.freightForwarderAddress.other_addresses[0];
        const label =
          (getCurrentLanguage() === "fr"
            ? firstItem.country_name
            : firstItem.country_name_en) +
          " | " +
          firstItem.city +
          (firstItem.detail_address ? (" | " + firstItem.detail_address) : "");
        setWarehouse(label);
        setSelectedWarehouseLabel(label);
        setCountryCode(firstItem.country_code);
      }
    }
  }, [state.freightForwarderAddress]);

  useEffect(() => {
    if (state.shippingFees) {
      setShippingFeeData(state.shippingFees);
    }
  }, [state.shippingFees]);

  useEffect(() => {
    if (state.domesticShippingFees) {
      setDomesticShippingFeeData(state.domesticShippingFees);
    }
  }, [state.domesticShippingFees]);

  // 统一处理loading状态
  useEffect(() => {
    if (
      state.shippingFees &&
      state.domesticShippingFees &&
      isShippingFeeLoading
    ) {
      setIsShippingFeeLoading(false);
    }
  }, [state.shippingFees, state.domesticShippingFees, isShippingFeeLoading]);

  // Call changeCountryHandel when warehouse changes
  useEffect(() => {
    if (warehouse && freightForwarderAddress?.other_addresses) {
      changeCountryHandel(warehouse);
    }
  }, [warehouse, freightForwarderAddress]);

  // 当运输方式改变时重新获取货代中心
  useEffect(() => {
    const transportMode = shippingMethod === "sea" ? 0 : 1;
    fetchFreightForwarderAddress(transportMode);
  }, [shippingMethod]);

  const changeCountryHandel = async (value: string) => {
    if (value && freightForwarderAddress?.other_addresses) {
      const selectedWarehouse = freightForwarderAddress.other_addresses.find(
        (item) =>
          ((getCurrentLanguage() === "fr"
            ? item.country_name
            : item.country_name_en) +
            " | " +
            item.city +
            (item.detail_address ? (" | " + item.detail_address) : "")) === value
      );

      setSelectedWarehouse(selectedWarehouse);

      if (selectedWarehouse && items) {
        const data = {
          items: items,
          freight_forwarder_address_id: selectedWarehouse.address_id,
        };

        // Only calculate if we have the necessary data
        if (data.items && data.freight_forwarder_address_id) {
          // 设置loading状态为true，开始计算
          setIsShippingFeeLoading(true);
          setCount(t("order.shipping.calculating"));

          // 清空store中的旧数据，确保loading状态正确
          clearShippingFees();

          // 清空之前的运费数据，确保loading状态正确
          setShippingFeeData(undefined);
          setDomesticShippingFeeData(undefined);

          calculateShippingFee(data);
          calculateDomesticShippingFee(data);
        }
      }
    }
  };

  const handleSelectWarehouse = (countryCode: number, label: string) => {
    setWarehouse(label);
    setSelectedWarehouseLabel(label);
    setCountryCode(countryCode);
    setModalVisible(false);
  };

  const handleSubmit = () => {
    if (
      !isShippingFeeLoading &&
      domesticShippingFeeData?.total_shipping_fee != null
    ) {
      setOrderData({
        ...orderData,
        transport_type: shippingMethod === "sea" ? 0 : 1,
        domestic_shipping_fee: domesticShippingFeeData?.total_shipping_fee,
        shipping_fee:
          shippingMethod === "sea"
            ? shippingFeeData?.total_shipping_fee_sea
            : shippingFeeData?.total_shipping_fee_air,
        receiver_address: selectedWarehouseLabel,
      });

      // 收集物流确认埋点数据 - 按照指定的字段格式
      const shippingConfirmData = {
        shipping_method: shippingMethod === "sea" ? 0 : 1,
        shipping_price_outside:
          shippingMethod === "sea"
            ? shippingFeeData?.total_shipping_fee_sea || 0
            : shippingFeeData?.total_shipping_fee_air || 0,
        shipping_price_within: domesticShippingFeeData?.total_shipping_fee || 0,
        currency: userStore.user?.currency || "FCFA",
        forwarder_name: selectedWarehouse?.forwarder_name || "",
        country_city: selectedWarehouseLabel || "",
        timestamp: new Date().toISOString(),
      };



      // 记录物流确认埋点事件
      const burialPointStore = useBurialPointStore.getState();
      burialPointStore.logShippingConfirm(shippingConfirmData, "shipping");
      
      console.log("物流确认信息埋点数据:", shippingConfirmData);
      
      navigation.navigate("PaymentMethod", {
        freight_forwarder_address_id: selectedWarehouse?.address_id || 0,
        isFei: route.params.isFei
      });
    } else {
      Alert.alert(t("order.shipping.select_method"));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        <View style={styles.container}>
          <View style={styles.recipientFormContainer3}>
            <View style={styles.titleContainer}>
              <View style={styles.backIconContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <BackIcon size={20} />
                </TouchableOpacity>
              </View>

              <Text style={styles.titleHeading}>
                {t("order.shipping.method")}
              </Text>
            </View>

            {/* 到达时间显示区域 - 移动到页面顶部 */}
            <View style={styles.estimatedTimeContainer}>
              <View style={styles.timeRow}>
                <Image 
                  source={require("../../../assets/preview/Frame.png")} 
                  style={styles.timeIcon}
                />
                <Text style={styles.timeLabel}>
                  {t("order.shipping.estimated_time")}:
                </Text>
                <Text style={styles.timeValue}>
                  {shippingMethod === "sea"
                    ? t("order.shipping.sea_time")
                    : t("order.shipping.air_time")}
                </Text>
              </View>
            </View>

            <View style={styles.recipientFormContainer1}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={{ marginRight: 8 }}>
                    <DeliveryIcon size={18} color="#333" />
                  </View>
                  <Text style={styles.sectionTitle}>
                    {t("order.shipping.method")}
                  </Text>
                </View>
                <View style={styles.shippingOptions}>
                  {[
                    {
                      id: "sea",
                      label: t("order.shipping.sea"),
                      detail: t("order.shipping.economical"),
                    },
                    {
                      id: "air",
                      label: t("order.shipping.air"),
                      detail: t("order.shipping.express"),
                    },
                  ].map((option, index) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.shippingCard,
                        shippingMethod === option.id &&
                          styles.shippingCardSelected,
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
                      <View style={styles.shippingIcon}>
                        {option.id === "sea" ? (
                          <ShipIcon 
                            size={70} 
                            color={shippingMethod === option.id ? "#ff8d4e" : "#999"} 
                          />
                        ) : (
                          <PlaneIcon 
                            size={70} 
                            color={shippingMethod === option.id ? "#ff8d4e" : "#999"} 
                          />
                        )}
                      </View>
                      <Text style={styles.shippingLabel}>{option.label}</Text>
                      <Text style={styles.shippingDetail}>
                        {option.detail}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Warehouse Selection */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={{ marginRight: 8 }}>
                    <WarehouseIcon size={18} color="#333" />
                  </View>
                  <Text style={styles.sectionTitle}>
                    {t("order.shipping.warehouse")}
                  </Text>
                </View>
                <View style={{ marginTop: 12 }}>
                  <View style={styles.selectBox}>
                    <Text style={styles.selectLabel}>
                      {t("order.shipping.select_warehouse")}:
                    </Text>
                    <TouchableOpacity
                      style={styles.selectWrapper}
                      onPress={() => setModalVisible(true)}
                    >
                      <Text style={styles.selectedText} numberOfLines={1} ellipsizeMode="tail">
                        {selectedWarehouseLabel ||
                          t("order.shipping.select_warehouse")}
                      </Text>
                      <DropdownIcon size={12} color="#666" />
                    </TouchableOpacity>

                    {/* Modal Dropdown */}
                    <Modal
                      visible={modalVisible}
                      transparent={true}
                      animationType="slide"
                      onRequestClose={() => setModalVisible(false)}
                    >
                      <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setModalVisible(false)}
                      >
                        <View style={styles.modalContainer}>
                          <SafeAreaView style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                              <Text style={styles.modalTitle}>
                                {t("order.shipping.select_warehouse")}
                              </Text>
                              <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                              >
                                <Text style={styles.closeButton}>×</Text>
                              </TouchableOpacity>
                            </View>
                            <FlatList
                              data={
                                freightForwarderAddress?.other_addresses || []
                              }
                              keyExtractor={(item, index) => index.toString()}
                              renderItem={({ item }) => {
                                const label =
                                  (getCurrentLanguage() === "fr"
                                    ? item.country_name
                                    : item.country_name_en) +
                                  " | " +
                                  item.city +
                                  (item.detail_address ? (" | " + item.detail_address) : "");
                                return (
                                  <TouchableOpacity
                                    style={[
                                      styles.optionItem,
                                      warehouse === label && styles.selectedOption,
                                    ]}
                                    onPress={() =>
                                      handleSelectWarehouse(
                                        item.country_code,
                                        label
                                      )
                                    }
                                  >
                                    <Text style={styles.optionText} numberOfLines={1} ellipsizeMode="tail">
                                      {label}
                                    </Text>
                                    {warehouse === label && (
                                      <Text style={styles.checkmark}>✓</Text>
                                    )}
                                  </TouchableOpacity>
                                );
                              }}
                            />
                          </SafeAreaView>
                        </View>
                      </TouchableOpacity>
                    </Modal>
                  </View>

                  {warehouse && (
                    <>
                      <View style={styles.paymentHeader}>
                        <View style={{ marginRight: 8 }}>
                          <PaymentIcon size={18} color="#333" />
                        </View>
                        <Text style={styles.paymentTitle}>
                          {t("order.shipping.payment_details") || "支付详情"}
                        </Text>
                      </View>
                      <View style={styles.shippingInfo}>
                        {isShippingFeeLoading ? (
                          // 统一显示一个加载状态
                          <View style={styles.loadingFeesContainer}>
                            <Text style={styles.calculatingText}>{count}</Text>
                            <ActivityIndicator
                              size="small"
                              color="#ff6000"
                              style={{ marginLeft: 5 }}
                            />
                          </View>
                        ) : (
                          // 加载完成后同时显示两个费用
                          <>
                            <View style={styles.shippingInfoRow}>
                              <Text style={styles.shippingInfoLabel}>
                                {t("order.shipping.domestic_fee_china") || "运费 (在中国)"}:{" "}
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
                                <Text style={{ color: "#ff6000" }}>
                                  {domesticShippingFeeData?.total_shipping_fee.toFixed(2) ||
                                    0}{" "}
                                  {userStore.user?.currency}
                                </Text>
                              </Text>
                            </View>
                            <View style={styles.shippingInfoRow}>
                              <Text style={styles.shippingInfoLabel}>
                                {t("order.shipping.international_delivery_fee") || "国际运输费"}:{" "}
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
                                  ? shippingFeeData?.total_shipping_fee_sea.toFixed(2)
                                  : shippingFeeData?.total_shipping_fee_air.toFixed(2)}{" "}
                                {userStore.user?.currency}
                              </Text>
                            </View>
                            {userStore.user.country_code !== 225 ? (
                              <View style={styles.delivery}>
                                <Text style={styles.deliveryText}>
                                  {t("order.preview.Cash_on_delivery")}
                                </Text>
                              </View>
                            ) : (
                              route.params.isFei ? (
                                <View style={styles.delivery}>
                                  <Text style={styles.deliveryText}>
                                    {t("order.preview.Cash_on_delivery")}
                                  </Text>
                                </View>
                              ) : (
                                <View></View>
                              )
                            )}
                          </>
                        )}
                      </View>
                    </>
                  )}
                </View>
              </View>

              <View style={styles.submitButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.primaryButtonStyle,
                    isShippingFeeLoading ||
                    domesticShippingFeeData?.total_shipping_fee == null
                      ? styles.disabledButtonStyle
                      : {},
                  ]}
                  onPress={handleSubmit}
                  disabled={
                    isShippingFeeLoading ||
                    domesticShippingFeeData?.total_shipping_fee == null
                  }
                >
                  <Text style={styles.buttonText}>
                    {t("order.shipping.submit")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
    paddingTop: Platform.OS === "android" ? 0 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingLeft: 16,
    paddingRight: 16,
    marginTop: 10,
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
    flexDirection: "column",
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
    backgroundColor: "#fff",
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
  shippingCardSelected: { borderColor: "#ff6000", backgroundColor: "#fff" },
  locationPin: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
  },
  shippingIcon: {
    width: 70,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shippingLabel: { fontSize: fontSize(14), fontWeight: "500" },
  shippingDetail: { fontSize: fontSize(12), color: "#888", marginTop: 3 },
  recipientFormContainer3: {
    flex: 1,
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    backgroundColor: "#fff",
    padding: 15,
  },
  recipientFormContainer1: {
    width: "100%",
    paddingBottom: 32,
  },
  border: {
    height: 6,
    backgroundColor: "#f5f5f5",
    marginTop: 12,
  },
  selectBox: { marginBottom: 12 },
  selectLabel: { fontSize: fontSize(14), marginBottom: 6, color: "#666" },
  selectWrapper: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#fff",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedText: {
    fontSize: fontSize(14),
    color: "#333",
    maxWidth: '95%',
    overflow: 'hidden',
  },
  dropdownIcon: {
    fontSize: fontSize(12),
    color: "#666",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    height: "80%",
  },
  modalContent: {
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: fontSize(16),
    fontWeight: "600",
  },
  closeButton: {
    fontSize: fontSize(24),
    color: "#666",
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedOption: {
    backgroundColor: "#f0f0f0",
  },
  optionText: {
    fontSize: fontSize(14),
    maxWidth: '95%',
    overflow: 'hidden',
  },
  checkmark: {
    color: "#ff6000",
    fontWeight: "bold",
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
    alignItems: "center",
  },
  shippingInfoLabel: {
    color: "#777",
    fontWeight: "500",
    fontSize: fontSize(13),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backIconContainer: {
    position: "absolute",
    left: 0,
  },
  titleContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  titleHeading: {
    fontWeight: "600",
    fontSize: fontSize(20),
    lineHeight: 22,
    fontFamily: "PingFang SC",
    color: "black",
  },
  submitButtonContainer: {
    paddingRight: 11,
    paddingLeft: 11,
    marginTop: 60,
  },
  primaryButtonStyle: {
    width: "100%",
    height: 50,
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
  loadingFeesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
  },
  calculatingText: {
    color: "#ff6000",
    fontSize: fontSize(14),
    fontWeight: "500",
  },
  delivery: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  deliveryText: {
    color: "#ff6000",
    fontSize: fontSize(20),
    fontWeight: "900",
    textAlign: "center",
  },
  estimatedTimeContainer: {
    backgroundColor: "#002fa7",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    marginTop: 16,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  timeLabel: {
    fontSize: fontSize(14),
    fontWeight: "500",
    color: "white",
    marginRight: 8,
  },
  timeValue: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "white",
  },
  paymentHeader: {
    marginBottom: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  paymentTitle: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "#333",
  },
});
