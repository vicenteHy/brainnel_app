import React, { useState, useCallback } from 'react';
import { View, Text, useWindowDimensions, Image } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles';

interface ProductDetailsProps {
  product: any;
}

const DetailImage: React.FC<{ src: string; width: number }> = ({ src, width }) => {
  const [imageHeight, setImageHeight] = useState(300);

  const handleImageLoad = useCallback((event: any) => {
    const { width: imgWidth, height: imgHeight } = event.nativeEvent.source;
    const aspectRatio = imgHeight / imgWidth;
    const calculatedHeight = width * aspectRatio;
    setImageHeight(calculatedHeight);
  }, [width]);

  return (
    <View
      style={{
        width: width,
        backgroundColor: "#ffffff",
        overflow: 'hidden',
      }}
    >
      <Image
        style={{
          width: width,
          height: imageHeight,
        }}
        source={{ uri: src }}
        resizeMode="contain"
        onLoad={handleImageLoad}
      />
    </View>
  );
};

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
  
  console.log('商品描述:', product?.description?.substring(0, 200));
  console.log('提取到的图片URLs:', imageUrls);

  return (
    <View style={styles.productDetailsSection}>
      <Text style={styles.productDetailsSectionTitle}>
        {t('productDetails')}
      </Text>
      {imageUrls.map((src, index) => (
        <DetailImage key={index} src={src} width={width} />
      ))}
    </View>
  );
};