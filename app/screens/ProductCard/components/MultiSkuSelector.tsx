import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import widthUtils from "../../../utils/widthUtils";
import fontSize from "../../../utils/fontsizeUtils";
import { ProductDetailParams, Sku } from "../../../services/api/productApi";
import { t } from "../../../i18n";
import { getSkuNameTransLanguage } from "../../../utils/languageUtils";

interface MultiSkuSelectorProps {
  product: ProductDetailParams;
  skuQuantities: { [key: number]: number };
  onQuantityChange: (index: number, quantity: number) => void;
  onQuantityPress: (
    type: "hasImg" | "noImg",
    index: number,
    currentQuantity: number,
    maxQuantity: number,
    attributeValue?: string
  ) => void;
}

const MultiSkuSelector: React.FC<MultiSkuSelectorProps> = ({
  product,
  skuQuantities,
  onQuantityChange,
  onQuantityPress,
}) => {
  if (!product.skus || product.skus.length <= 1) {
    return null;
  }

  return (
    <View style={styles.productBox}>
      <View style={styles.productTit}>
        <Text style={styles.productTitText}>
          {t("productCard.skuOptions")}
        </Text>
      </View>
      <ScrollView
        style={styles.sizePrice}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sizePriceBox}>
          {product.skus.map((sku, index) => (
            <View style={styles.allImageBox} key={index}>
              {sku.sku_image_url && (
                <View style={styles.allImageBoxImg}>
                  <Image
                    source={{ uri: sku.sku_image_url }}
                    style={styles.allImageBoxImgImg}
                  />
                </View>
              )}
              
              <View style={styles.allImageBoxList}>
                <View style={styles.allImageBoxListBox}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text
                      style={[
                        (sku.amount_on_sale ?? 0) === 0 
                          ? { color: '#bdbdbd', fontSize: fontSize(16), fontWeight: '700', fontFamily: 'Segoe UI', marginRight: 5 } 
                          : { fontSize: fontSize(16), fontWeight: '700', fontFamily: 'Segoe UI', color: 'red', marginRight: 5 }
                      ]}
                    >
                      {sku.offer_price || product.price || 0}
                    </Text>
                    <Text
                      style={[
                        styles.allImageBoxListBoxText, 
                        (sku.amount_on_sale ?? 0) === 0 && { color: '#bdbdbd' }
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {sku.attributes && sku.attributes.length > 0
                        ? sku.attributes.map(attr => getSkuNameTransLanguage(attr) || attr.value_trans || attr.value).join(" / ")
                        : `SKU ${index + 1}`}
                    </Text>
                  </View>
                  <Text style={styles.amountText}>
                    {t("productCard.stock")} {sku.amount_on_sale ?? 0}
                  </Text>
                </View>
                <View style={styles.allImageBoxListStop}>
                  <TouchableOpacity
                    style={styles.sizePriceBoxStepForwardButton}
                    onPress={() => {
                      const currentQuantity = skuQuantities[index] || 0;
                      if (currentQuantity > 0) {
                        onQuantityChange(index, currentQuantity - 1);
                      }
                    }}
                    disabled={(sku.amount_on_sale ?? 0) === 0}
                  >
                    <Text>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sizePriceBoxStepForwardInput}
                    onPress={() =>
                      onQuantityPress(
                        "noImg",
                        index,
                        skuQuantities[index] || 0,
                        sku.amount_on_sale ?? 0,
                        sku.sku_id?.toString()
                      )
                    }
                    disabled={(sku.amount_on_sale ?? 0) === 0}
                  >
                    <Text style={styles.quantityDisplayText}>
                      {(skuQuantities[index] || 0).toString()}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sizePriceBoxStepForwardButton}
                    onPress={() => {
                      const currentQuantity = skuQuantities[index] || 0;
                      const maxQuantity = sku.amount_on_sale ?? 0;
                      if (currentQuantity < maxQuantity) {
                        onQuantityChange(index, currentQuantity + 1);
                      }
                    }}
                    disabled={(sku.amount_on_sale ?? 0) === 0}
                  >
                    <Text>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
  sizePrice: {
    flex: 1,
    width: "100%",
  },
  sizePriceBox: {
    width: "100%",
    paddingBottom: 10,
  },
  allImageBox: {
    flexDirection: "row",
    marginTop: 10,
    alignItems: "center",
  },
  allImageBoxImg: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  allImageBoxImgImg: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  allImageBoxList: {
    flex: 1,
    paddingLeft: 10,
    flexDirection: "row",
  },
  allImageBoxListBox: {
    width: "60%",
    justifyContent: "center",
  },
  allImageBoxListBoxText: {
    fontSize: fontSize(16),
    fontFamily: "Segoe UI",
    color: "#000",
  },
  amountText: {
    fontSize: fontSize(16),
    fontWeight: "600",
    fontFamily: "Segoe UI",
    color: "#bdbdbd",
  },
  allImageBoxListStop: {
    width: "40%",
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

export default MultiSkuSelector;