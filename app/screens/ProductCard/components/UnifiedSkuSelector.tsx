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

interface UnifiedSkuSelectorProps {
  product: ProductDetailParams;
  skuQuantities?: { [key: number]: number };
  mainProductQuantity?: number;
  onQuantityChange: (index: number, quantity: number) => void;
  onQuantityPress: (
    type: "hasImg" | "noImg",
    index: number,
    currentQuantity: number,
    maxQuantity: number,
    attributeValue?: string
  ) => void;
}

const UnifiedSkuSelector: React.FC<UnifiedSkuSelectorProps> = ({
  product,
  skuQuantities = {},
  mainProductQuantity = 1,
  onQuantityChange,
  onQuantityPress,
}) => {
  // 判断SKU类型
  const getSkuType = () => {
    if (!product.skus || product.skus.length === 0) {
      return 'noSku';
    }
    if (product.skus.length === 1 && !product.skus[0].sku_image_url) {
      return 'singleSku';
    }
    return 'multiSku';
  };

  const skuType = getSkuType();

  // 无SKU选择器
  const renderNoSkuSelector = () => (
    <View style={styles.productBox}>
      <View style={styles.productTitle}>
        <Text style={styles.productTitleText}>
          {t("productCard.quantity")}
        </Text>
      </View>
      <View style={styles.productItems}>
        <View style={styles.productItem}>
          <View style={styles.productItemTextContainer}>
            <Text style={styles.productItemText}>
              {product.subject || t("productCard.noName")}
            </Text>
          </View>
        </View>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => onQuantityChange(0, Math.max(1, mainProductQuantity - 1))}
            activeOpacity={1}
          >
            <Text>-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quantityInput}
            onPress={() =>
              onQuantityPress(
                "noImg",
                0,
                mainProductQuantity,
                999999,
                "default"
              )
            }
            activeOpacity={1}
          >
            <Text style={styles.quantityDisplayText}>
              {mainProductQuantity.toString()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => onQuantityChange(0, mainProductQuantity + 1)}
            activeOpacity={1}
          >
            <Text>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // 单SKU选择器
  const renderSingleSkuSelector = () => {
    const sku = product.skus![0];
    
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
            style={[styles.productTitleText, { flex: 1 }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {product.subject || t("productCard.noName")}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 10 }}>
          <Text
            style={[
              styles.productTitleText,
              { flex: 1, paddingRight: 10 }
            ]}
          >
            {sku.attributes && sku.attributes.length > 0
              ? sku.attributes.map(attr => attr.value_trans || attr.value).join(" / ")
              : ""}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", minWidth: 120 }}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => onQuantityChange(0, Math.max(1, mainProductQuantity - 1))}
              activeOpacity={1}
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
              style={styles.quantityButton}
              onPress={() => onQuantityChange(0, mainProductQuantity + 1)}
              activeOpacity={1}
            >
              <Text>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // 多SKU选择器
  const renderMultiSkuSelector = () => (
    <View style={styles.productBox}>
      <View style={styles.productTitle}>
        <Text style={styles.productTitleText}>
          {t("productCard.skuOptions")}
        </Text>
      </View>
      <ScrollView
        style={styles.scrollContainer}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.skuListContainer}>
          {product.skus!.map((sku, index) => (
            <View style={styles.skuItem} key={index}>
              {sku.sku_image_url && (
                <View style={styles.skuImageContainer}>
                  <Image
                    source={{ uri: sku.sku_image_url }}
                    style={styles.skuImage}
                  />
                </View>
              )}
              
              <View style={styles.skuContent}>
                <View style={styles.skuInfo}>
                  <Text
                    style={[
                      styles.skuText, 
                      (sku.amount_on_sale ?? 0) === 0 && { color: '#bdbdbd' }
                    ]}
                  >
                    {sku.attributes && sku.attributes.length > 0
                      ? sku.attributes.map(attr => getSkuNameTransLanguage(attr) || attr.value_trans || attr.value).join(" / ")
                      : `SKU ${index + 1}`}
                  </Text>
                  <Text style={styles.stockText}>
                    {t("productCard.stock")} {sku.amount_on_sale ?? 0}
                  </Text>
                </View>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => {
                      const currentQuantity = skuQuantities[index] || 0;
                      if (currentQuantity > 0) {
                        onQuantityChange(index, currentQuantity - 1);
                      }
                    }}
                    disabled={(sku.amount_on_sale ?? 0) === 0}
                    activeOpacity={1}
                  >
                    <Text>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quantityInput}
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
                    activeOpacity={1}
                  >
                    <Text style={styles.quantityDisplayText}>
                      {(skuQuantities[index] || 0).toString()}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => {
                      const currentQuantity = skuQuantities[index] || 0;
                      const maxQuantity = sku.amount_on_sale ?? 0;
                      if (currentQuantity < maxQuantity) {
                        onQuantityChange(index, currentQuantity + 1);
                      }
                    }}
                    disabled={(sku.amount_on_sale ?? 0) === 0}
                    activeOpacity={1}
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

  // 根据SKU类型渲染对应的组件
  switch (skuType) {
    case 'noSku':
      return renderNoSkuSelector();
    case 'singleSku':
      return renderSingleSkuSelector();
    case 'multiSku':
      return renderMultiSkuSelector();
    default:
      return null;
  }
};

const styles = StyleSheet.create({
  productBox: {
    marginTop: 10,
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  productTitle: {
    flexDirection: "row",
    width: "100%",
  },
  productTitleText: {
    fontSize: fontSize(14),
    fontWeight: "600",
    color: "#000",
    lineHeight: fontSize(20),
  },
  // 无SKU样式
  productItems: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    width: "100%",
  },
  productItem: {
    width: "70%",
  },
  productItemTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  productItemText: {
    fontSize: fontSize(18),
    color: "#000",
  },
  // 多SKU样式
  scrollContainer: {
    flex: 1,
    width: "100%",
  },
  skuListContainer: {
    width: "100%",
    paddingBottom: 10,
  },
  skuItem: {
    flexDirection: "row",
    marginTop: 10,
    alignItems: "flex-start",
    minHeight: 60,
  },
  skuImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  skuImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  skuContent: {
    flex: 1,
    paddingLeft: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 5,
  },
  skuInfo: {
    flex: 1,
    justifyContent: "flex-start",
    paddingRight: 10,
  },
  skuText: {
    fontSize: fontSize(16),
    color: "#000",
    lineHeight: fontSize(20),
    marginBottom: 4,
  },
  stockText: {
    fontSize: fontSize(12),
    fontWeight: "400",
    color: "lightgray",
  },
  // 通用样式
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: 120,
  },
  quantityButton: {
    width: widthUtils(40, 30).width,
    height: widthUtils(40, 30).height,
    backgroundColor: "#f3f4f8",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityInput: {
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
  },
});

export default UnifiedSkuSelector; 