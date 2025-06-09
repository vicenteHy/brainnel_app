import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import {
  ProductParams,
  type Product,
} from "../services/api/productApi";
import { useTranslation } from "react-i18next";
import { Svg, Path } from "react-native-svg";
import SearchIcon from "../components/SearchIcon";
import useUserStore from "../store/user";
import { getSubjectTransLanguage } from "../utils/languageUtils";
import Toast from "react-native-toast-message";
import { getCurrentLanguage } from "../i18n";
import useAnalyticsStore from "../store/analytics";
import { eventBus } from "../utils/eventBus";

import { IconComponent, ProductSkeleton, ProductItem } from "./SearchResultScreen/components";
import { useSearchProducts, useSearchFilters } from "./SearchResultScreen/hooks";
import { styles } from "./SearchResultScreen/styles";

type SearchResultRouteParams = {
  keyword?: string;
  category_id?: number;
};

type SearchResultScreenProps = {
  route: RouteProp<Record<string, SearchResultRouteParams>, string>;
  navigation: NativeStackNavigationProp<any>;
};

export const SearchResultScreen = ({ route, navigation }: SearchResultScreenProps) => {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const userStore = useUserStore();
  const [showSkeleton, setShowSkeleton] = useState(true);
  
  // 检查是否为产品ID搜索
  const isProductIdSearch = useMemo(() => {
    const keyword = searchText.trim();
    return /^\d{8,15}$/.test(keyword);
  }, [searchText]);
  const LANGUAGE_KEY = '@app_language';
  const [searchParams, setSearchParams] = useState<ProductParams>({
    keyword: route.params?.keyword || "",
    page: 1,
    page_size: 10,
    sort_order: "desc",
    category_id: null,
    sort_by: "default",
    language: getCurrentLanguage(),
    user_id: userStore.user.user_id,
  });

  const {
    products,
    setProducts,
    originalProducts,
    setOriginalProducts,
    loading,
    setLoading,
    hasMore,
    loadingMore,
    refreshing,
    searchProducts,
    handleLoadMore,
    handleRefresh,
  } = useSearchProducts();

  const {
    isFilterVisible,
    sortOrder,
    sortField,
    activeTab,
    toggleFilter,
    handleSort,
    handleTabChange,
    setActiveTab,
    setSortField,
    setSortOrder,
  } = useSearchFilters();

  useEffect(() => {
    if (route.params?.keyword) {
      setSearchText(route.params.keyword);
      setShowSkeleton(true);
      const newParams = {
        ...searchParams,
        keyword: route.params.keyword,
        page: 1,
      };
      setSearchParams(newParams);
      
      const fetchData = async () => {
        try {
          const res = await searchProducts(newParams);
          console.log('[SearchResult] 初始搜索完成, 产品数量:', res?.products?.length || 0);
        } catch (error) {
          console.error("Error fetching products:", error);
        } finally {
          setTimeout(() => {
            setShowSkeleton(false);
          }, 300);
        }
      };
      fetchData();
    }
    if (route.params?.category_id) {
      setSearchText(""); // 清空搜索框显示
      setShowSkeleton(true);
      const newParams = {
        ...searchParams,
        keyword: "", // 清空关键词，因为这是分类搜索
        category_id: route.params.category_id,
        page: 1,
      };
      setSearchParams(newParams);
      
      const fetchData = async () => {
        try {
          const res = await searchProducts(newParams);
          console.log('[SearchResult] 分类搜索完成, 产品数量:', res?.products?.length || 0);
        } catch (error) {
          console.error("Error fetching products:", error);
        } finally {
          setTimeout(() => {
            setShowSkeleton(false);
          }, 300);
        }
      };
      fetchData();
    }
  }, [route.params?.keyword, route.params?.category_id]);

  // 监听设置变更事件，刷新搜索结果以更新价格和多语言显示
  useEffect(() => {
    const handleSettingsChanged = () => {
      console.log('[SearchResultScreen] 设置发生变更，刷新搜索结果');
      
      // 重新执行搜索以获取更新的数据
      setTimeout(() => {
        console.log('[SearchResultScreen] 重新执行搜索');
        
        // 如果是关键词搜索
        if (searchText.trim()) {
          const newParams = {
            ...searchParams,
            keyword: searchText.trim(),
            page: 1,
          };
          setSearchParams(newParams);
          searchProducts(newParams);
        } 
        // 如果是分类搜索
        else if (route.params?.category_id) {
          const newParams = {
            ...searchParams,
            keyword: "",
            category_id: route.params.category_id,
            page: 1,
          };
          setSearchParams(newParams);
          searchProducts(newParams);
        }
      }, 300);
    };

    // 监听设置变更事件
    eventBus.on('settingsChanged', handleSettingsChanged);
    eventBus.on('refreshSetting', handleSettingsChanged);
    
    // 清理监听器
    return () => {
      eventBus.off('settingsChanged', handleSettingsChanged);
      eventBus.off('refreshSetting', handleSettingsChanged);
    };
  }, [searchText, searchParams, route.params?.category_id, searchProducts]);

  const handleSearch = useCallback(() => {
    if (searchText.trim()) {
      const analyticsStore = useAnalyticsStore.getState();
      analyticsStore.logSearch(searchText.trim(), "search");
      
      setSortField("price");
      setSortOrder(null);
      setActiveTab("default");
      setShowSkeleton(true);
      const newParams = {
        ...searchParams,
        keyword: searchText.trim(),
        page: 1,
      };
      setSearchParams(newParams);
      searchProducts(newParams);
    }
  }, [searchText, searchParams, searchProducts]);

  const handleProductPress = useCallback(
    (product: Product) => {
      if (product.min_price === 0 || product.min_price === null) {
        Toast.show({
          type: "error",
          text1: t("productDiscontinued"),
        });
        return;
      }
      
      const analyticsStore = useAnalyticsStore.getState();
      const productInfo = {
        offer_id: product.offer_id,
        category_id: product.category_id || 0,
        price: product.min_price || 0,
        sku_id: 0,
        currency: product.currency || "FCFA",
        product_name: getSubjectTransLanguage(product) || product.subject_trans || "",
        timestamp: new Date().toISOString().replace("T", " ").substr(0, 19),
        product_img: product.product_image_urls?.[0] || "",
      };
      
      analyticsStore.logViewProduct(productInfo, "search");
      
      navigation.navigate("ProductDetail", {
        offer_id: product.offer_id,
        searchKeyword: searchText,
        price: product.min_price,
      });
    },
    [navigation, searchText, t]
  );

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const renderEmptyList = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <IconComponent name="search-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>
          {route.params?.category_id 
            ? t("noCategoryResults") || "该分类暂无商品"
            : `${t("noResults")} "${searchText}"`
          }
        </Text>
        <Text style={styles.emptySubtext}>
          {route.params?.category_id 
            ? t("tryOtherCategories") || "请尝试其他分类"
            : t("tryDifferentKeywords")
          }
        </Text>
      </View>
    ),
    [searchText, t, route.params?.category_id]
  );

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    if (item && item.isLoadingSkeleton) {
      return <ProductSkeleton />;
    }
    
    if (!item) {
      return <View style={[styles.productCard, { backgroundColor: 'transparent', elevation: 0, borderWidth: 0 }]} />;
    }
    
    return (
      <ProductItem
        product={item}
        onPress={handleProductPress}
        t={t}
        userStore={userStore}
      />
    );
  }, [handleProductPress, t, userStore]);

  const keyExtractor = useCallback((item: any, index: number) => {
    if (!item) return `empty-${index}`;
    return `${item.offer_id || 'item'}-${index}`;
  }, []);

  const handleLoadMoreProducts = useCallback(() => {
    const { page, ...baseParams } = searchParams;
    handleLoadMore(baseParams);
  }, [handleLoadMore, searchParams]);

  const handleRefreshProducts = useCallback(() => {
    const { page, ...baseParams } = searchParams;
    handleRefresh(baseParams);
  }, [handleRefresh, searchParams]);

  const renderFooter = useCallback(() => {
    if (loadingMore) {
      return (
        <View style={styles.loadMoreSkeletonContainer}>
          {Array(6).fill(null).map((_, index) => (
            <View key={`loading-skeleton-${index}`} style={styles.loadMoreSkeletonItem}>
              <ProductSkeleton />
            </View>
          ))}
        </View>
      );
    }
    
    if (!hasMore && products.length > 0) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>{t("noMoreData")}</Text>
        </View>
      );
    }
    
    return <View style={styles.footerSpace} />;
  }, [hasMore, loadingMore, t]);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowBackToTop(offsetY > 300);
  }, []);

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleTabChangeWithProducts = useCallback(
    (tab: "default" | "volume" | "price") => {
      handleTabChange(tab, originalProducts, setProducts, scrollToTop);
    },
    [handleTabChange, originalProducts, setProducts, scrollToTop]
  );

  const renderLoadingSpinner = useCallback(() => {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6F30" />
        <Text style={styles.loadingText}>{t("loading") || "加载中..."}</Text>
      </View>
    );
  }, [t]);

  const ensureEvenItems = useCallback((): (Product | any)[] => {
    if (products.length % 2 !== 0) {
      if (loadingMore) {
        return [...products, { isLoadingSkeleton: true, tempId: 'loadingPlaceholder' }];
      }
      return [...products, null];
    }
    
    return products;
  }, [products, loadingMore]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        <View style={styles.container}>
          {/* 搜索栏 */}
          <View style={styles.searchHeader}>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <Svg width="11" height="18" viewBox="0 0 11 18" fill="none">
                <Path
                  d="M8.52018 17.1171L10.0867 15.6172L3.19348 8.93139L10.2127 2.37801L8.67501 0.848572L0.0893813 8.90185L8.52018 17.1171Z"
                  fill={"black"}
                />
              </Svg>
            </TouchableOpacity>
            <View style={styles.searchBar}>
              <View style={{ marginRight: 8, marginLeft: 4 }}>
                <SearchIcon color="#373737" size={20} />
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder={t("searchProducts")}
                placeholderTextColor="#999"
                value={searchText}
                onChangeText={setSearchText}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              {searchText.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setSearchText("")}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <IconComponent name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 标签筛选 */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "default" && styles.activeTabButton,
              ]}
              onPress={() => handleTabChangeWithProducts("default")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "default" && styles.activeTabText,
                ]}
              >
                {t('default')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "volume" && styles.activeTabButton,
              ]}
              onPress={() => handleTabChangeWithProducts("volume")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "volume" && styles.activeTabText,
                ]}
              >
                {t('volume')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "price" && styles.activeTabButton,
              ]}
              onPress={() => handleTabChangeWithProducts("price")}
            >
              <View style={styles.tabButtonContent}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "price" && styles.activeTabText,
                  ]}
                >
                  {t('price')}
                </Text>
                {activeTab === "price" && (
                  <View style={styles.tabIcon}>
                    <IconComponent
                      name={sortOrder === "desc" ? "chevron-down" : "chevron-up"}
                      size={16}
                      color="#000"
                    />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* 搜索结果 */}
          <View style={styles.resultsContainer}>
            {/* 产品ID搜索提示 */}
            {isProductIdSearch && (
              <View style={styles.productIdSearchHint}>
                <IconComponent name="barcode-outline" size={18} color="#0066FF" />
                <Text style={styles.productIdSearchText}>
                  {t('searchingProductId')} <Text style={styles.productIdValue}>{searchText}</Text>
                </Text>
              </View>
            )}
            
            {/* 搜索结果标题栏和排序选项 */}
            {isFilterVisible && (
              <View style={styles.resultsHeader}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.sortScrollView}
                >
                  <View style={styles.sortGroup}>
                    <Text style={styles.sortLabel}>{t("price")}:</Text>
                    <View style={styles.sortButtons}>
                      <TouchableOpacity
                        style={[
                          styles.sortButton,
                          sortField === "price" && sortOrder === "asc"
                            ? styles.sortButtonActive
                            : {},
                        ]}
                        onPress={() => handleSort("price", "asc", products, setProducts)}
                      >
                        <Text
                          style={[
                            styles.sortButtonText,
                            sortField === "price" && sortOrder === "asc"
                              ? styles.sortButtonTextActive
                              : {},
                          ]}
                        >
                          {t("lowToHigh")}
                        </Text>
                        {sortField === "price" && sortOrder === "asc" && (
                          <IconComponent
                            name="chevron-up"
                            size={16}
                            color="#FF6F30"
                          />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.sortButton,
                          sortField === "price" && sortOrder === "desc"
                            ? styles.sortButtonActive
                            : {},
                        ]}
                        onPress={() => handleSort("price", "desc", products, setProducts)}
                      >
                        <Text
                          style={[
                            styles.sortButtonText,
                            sortField === "price" && sortOrder === "desc"
                              ? styles.sortButtonTextActive
                              : {},
                          ]}
                        >
                          {t("highToLow")}
                        </Text>
                        {sortField === "price" && sortOrder === "desc" && (
                          <IconComponent
                            name="chevron-down"
                            size={16}
                            color="#FF6F30"
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.sortDivider} />
                  <View style={styles.sortGroup}>
                    <Text style={styles.sortLabel}>{t('time')}:</Text>
                    <View style={styles.sortButtons}>
                      <TouchableOpacity
                        style={[
                          styles.sortButton,
                          sortField === "time" && sortOrder === "asc"
                            ? styles.sortButtonActive
                            : {},
                        ]}
                        onPress={() => handleSort("time", "asc", products, setProducts)}
                      >
                        <Text
                          style={[
                            styles.sortButtonText,
                            sortField === "time" && sortOrder === "asc"
                              ? styles.sortButtonTextActive
                              : {},
                          ]}
                        >
                          {t("oldest")}
                        </Text>
                        {sortField === "time" && sortOrder === "asc" && (
                          <IconComponent
                            name="chevron-up"
                            size={16}
                            color="#FF6F30"
                          />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.sortButton,
                          sortField === "time" && sortOrder === "desc"
                            ? styles.sortButtonActive
                            : {},
                        ]}
                        onPress={() => handleSort("time", "desc", products, setProducts)}
                      >
                        <Text
                          style={[
                            styles.sortButtonText,
                            sortField === "time" && sortOrder === "desc"
                              ? styles.sortButtonTextActive
                              : {},
                          ]}
                        >
                          {t("newest")}
                        </Text>
                        {sortField === "time" && sortOrder === "desc" && (
                          <IconComponent
                            name="chevron-down"
                            size={16}
                            color="#FF6F30"
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </View>
            )}
            
            {/* 加载指示器或产品列表 */}
            {loading && showSkeleton ? (
              renderLoadingSpinner()
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
                  ListEmptyComponent={!loading && !showSkeleton ? renderEmptyList : null}
                  ListFooterComponent={renderFooter}
                  showsVerticalScrollIndicator={false}
                  initialNumToRender={8}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  removeClippedSubviews={Platform.OS !== "web"}
                  updateCellsBatchingPeriod={50}
                  onEndReached={handleLoadMoreProducts}
                  onEndReachedThreshold={3}
                  onScroll={handleScroll}
                  scrollEventThrottle={160}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={handleRefreshProducts}
                      colors={["#0066FF"]}
                      tintColor="#0066FF"
                      progressBackgroundColor="transparent"
                    />
                  }
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