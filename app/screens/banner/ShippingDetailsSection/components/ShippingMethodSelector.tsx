import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import widthUtils from "../../../../utils/widthUtils";
import fontSize from "../../../../utils/fontsizeUtils";
import { useTranslation } from "react-i18next";
import { IMAGES } from "../constants";

interface ShippingMethodSelectorProps {
  shippingMethod: "maritime" | "airway";
  onMethodChange: (method: "maritime" | "airway") => void;
}

export const ShippingMethodSelector: React.FC<ShippingMethodSelectorProps> = ({
  shippingMethod,
  onMethodChange,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.shippingMethodContainer}>
      {/* Maritime Option */}
      <TouchableOpacity
        style={[
          styles.maritimeInfoBox,
          shippingMethod === "maritime" ? styles.activeShippingMethod : {},
        ]}
        onPress={() => onMethodChange("maritime")}
      >
        <Image
          source={IMAGES.maritimeIcon}
          style={{
            width: 20,
            height: 20,
            tintColor: shippingMethod === "maritime" ? "#fff" : "#747474",
            marginBottom: 4,
          }}
          resizeMode="contain"
        />
        <Text
          style={[
            styles.maritimeHeadingStyle,
            shippingMethod === "maritime" ? {} : { color: "#747474" },
          ]}
        >
          {t("banner.shipping.maritime")}
        </Text>
      </TouchableOpacity>

      {/* Airway Option */}
      <TouchableOpacity
        style={[
          styles.airwayInfoContainer,
          shippingMethod === "airway" ? styles.activeShippingMethod : {},
        ]}
        onPress={() => onMethodChange("airway")}
      >
        <Image
          source={IMAGES.airwayIcon}
          style={{
            width: 20,
            height: 20,
            tintColor: shippingMethod === "airway" ? "#fff" : "#747474",
            marginBottom: 4,
          }}
          resizeMode="contain"
        />
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
  );
};

const styles = StyleSheet.create({
  shippingMethodContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 80,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#f2f6ff",
    borderRadius: 5,
  },
  maritimeInfoBox: {
    flex: 1,
    minHeight: 60,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 5,
    backgroundColor: "#f2f6ff",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  airwayInfoContainer: {
    flex: 1,
    minHeight: 60,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginLeft: 5,
    backgroundColor: "#f2f6ff",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  activeShippingMethod: {
    backgroundColor: "#005EE4",
  },
  maritimeHeadingStyle: {
    fontSize: fontSize(12),
    fontFamily: "PingFang SC",
    fontWeight: "600",
    color: "white",
    textAlign: "center",
    textTransform: "capitalize",
  },
  flightModeLabel: {
    fontSize: fontSize(12),
    fontFamily: "PingFang SC",
    fontWeight: "600",
    color: "#747474",
    textAlign: "center",
    textTransform: "capitalize",
  },
});