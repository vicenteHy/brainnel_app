import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, Modal, InteractionManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DownArrowIcon from '../../../../components/DownArrowIcon';
import fontSize from '../../../../utils/fontsizeUtils';
import { cartApi } from '../../../../services/api/cart';
import useCartStore from '../../../../store/cartStore';

interface InquiryItemProps {
  inquiry: any;
  isCompleted?: boolean;
  expandedItems: {[key: string]: {link: boolean, remark: boolean}};
  onToggleExpanded: (inquiryId: string, type: 'link' | 'remark') => void;
}

export const InquiryItem: React.FC<InquiryItemProps> = ({
  inquiry,
  isCompleted = false,
  expandedItems,
  onToggleExpanded
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { updateCartItemCount } = useCartStore();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleAddToCart = async () => {
    try {
      // 使用询盘中的数据
      const productData = {
        offer_id: inquiry.inquiry_id,
        skus: [{
          sku_id: inquiry.sku_id || null,
          quantity: inquiry.quantity || 1,
          is_inquiry_item: true
        }]
      };
      
      console.log("=== 询盘产品加购请求数据 ===");
      console.log("原始询盘数据:", inquiry);
      console.log("构建的加购数据:", productData);
      console.log("数据字段检查:");
      console.log("offer_id:", productData.offer_id, typeof productData.offer_id);
      console.log("quantity:", productData.quantity, typeof productData.quantity);
      console.log("sku_id:", productData.sku_id, typeof productData.sku_id);
      console.log("is_inquiry_item:", productData.is_inquiry_item, typeof productData.is_inquiry_item);
      console.log("============================");
      
      await cartApi(productData);
      // 更新全局购物车数量
      updateCartItemCount();
      // 显示成功弹窗
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("=== 询盘产品加购失败详情 ===");
      console.error("错误消息:", error.message);
      console.error("错误状态:", error.status);
      console.error("完整错误对象:", error);
      
      if (error.data) {
        console.error("错误数据:", error.data);
        if (error.data.detail) {
          console.error("详细错误信息:", JSON.stringify(error.data.detail, null, 2));
          if (Array.isArray(error.data.detail)) {
            error.data.detail.forEach((detail: any, index: number) => {
              console.error(`错误详情 ${index}:`, JSON.stringify(detail, null, 2));
            });
          }
        }
      }
      
      if (error.response?.data) {
        console.error("响应数据:", JSON.stringify(error.response.data, null, 2));
      }
      console.error("==============================");
      
      Alert.alert(t('common.error'), t('productCard.addFailedTryAgain'));
    }
  };

  return (
    <>
    <View style={styles.container}>
      {/* 顶部蓝色条 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isCompleted ? t('banner.inquiry.completed') : t('banner.inquiry.in_progress')}
        </Text>
        <Text style={styles.headerTime}>
          {inquiry.create_time || new Date().toLocaleString()}
        </Text>
      </View>
      
      {/* 内容区 */}
      <View style={styles.content}>
        <Image
          source={
            inquiry.image_url
              ? { uri: inquiry.image_url }
              : require("../../../../../assets/img/image_fac2b0a9.png")
          }
          style={styles.image}
        />
        
        <View style={styles.details}>
          <Text style={styles.title}>
            {inquiry.name || t('banner.inquiry.item_name')}
          </Text>
          
          <View style={styles.infoRow}>
            <View>
              <Text style={styles.label}>
                {t('banner.inquiry.quantity')}
              </Text>
              <Text style={styles.value}>
                {inquiry.quantity || "--"}
              </Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.label}>
                {t('banner.inquiry.material')}
              </Text>
              <Text style={styles.value}>
                {inquiry.material || "--"}
              </Text>
            </View>
          </View>
          
          {/* 价格信息 - 仅在已完成状态显示 */}
          {isCompleted && inquiry.display_price && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t('price')}</Text>
              <Text style={styles.priceValue}>
                {inquiry.display_price} {inquiry.display_currency || '¥'}
              </Text>
            </View>
          )}
          
          <View>
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => onToggleExpanded(inquiry.id, 'link')}
            >
              <Text style={styles.expandLabel}>
                {t('banner.inquiry.link')}
              </Text>
              <View style={{ flex: 1 }} />
              <View style={styles.arrowContainer}>
                <DownArrowIcon 
                  size={12} 
                  color="#888" 
                  rotation={expandedItems[inquiry.id]?.link ? 180 : 0} 
                />
              </View>
            </TouchableOpacity>
            {expandedItems[inquiry.id]?.link && (
              <Text style={styles.expandContent}>
                {inquiry.link || t('banner.inquiry.none')}
              </Text>
            )}
          </View>
          
          <View>
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => onToggleExpanded(inquiry.id, 'remark')}
            >
              <Text style={styles.expandLabel}>
                {t('banner.inquiry.remark')}
              </Text>
              <View style={{ flex: 1 }} />
              <View style={styles.arrowContainer}>
                <DownArrowIcon 
                  size={12} 
                  color="#888" 
                  rotation={expandedItems[inquiry.id]?.remark ? 180 : 0} 
                />
              </View>
            </TouchableOpacity>
            {expandedItems[inquiry.id]?.remark && (
              <Text style={styles.expandContent}>
                {inquiry.remark || t('banner.inquiry.none')}
              </Text>
            )}
          </View>
        </View>
      </View>
      
      {/* 加购按钮 - 仅在已完成状态显示 */}
      {isCompleted && (
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.addToCartButton}
            onPress={handleAddToCart}
          >
            <Text style={styles.addToCartText}>
              {t('addToCart')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
    
    {/* 加购成功弹窗 */}
    <Modal
      visible={showSuccessModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSuccessModal(false)}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.popup}>
          <Text style={modalStyles.promptText}>{t("cart.enter_the_shopping_cart")}</Text>
          <View style={modalStyles.buttonContainer}>
            <TouchableOpacity
              style={modalStyles.cancelButton}
              onPress={() => setShowSuccessModal(false)}
              activeOpacity={1}
            >
              <Text style={modalStyles.cancelText}>{t("productCard.continueShopping")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.confirmButton}
              onPress={() => {
                setShowSuccessModal(false);
                InteractionManager.runAfterInteractions(() => {
                  navigation.navigate("CartScreen");
                });
              }}
              activeOpacity={1}
            >
              <Text style={modalStyles.confirmText}>
                {t("productCard.viewCart")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  header: {
    backgroundColor: "#E8F2FF",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: "#1976D2",
    fontWeight: "600",
    fontSize: fontSize(15),
  },
  headerTime: {
    color: "#5E92C4",
    fontSize: fontSize(13),
  },
  content: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 14,
    backgroundColor: "#f5f5f5",
  },
  details: {
    flex: 1,
  },
  title: {
    fontWeight: "600",
    fontSize: fontSize(16),
    marginBottom: 10,
    color: "#333333",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  infoCol: {
    marginLeft: 40,
  },
  label: {
    color: "#999999",
    fontSize: fontSize(13),
    marginBottom: 2,
  },
  value: {
    fontSize: fontSize(15),
    fontWeight: "600",
    color: "#333333",
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: 4,
  },
  expandLabel: {
    color: "#666666",
    fontSize: fontSize(14),
    marginRight: 8,
  },
  arrowContainer: {
    marginLeft: 4,
  },
  expandContent: {
    fontSize: fontSize(13),
    marginBottom: 8,
    paddingLeft: 0,
    color: "#555555",
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  priceLabel: {
    fontSize: fontSize(14),
    color: "#666666",
  },
  priceValue: {
    fontSize: fontSize(18),
    fontWeight: "700",
    color: "#ff4444",
  },
  actionRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fafafa",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  addToCartButton: {
    backgroundColor: "#1976D2",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: "center",
  },
  addToCartText: {
    color: "#ffffff",
    fontSize: fontSize(15),
    fontWeight: "600",
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  popup: {
    backgroundColor: "white",
    borderRadius: 15,
    paddingVertical: 30,
    paddingHorizontal: 25,
    alignItems: "center",
    width: "90%",
    maxWidth: 380,
    minWidth: 300,
  },
  promptText: {
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "black",
    textAlign: "center",
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
    paddingHorizontal: 10,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f2f3f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    paddingHorizontal: 15,
  },
  confirmButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FF5100",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  cancelText: {
    fontSize: fontSize(15),
    fontWeight: "500",
    color: "#333333",
    textAlign: "center",
  },
  confirmText: {
    fontSize: fontSize(15),
    fontWeight: "500",
    color: "#ffffff",
    textAlign: "center",
  },
});