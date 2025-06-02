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
    <View style={styles.nightLampProductCard}>
      <Text style={styles.creativeHeading}>
        {getSubjectTransLanguage(product)}
      </Text>
      <View style={styles.productInfoContainer1}>
        <View style={styles.productInfoContainer}>
          <View style={styles.salesInfoContainer}>
            <Text style={styles.highlightedText}>
              {product?.price}
            </Text>
            <Text style={styles.orangeHighlightedText}>
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
        {userStore.user?.vip_level > 0 && (
          <>
            <View style={styles.discountInfoContainer}>
              <Text style={styles.emphasizedTextWidget}>
                -5%
              </Text>
            </View>
            <View style={styles.priceInfoVip}>
              <ImageBackground
                source={require("../../../../assets/img/vip1.png")}
                style={styles.priceInfoVipImg}
              >
                <Text style={styles.vipStatusNumeric}>
                  VIP {userStore.user?.vip_level}
                </Text>
              </ImageBackground>
            </View>
          </>
        )}
      </View>
    </View>
  );
};