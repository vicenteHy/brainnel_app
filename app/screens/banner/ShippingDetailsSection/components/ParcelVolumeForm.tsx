import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import fontSize from "../../../../utils/fontsizeUtils";
import { useTranslation } from "react-i18next";
import { CountryList } from "../../../../constants/countries";

interface ParcelVolumeFormProps {
  selectedCountry: CountryList | null;
  parcelVolume: string;
  shippingMethod: "maritime" | "airway";
  onCountryPress: () => void;
  onVolumeChange: (text: string) => void;
}

export const ParcelVolumeForm: React.FC<ParcelVolumeFormProps> = ({
  selectedCountry,
  parcelVolume,
  shippingMethod,
  onCountryPress,
  onVolumeChange,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.parcelVolumeFormContainer}>
      {/* Country Selection */}
      <View style={styles.parcelVolumeContainer}>
        <Text style={styles.parcelVolumeLabel}>
          {t("banner.shipping.select_country")}
        </Text>
        <TouchableOpacity
          style={styles.volumeInputContainer}
          onPress={onCountryPress}
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
            onChangeText={onVolumeChange}
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
  );
};

const styles = StyleSheet.create({
  parcelVolumeFormContainer: {
    marginTop: 16,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#dbdce0",
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
  volumeInput: {
    flex: 1,
    fontSize: fontSize(16),
    color: "#1c284e",
    padding: 0,
  },
});