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
  ShippingFee: { cart_item_id: any; totalAmount?: number; isCOD?: number; isToc?: number };
  PaymentMethod: { freight_forwarder_address_id: number; isCOD?: number; isToc?: number };
};
type ShippingFeeParams = {
  cart_item_id: any;
  totalAmount: number;
  isCOD?: number;
  isToc?: number;
};

export const ShippingFee = () => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "ShippingFee">>();
  const {
    fetchFreightForwarderAddress,
    state,
    calculateAllShippingFees,
    clearShippingFees,
  } = usePreviewShippingStore();
  const [shippingMethod, setShippingMethod] = useState("sea");
  const [warehouse, setWarehouse] = useState<string>();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWarehouseLabel, setSelectedWarehouseLabel] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<Address>();
  const [isInitializing, setIsInitializing] = useState(true);

  const { setOrderData, orderData, items } = useCreateOrderStore();
  const [countryCode, setCountryCode] = useState<number>();
  const userStore = useUserStore();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(false);

  // 统一处理地址获取和运费计算
  const initializeShippingData = async (method: string) => {
    const transportMode = method === "sea" ? 0 : 1;
    const isToc = route.params?.isToc !== undefined ? route.params.isToc : 0;
    
    // 获取地址
    await fetchFreightForwarderAddress(transportMode, isToc);
  };

  useEffect(() => {
    // 进入页面时先清空旧的运费数据
    clearShippingFees();
    initializeShippingData(shippingMethod);
    
    // 组件卸载时清空状态
    return () => {
      clearShippingFees();
    };
  }, []);

  // 处理地址数据更新并立即计算运费
  useEffect(() => {
    if (state.freightForwarderAddress) {
      // 使用other_addresses（store已将所有地址合并到此数组中）
      let firstItem = null;
      if (
        state.freightForwarderAddress.other_addresses &&
        state.freightForwarderAddress.other_addresses.length > 0
      ) {
        firstItem = state.freightForwarderAddress.other_addresses[0];
      }
      
      if (firstItem) {
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
        setSelectedWarehouse(firstItem);
        
        // 立即计算运费
        if (items && firstItem.address_id) {
          const data = {
            items: items,
            freight_forwarder_address_id: firstItem.address_id,
          };
          calculateAllShippingFees(data);
        }
      }
      
      setIsInitializing(false);
    }
  }, [state.freightForwarderAddress]);

  // 当运输方式改变时，重新获取地址和计算运费
  useEffect(() => {
    if (!isInitializing && shippingMethod) {
      clearShippingFees();
      initializeShippingData(shippingMethod);
    }
  }, [shippingMethod]);

  const changeCountryHandel = async (value: string) => {
    if (value && state.freightForwarderAddress) {
      // 查找地址（store已将所有地址合并到other_addresses中）
      const allAddresses = state.freightForwarderAddress.other_addresses || [];
      
      const selected = allAddresses.find(
        (item) =>
          ((getCurrentLanguage() === "fr"
            ? item.country_name
            : item.country_name_en) +
            " | " +
            item.city +
            (item.detail_address ? (" | " + item.detail_address) : "")) === value
      );

      if (selected) {
        setSelectedWarehouse(selected);
        setWarehouse(value);
        setSelectedWarehouseLabel(value);
        setCountryCode(selected.country_code);

        if (items) {
          const data = {
            items: items,
            freight_forwarder_address_id: selected.address_id,
          };
          // 使用统一的计算方法
          calculateAllShippingFees(data);
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
      !state.isLoading &&
      state.domesticShippingFees?.total_shipping_fee != null
    ) {
      // 计算更新后的COD状态：科特迪瓦用户选择空运时需要预付
      let updatedIsCOD = route.params.isCOD || 0;
      
      if (userStore.user?.country_code === 225) {
        if (shippingMethod === "air") {
          updatedIsCOD = 0; // 空运情况下科特迪瓦用户需要预付运费
        }
        // 海运保持原有逻辑（基于50000FCFA判断）
      }

      setOrderData({
        ...orderData,
        transport_type: shippingMethod === "sea" ? 0 : 1,
        domestic_shipping_fee: state.domesticShippingFees?.total_shipping_fee,
        shipping_fee:
          shippingMethod === "sea"
            ? state.shippingFees?.total_shipping_fee_sea
            : state.shippingFees?.total_shipping_fee_air,
        receiver_address: selectedWarehouseLabel,
      });

      // 收集物流确认埋点数据 - 按照指定的字段格式
      const shippingConfirmData = {
        shipping_method: shippingMethod === "sea" ? 0 : 1,
        shipping_price_outside:
          shippingMethod === "sea"
            ? state.shippingFees?.total_shipping_fee_sea || 0
            : state.shippingFees?.total_shipping_fee_air || 0,
        shipping_price_within: state.domesticShippingFees?.total_shipping_fee || 0,
        currency: userStore.user?.currency || "FCFA",
        forwarder_name: selectedWarehouse?.forwarder_name || "",
        country_city: selectedWarehouseLabel || "",
        timestamp: new Date().toISOString(),
      };

      // 记录物流确认埋点事件
      const analyticsStore = useAnalyticsStore.getState();
      analyticsStore.logShippingConfirm(shippingConfirmData, "shipping");
      
      const isTocValue = route.params?.isToc !== undefined ? route.params.isToc : 0;
      
      navigation.navigate("PaymentMethod", {
        freight_forwarder_address_id: selectedWarehouse?.address_id || 0,
        isCOD: updatedIsCOD,
        isToc: isTocValue
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
                              color={shippingMethod === option.id ? "#FF5100" : "#999"} 
                            />
                          ) : (
                            <PlaneIcon 
                              size={60} 
                              color={shippingMethod === option.id ? "#FF5100" : "#999"} 
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
                        {state.isLoading ? (
                          // 统一显示一个加载状态
                          <View style={styles.loadingFeesContainer}>
                            <Text style={styles.calculatingText}>{t("order.shipping.calculating")}</Text>
                            <ActivityIndicator
                              size="small"
                              color="#FF5100"
                              style={{ marginLeft: 5 }}
                            />
                          </View>
                        ) : (
                          // 加载完成后同时显示两个费用
                          <>
                            <View style={styles.shippingInfoRow}>
                              <Text style={styles.shippingInfoLabel}>
                                {t("order.shipping.domestic_fee_china") || "运费 (在中国)"}
                              </Text>
                              <Text style={styles.shippingInfoPrice}>
                                {(state.domesticShippingFees?.total_shipping_fee || 0).toFixed(2)} {userStore.user?.currency}
                              </Text>
                            </View>
                            <View style={styles.shippingInfoRow}>
                              <Text style={styles.shippingInfoLabel}>
                                {t("order.shipping.international_delivery_fee") || "国际运输费"}
                              </Text>
                              <Text style={styles.shippingInfoPrice}>
                                {(shippingMethod === "sea"
                                  ? state.shippingFees?.total_shipping_fee_sea || 0
                                  : state.shippingFees?.total_shipping_fee_air || 0).toFixed(2)} {userStore.user?.currency}
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
                          (shippingMethod === "sea" && route.params.isCOD === 1) ? (
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
                    state.isLoading ||
                    state.domesticShippingFees?.total_shipping_fee == null
                      ? styles.disabledButtonStyle
                      : {},
                  ]}
                  onPress={handleSubmit}
                  disabled={
                    state.isLoading ||
                    state.domesticShippingFees?.total_shipping_fee == null
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
                  data={state.freightForwarderAddress?.other_addresses || []}
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
    elevation: 0,
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
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
  sectionAction: {
    color: "#FF5100",
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
    color: "#FF5100",
    marginRight: 6,
  },
  addRecipientText: { 
    fontSize: fontSize(14), 
    color: "#666666",
    fontFamily: 'System',
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
    elevation: 0,
    minHeight: 120,
    justifyContent: "space-between",
  },
  shippingCardSelected: { 
    borderColor: "#FF5100", 
    backgroundColor: "#fff4f0",
    shadowColor: "#FF5100",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 0,
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
    fontFamily: 'System',
    textAlign: "center",
    marginBottom: 4,
  },
  shippingDetail: { 
    fontSize: fontSize(12), 
    color: "#666666", 
    fontFamily: 'System',
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
    fontFamily: 'System',
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
    elevation: 0,
  },
  selectedText: {
    fontSize: fontSize(14),
    color: "#1a1a1a",
    maxWidth: '95%',
    overflow: 'hidden',
    fontFamily: 'System',
  },
  dropdownIcon: {
    fontSize: fontSize(12),
    color: "#666666",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000080",
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
    fontFamily: 'System',
  },
  closeButton: {
    fontSize: fontSize(16),
    color: "#FF5100",
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
    fontFamily: 'System',
  },
  checkmark: {
    color: "#FF5100",
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
    fontFamily: 'System',
    flex: 1,
  },
  cityText: {
    fontSize: fontSize(14),
    color: "#666666",
    fontFamily: 'System',
    marginLeft: 36,
    marginBottom: 4,
  },
  addressDetailText: {
    fontSize: fontSize(12),
    color: "#999999",
    fontFamily: 'System',
    marginLeft: 36,
    lineHeight: 16,
  },
  shippingInfo: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  shippingInfoRow: {
    fontSize: fontSize(12),
    marginBottom: 12,
    color: "#1a1a1a",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  shippingInfoLabel: {
    color: "#666666",
    fontWeight: "500",
    fontSize: fontSize(14),
    flex: 1,
    lineHeight: 20,
    marginRight: 8,
    flexShrink: 1,
  },
  shippingInfoPrice: {
    color: "#FF5100",
    fontWeight: "600",
    fontSize: fontSize(14),
    textAlign: "right",
    lineHeight: 20,
    flexShrink: 1,
    maxWidth: '30%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: fontSize(14),
    color: "#666666",
    fontFamily: 'System',
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
    fontFamily: 'System',
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
    backgroundColor: "#FF5100",
    borderWidth: 0,
    borderRadius: 16,
    shadowColor: "#FF5100",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 0,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: fontSize(16),
    lineHeight: 22,
    fontFamily: 'System',
    letterSpacing: 0.3,
  },
  selectedCountryText: {
    padding: 0,
    margin: 0,
    fontWeight: "500",
    fontSize: fontSize(16),
    lineHeight: 22,
    fontFamily: 'System',
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
    color: "#FF5100",
    fontSize: fontSize(14),
    fontWeight: "500",
    fontFamily: 'System',
  },
  delivery: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fff4f0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF5100",
  },
  deliveryText: {
    color: "#FF5100",
    fontSize: fontSize(16),
    fontWeight: "700",
    textAlign: "center",
    fontFamily: 'System',
  },
  estimatedTimeContainer: {
    backgroundColor: "#FF5100",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    marginTop: 16,
    shadowColor: "#FF5100",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 0,
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
    fontFamily: 'System',
  },
  timeValue: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "white",
    fontFamily: 'System',
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
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
});
