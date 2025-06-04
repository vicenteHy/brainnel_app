import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { similar } from '../../../services/api/productApi';
import useUserStore from '../../../store/user';
import { styles } from '../styles';

interface SimilarProductsProps {
  similars?: similar[];
  isSimilarsFlag: boolean;
  onProductPress: (item: similar) => void;
  onViewAllPress: () => void;
  renderSkeletonItems: () => any[];
  totalCount?: number; // 添加总数显示
}

export const SimilarProducts: React.FC<SimilarProductsProps> = ({
  similars,
  isSimilarsFlag,
  onProductPress,
  onViewAllPress,
  renderSkeletonItems,
}) => {
  const userStore = useUserStore();
  const { t } = useTranslation();

  return (
    <View style={styles.storeRecommendationsContainer}>
      <View style={styles.storeInfoContainer}>
        <Text style={styles.storeSectionTitle}>
          {t('moreFromStore')}
        </Text>
        <TouchableOpacity onPress={onViewAllPress}>
          <Text style={styles.storeMoreLink}>{t('viewAll')}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productGridContainer}
      >
        {isSimilarsFlag
          ? similars?.map((item) => (
              <TouchableOpacity
                style={styles.productCard}
                key={item.offer_id}
                onPress={() => onProductPress(item)}
              >
                <View style={styles.cardContainerWithPrice}>
                  <Image
                    source={{ uri: item.product_image_urls[0] }}
                    style={styles.imageContainerCompact}
                  />
                </View>
                <View style={styles.priceContainerFlex}>
                  <Text style={styles.productPrice}>
                    {item.max_price}
                  </Text>
                  <Text style={styles.smallCurrencyText}>
                    {userStore.user?.currency || "FCFA"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          : renderSkeletonItems().map((item) => (
              <View style={styles.productCard} key={item.id}>
                <View style={[styles.cardContainerWithPrice, styles.skeletonBox]} />
                <View style={styles.priceContainerFlex}>
                  <View style={[styles.skeletonText, { width: 50 }]} />
                  <View style={[styles.skeletonText, { width: 30, marginLeft: 5 }]} />
                </View>
              </View>
            ))}
      </ScrollView>
    </View>
  );
};