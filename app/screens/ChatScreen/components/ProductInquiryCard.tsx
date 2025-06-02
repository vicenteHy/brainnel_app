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
    <TouchableOpacity style={styles.productInquiryCard} onPress={navigateToProductChat}>
      <View style={styles.productInquiryContent}>
        {item.product_image_urls && item.product_image_urls[0] && (
          <Image
            source={{ uri: item.product_image_urls[0] }}
            style={styles.productInquiryImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.productInquiryDetails}>
          <Text style={styles.productInquiryName} numberOfLines={2}>
            {item.subject_trans || t("chat.product_name_unavailable", "商品名称不可用")}
          </Text>
          {item.min_price && (
            <Text style={styles.productInquiryPrice}>
              {item.min_price} {user.currency || "FCFA"}
            </Text>
          )}
          {item.offer_id && (
            <Text style={styles.productInquiryId}>
              ID: {item.offer_id}
            </Text>
          )}
          <Text style={styles.productInquiryTime}>
            {t("chat.last_inquiry", "最后咨询")}: {new Date(item.lastInquiryTime).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.productInquiryContinueButton}>
        <Text style={styles.productInquiryContinueButtonText}>
          {t("chat.continue_chat", "继续聊天")}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  productInquiryCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productInquiryContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  productInquiryImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: "#f5f5f5",
  },
  productInquiryDetails: {
    flex: 1,
  },
  productInquiryName: {
    fontSize: customRF(16),
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    lineHeight: 22,
  },
  productInquiryPrice: {
    fontSize: customRF(16),
    fontWeight: "700",
    color: "#ff5217",
    marginBottom: 5,
  },
  productInquiryId: {
    fontSize: customRF(12),
    color: "#999",
    marginBottom: 5,
  },
  productInquiryTime: {
    fontSize: customRF(12),
    color: "#666",
  },
  productInquiryContinueButton: {
    backgroundColor: "#ff5323",
    borderRadius: 59,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: "center",
  },
  productInquiryContinueButtonText: {
    color: "white",
    fontSize: customRF(14),
    fontWeight: "600",
  },
});