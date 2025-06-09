import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import customRF from "../../../utils/customRF";
import { ProductInquiry, RootStackParamList } from "../types";
import useUserStore from "../../../store/user";
import { t } from "../../../i18n";

interface ProductInquiryCardProps {
  item: ProductInquiry;
}

export const ProductInquiryCard: React.FC<ProductInquiryCardProps> = ({ item }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useUserStore();

  const navigateToProductChat = () => {
    navigation.navigate("ProductChatScreen", {
      product_image_urls: item.product_image_urls,
      subject_trans: item.subject_trans,
      min_price: item.min_price,
      offer_id: item.offer_id,
      default_message: item.default_message,
    });
  };

  return (
    <View style={styles.productCard}>
      <View style={styles.productContent}>
        <View style={styles.imageContainer}>
          {item.product_image_urls && item.product_image_urls[0] && (
            <Image
              source={{ uri: item.product_image_urls[0] }}
              style={styles.productImage}
              resizeMode="cover"
            />
          )}
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.subject_trans || t("chat.product_name_unavailable", "商品名称不可用")}
          </Text>
          {item.min_price && (
            <Text style={styles.productPrice}>
              {item.min_price} {user.currency || "FCFA"}
            </Text>
          )}
          {item.offer_id && (
            <Text style={styles.productId}>
              ID: {item.offer_id}
            </Text>
          )}
        </View>
        
        <TouchableOpacity style={styles.continueButton} onPress={navigateToProductChat} activeOpacity={0.8}>
          <Text style={styles.continueButtonText}>
            {t("chat.continue_inquiry", "继续咨询")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  productCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  productContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginRight: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 12,
  },
  productName: {
    fontSize: customRF(14),
    fontWeight: "600",
    color: "#2c3e50",
    lineHeight: 20,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: customRF(16),
    fontWeight: "700",
    color: "#e74c3c",
    marginBottom: 2,
  },
  productId: {
    fontSize: customRF(12),
    color: "#95a5a6",
  },
  continueButton: {
    backgroundColor: "#FF6F30",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  continueButtonText: {
    fontSize: customRF(13),
    fontWeight: "600",
    color: "white",
  },
});