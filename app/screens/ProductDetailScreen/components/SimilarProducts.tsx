import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions, Platform } from 'react-native';
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
  
  // 动态计算卡片宽度
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = Platform.select({
    ios: Math.min(115, screenWidth * 0.28),
    android: Math.min(110, screenWidth * 0.26),
    default: 110
  });

  return (
    <View style={styles.storeRecommendationsContainer}>
      <View style={styles.storeInfoContainer}>
        <Text style={styles.storeSectionTitle}>
          {t('moreFromStore')}
        </Text>
        <TouchableOpacity onPress={onViewAllPress} activeOpacity={1}>
          <Text style={styles.storeMoreLink}>{t('viewAll')}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.productGridContainer, { paddingRight: 20 }]}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={cardWidth + 10}
        snapToAlignment="start"
      >
        {isSimilarsFlag
          ? similars?.map((item) => (
              <TouchableOpacity
                key={item.offer_id}
                onPress={() => onProductPress(item)}
                activeOpacity={0.8}
                style={[styles.productCard, { width: cardWidth }]}
              >
                <View style={[styles.cardContainerWithPrice, { height: cardWidth }]}>
                  {item.product_image_urls && item.product_image_urls[0] ? (
                    <Image
                      source={{ uri: item.product_image_urls[0] }}
                      style={styles.imageContainerCompact}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.imageContainerCompact, styles.skeletonBox]} />
                  )}
                </View>
                <View style={styles.priceContainerFlex}>
                  <Text style={styles.productPrice} numberOfLines={1}>
                    {item.max_price}
                  </Text>
                  <Text style={styles.smallCurrencyText}>
                    {userStore.user?.currency || "FCFA"}
                  </Text>
                </View>
                <Text style={styles.productTitleSimilar} numberOfLines={2} ellipsizeMode="tail">
                  {item.subject_trans || ' '}
                </Text>
              </TouchableOpacity>
            ))
          : renderSkeletonItems().map((item) => (
              <View style={[styles.productCard, { width: cardWidth }]} key={item.id}>
                <View style={styles.cardContainerWithPrice}>
                  <View style={[styles.imageContainerCompact, styles.skeletonBox]} />
                </View>
                <View style={styles.priceContainerFlex}>
                  <View style={[styles.skeletonText, { width: 50, height: 16 }]} />
                  <View style={[styles.skeletonText, { width: 30, height: 16, marginLeft: 5 }]} />
                </View>
                <View style={[styles.skeletonText, { width: '90%', height: 14, marginTop: 4, marginHorizontal: 2 }]} />
                <View style={[styles.skeletonText, { width: '70%', height: 14, marginTop: 2, marginHorizontal: 2 }]} />
              </View>
            ))}
      </ScrollView>
    </View>
  );
};