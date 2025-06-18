import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
  Animated,
  InteractionManager,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import {
  productApi,
  ProductParams,
  type Product,
} from "../services/api/productApi";
import { useTranslation } from "react-i18next";
import isSmallScreen from "../utils/isSmallScreen";
import { Svg, Path } from "react-native-svg";
import widthUtils from "../utils/widthUtils";
import fontSize from "../utils/fontsizeUtils";
import useUserStore from "../store/user";
import { getSubjectTransLanguage } from "../utils/languageUtils";
import Toast from "react-native-toast-message";
import { getCurrentLanguage } from "../i18n";

// 图标组件 - 使用React.memo优化渲染
const IconComponent = React.memo(
  ({ name, size, color }: { name: string; size: number; color: string }) => {
    const Icon = Ionicons as any;
    return <Icon name={name} size={size} color={color} />;
  }
);

// 路由参数类型
type RelatedProductsRouteParams = {
  product_id: string;
  product_name: string;
};

// 组件Props类型
type RelatedProductsScreenProps = {
  route: RouteProp<Record<string, RelatedProductsRouteParams>, string>;
  navigation: NativeStackNavigationProp<any>;
};

// 懒加载图片组件 - 改进版本
const LazyImage = React.memo(
  ({
    uri,
    style,
    resizeMode,
  }: {
    uri: string;
    style: any;
    resizeMode: any;
  }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const onLoad = useCallback(() => {
      setIsLoaded(true);
    }, []);
    const onError = useCallback(() => {
      setHasError(true);
      setIsLoaded(true); // Also mark as loaded on error to remove placeholder
    }, []);
    return (
      <View style={[style, { overflow: "hidden" }]}>
        {/* Show placeholder while image is loading */}
        {!isLoaded && !hasError && (
          <View style={[style, styles.imagePlaceholder, { position: 'absolute', zIndex: 1 }]} />
        )}
        
        {/* Show error state if image failed to load */}
        {hasError && (
          <View
            style={[style, styles.imagePlaceholder, { position: 'absolute', zIndex: 1 }]}
          >
            <IconComponent name="image-outline" size={24} color="#999" />
            <Text style={{ fontSize: fontSize(12), color: "#999", marginTop: 4 }}>
              加载失败
            </Text>
          </View>
        )}
        {/* Actual image */}
        <Image
          source={{ uri }}
          style={[style, { opacity: isLoaded ? 1 : 0 }]}
          resizeMode={resizeMode}
          onLoad={onLoad}
          onError={onError}
        />
      </View>
    );
  }
);

// 产品骨架屏组件 - 用于加载状态
const ProductSkeleton = React.memo(() => {
  // 创建动画值
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // 设置动画效果
  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );

    shimmerAnimation.start();

    return () => {
      shimmerAnimation.stop();
    };
  }, []);

  // 定义动画插值
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={styles.productCard}>
      <View style={[styles.productImageContainer, styles.imagePlaceholder]}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        />
      </View>
      <View style={styles.productInfo}>
        <View style={[styles.skeletonText, { width: '90%', height: 16, marginBottom: 8 }]}>
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
        </View>
        <View style={[styles.skeletonText, { width: '70%', height: 16, marginBottom: 8 }]}>
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
        </View>
        <View style={[styles.skeletonText, { width: '40%', height: 24, marginBottom: 4 }]}>
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
        </View>
        <View style={[styles.skeletonText, { width: '30%', height: 12 }]}>
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
});

// 产品项组件 - 使用React.memo优化渲染
const ProductItem = React.memo(
  ({
    product,
    onPress,
    t,
    userStore,
  }: {
    product: Product;
    onPress: (product: Product) => void;
    t: any;
    userStore: any;
  }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => onPress(product)}
      activeOpacity={0.7}
    >
      <View style={styles.productImageContainer}>
        {product.product_image_urls && product.product_image_urls[0] ? (
          <LazyImage
            uri={product.product_image_urls[0]}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.placeholderText}>{t('productPicture')}</Text>
        )}
        {userStore.user?.user_id && (
          <TouchableOpacity style={styles.vipIcon}>
            <Text style={styles.vipButtonText}>VIP</Text>
            <Text style={styles.vipLabelBold}>{userStore.user?.vip_level}</Text>
          </TouchableOpacity>
        )}
      </View>
      {/* 产品分类 */}
      <View style={styles.productInfo}>
        <Text style={styles.categoryText} numberOfLines={2}>
          {getSubjectTransLanguage(product) || product.subject_trans}
        </Text>
        {/* 价格信息 */}
        <View style={styles.beautyProductInfoRow}>
          <View style={styles.flexRowCentered}>
            {userStore.user?.user_id && (
              <Text style={styles.priceLabel1}>
                {product.original_min_price || "0"}
                {product.currency || "FCFA"}
              </Text>
            )}
            <View style={styles.priceContainer}>
              <Text style={styles.highlightedText}>
                {product.min_price || "0"}
              </Text>
              <Text style={styles.highlightedText1}>
                {product.currency || "FCFA"}
              </Text>
            </View>
          </View>
        </View>
        {/* 销售量 */}
        <Text style={styles.productSales}>
          {product.sold_out} {product.sold_out === 0 ? "" : "+"}{" "}
          {t('sales')}
        </Text>
      </View>
    </TouchableOpacity>
  )
);

