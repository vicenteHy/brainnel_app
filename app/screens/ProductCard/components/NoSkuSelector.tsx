import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import fontSize from "../../../utils/fontsizeUtils";
import widthUtils from "../../../utils/widthUtils";
import { ProductDetailParams } from "../../../services/api/productApi";
import { t } from "../../../i18n";

interface NoSkuSelectorProps {
  product: ProductDetailParams;
  mainProductQuantity: number;
  onQuantityChange: (quantity: number) => void;
  onQuantityPress: (
    type: "hasImg" | "noImg",
    index: number,
    currentQuantity: number,
    maxQuantity: number,
    attributeValue?: string
  ) => void;
}

const NoSkuSelector: React.FC<NoSkuSelectorProps> = ({
  product,
  mainProductQuantity,
  onQuantityChange,
  onQuantityPress,
}) => {
  if (product.skus && product.skus.length > 0) {
    return null;
  }

  return (
    <View style={styles.productBox}>
      <View style={styles.productTit}>
        <Text style={styles.productTitText}>
          {t("productCard.quantity")}
        </Text>
      </View>
      <View style={styles.sizePriceBoxItems}>
        <View style={styles.sizePriceBoxItem}>
          <View style={styles.sizePriceBoxItemTextBox}>
            <Text style={styles.sizePriceBoxItemText}>
              {product.subject || t("productCard.noName")}
            </Text>
          </View>
        </View>
        <View style={styles.sizePriceBoxStepForward}>
          <TouchableOpacity
            style={styles.sizePriceBoxStepForwardButton}
            onPress={() => onQuantityChange(Math.max(1, mainProductQuantity - 1))}
          >
            <Text>-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sizePriceBoxStepForwardInput}
            onPress={() =>
              onQuantityPress(
                "noImg",
                0,
                mainProductQuantity,
                999999,
                "default"
              )
            }
          >
            <Text style={styles.quantityDisplayText}>
              {mainProductQuantity.toString()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sizePriceBoxStepForwardButton}
            onPress={() => onQuantityChange(mainProductQuantity + 1)}
          >
            <Text>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  productBox: {
    marginTop: 10,
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  productTit: {
    flexDirection: "row",
    width: "100%",
  },
  productTitText: {
    fontSize: fontSize(16),
    fontWeight: "700",
    fontFamily: "Segoe UI",
    color: "#000",
  },
  sizePriceBoxItems: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    width: "100%",
  },
  sizePriceBoxItem: {
    width: "70%",
  },
  sizePriceBoxItemTextBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  sizePriceBoxItemText: {
    fontSize: fontSize(18),
    color: "#000",
  },
  sizePriceBoxStepForward: {
    width: "30%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  sizePriceBoxStepForwardButton: {
    width: widthUtils(40, 30).width,
    height: widthUtils(40, 30).height,
    backgroundColor: "#f3f4f8",
    justifyContent: "center",
    alignItems: "center",
  },
  sizePriceBoxStepForwardInput: {
    width: widthUtils(60, 40).width,
    height: widthUtils(40, 30).height,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    fontSize: fontSize(14),
    borderWidth: 1,
    borderColor: "#f3f4f8",
    padding: 0,
    lineHeight: fontSize(14),
  },
  quantityDisplayText: {
    fontSize: fontSize(16),
    fontWeight: "700",
    color: "#000",
    fontFamily: "Segoe UI",
  },
});

export default NoSkuSelector;