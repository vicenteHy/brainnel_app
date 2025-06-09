import React from 'react';
import { View, Text, ImageBackground } from 'react-native';
import { getSubjectTransLanguage } from '../../../utils/languageUtils';
import useUserStore from '../../../store/user';
import { styles } from '../styles';

interface ProductInfoProps {
  product: any;
}

export const ProductInfo: React.FC<ProductInfoProps> = ({ product }) => {
  const userStore = useUserStore();

  return (
    <View style={styles.productInfoCard}>
      <Text style={styles.productTitle}>
        {getSubjectTransLanguage(product)}
      </Text>
      <View style={styles.productPriceWrapper}>
        <View style={styles.productPriceContainer}>
          <View style={styles.salesInfoContainer}>
            <Text style={styles.highlightedText}>
              {product?.price}
            </Text>
            <Text style={styles.currencyText}>
              {userStore.user?.currency || "FCFA"}
            </Text>
            <Text style={styles.priceLabel}>
              {product?.original_price}
              {userStore.user?.currency}
            </Text>
          </View>
          <Text style={styles.salesCountLabel}>
            {/* {product?.sold_out} {t("sales")} */}
          </Text>
        </View>
        
        {/* 产品ID水印 */}
        {product?.offer_id && (
          <View style={styles.productIdWatermark}>
            <Text style={styles.productIdText}>
              ID: {product.offer_id}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};