import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
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
        <View style={styles.svgContainer1}>
          <Image
            source={IMAGES.maritimeIcon}
            style={{
              width: widthUtils(24, 24).width,
              height: widthUtils(24, 24).height,
              tintColor: shippingMethod === "maritime" ? "#fff" : "#747474",
            }}
          />
        </View>
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
        <View style={styles.svgContainer2}>
          <Image
            source={IMAGES.airwayIcon}
            style={{
              width: widthUtils(24, 24).width,
              height: widthUtils(24, 24).height,
              tintColor: shippingMethod === "airway" ? "#fff" : "#747474",
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
  );
};

const styles = StyleSheet.create({
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
});