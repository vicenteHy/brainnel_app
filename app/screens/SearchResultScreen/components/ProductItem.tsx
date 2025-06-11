import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { type Product } from "../../../services/api/productApi";
import { getSubjectTransLanguage } from "../../../utils/languageUtils";
import LazyImage from "./LazyImage";
import widthUtils from "../../../utils/widthUtils";
import fontSize from "../../../utils/fontsizeUtils";
import isSmallScreen from "../../../utils/isSmallScreen";
import { formatPrice } from "../../../utils/priceUtils";

interface ProductItemProps {
  product: Product;
  onPress: (product: Product) => void;
  t: any;
  userStore: any;
}

const ProductItem = React.memo(({ product, onPress, t, userStore }: ProductItemProps) => {
  const styles = {
    productCard: {
      flex: 1,
      margin: 8,
      backgroundColor: "#fff",
      borderRadius: 8,
      overflow: "hidden" as "hidden",
    },
    productImageContainer: {
      height: widthUtils(190, 190).height,
      backgroundColor: "#f9f9f9",
      alignItems: "center" as "center",
      justifyContent: "center" as "center",
    },
    productImage: {
      width: "100%",
      height: "100%",
    },
    placeholderText: {
      color: "#999",
      fontSize: fontSize(14),
    },
    productInfo: {
      padding: 8,
    },
    categoryText: {
      fontSize: isSmallScreen ? 12 : 14,
      color: "#000000",
      fontWeight: "600" as "600",
      marginBottom: 4,
      fontFamily: "PingFang SC",
      letterSpacing: 0,
    },
    beautyProductInfoRow: {
      flexDirection: "row" as "row",
      alignItems: "center" as "center",
    },
    flexRowCentered: {},
    priceContainer: {
      flexDirection: "row" as "row",
    },
    highlightedText: {
      fontWeight: "700" as "700",
      fontSize: fontSize(24),
      color: "#ff5100",
    },
    highlightedText1: {
      fontWeight: "700" as "700",
      fontSize: fontSize(14),
      color: "#ff5100",
    },
    priceLabel1: {
      fontSize: fontSize(12),
      fontWeight: "600" as "600",
      color: "#9a9a9a",
      textDecorationLine: "line-through" as "line-through",
    },
    productSales: {
      fontSize: fontSize(14),
      fontWeight: "600" as "600",
      fontFamily: "PingFang SC",
      color: "#7c7c7c",
    },
    vipIcon: {
      position: "absolute" as "absolute",
      top: 0,
      right: 0,
      justifyContent: "center" as "center",
      alignItems: "center" as "center",
      backgroundColor: "#3b3b3b",
      borderRadius: 10,
      flexDirection: "row" as "row",
      width: widthUtils(30, 66).width,
      height: widthUtils(30, 66).height,
    },
    vipButtonText: {
      fontStyle: "italic" as "italic",
      fontWeight: "900" as "900",
      fontSize: fontSize(18),
      color: "#f1c355",
    },
    vipLabelBold: {
      fontStyle: "italic" as "italic",
      fontWeight: "900" as "900",
      fontSize: fontSize(18),
      color: "#f1c355",
    },
  };

  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => onPress(product)}
      activeOpacity={0.7}
    >
      <View style={styles.productImageContainer}>
        {product.product_image_urls && product.product_image_urls[0] ? (
          <LazyImage
            uri={product.product_image_urls[0]}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.placeholderText}>{t('productPicture')}</Text>
        )}
        {userStore.user?.user_id && (
          <TouchableOpacity style={styles.vipIcon}>
            <Text style={styles.vipButtonText}>VIP</Text>
            <Text style={styles.vipLabelBold}>{userStore.user?.vip_level}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.categoryText} numberOfLines={2}>
          {getSubjectTransLanguage(product) || product.subject_trans}
        </Text>
        <View style={styles.beautyProductInfoRow}>
          <View style={styles.flexRowCentered}>
            {userStore.user?.user_id && (
              <Text style={styles.priceLabel1}>
                {formatPrice(Number(product.original_min_price || 0), product.currency || "FCFA")}
                {product.currency || "FCFA"}
              </Text>
            )}
            <View style={styles.priceContainer}>
              <Text style={styles.highlightedText}>
                {formatPrice(Number(product.min_price || 0), product.currency || "FCFA")}
              </Text>
              <Text style={styles.highlightedText1}>
                {product.currency || "FCFA"}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.productSales}>
          {product.sold_out} {product.sold_out === 0 ? "" : "+"}{" "}
          {t('sales')}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

export default ProductItem;