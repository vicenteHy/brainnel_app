import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
} from "react-native";
import BackIcon from "../../components/BackIcon";
import fontSize from "../../utils/fontsizeUtils";
import widthUtils from "../../utils/widthUtils";
import { useState, useEffect } from "react";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/types";
import { useTranslation } from "react-i18next";
import { getLiveProducts, LiveProductListItem } from "../../services/api/liveProductApi";
import { formatPrice } from "../../utils/priceUtils";

export const TikTokScreen = () => {
  const [liveProducts, setLiveProducts] = useState<LiveProductListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { t, i18n } = useTranslation();

  const fetchLiveProducts = async (page: number = 1, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const response = await getLiveProducts({ page, page_size: 20 });
      
      if (isLoadMore) {
        setLiveProducts(prev => [...prev, ...(response.items || [])]);
      } else {
        setLiveProducts(response.items || []);
      }
      
      setHasMore(response.items && response.items.length >= 20);
      setCurrentPage(page);
    } catch (error) {
      console.error(t('banner.tiktok.fetch_failed'), error);
      if (!isLoadMore) {
        setLiveProducts([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreProducts = () => {
    if (!loadingMore && hasMore) {
      fetchLiveProducts(currentPage + 1, true);
    }
  };

  useEffect(() => {
    fetchLiveProducts();
  }, []);

  const handleProductPress = (product: LiveProductListItem) => {
    navigation.navigate("ProductDetail", {
      offer_id: product.product_id.toString(),
      price: product.price,
      is_live_item: true,
    });
  };

  const getLiveProductName = (product: LiveProductListItem) => {
    const currentLang = i18n.language;
    switch (currentLang) {
      case 'en':
        return product.name_en || product.name;
      case 'fr':
        return product.name_fr || product.name;
      case 'zh':
      case 'cn':
        return product.name;
      default:
        return product.name_fr || product.name;
    }
  };

  const renderLiveProduct = (product: LiveProductListItem) => {
    const productName = getLiveProductName(product);
    const priceText = formatPrice(product.price, product.currency);
    const originalPriceText = formatPrice(product.original_price, product.currency);
    const currency = product.currency || "FCFA";
    
    return (
      <TouchableOpacity
        key={product.id}
        style={styles.liveProductItem}
        onPress={() => handleProductPress(product)}
      >
        <View style={styles.liveProductImage}>
          <Image
            source={{ uri: product.image_url }}
            style={styles.liveProductImg}
            resizeMode="cover"
          />
          {product.is_live && (
            <View style={styles.liveTag}>
              <Text style={styles.liveTagText}>{t('banner.tiktok.live')}</Text>
            </View>
          )}
        </View>
        <View style={styles.liveProductInfo}>
          <Text
            style={styles.liveProductTitle}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {productName}
          </Text>
          <View style={styles.liveProductPriceContainer}>
            <View style={styles.currentPriceContainer}>
              <Text style={styles.liveProductPrice}>{priceText}</Text>
              <Text style={styles.liveProductCurrency}>{currency}</Text>
            </View>
            {product.original_price > product.price && (
              <Text style={styles.liveProductOriginalPrice}>
                {originalPriceText} {currency}
              </Text>
            )}
          </View>
          <Text style={styles.liveProductSold}>{t('banner.tiktok.sold')} {product.sold_out}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.safeAreaContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <BackIcon color="#fff" size={fontSize(22)} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('banner.tiktok.store')}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.productContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.productContainerContent}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const paddingToBottom = 20;
            if (layoutMeasurement.height + contentOffset.y >=
                contentSize.height - paddingToBottom) {
              loadMoreProducts();
            }
          }}
          scrollEventThrottle={400}
        >
          <View style={styles.productList}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>{t('loading')}</Text>
              </View>
            ) : liveProducts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('banner.tiktok.no_products')}</Text>
              </View>
            ) : (
              <>
                {liveProducts.map(renderLiveProduct)}
                {loadingMore && (
                  <View style={styles.loadingMoreContainer}>
                    <Text style={styles.loadingMoreText}>{t('loading')}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeAreaContent: {
    flex: 1,
    paddingTop: 0,
  },
  header: {
    width: "100%",
    padding: 19,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#000",
  },
  backButton: {
    width: widthUtils(24, 24).width,
  },
  placeholder: {
    width: widthUtils(24, 24).width,
  },
  title: {
    color: "#fff",
    fontSize: fontSize(22),
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },
  productContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  productContainerContent: {
    paddingHorizontal: 19,
    paddingTop: 20,
  },
  productList: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  loadingContainer: {
    width: "100%",
    height: widthUtils(200, 200).height,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: fontSize(16),
  },
  liveProductItem: {
    width: "48%",
    marginBottom: 15,
    borderRadius: 10,
    overflow: "hidden",
  },
  liveProductImage: {
    width: "100%",
    height: widthUtils(190, 190).height,
    position: "relative",
    borderRadius: 10,
    overflow: "hidden",
  },
  liveProductImg: {
    width: "100%",
    height: "100%",
  },
  liveTag: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#ff188a",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveTagText: {
    color: "#fff",
    fontSize: fontSize(10),
    fontWeight: "600",
  },
  liveProductInfo: {
    padding: 8,
  },
  liveProductTitle: {
    color: "#fff",
    fontSize: fontSize(14),
    lineHeight: fontSize(20),
    marginBottom: 6,
  },
  liveProductPriceContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  currentPriceContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 2,
  },
  liveProductPrice: {
    color: "#ff188a",
    fontSize: fontSize(16),
    fontWeight: "600",
    marginRight: 2,
  },
  liveProductCurrency: {
    color: "#ff188a",
    fontSize: fontSize(12),
    fontWeight: "600",
  },
  liveProductOriginalPrice: {
    color: "#999",
    fontSize: fontSize(12),
    textDecorationLine: "line-through",
  },
  liveProductSold: {
    color: "#999",
    fontSize: fontSize(12),
  },
  emptyContainer: {
    width: "100%",
    height: widthUtils(200, 200).height,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#999",
    fontSize: fontSize(16),
  },
  loadingMoreContainer: {
    width: "100%",
    paddingVertical: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingMoreText: {
    color: "#999",
    fontSize: fontSize(14),
  }
});
