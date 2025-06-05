import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import widthUtils from "../../../utils/widthUtils";
import fontSize from "../../../utils/fontsizeUtils";
import CloseIcon from "../../../components/CloseIcon";
import { ProductDetailParams } from "../../../services/api/productApi";
import { t } from "../../../i18n";

interface ProductHeaderProps {
  imgTitle: string;
  price: number;
  product: ProductDetailParams;
  vip_level: number;
  vip_discount: number;
  onClose: () => void;
}

const ProductHeader: React.FC<ProductHeaderProps> = ({
  imgTitle,
  price,
  product,
  vip_level,
  vip_discount,
  onClose,
}) => {
  return (
    <View style={styles.productInfo}>
      <View style={styles.productBigImgBox}>
        <Image source={{ uri: imgTitle }} style={styles.productBigImg} />
      </View>
      <View style={styles.productInfoBox}>
        <View style={styles.priceInfo}>
          <View style={styles.priceInfoBox}>
            <View style={styles.priceInfoBoxVip}>
              {vip_level > 0 && (
                <>
                  <View style={styles.priceInfoOffer}>
                    <Image
                      source={require("../../../../assets/img/zkVIP1.png")}
                      style={styles.priceInfoOfferImg}
                    />
                    <View style={styles.discountTextContainer}>
                      <Text style={styles.discountText}>
                        {" "}
                        -{((1 - vip_discount) * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.priceInfoVip}>
                    <ImageBackground
                      source={require("../../../../assets/img/vip1.png")}
                      style={styles.priceInfoVipImg}
                    >
                      <Text style={styles.vipStatusNumeric}>
                        VIP {vip_level}
                      </Text>
                    </ImageBackground>
                  </View>
                </>
              )}
            </View>
            <View style={styles.priceContainer}>
              <View style={styles.price}>
                <Text style={styles.priceInfoText}>{price}</Text>
                <Text style={styles.priceInfoTextCon}>
                  {product.currency}
                </Text>
              </View>
              {product.min_order_quantity && product.min_order_quantity > 1 && (
                <Text style={styles.minOrderText}>
                  {t("productCard.minOrder")}: {product.min_order_quantity}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.priceInfoClose}>
            <TouchableOpacity onPress={onClose} activeOpacity={1}>
              <CloseIcon size={fontSize(20)} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  productInfo: {
    flexDirection: "row",
    height: widthUtils(100, 100).height,
  },
  productBigImgBox: {
    width: widthUtils(100, 100).width,
    height: widthUtils(100, 81000).height,
    borderRadius: 10,
  },
  productBigImg: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  productInfoBox: {
    flex: 1,
    paddingLeft: 10,
  },
  priceInfo: {
    width: "100%",
    height: "40%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priceInfoBox: {
    width: "90%",
    height: "100%",
    gap: 18,
    justifyContent: "space-between",
  },
  priceInfoBoxVip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  priceContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  price: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  priceInfoText: {
    fontWeight: "700",
    fontSize: fontSize(26),
    color: "#ff5100",
  },
  priceInfoTextCon: {
    fontWeight: "700",
    fontSize: fontSize(14),
    color: "#ff5100",
    lineHeight: fontSize(30),
    alignSelf: "flex-end",
    marginLeft: 2,
  },
  minOrderText: {
    fontSize: fontSize(12),
    color: "#666",
    marginTop: 2,
    fontWeight: "500",
  },
  priceInfoOffer: {
    width: widthUtils(35, 35).width,
    height: widthUtils(35, 35).height,
    position: "relative",
  },
  priceInfoOfferImg: {
    width: "100%",
    height: "100%",
  },
  discountTextContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  discountText: {
    color: "#512003",
    fontSize: fontSize(12),
    fontWeight: "600",
    fontStyle: "italic",
  },
  priceInfoVip: {
    width: widthUtils(30, 63).width,
    height: widthUtils(30, 63).height,
  },
  priceInfoVipImg: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  vipStatusNumeric: {
    fontStyle: "italic",
    fontWeight: "900",
    fontSize: fontSize(18),
    color: "#f1c355",
    textAlign: "center",
    marginLeft: 2,
  },
  priceInfoClose: {
    width: "10%",
    alignItems: "flex-end",
  },
});

export default ProductHeader;