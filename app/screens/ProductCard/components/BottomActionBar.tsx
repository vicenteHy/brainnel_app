import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import widthUtils from "../../../utils/widthUtils";
import fontSize from "../../../utils/fontsizeUtils";
import { ProductDetailParams } from "../../../services/api/productApi";
import { t } from "../../../i18n";

interface BottomActionBarProps {
  selectedSize: number;
  totalPrice: number;
  product: ProductDetailParams;
  onAddToCart: () => void;
}

const BottomActionBar: React.FC<BottomActionBarProps> = ({
  selectedSize,
  totalPrice,
  product,
  onAddToCart,
}) => {
  return (
    <View style={styles.fixedBottomView}>
      <View style={styles.fixedBottomViewBox}>
        <View style={styles.fixedBottomViewBoxLeft}>
          <Text style={styles.fixedBottomViewBoxLeftText}>
            {t("productCard.totalQuantity")}
          </Text>
          <Text style={styles.fixedBottomViewBoxPriceText}>
            {selectedSize}
          </Text>
        </View>
        <View style={styles.fixedBottomViewBoxRight}>
          <Text style={styles.fixedBottomViewBoxRightText}>
            {t("productCard.totalPrice")}
          </Text>
          <Text style={styles.fixedBottomViewBoxPriceText}>
            {Math.round(totalPrice)} {product.currency}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.fixedBottomViewButton}
        onPress={onAddToCart}
        activeOpacity={1}
      >
        <Text style={styles.fixedBottomViewButtonText}>
          {t("productCard.addToCart")}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  fixedBottomView: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: widthUtils(118, 118).height,
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f8",
    padding: 10,
    zIndex: 1000,
    backgroundColor: "white",
  },
  fixedBottomViewBox: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fixedBottomViewBoxLeft: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
  },
  fixedBottomViewBoxLeftText: {
    fontSize: fontSize(16),
    color: "#000",
  },
  fixedBottomViewBoxPriceText: {
    fontSize: fontSize(20),
    color: "#ff5217",
    fontWeight: "700",
  },
  fixedBottomViewBoxRight: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  fixedBottomViewBoxRightText: {
    fontSize: fontSize(16),
  },
  fixedBottomViewButton: {
    marginTop: 10,
    width: "100%",
    height: widthUtils(50, 50).height,
    backgroundColor: "#ff5217",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  fixedBottomViewButtonText: {
    fontSize: fontSize(16),
    color: "#fff",
    fontWeight: "700",
    lineHeight: widthUtils(50, 50).height,
  },
});

export default BottomActionBar;