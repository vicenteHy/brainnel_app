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
  ScrollView,
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
import useAnalyticsStore from "../../store/analytics";
import flagMap from "../../utils/flagMap";

type RootStackParamList = {
  ShippingFee: { cart_item_id: any; totalAmount?: number; isCOD?: boolean };
  PaymentMethod: { freight_forwarder_address_id: number; isCOD?: boolean };
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

  // 当运输方式改变时，如果已有体积重量数据，直接重新计算运费，无需重新获取货代中心
  useEffect(() => {
    if (shippingFeeData && selectedWarehouse) {
      // 如果已经有运费数据和选中的仓库，直接切换显示即可，无需重新调用API
    } else {
      // 只有在没有数据时才重新获取货代中心
      const transportMode = shippingMethod === "sea" ? 0 : 1;
      fetchFreightForwarderAddress(transportMode);
    }
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
      // 计算更新后的COD状态：科特迪瓦用户选择空运时需要预付
      let updatedIsCOD = route.params.isCOD;
      if (userStore.user?.country_code === 225) {
        if (shippingMethod === "air") {
          updatedIsCOD = false; // 空运情况下科特迪瓦用户需要预付运费
        }
        // 海运保持原有逻辑（基于50000FCFA判断）
      }

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
      const analyticsStore = useAnalyticsStore.getState();
      analyticsStore.logShippingConfirm(shippingConfirmData, "shipping");
      
      navigation.navigate("PaymentMethod", {
        freight_forwarder_address_id: selectedWarehouse?.address_id || 0,
        isCOD: updatedIsCOD
      });
    } else {
      Alert.alert(t("order.shipping.select_method"));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        {/* Fixed Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={styles.backIconContainer}>
              <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={1}>
                <BackIcon size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.titleHeading}>
              {t("order.shipping.method")}
            </Text>
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={styles.recipientFormContainer3}>

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
                      activeOpacity={1}
                    >
                      {index === 0 && (
                        <View style={styles.locationPin}>
                          <LocationPinIcon size={16} />
                        </View>
                      )}
                      <View style={styles.shippingIconContainer}>
                        <View style={styles.shippingIcon}>
                          {option.id === "sea" ? (
                            <ShipIcon 
                              size={60} 
                              color={shippingMethod === option.id ? "#FF6F30" : "#999"} 
                            />
                          ) : (
                            <PlaneIcon 
                              size={60} 
                              color={shippingMethod === option.id ? "#FF6F30" : "#999"} 
                            />
                          )}
                        </View>
                        <View style={styles.shippingTextContainer}>
                          <Text style={styles.shippingLabel}>{option.label}</Text>
                          <Text style={styles.shippingDetail}>
                            {option.detail}
                          </Text>
                        </View>
                      </View>
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
                      activeOpacity={1}
                    >
                      <Text style={styles.selectedText} numberOfLines={1} ellipsizeMode="tail">
                        {selectedWarehouseLabel ||
                          t("order.shipping.select_warehouse")}
                      </Text>
                      <DropdownIcon size={12} color="#666" />
                    </TouchableOpacity>
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
                              color="#FF6F30"
                              style={{ marginLeft: 5 }}
                            />
                          </View>
                        ) : (
                          // 加载完成后同时显示两个费用
                          <>
                            <View style={styles.shippingInfoRow}>
                              <Text style={styles.shippingInfoLabel}>
                                {t("order.shipping.domestic_fee_china") || "运费 (在中国)"}:
                              </Text>
                              <Text style={styles.shippingInfoPrice}>
                                {domesticShippingFeeData?.total_shipping_fee.toFixed(2) ||
                                  0}{" "}
                                {userStore.user?.currency}
                              </Text>
                            </View>
                            <View style={styles.shippingInfoRow}>
                              <Text style={styles.shippingInfoLabel}>
                                {t("order.shipping.international_delivery_fee") || "国际运输费"}:
                              </Text>
                              <Text style={styles.shippingInfoPrice}>
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
                              // 科特迪瓦用户的COD逻辑：空运需要预付，海运根据金额判断
                              (shippingMethod === "sea" && route.params.isCOD) ? (
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
                  activeOpacity={1}
                >
                  <Text style={styles.buttonText}>
                    {t("order.shipping.submit")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          </View>
        </ScrollView>

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
                    activeOpacity={1}
                  >
                    <Text style={styles.closeButton}>×</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={
                    freightForwarderAddress?.other_addresses || []
                  }
                  keyExtractor={(item, index) => index.toString()}
                  contentContainerStyle={styles.flatListContent}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const label =
                      (getCurrentLanguage() === "fr"
                        ? item.country_name
                        : item.country_name_en) +
                      " | " +
                      item.city +
                      (item.detail_address ? (" | " + item.detail_address) : "");
                    const countryName = getCurrentLanguage() === "fr" ? item.country_name : item.country_name_en;
                    const flagSource = flagMap.get(countryName);
                    
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
                        activeOpacity={1}
                      >
                        <View style={styles.warehouseItemContainer}>
                          <View style={styles.warehouseItemHeader}>
                            {flagSource && (
                              <Image source={flagSource} style={styles.countryFlag} />
                            )}
                            <Text style={styles.countryNameText}>{countryName}</Text>
                            {warehouse === label && (
                              <Text style={styles.checkmark}>✓</Text>
                            )}
                          </View>
                          <Text style={styles.cityText}>{item.city}</Text>
                          {item.detail_address && (
                            <Text style={styles.addressDetailText}>{item.detail_address}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              </SafeAreaView>
            </View>
          </TouchableOpacity>
        </Modal>
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
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    backgroundColor: "#fff",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  sectionIcon: { marginRight: 8, fontSize: fontSize(18) },
  sectionTitle: { 
    flex: 1, 
    fontSize: fontSize(16), 
    fontWeight: "600",
    color: "#1a1a1a",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.2,
  },
  sectionAction: {
    color: "#FF6F30",
    fontSize: fontSize(14),
    fontWeight: "600",
  },
  paymentOptions: {
    marginTop: 12,
    flexDirection: "column",
  },
  recipientInfo: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
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
    fontSize: fontSize(16),
    color: "#1a1a1a",
  },

  addRecipient: {
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  addRecipientIcon: {
    fontSize: fontSize(20),
    color: "#FF6F30",
    marginRight: 6,
  },
  addRecipientText: { 
    fontSize: fontSize(14), 
    color: "#666666",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  shippingOptions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 16,
  },
  shippingCard: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    paddingTop: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 120,
    justifyContent: "space-between",
  },
  shippingCardSelected: { 
    borderColor: "#FF6F30", 
    backgroundColor: "#fff4f0",
    shadowColor: "#FF6F30",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  locationPin: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
  },
  shippingIconContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
  },
  shippingIcon: {
    width: 60,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  shippingTextContainer: {
    alignItems: "center",
  },
  shippingLabel: { 
    fontSize: fontSize(14), 
    fontWeight: "600",
    color: "#1a1a1a",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlign: "center",
    marginBottom: 4,
  },
  shippingDetail: { 
    fontSize: fontSize(12), 
    color: "#666666", 
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlign: "center",
  },
  recipientFormContainer3: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 16,
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
  selectBox: { marginBottom: 16 },
  selectLabel: { 
    fontSize: fontSize(14), 
    marginBottom: 8, 
    color: "#666666",
    fontWeight: "500",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  selectWrapper: {
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedText: {
    fontSize: fontSize(14),
    color: "#1a1a1a",
    maxWidth: '95%',
    overflow: 'hidden',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  dropdownIcon: {
    fontSize: fontSize(12),
    color: "#666666",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "80%",
  },
  modalContent: {
    width: "100%",
    flex: 1,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  modalTitle: {
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#1a1a1a",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  closeButton: {
    fontSize: fontSize(16),
    color: "#FF6F30",
    fontWeight: "500",
  },
  flatListContent: {
    paddingBottom: 20,
  },
  optionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedOption: {
    backgroundColor: "#fff4f0",
  },
  optionText: {
    fontSize: fontSize(14),
    maxWidth: '95%',
    overflow: 'hidden',
    color: "#1a1a1a",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  checkmark: {
    color: "#FF6F30",
    fontWeight: "bold",
    fontSize: fontSize(16),
  },
  warehouseItemContainer: {
    flex: 1,
  },
  warehouseItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  countryFlag: {
    width: 24,
    height: 16,
    marginRight: 12,
    borderRadius: 2,
  },
  countryNameText: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "#1a1a1a",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    flex: 1,
  },
  cityText: {
    fontSize: fontSize(14),
    color: "#666666",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginLeft: 36,
    marginBottom: 4,
  },
  addressDetailText: {
    fontSize: fontSize(12),
    color: "#999999",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginLeft: 36,
    lineHeight: 16,
  },
  shippingInfo: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  shippingInfoRow: {
    fontSize: fontSize(14),
    marginBottom: 8,
    color: "#1a1a1a",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shippingInfoLabel: {
    color: "#666666",
    fontWeight: "500",
    fontSize: fontSize(14),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    flex: 1,
  },
  shippingInfoPrice: {
    color: "#FF6F30",
    fontWeight: "600",
    fontSize: fontSize(14),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlign: "right",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backIconContainer: {
    position: "absolute",
    left: 0,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingVertical: 16,
  },
  titleHeading: {
    fontWeight: "600",
    fontSize: fontSize(20),
    lineHeight: 28,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    color: "#1a1a1a",
    letterSpacing: 0.3,
  },
  submitButtonContainer: {
    marginTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  primaryButtonStyle: {
    width: "100%",
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FF6F30",
    borderWidth: 0,
    borderRadius: 16,
    shadowColor: "#FF6F30",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: fontSize(16),
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.3,
  },
  selectedCountryText: {
    padding: 0,
    margin: 0,
    fontWeight: "500",
    fontSize: fontSize(16),
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    color: "#1a1a1a",
  },
  disabledButtonStyle: {
    backgroundColor: "#cccccc",
    shadowOpacity: 0,
    elevation: 0,
  },
  loadingFeesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  calculatingText: {
    color: "#FF6F30",
    fontSize: fontSize(14),
    fontWeight: "500",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  delivery: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fff4f0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF6F30",
  },
  deliveryText: {
    color: "#FF6F30",
    fontSize: fontSize(16),
    fontWeight: "700",
    textAlign: "center",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  estimatedTimeContainer: {
    backgroundColor: "#FF6F30",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    marginTop: 16,
    shadowColor: "#FF6F30",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  timeValue: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "white",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  paymentHeader: {
    marginBottom: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  paymentTitle: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "#1a1a1a",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.2,
  },
});
