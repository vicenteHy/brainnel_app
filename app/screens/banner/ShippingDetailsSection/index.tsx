import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import BackIcon from "../../../components/BackIcon";
import fontSize from "../../../utils/fontsizeUtils";
import { useShippingCalculator } from "./hooks/useShippingCalculator";
import { CountryModal } from "./components/CountryModal";
import { ResultModal } from "./components/ResultModal";
import { ShippingMethodSelector } from "./components/ShippingMethodSelector";
import { ParcelVolumeForm } from "./components/ParcelVolumeForm";
import { NavigationProp } from "./types";
import { styles } from "./styles";

export const ShippingDetailsSection = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  
  const {
    shippingMethod,
    isLoading,
    showCountryModal,
    countries,
    selectedCountry,
    parcelVolume,
    isCalculating,
    showResultModal,
    shippingFee,
    shippingCurrency,
    setShowCountryModal,
    setShowResultModal,
    handleShippingMethodChange,
    handleCountrySelect,
    handleParcelVolumeChange,
    handleCalculateShipping,
  } = useShippingCalculator();

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
                      onPress={() => navigation.goBack()}
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
                  <ShippingMethodSelector
                    shippingMethod={shippingMethod}
                    onMethodChange={handleShippingMethodChange}
                  />

                  {/* Parcel Volume Form */}
                  <ParcelVolumeForm
                    selectedCountry={selectedCountry}
                    parcelVolume={parcelVolume}
                    shippingMethod={shippingMethod}
                    onCountryPress={() => setShowCountryModal(true)}
                    onVolumeChange={handleParcelVolumeChange}
                  />

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
        <CountryModal
          visible={showCountryModal}
          onClose={() => setShowCountryModal(false)}
          countries={countries}
          selectedCountry={selectedCountry}
          onSelectCountry={handleCountrySelect}
        />

        {/* Result Modal */}
        <ResultModal
          visible={showResultModal}
          onClose={() => setShowResultModal(false)}
          shippingFee={shippingFee}
          shippingCurrency={shippingCurrency}
        />
      </View>
    </SafeAreaView>
  );
};