export const RelatedProductsScreen = ({ route, navigation }: RelatedProductsScreenProps) => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [originalProducts, setOriginalProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const userStore = useUserStore();
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [searchParams, setSearchParams] = useState<ProductParams>({
    keyword: route.params?.product_name || "",
    page: 1,
    page_size: 20,
    sort_order: "desc",
    category_id: null,
    sort_by: "default",
    language: getCurrentLanguage(),
    user_id: userStore.user.user_id,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const lastLoadTime = useRef(0);

  // 初始化相关商品搜索
  useEffect(() => {
    if (route.params?.product_id) {
      setShowSkeleton(true);
      // 直接调用关联商品API
      const fetchData = async () => {
        try {
          setLoading(true);
          // 使用现有的getSimilarProducts API（limit=20）
          const res = await productApi.getSimilarProducts(route.params.product_id, userStore.user?.user_id, 20);
          // 将similar product格式转换为Product格式
          const products = (res || []).map((item: any) => ({
            ...item,
            currency: userStore.user?.currency || "FCFA",
            original_min_price: item.min_price || 0,
          }));
          setProducts(products);
          setOriginalProducts(products);
          setCurrentPage(1);
          // 关联商品只显示5个，不需要分页
          setHasMore(false);
        } catch (error) {
          console.error("Error fetching related products:", error);
          // 如果关联商品API失败，fallback到搜索API
          if (route.params?.product_name) {
            try {
              const newParams = {
                ...searchParams,
                keyword: route.params.product_name,
              };
              const searchRes = await productApi.getSearchProducts(newParams);
              setProducts(searchRes.products);
              setOriginalProducts(searchRes.products);
              setHasMore(searchRes.products.length === newParams.page_size);
            } catch (searchError) {
              console.error("Fallback search also failed:", searchError);
              setProducts([]);
              setOriginalProducts([]);
              setHasMore(false);
            }
          } else {
            setProducts([]);
            setOriginalProducts([]);
            setHasMore(false);
          }
        } finally {
          setLoading(false);
          setTimeout(() => {
            setShowSkeleton(false);
          }, 300);
        }
      };
      fetchData();
    }
  }, [route.params?.product_id, route.params?.product_name]);

  // 搜索产品的API调用
  const searchProducts = useCallback(
    async (params: ProductParams, isLoadMore = false) => {
      // 防止重复请求
      if (isLoadMore && loadingMore) {
        console.log('阻止重复加载更多请求');
        return;
      }
      if (!isLoadMore && loading) {
        console.log('阻止重复初始加载请求');
        return;
      }
      
      console.log('发起请求:', isLoadMore ? '加载更多' : '初始加载', params);
      
      if (!isLoadMore) {
        setLoading(true);
        setShowSkeleton(true);
      } else {
        setLoadingMore(true);
      }
      
      try {
        const res = await productApi.getSearchProducts(params);
        console.log('请求成功, 获取商品数:', res.products.length);
        
        if (isLoadMore) {
          // 使用回调方式更新，确保获取最新状态
          setProducts(prev => {
            // 过滤掉重复商品，避免闪烁
            const newProducts = res.products.filter(
              newProduct => !prev.some(
                existingProduct => existingProduct.offer_id === newProduct.offer_id
              )
            );
            return [...prev, ...newProducts];
          });
          
          setCurrentPage(prev => prev + 1);
        } else {
          setProducts(res.products);
          // 保存原始排序的数据，以便默认排序时恢复
          setOriginalProducts(res.products);
          setCurrentPage(1);
        }
        
        // 如果返回的数据少于页面大小，说明没有更多数据了
        setHasMore(res.products.length === params.page_size);
        return res;
      } catch (error) {
        console.error("Error searching products:", error);
        // 发生错误时，设置hasMore为false，防止继续加载
        setHasMore(false);
        // 如果不是加载更多，清空产品列表
        if (!isLoadMore) {
          setProducts([]);
          setOriginalProducts([]);
        }
        throw error;
      } finally {
        if (isLoadMore) {
          // 延迟清除加载状态，让视觉过渡更平滑
          setTimeout(() => {
            setLoadingMore(false);
          }, 300);
        } else {
          setLoading(false);
          // 添加延迟以使骨架屏过渡更平滑
          setTimeout(() => {
            setShowSkeleton(false);
          }, 300);
        }
      }
    },
    [loading, loadingMore]
  );

  // 处理点击产品
  const handleProductPress = useCallback(
    (product: Product) => {
      InteractionManager.runAfterInteractions(() => {
        navigation.navigate("ProductDetail", {
          offer_id: product.offer_id,
          searchKeyword: product.subject_trans || product.subject || '',
          price: product.min_price,
        });
      });
    },
    [navigation]
  );

  // 返回上一页
  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 渲染列表为空时的组件
  const renderEmptyList = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <IconComponent name="search-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>
          {t("noResults")} "{route.params?.product_name}"
        </Text>
        <Text style={styles.emptySubtext}>{t("tryDifferentKeywords")}</Text>
      </View>
    ),
    [route.params?.product_name, t]
  );

  // 渲染商品项
  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    // 处理骨架屏项
    if (item && item.isLoadingSkeleton) {
      return <ProductSkeleton />;
    }
    
    // 处理空白占位项
    if (!item) {
      // 显示透明的占位视图
      return <View style={[styles.productCard, { backgroundColor: 'transparent', elevation: 0, borderWidth: 0 }]} />;
    }
    
    // 渲染正常商品项
    return (
      <ProductItem
        product={item}
        onPress={handleProductPress}
        t={t}
        userStore={userStore}
      />
    );
  }, [handleProductPress, t, userStore]);

  // 创建产品列表项的key提取器
  const keyExtractor = useCallback((item: any, index: number) => {
    if (!item) return `empty-${index}`;
    return `${item.offer_id || 'item'}-${index}`;
  }, []);


  // 处理加载更多
  const handleLoadMore = useCallback(() => {
    // 简化条件判断
    if (!hasMore || loadingMore) {
      return;
    }
    
    // 添加时间防抖，避免频繁触发
    const now = Date.now();
    if (now - lastLoadTime.current < 500) { // 500ms内不重复触发
      return;
    }
    lastLoadTime.current = now;
    
    // 标记为加载中
    setLoadingMore(true);
    
    // 关联商品页面不支持分页，直接返回
    if (route.params?.product_id) {
      setLoadingMore(false);
      return;
    } else {
      // 使用搜索API加载更多
      const loadMoreParams = {
        ...searchParams,
        page: currentPage + 1,
      };
      
      // 获取下一页数据
      productApi.getSearchProducts(loadMoreParams)
        .then(res => {
          // 使用回调更新，确保获取最新状态
          setProducts(prev => {
            // 过滤掉重复商品
            const newProducts = res.products.filter(
              newProduct => !prev.some(
                existingProduct => existingProduct.offer_id === newProduct.offer_id
              )
            );
            return [...prev, ...newProducts];
          });
          
          setCurrentPage(prev => prev + 1);
          setHasMore(res.products.length === loadMoreParams.page_size);
        })
        .catch(error => {
          console.error("加载更多失败:", error);
        })
        .finally(() => {
          // 延迟结束加载状态，给用户更好的体验
          setTimeout(() => {
            setLoadingMore(false);
          }, 300);
        });
    }
  }, [hasMore, loadingMore, searchParams, currentPage, route.params?.product_id, userStore.user?.user_id]);



  // 渲染底部加载指示器
  const renderFooter = useCallback(() => {
    // 加载中状态显示骨架屏
    if (loadingMore) {
      return (
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 8,
          width: '100%'
        }}>
          <View style={{ width: '48%' }}>
            <ProductSkeleton />
          </View>
          <View style={{ width: '48%' }}>
            <ProductSkeleton />
          </View>
        </View>
      );
    }
    
    // 没有更多数据时显示提示
    if (!hasMore) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>{t("noMoreData")}</Text>
        </View>
      );
    }
    
    return <View style={styles.footerSpace} />;
  }, [hasMore, loadingMore, t]);

  // 处理滚动事件
  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    
    // 当滚动超过屏幕高度的一半时显示回到顶部按钮
    setShowBackToTop(offsetY > 300);
  }, []);

  // 回到顶部
  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);


  // 渲染骨架屏网格
  const renderSkeletonGrid = useCallback(() => {
    // 创建一个骨架屏数组
    const skeletonArray = Array(8).fill(null);
    
    return (
      <View style={styles.productGrid}>
        <FlatList
          data={skeletonArray}
          renderItem={() => <ProductSkeleton />}
          keyExtractor={(_, index) => `skeleton-${index}`}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.productGrid}
        />
      </View>
    );
  }, []);

  // 确保产品列表包含偶数条目，防止最后一个产品占满整行
  const ensureEvenItems = useCallback((): (Product | any)[] => {
    // 如果商品数量为奇数
    if (products.length % 2 !== 0) {
      // 加载更多时使用骨架屏替代空白占位符
      if (loadingMore) {
        return [...products, { isLoadingSkeleton: true, tempId: 'loadingPlaceholder' }];
      }
      // 非加载状态时使用空白占位符
      return [...products, null];
    }
    
    return products;
  }, [products, loadingMore]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        <View style={styles.container}>
          {/* 头部标题栏 */}
          <View style={styles.searchHeader}>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <Svg width="11" height="18" viewBox="0 0 11 18" fill="none">
                <Path
                  d="M8.52018 17.1171L10.0867 15.6172L3.19348 8.93139L10.2127 2.37801L8.67501 0.848572L0.0893813 8.90185L8.52018 17.1171Z"
                  fill={"black"}
                />
              </Svg>
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.titleText} numberOfLines={1}>
                {t('related_goods')}
              </Text>
            </View>
          </View>


          {/* 商品列表 */}
          <View style={styles.resultsContainer}>
            {/* 加载指示器或产品列表 */}
            {loading && showSkeleton ? (
              renderSkeletonGrid()
            ) : (
              <>
                <FlatList
                  ref={flatListRef}
                  data={ensureEvenItems() as any}
                  renderItem={renderItem}
                  keyExtractor={keyExtractor}
                  numColumns={2}
                  columnWrapperStyle={styles.productColumnWrapper}
                  contentContainerStyle={{
                    paddingBottom: 15,
                    backgroundColor: "transparent",
                  }}
                  ListEmptyComponent={renderEmptyList}
                  ListFooterComponent={renderFooter}
                  showsVerticalScrollIndicator={false}
                  initialNumToRender={8}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  removeClippedSubviews={Platform.OS !== "web"}
                  updateCellsBatchingPeriod={50}
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={3}
                  onScroll={handleScroll}
                  scrollEventThrottle={160}
                />
                {showBackToTop && (
                  <TouchableOpacity
                    style={styles.backToTopButton}
                    onPress={scrollToTop}
                    activeOpacity={0.7}
                  >
                    <IconComponent name="arrow-up" size={24} color="#fff" />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeAreaContent: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 0 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 4,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 8,
  },
  titleText: {
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#333",
  },
  resultsContainer: {
    flex: 1,
  },
  productGrid: {
    padding: 8,
  },
  productCard: {
    flex: 1,
    margin: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
  },
  productImageContainer: {
    height: widthUtils(190, 190).height,
    backgroundColor: "#f9f9f9",
    alignItems: "center",
    justifyContent: "center",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  placeholderText: {
    color: "#999",
    fontSize: fontSize(14),
  },
  productInfo: {
    padding: 8,
  },
  categoryText: {
    fontSize: isSmallScreen ? 12 : 14,
    color: "#000000",
    fontWeight: "600",
    marginBottom: 4,
    fontFamily: "PingFang SC",
    letterSpacing: 0,
  },
  beautyProductInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  flexRowCentered: {},
  priceContainer: {
    flexDirection: "row",
  },
  highlightedText: {
    fontWeight: "700",
    fontSize: fontSize(24),
    color: "#ff5100",
  },
  highlightedText1: {
    fontWeight: "700",
    fontSize: fontSize(14),
    color: "#ff5100",
  },
  priceLabel1: {
    fontSize: fontSize(12),
    fontWeight: "600",
    color: "#9a9a9a",
    textDecorationLine: "line-through",
  },
  productSales: {
    fontSize: fontSize(14),
    fontWeight: "600",
    fontFamily: "PingFang SC",
    color: "#7c7c7c",
  },
  footerContainer: {
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    fontSize: fontSize(14),
    color: "#666",
    marginLeft: 8,
  },
  footerSpace: {
    height: widthUtils(20, 20).height,
  },
  backToTopButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: widthUtils(44, 44).width,
    height: widthUtils(44, 44).height,
    borderRadius: 22,
    backgroundColor: "#0066FF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyContainer: {
    flex: 1,
    minHeight: 300,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyText: {
    fontSize: fontSize(16),
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: fontSize(14),
    color: "#999",
    textAlign: "center",
  },
  imagePlaceholder: {
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  vipIcon: {
    position: "absolute",
    top: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#3b3b3b",
    borderRadius: 10,
    flexDirection: "row",
    width: widthUtils(30, 66).width,
    height: widthUtils(30, 66).height,
  },
  vipButtonText: {
    fontStyle: "italic",
    fontWeight: "900",
    fontSize: fontSize(18),
    color: "#f1c355",
  },
  vipLabelBold: {
    fontStyle: "italic",
    fontWeight: "900",
    fontSize: fontSize(18),
    color: "#f1c355",
  },
  skeletonText: {
    backgroundColor: '#EAEAEA',
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  shimmer: {
    width: "30%",
    height: "100%",
    backgroundColor: "#ffffff4d",
    position: "absolute",
    top: 0,
    left: 0,
  },
  productColumnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
}); 