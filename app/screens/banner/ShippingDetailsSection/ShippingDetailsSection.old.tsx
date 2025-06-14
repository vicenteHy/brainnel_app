import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import BackIcon from "../../../components/BackIcon";
import fontSize from "../../../utils/fontsizeUtils";
import widthUtils from "../../../utils/widthUtils";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { settingApi } from "../../../services/api/setting";
import { CountryList } from "../../../constants/countries";
import { useTranslation } from "react-i18next";

// Pre-require images to avoid dynamic require issues
const IMAGES = {
  maritimeIcon: require("../../../assets/img/海运 (1) 1.png"),
  airwayIcon: require("../../../assets/img/空运 1.png"),
};

type RootStackParamList = {
  Home: undefined;
  ShippingDetails: undefined;
  Main: undefined;
  // Add other screens as needed
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ShippingDetailsSection = () => {
  const { t } = useTranslation();
  const [shippingMethod, setShippingMethod] = useState("maritime"); // 'maritime' or 'airway'
  const [isLoading, setIsLoading] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countries, setCountries] = useState<CountryList[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryList | null>(
    null
  );
  const [parcelVolume, setParcelVolume] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [shippingFee, setShippingFee] = useState<number | null>(null);
  const [shippingCurrency, setShippingCurrency] = useState<string>("");
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await settingApi.getCountryList();
        setCountries(response);
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };

    fetchCountries();
  }, []);

  const handleShippingMethodChange = (method: "maritime" | "airway") => {
    setShippingMethod(method);
  };

  const handleCountrySelect = (country: CountryList) => {
    setSelectedCountry(country);
    setShowCountryModal(false);
  };

  const handleCalculateShipping = async () => {
    if (!selectedCountry || !parcelVolume) {
      // TODO: Show error message
      return;
    }

    setIsCalculating(true);
    try {
      const volume = parseFloat(parcelVolume);
      if (isNaN(volume)) {
        // TODO: Show error message for invalid input
        return;
      }

      const shippingData = {
        weight_kg: shippingMethod === "airway" ? volume : 0,
        volume_m3: shippingMethod === "maritime" ? volume : 0,
        country_code: selectedCountry.country,
      };

      const response = await settingApi.getShippingFee(shippingData);
      const fee =
        shippingMethod === "maritime"
          ? response.estimated_shipping_fee_sea
          : response.estimated_shipping_fee_air;
      setShippingFee(fee);
      setShippingCurrency(response.currency);
      setShowResultModal(true);
    } catch (error) {
      console.error("Error calculating shipping fee:", error);
      // TODO: Show error message
    } finally {
      setIsCalculating(false);
    }
  };

  const renderCountryItem = ({ item }: { item: CountryList }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => handleCountrySelect(item)}
    >
      <Text style={styles.countryItemText}>{item.name}</Text>
      {selectedCountry?.country === item.country && (
        <Text style={styles.checkIcon}>✓</Text>
      )}
    </TouchableOpacity>
  );

  const renderResultModal = () => (
    <Modal
      visible={showResultModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowResultModal(false)}
    >
      <View style={styles.resultModalContainer}>
        <View style={styles.resultModalContent}>
          <Text style={styles.resultTitle}>
            {t("banner.shipping.calculation_result")}
          </Text>
          <Text style={styles.resultText}>
            {t("banner.shipping.estimated_fee")}: {shippingFee?.toFixed(2)}{" "}
            {shippingCurrency}
          </Text>
          <TouchableOpacity
            style={styles.resultCloseButton}
            onPress={() => setShowResultModal(false)}
          >
            <Text style={styles.resultCloseButtonText}>
              {t("banner.shipping.confirm")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#005EE4" />
      <View style={styles.safeAreaContent}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#005EE4" />
          </View>
        ) : (
          <View style={styles.backgroundContainer}>
            <View style={styles.contentContainer}>
              <View style={styles.timeShippingSection}>
                <View style={styles.shippingCostContainer}>
                  <View style={styles.svgContainer}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => {
                        navigation.goBack();
                      }}
                    >
                      <BackIcon size={fontSize(18)} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.shippingCostLabelTextStyle}>
                    {t("banner.shipping.fee")}
                  </Text>
                </View>
              </View>

              {/* Calculator Form */}
              <View style={styles.shippingCalculatorContainer}>
                <View style={styles.flexColumnCenteredWithSelect}>
                  {/* Shipping Method Selection */}
                  <View style={styles.shippingMethodContainer}>
                    {/* Maritime Option */}
                    <TouchableOpacity
                      style={[
                        styles.maritimeInfoBox,
                        shippingMethod === "maritime"
                          ? styles.activeShippingMethod
                          : {},
                      ]}
                      onPress={() => handleShippingMethodChange("maritime")}
                    >
                      <View style={styles.svgContainer1}>
                        <Image
                          source={IMAGES.maritimeIcon}
                          style={{
                            width: widthUtils(24, 24).width,
                            height: widthUtils(24, 24).height,
                            tintColor:
                              shippingMethod === "maritime"
                                ? "#fff"
                                : "#747474",
                          }}
                        />
                      </View>
                      <Text
                        style={[
                          styles.maritimeHeadingStyle,
                          shippingMethod === "maritime"
                            ? {}
                            : { color: "#747474" },
                        ]}
                      >
                        {t("banner.shipping.maritime")}
                      </Text>
                    </TouchableOpacity>

                    {/* Airway Option */}
                    <TouchableOpacity
                      style={[
                        styles.airwayInfoContainer,
                        shippingMethod === "airway"
                          ? styles.activeShippingMethod
                          : {},
                      ]}
                      onPress={() => handleShippingMethodChange("airway")}
                    >
                      <View style={styles.svgContainer2}>
                        <Image
                          source={IMAGES.airwayIcon}
                          style={{
                            width: widthUtils(24, 24).width,
                            height: widthUtils(24, 24).height,
                            tintColor:
                              shippingMethod === "airway" ? "#fff" : "#747474",
                          }}
                        />
                      </View>
                      <Text
                        style={[
                          styles.flightModeLabel,
                          shippingMethod === "airway" ? { color: "#fff" } : {},
                        ]}
                      >
                        {t("banner.shipping.airway")}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Parcel Volume Form */}
                  <View style={styles.parcelVolumeFormContainer}>
                    {/* Country Selection */}
                    <View style={styles.parcelVolumeContainer}>
                      <Text style={styles.parcelVolumeLabel}>
                        {t("banner.shipping.select_country")}
                      </Text>
                      <TouchableOpacity
                        style={styles.volumeInputContainer}
                        onPress={() => setShowCountryModal(true)}
                      >
                        <Text style={styles.volumePromptTextStyle}>
                          {selectedCountry
                            ? selectedCountry.name
                            : t("banner.shipping.select_country")}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Parcel Volume Input */}
                    <View style={styles.parcelVolumeContainer}>
                      <Text style={styles.parcelVolumeLabel}>
                        {t("banner.shipping.parcel_volume")}
                      </Text>
                      <View style={styles.volumeInputContainer}>
                        <TextInput
                          style={styles.volumeInput}
                          value={parcelVolume}
                          onChangeText={(text) => {
                            // 只允许输入数字和小数点
                            const numericValue = text.replace(/[^0-9.]/g, "");
                            // 确保只有一个小数点
                            const parts = numericValue.split(".");
                            if (parts.length > 2) {
                              setParcelVolume(
                                parts[0] + "." + parts.slice(1).join("")
                              );
                            } else {
                              setParcelVolume(numericValue);
                            }
                          }}
                          placeholder={t("banner.shipping.enter_parcel_volume")}
                          keyboardType="decimal-pad"
                          placeholderTextColor="#807e7e"
                        />
                        <Text style={styles.unitText}>
                          {shippingMethod === "maritime" ? "m³" : "kg"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      isCalculating && styles.disabledButton,
                    ]}
                    onPress={handleCalculateShipping}
                    disabled={
                      isCalculating || !selectedCountry || !parcelVolume
                    }
                  >
                    {isCalculating ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text
                        style={{
                          color: "white",
                          fontSize: fontSize(16),
                          fontFamily: "PingFang SC",
                          fontWeight: "600",
                        }}
                      >
                        {t("banner.shipping.calculate_shipping")}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Country Selection Modal */}
        <Modal
          visible={showCountryModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCountryModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {t("banner.shipping.select_country_modal_title")}
                </Text>
                <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                  <Text style={styles.modalCloseButton}>
                    {t("banner.shipping.close")}
                  </Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={countries}
                renderItem={renderCountryItem}
                keyExtractor={(item) => item.country.toString()}
                style={styles.countryList}
              />
            </View>
          </View>
        </Modal>

        {renderResultModal()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#005EE4",
  },
  safeAreaContent: {
    flex: 1,
    paddingTop: 0,
  },
  container: {
    width: "100%",
    flex: 1,
  },
  backgroundContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#005EE4",
  },
  contentContainer: {
    flex: 1,
    padding: 15,
  },
  timeShippingSection: {
    flexDirection: "column",
  },
  timeAndImageContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 36,
  },
  timeDisplay: {
    width: widthUtils(42, 42).width,
    fontSize: fontSize(17),
    fontFamily: "SF Pro",
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
  timeImageContainer: {
    width: widthUtils(54, 154).width,
    height: widthUtils(54, 154).height,
  },
  shippingCostContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    justifyContent: "center",
  },
  svgContainer: {
    width: widthUtils(18, 18).width,
    height: widthUtils(18, 18).height,
    position: "absolute",
    left: 0,
  },
  shippingCostLabelTextStyle: {
    fontSize: fontSize(20),
    lineHeight: 22,
    fontFamily: "Microsoft YaHei UI",
    fontWeight: "700",
    color: "white",
    textAlign: "center",
    textTransform: "capitalize",
    width: "100%",
  },
  shippingCalculatorContainer: {
    marginTop: widthUtils(100, 100).height,
    paddingTop: 18,
    paddingRight: 20,
    paddingBottom: 28,
    paddingLeft: 20,
    backgroundColor: "white",
    borderRadius: 5,
    justifyContent: "center",
  },
  flexColumnCenteredWithSelect: {
    flexDirection: "column",
    justifyContent: "center",
  },
  shippingMethodContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: widthUtils(80, 80).height,
    paddingRight: 10,
    paddingLeft: 10,
    backgroundColor: "#f2f6ff",
    borderRadius: 5,
  },
  maritimeInfoBox: {
    height: widthUtils(60, 60).height,
    paddingRight: 19,
    paddingLeft: 20,
    backgroundColor: "#f2f6ff",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  airwayInfoContainer: {
    height: widthUtils(60, 60).height,
    paddingRight: 24,
    paddingLeft: 25,
    marginLeft: 10,
    backgroundColor: "#f2f6ff",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  activeShippingMethod: {
    backgroundColor: "#005EE4",
  },
  svgContainer1: {
    width: widthUtils(32, 32).width,
    height: widthUtils(32, 32).height,
  },
  maritimeHeadingStyle: {
    marginTop: -5,
    fontSize: fontSize(14),
    fontFamily: "Segoe UI",
    fontWeight: "700",
    color: "white",
    textTransform: "capitalize",
  },
  svgContainer2: {
    width: widthUtils(24, 24).width,
    height: widthUtils(24, 24).height,
  },
  flightModeLabel: {
    marginTop: -2,
    fontSize: fontSize(14),
    fontFamily: "Segoe UI",
    fontWeight: "400",
    color: "#747474",
    textTransform: "capitalize",
  },
  parcelVolumeFormContainer: {
    marginTop: 16,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#dbdce0",
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: widthUtils(60, 60).height,
    paddingRight: 6,
    paddingLeft: 8,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#dbdce0",
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  pingfangTextSelect: {
    fontSize: fontSize(12),
    fontFamily: "PingFang SC",
    fontWeight: "500",
    color: "#646472",
  },
  iconSelectDropdown: {
    width: widthUtils(24, 24).width,
    height: widthUtils(24, 24).height,
    marginLeft: 10,
  },
  parcelVolumeContainer: {
    width: "100%",
    paddingTop: 6,
    paddingRight: 8,
    paddingBottom: 10,
    paddingLeft: 8,
    marginTop: -1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#dbdce0",
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  parcelVolumeLabel: {
    fontSize: fontSize(12),
    fontFamily: "PingFang SC",
    fontWeight: "600",
    color: "#646472",
  },
  volumeInputContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  volumePromptTextStyle: {
    fontSize: fontSize(16),
    lineHeight: 22,
    fontFamily: "PingFang SC",
    fontWeight: "400",
    color: "#807e7e",
  },
  unitText: {
    fontSize: fontSize(16),
    lineHeight: 22,
    fontFamily: "PingFang SC",
    fontWeight: "600",
    color: "#1c284e",
  },
  primaryButton: {
    width: "100%",
    height: widthUtils(50, 50).height,
    marginTop: 34,
    backgroundColor: "#002fa7",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    padding: 10,
    borderRadius: 20,
    zIndex: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f6ff",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#dbdce0",
  },
  modalTitle: {
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#1c284e",
  },
  modalCloseButton: {
    fontSize: fontSize(16),
    color: "#005EE4",
  },
  countryList: {
    paddingHorizontal: 16,
  },
  countryItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#dbdce0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  countryItemText: {
    fontSize: fontSize(16),
    color: "#1c284e",
  },
  checkIcon: {
    fontSize: fontSize(20),
    color: "#005EE4",
    fontWeight: "bold",
  },
  volumeInput: {
    flex: 1,
    fontSize: fontSize(16),
    color: "#1c284e",
    padding: 0,
  },
  disabledButton: {
    opacity: 0.6,
  },
  resultModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  resultModalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  resultTitle: {
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#1c284e",
    marginBottom: 15,
  },
  resultText: {
    fontSize: fontSize(16),
    color: "#1c284e",
    marginBottom: 20,
  },
  resultCloseButton: {
    backgroundColor: "#005EE4",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
  },
  resultCloseButtonText: {
    color: "white",
    fontSize: fontSize(16),
    fontWeight: "600",
  },
});
