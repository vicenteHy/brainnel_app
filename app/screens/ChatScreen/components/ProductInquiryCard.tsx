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
          <Text style={styles.productName} numberOfLines={3}>
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
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.continueButton} onPress={navigateToProductChat} activeOpacity={1}>
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
    borderRadius: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
  },
  productContent: {
    padding: 24,
    alignItems: "center",
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  productInfo: {
    alignItems: "center",
    width: "100%",
  },
  productName: {
    fontSize: customRF(15),
    fontWeight: "600",
    color: "#2c3e50",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  productPrice: {
    fontSize: customRF(22),
    fontWeight: "700",
    color: "#e74c3c",
    marginBottom: 8,
  },
  productId: {
    fontSize: customRF(13),
    color: "#95a5a6",
    marginBottom: 4,
  },
  actionButtons: {
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
    padding: 16,
  },
  continueButton: {
    backgroundColor: "#ff6b35",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff6b35",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  continueButtonText: {
    fontSize: customRF(15),
    fontWeight: "600",
    color: "white",
  },
});