import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles';

interface ProductDetailsProps {
  product: any;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({
  product,
}) => {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  // 从产品描述中提取图片URLs
  const imageUrls: string[] = [];
  if (product?.description) {
    const regex = /<img[^>]+src="([^"]+)"/g;
    let match;
    while ((match = regex.exec(product.description)) !== null) {
      imageUrls.push(match[1]);
    }
  }

  return (
    <View style={styles.productDetailsSection}>
      <Text style={styles.productDetailsSectionTitle}>
        {t("Product Details")}
      </Text>
      {imageUrls.map((src, index) => (
        <View
          key={index}
          style={{
            width: width,
            marginBottom: 15,
            backgroundColor: "#ffffff",
            overflow: 'hidden',
          }}
        >
          <ExpoImage
            style={{
              width: width,
              height: 300,
            }}
            source={{ uri: src }}
            contentFit="cover"
          />
        </View>
      ))}
    </View>
  );
};