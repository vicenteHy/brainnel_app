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
    <View style={styles.container}>
      {productInquiries.length > 0 ? (
        <FlatList
          data={productInquiries}
          renderItem={({ item }) => <ProductInquiryCard item={item} />}
          keyExtractor={(item, index) => item.offer_id?.toString() || index.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          scrollEnabled={userLoggedIn}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
          </View>
          <Text style={styles.emptyTitle}>
            {t("chat.no_product_inquiries", "暂无产品咨询记录")}
          </Text>
          <Text style={styles.emptySubtitle}>
            {t("chat.product_inquiry_hint", "从商品详情页点击咨询按钮开始您的第一次产品咨询")}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: customRF(18),
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: customRF(14),
    color: "#95a5a6",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
});