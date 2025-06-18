import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  Dimensions,
} from "react-native";
import widthUtils from "../../../utils/widthUtils";
import fontSize from "../../../utils/fontsizeUtils";
import { ProductDetailParams, Sku } from "../../../services/api/productApi";
import { t } from "../../../i18n";
import { getSkuNameTransLanguage } from "../../../utils/languageUtils";
import { getCurrentLanguage as getI18nLanguage } from "../../../i18n";
import { formatPrice } from "../../../utils/priceUtils";

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
    attributeValue?: string,
  ) => void;
}

const UnifiedSkuSelector: React.FC<UnifiedSkuSelectorProps> = ({
  product,
  skuQuantities = {},
  mainProductQuantity = 1,
  onQuantityChange,
  onQuantityPress,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setModalVisible(true);
  };
  
  // 获取直播商品SKU名称的辅助函数
  const getLiveSkuName = (sku: any): string => {
    const currentLang = getI18nLanguage();
    
    // 根据语言选择对应的字段
    if (currentLang === 'en') {
      return sku.name_en || sku.name || sku.spec_en || sku.spec || '';
    } else if (currentLang === 'fr') {
      return sku.name_fr || sku.name || sku.spec_fr || sku.spec || '';
    } else {
      // 默认中文
      return sku.name || sku.spec || sku.name_zh || '';
    }
  };
  
  // 获取产品名称的辅助函数（根据语言）
  const getProductName = (): string => {
    const currentLang = getI18nLanguage();
    
    if (currentLang === 'en') {
      return product.subject_trans_en || product.subject || t("productCard.noName");
    } else if (currentLang === 'fr') {
      return product.subject_trans || product.subject || t("productCard.noName");
    } else {
      // 默认使用subject字段
      return product.subject || t("productCard.noName");
    }
  };
  // 判断SKU类型
  const getSkuType = () => {
    if (!product.skus || product.skus.length === 0) {
      return "noSku";
    }
    if (product.skus.length === 1 && !product.skus[0].sku_image_url) {
      return "singleSku";
    }
    return "multiSku";
  };

  const skuType = getSkuType();

  // 无SKU选择器
  const renderNoSkuSelector = () => (
    <View style={styles.productBox}>
      <View style={styles.productTitle}>
        <Text style={styles.productTitleText}>{t("productCard.quantity")}</Text>
      </View>
      <View style={styles.productItems}>
        <View style={styles.productItem}>
          <View style={styles.productItemTextContainer}>
            <Text style={styles.productItemText}>
              {getProductName()}
            </Text>
          </View>
        </View>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={[
              styles.quantityButton,
              mainProductQuantity <= 1
                ? styles.quantityButtonDisabled
                : styles.quantityButtonEnabled,
            ]}
            onPress={() =>
              onQuantityChange(0, Math.max(1, mainProductQuantity - 1))
            }
            activeOpacity={1}
          >
            <Text
              style={
                mainProductQuantity <= 1
                  ? styles.quantityButtonDisabledText
                  : styles.quantityButtonText
              }
            >
              -
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quantityInput}
            onPress={() =>
              onQuantityPress(
                "noImg",
                0,
                mainProductQuantity,
                999999,
                "default",
              )
            }
            activeOpacity={1}
          >
            <Text style={styles.quantityDisplayText}>
              {mainProductQuantity.toString()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quantityButton, styles.quantityButtonEnabled]}
            onPress={() => onQuantityChange(0, mainProductQuantity + 1)}
            activeOpacity={1}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // 单SKU选择器
  const renderSingleSkuSelector = () => {
    const sku = product.skus![0];
    
    // 参考ProductDetailScreen的逻辑，从attributes中获取图片
    let skuImageFromAttributes = null;
    if (sku.attributes && sku.attributes.length > 0) {
      // 查找attributes中有图片的项
      const attributeWithImage = sku.attributes.find((attr: any) => attr.sku_image_url);
      skuImageFromAttributes = attributeWithImage?.sku_image_url;
    }
    
    // 同时保持原有的字段检查作为备用
    const skuAny = sku as any;
    const possibleImageFields = [
      skuImageFromAttributes, // 优先使用从attributes中找到的图片
      sku.sku_image_url,
      skuAny.image_url,
      skuAny.image,
      skuAny.sku_image,
      skuAny.picture_url,
      skuAny.photo_url,
      skuAny.img_url,
      skuAny.imageUrl,
      skuAny.skuImageUrl,
      skuAny.sku_picture,
      skuAny.picture,
      skuAny.photo
    ];
    
    // 找到第一个有效的图片URL
    const skuImageUrl = possibleImageFields.find(url => url && typeof url === 'string' && url.trim() !== '');
    const productImageUrl = product.product_image_urls?.[0];
    const imageUrl = skuImageUrl || productImageUrl;


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
            {getProductName()}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            marginTop: 10,
          }}
        >
          {imageUrl && imageUrl.trim() !== '' ? (
            <View style={styles.skuImageWrapper}>
              <TouchableOpacity
                style={styles.skuImageContainer}
                onPress={() => handleImagePress(imageUrl)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.skuImage}
                  onError={(error) => {
                    if (__DEV__) {
                      console.log('单SKU图片加载失败:', imageUrl, error);
                    }
                  }}
                  onLoad={() => {
                    // Image loaded successfully
                  }}
                />
              </TouchableOpacity>
              <View style={styles.skuPriceContainer}>
                <Text style={styles.skuPriceText}>
                  {formatPrice(sku.offer_price || sku.price || 0, product.currency)} {product.currency}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.skuImageWrapper}>
              <View style={styles.skuImageContainer}>
                <View style={[styles.skuImage, styles.noImagePlaceholder]}>
                  <Text style={styles.noImageText}>无图</Text>
                </View>
              </View>
              <View style={styles.skuPriceContainer}>
                <Text style={styles.skuPriceText}>
                  {formatPrice(sku.offer_price || sku.price || 0, product.currency)} {product.currency}
                </Text>
              </View>
            </View>
          )}
          <View style={styles.skuContent}>
            <Text
              style={[styles.productTitleText, { flex: 1, paddingRight: 10 }]}
            >
              {sku.attributes && sku.attributes.length > 0
                ? sku.attributes
                    .map((attr) => getSkuNameTransLanguage(attr))
                    .join(" / ")
                : getLiveSkuName(sku)}
            </Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  mainProductQuantity <= 1
                    ? styles.quantityButtonDisabled
                    : styles.quantityButtonEnabled,
                ]}
                onPress={() =>
                  onQuantityChange(0, Math.max(1, mainProductQuantity - 1))
                }
                activeOpacity={1}
              >
                <Text
                  style={
                    mainProductQuantity <= 1
                      ? styles.quantityButtonDisabledText
                      : styles.quantityButtonText
                  }
                >
                  -
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quantityInput}
                onPress={() =>
                  onQuantityPress(
                    "hasImg",
                    0,
                    mainProductQuantity,
                    999999,
                    "default",
                  )
                }
                activeOpacity={1}
              >
                <Text style={styles.quantityDisplayText}>
                  {mainProductQuantity}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quantityButton, styles.quantityButtonEnabled]}
                onPress={() => onQuantityChange(0, mainProductQuantity + 1)}
                activeOpacity={1}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
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
          {product.skus!.map((sku, index) => {
            // 参考ProductDetailScreen的逻辑，从attributes中获取图片
            let skuImageFromAttributes = null;
            if (sku.attributes && sku.attributes.length > 0) {
              // 查找attributes中有图片的项
              const attributeWithImage = sku.attributes.find((attr: any) => attr.sku_image_url);
              skuImageFromAttributes = attributeWithImage?.sku_image_url;
            }
            
            // 同时保持原有的字段检查作为备用
            const skuAny = sku as any;
            const possibleImageFields = [
              skuImageFromAttributes, // 优先使用从attributes中找到的图片
              sku.sku_image_url,
              skuAny.image_url,
              skuAny.image,
              skuAny.sku_image,
              skuAny.picture_url,
              skuAny.photo_url,
              skuAny.img_url,
              skuAny.imageUrl,
              skuAny.skuImageUrl,
              skuAny.sku_picture,
              skuAny.picture,
              skuAny.photo
            ];
            
            // 找到第一个有效的图片URL
            const skuImageUrl = possibleImageFields.find(url => url && typeof url === 'string' && url.trim() !== '');
            const productImageUrl = product.product_image_urls?.[0];
            const imageUrl = skuImageUrl || productImageUrl;
            
            
            return (
            <View style={styles.skuItem} key={index}>
              {imageUrl && imageUrl.trim() !== '' ? (
                <View style={styles.skuImageWrapper}>
                  <TouchableOpacity
                    style={styles.skuImageContainer}
                    onPress={() => handleImagePress(imageUrl)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.skuImage}
                      onError={(error) => {
                        if (__DEV__) {
                          console.log(`SKU ${index} 图片加载失败:`, imageUrl, error);
                        }
                      }}
                      onLoad={() => {
                        // Image loaded successfully
                      }}
                    />
                  </TouchableOpacity>
                  <View style={styles.skuPriceContainer}>
                    <Text style={styles.skuPriceText}>
                      {formatPrice(sku.offer_price || sku.price || 0, product.currency)} {product.currency}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.skuImageWrapper}>
                  <View style={styles.skuImageContainer}>
                    <View style={[styles.skuImage, styles.noImagePlaceholder]}>
                      <Text style={styles.noImageText}>无图</Text>
                    </View>
                  </View>
                  <View style={styles.skuPriceContainer}>
                    <Text style={styles.skuPriceText}>
                      {formatPrice(sku.offer_price || sku.price || 0, product.currency)} {product.currency}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.skuContent}>
                <View style={styles.skuInfo}>
                  <Text
                    style={[
                      styles.skuText,
                      ((sku.amount_on_sale ?? 0) === 0) && { color: "#bdbdbd" },
                    ]}
                  >
                    {sku.attributes && sku.attributes.length > 0
                      ? sku.attributes
                          .map((attr) => getSkuNameTransLanguage(attr))
                          .join(" / ")
                      : getLiveSkuName(sku) || `SKU ${index + 1}`}
                  </Text>
                  <Text style={styles.stockText}>
                    {t("productCard.stock")} {sku.amount_on_sale ?? 0}
                  </Text>
                </View>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      ((sku.amount_on_sale ?? 0) === 0) ||
                      (skuQuantities[index] || 0) <= 0
                        ? styles.quantityButtonDisabled
                        : styles.quantityButtonEnabled,
                    ]}
                    onPress={() => {
                      const currentQuantity = skuQuantities[index] || 0;
                      if (currentQuantity > 0) {
                        onQuantityChange(index, currentQuantity - 1);
                      }
                    }}
                    disabled={(sku.amount_on_sale ?? 0) === 0}
                    activeOpacity={1}
                  >
                    <Text
                      style={
                        ((sku.amount_on_sale ?? 0) === 0) ||
                        (skuQuantities[index] || 0) <= 0
                          ? styles.quantityButtonDisabledText
                          : styles.quantityButtonText
                      }
                    >
                      -
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quantityInput}
                    onPress={() =>
                      onQuantityPress(
                        "hasImg",
                        index,
                        skuQuantities[index] || 0,
                        sku.amount_on_sale ?? 0,
                        sku.sku_id?.toString(),
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
                    style={[
                      styles.quantityButton,
                      ((sku.amount_on_sale ?? 0) === 0)
                        ? styles.quantityButtonDisabled
                        : styles.quantityButtonEnabled,
                    ]}
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
                    <Text
                      style={
                        ((sku.amount_on_sale ?? 0) === 0)
                          ? styles.quantityButtonDisabledText
                          : styles.quantityButtonText
                      }
                    >
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  const renderSelector = () => {
    switch (skuType) {
      case "noSku":
        return renderNoSkuSelector();
      case "singleSku":
        return renderSingleSkuSelector();
      case "multiSku":
        return renderMultiSkuSelector();
      default:
        return null;
    }
  };

  return (
    <>
      {renderSelector()}
      <Modal
        transparent={true}
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <Image
            source={{ uri: selectedImage || "" }}
            style={styles.modalImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const screenWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000CC",
  },
  modalImage: {
    width: screenWidth * 0.9,
    height: screenWidth * 0.9,
  },
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
    lineHeight: fontSize(14),
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
    width: "25%",
    backgroundColor: "#fff",
    overflow: "visible",
  },
  quantityButton: {
    width: widthUtils(25, 25).width,
    height: widthUtils(25, 25).height,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: widthUtils(25, 25).width / 2,
  },
  quantityButtonEnabled: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f3f4f8",
  },
  quantityButtonDisabled: {
    backgroundColor: "#f3f4f8",
    borderWidth: 1,
    borderColor: "#f3f4f8",
  },
  quantityInput: {
    width: widthUtils(25, 25).width,
    height: widthUtils(25, 25).height,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    fontSize: fontSize(12),
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: "white",
    borderRightColor: "white",
    padding: 0,
    lineHeight: fontSize(12),
    borderRadius: 0,
  },
  quantityDisplayText: {
    fontSize: fontSize(14),
    fontWeight: "500",
    color: "#000",
  },
  quantityButtonText: {
    fontSize: fontSize(25),
    lineHeight: Platform.OS === 'android' ? fontSize(18) : fontSize(25),
    fontWeight: "300",
    color: "#000",
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  quantityButtonDisabledText: {
    fontSize: fontSize(25),
    lineHeight: Platform.OS === 'android' ? fontSize(18) : fontSize(25),
    fontWeight: "300",
    color: "#bdbdbd",
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  skuImageWrapper: {
    flexDirection: "column",
    alignItems: "center",
    width: 50,
  },
  skuPriceContainer: {
    marginTop: 4,
    alignItems: "center",
  },
  skuPriceText: {
    fontSize: fontSize(10),
    fontWeight: "500",
    color: "#FF5100",
    textAlign: "center",
  },
  noImagePlaceholder: {
    backgroundColor: "#f3f4f8",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    fontSize: fontSize(12),
    fontWeight: "500",
    color: "#000",
  },
});

export default UnifiedSkuSelector;
