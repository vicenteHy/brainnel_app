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

interface SingleSkuSelectorProps {
  product: ProductDetailParams;
  mainProductQuantity: number;
  onQuantityChange: (quantity: number) => void;
}

const SingleSkuSelector: React.FC<SingleSkuSelectorProps> = ({
  product,
  mainProductQuantity,
  onQuantityChange,
}) => {
  if (!product.skus || product.skus.length !== 1 || product.skus[0].sku_image_url) {
    return null;
  }

  const sku = product.skus[0];

  return (
    <View style={styles.productBox}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 20,
        }}
      >
        <Text
          style={[styles.productTitText, { flex: 1 }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {product.subject || t("productCard.noName")}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
        <Text
          style={[
            styles.productTitText,
            { width: "50%" }
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {sku.attributes && sku.attributes.length > 0
            ? sku.attributes.map(attr => attr.value_trans || attr.value).join(" / ")
            : ""}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1, justifyContent: "flex-end" }}>
          <TouchableOpacity
            style={styles.sizePriceBoxStepForwardButton}
            onPress={() => onQuantityChange(Math.max(1, mainProductQuantity - 1))}
          >
            <Text>-</Text>
          </TouchableOpacity>
          <Text
            style={[
              styles.quantityDisplayText,
              {
                marginHorizontal: 8,
                minWidth: 24,
                textAlign: "center",
              },
            ]}
          >
            {mainProductQuantity}
          </Text>
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
  productTitText: {
    fontSize: fontSize(16),
    fontWeight: "700",
    fontFamily: "Segoe UI",
    color: "#000",
  },
  sizePriceBoxStepForwardButton: {
    width: widthUtils(40, 30).width,
    height: widthUtils(40, 30).height,
    backgroundColor: "#f3f4f8",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityDisplayText: {
    fontSize: fontSize(16),
    fontWeight: "700",
    color: "#000",
    fontFamily: "Segoe UI",
  },
});

export default SingleSkuSelector;