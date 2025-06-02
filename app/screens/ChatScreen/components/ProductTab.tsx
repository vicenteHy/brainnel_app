import React from "react";
import { View, FlatList, Text, StyleSheet } from "react-native";
import customRF from "../../../utils/customRF";
import { ProductInquiryCard } from "./ProductInquiryCard";
import { ProductInquiry } from "../types";
import { t } from "../../../i18n";

interface ProductTabProps {
  productInquiries: ProductInquiry[];
  userLoggedIn: boolean;
}

export const ProductTab: React.FC<ProductTabProps> = ({
  productInquiries,
  userLoggedIn,
}) => {
  return (
    <View style={styles.tabContent}>
      <View style={styles.productSupportContainer}>
        {productInquiries.length > 0 ? (
          <FlatList
            data={productInquiries}
            renderItem={({ item }) => <ProductInquiryCard item={item} />}
            keyExtractor={(item, index) => item.offer_id?.toString() || index.toString()}
            contentContainerStyle={styles.productInquiryList}
            showsVerticalScrollIndicator={false}
            scrollEnabled={userLoggedIn}
          />
        ) : (
          <View style={styles.emptyProductContainer}>
            <Text style={styles.emptyProductText}>
              {t("chat.no_product_inquiries", "暂无产品咨询记录")}
            </Text>
            <Text style={styles.emptyProductSubText}>
              {t("chat.product_inquiry_hint", "从商品详情页点击咨询按钮开始您的第一次产品咨询")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
  },
  productSupportContainer: {
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  productInquiryList: {
    // padding: 20,
  },
  emptyProductContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyProductText: {
    fontSize: customRF(18),
    fontWeight: "600",
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyProductSubText: {
    fontSize: customRF(14),
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
});