import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import {
  productApi,
  type Product,
  ProductParams,
} from "../services/api/productApi";
import { useTranslation } from "react-i18next";
import isSmallScreen from "../utils/isSmallScreen";
import { Svg, Path } from "react-native-svg";
import SearchIcon from "../components/SearchIcon";
import widthUtils from "../utils/widthUtils";
import fontSize from "../utils/fontsizeUtils";
import useUserStore from "../store/user";
import { getSubjectTransLanguage } from "../utils/languageUtils";
import Toast from "react-native-toast-message";
import * as FileSystem from 'expo-file-system';
import useBurialPointStore from "../store/burialPoint";



// 图标组件 - 使用React.memo优化渲染
const IconComponent = React.memo(
  ({ name, size, color }: { name: string; size: number; color: string }) => {
    const Icon = Ionicons as any;
    return <Icon name={name} size={size} color={color} />;
  }
);

// 路由参数类型
type ImageSearchRouteParams = {
  image?: string;
};

// 组件Props类型
type ImageSearchResultScreenProps = {
  route: RouteProp<Record<string, ImageSearchRouteParams>, string>;
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
          <View
            style={[
              style,
              styles.imagePlaceholder,
              { position: "absolute", zIndex: 1 },
            ]}
          />
        )}

        {/* Show error state if image failed to load */}
        {hasError && (
          <View
            style={[
              style,
              styles.imagePlaceholder,
              { position: "absolute", zIndex: 1 },
            ]}
          >
            <IconComponent name="image-outline" size={24} color="#999" />
            <Text
              style={{ fontSize: fontSize(12), color: "#999", marginTop: 4 }}
            >
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
const ProductSkeleton = React.memo(() => (
  <View style={styles.productCard}>
    <View style={[styles.productImageContainer, styles.imagePlaceholder]} />
    <View style={styles.productInfo}>
      <View
        style={[
          styles.skeletonText,
          { width: "90%", height: 16, marginBottom: 8 },
        ]}
      />
      <View
        style={[
          styles.skeletonText,
          { width: "70%", height: 16, marginBottom: 8 },
        ]}
      />
      <View
        style={[
          styles.skeletonText,
          { width: "40%", height: 24, marginBottom: 4 },
        ]}
      />
      <View style={[styles.skeletonText, { width: "30%", height: 12 }]} />
    </View>
  </View>
));

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
      key={product.offer_id}
    >
      <View style={styles.productImageContainer}>
        {product.product_image_urls[0] ? (
          <LazyImage
            uri={product.product_image_urls[0]}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.placeholderText}>{t("productPicture")}</Text>
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
          {getSubjectTransLanguage(product)}
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
          {/* {product.sold_out} {product.sold_out === 0 ? "" : "+"} {t("sales")} */}
        </Text>
      </View>
    </TouchableOpacity>
  )
);

export const ImageSearchResultScreen = ({
  route,
  navigation,
}: ImageSearchResultScreenProps) => {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [originalProducts, setOriginalProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const userStore = useUserStore();
  const burialPointData = useBurialPointStore();
  const flatListRef = useRef<FlatList>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const imageProcessed = useRef(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [sortField, setSortField] = useState<"price" | "time">("price");
  const [activeTab, setActiveTab] = useState<"default" | "volume" | "price">("default");
  const [currentPage, setCurrentPage] = useState(1);
  const searchInProgress = useRef(false);
  const [isImageSearch, setIsImageSearch] = useState(false);
  const searchImageInProgress = useRef(false);
  const [isImageSearchLoading, setIsImageSearchLoading] = useState(false);

  // 获取初始图片URI
  const imageUri = useMemo(() => {
    console.log("获取图片URI", route.params?.image);
    return route.params?.image || null;
  }, [route.params?.image]);

  const uriToBase64 = async (uri: string): Promise<string> => {
    try {
      console.log("开始转换图片为Base64", uri);
  
      // **此部分是关键更改：使用 FileSystem.readAsStringAsync**
      // 删除了原有的 XMLHttpRequest 代码块
      const base64String = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      // FileSystem.readAsStringAsync 返回的是纯Base64字符串，不包含 'data:image/jpeg;base64,' 前缀
      // 所以你原来抽取 base64Data.split(',')[1] 的逻辑也就不需要了。
  
      console.log("图片转换为Base64完成，纯Base64字符串长度:", base64String.length);
      return base64String;
    } catch (error) {
      console.error("图片转换Base64出错:", error);
      throw error; // 继续抛出错误，以便 searchByImage 可以捕获并处理
    }
  };
  
  // 搜索图片
  const searchByImage = async (uri: string, isLoadMore = false, page = 1) => {
    if (!uri) {
      console.log("没有有效的图片URI，停止搜索。");
      setLoading(false);
      setShowSkeleton(false);
      setIsImageSearchLoading(false);
      return;
    }

    if (searchImageInProgress.current) {
      console.log("图片搜索正在进行中，跳过重复请求");
      return;
    }

    try {
      console.log("开始搜索图片，URI:", uri, "页码:", page);
      console.log("当前用户信息:", userStore.user);
      
      if (!isLoadMore) {
        setLoading(true);
        setShowSkeleton(true);
        setIsImageSearchLoading(true);
      } else {
        setLoadingMore(true);
      }

      searchImageInProgress.current = true;

      const base64String = await uriToBase64(uri);

      const userId = userStore.user?.user_id || null;
      const data = {
        image_base64: base64String,
        user_id: userId,
        page,
        page_size: 40
      };

      console.log("准备调用图片搜索API，用户ID:", userId, "页码:", page);
      const response = await productApi.searchByImage(data);

      console.log("图片搜索API调用成功，返回数据:", JSON.stringify(response));

      const productList = Array.isArray(response) ? response : [];

      if (isLoadMore) {
        setProducts(prev => [...prev, ...productList]);
      } else {
        setProducts(productList);
        setOriginalProducts(productList);
      }

      setHasMore(productList.length === 20);
      setCurrentPage(page);
      setIsImageSearch(true);

    } catch (error: any) {
      console.error("图片搜索出错:", error);

      let errorMessage = "图片搜索失败，请稍后再试。";
      if (error.message && error.message.includes("Network request failed")) {
        errorMessage = "网络连接错误，请检查您的网络设置。";
        console.error("排查建议:");
        console.error("1. 确保设备连接到稳定的网络。");
        console.error("2. 如果是本地开发，请检查开发服务器是否正在运行且可访问。");
        console.error("3. 检查后端API服务是否正常运行。");
      } else if (error instanceof TypeError) {
        errorMessage = "无法处理图片文件，请尝试其他图片或检查图片来源。";
        console.error("可能原因：图片文件损坏或格式不支持。");
      } else if (error.message) {
        errorMessage = `图片搜索失败: ${error.message}`;
      }

      setProducts([]);
      setOriginalProducts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setShowSkeleton(false);
      setIsImageSearchLoading(false);
      searchImageInProgress.current = false;
    }
  };
  
  // 搜索产品的API调用
  const searchProducts = useCallback(
    async (keyword: string, isLoadMore = false, page = 1) => {
      if (!isLoadMore) {
        setLoading(true);
        setShowSkeleton(true);
      } else {
        setLoadingMore(true);
      }

      if (searchInProgress.current) {
        return;
      }

      searchInProgress.current = true;

      try {
        const params: ProductParams = {
          keyword: keyword,
          page: page,
          page_size: 20,
          sort_order: "desc",
          sort_by: "default",
          language: "en",
          user_id: userStore.user?.user_id,
        };

        const res = await productApi.getSearchProducts(params);
        if (isLoadMore) {
          setProducts((prev) => [...prev, ...res.products]);
        } else {
          setProducts(res.products);
          // 保存原始排序的数据，以便默认排序时恢复
          setOriginalProducts(res.products);
        }
        // 如果返回的数据少于页面大小，说明没有更多数据了
        setHasMore(res.products.length === params.page_size);
        setCurrentPage(page);
      } catch (error) {
        console.error("Error searching products:", error);
        // 发生错误时，设置hasMore为false，防止继续加载
        setHasMore(false);
        // 如果不是加载更多，清空产品列表
        if (!isLoadMore) {
          setProducts([]);
          setOriginalProducts([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setShowSkeleton(false);
        searchInProgress.current = false;
      }
    },
    [userStore.user]
  );

  // 处理搜索提交
  const handleSearch = useCallback(() => {
    if (searchText.trim()) {
      // 重置排序状态
      setSortField("price");
      setSortOrder(null);
      // 重置到默认标签
      setActiveTab("default");
      // 重置页码
      setCurrentPage(1);
      // Show skeleton for new search
      setShowSkeleton(true);
      searchProducts(searchText.trim(), false, 1);
    }
  }, [searchText, searchProducts]);

  // 处理触底加载更多
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = currentPage + 1;
      if (isImageSearch && imageUri) {
        searchByImage(imageUri, true, nextPage);
      } else if (searchText.trim()) {
        searchProducts(searchText.trim(), true, nextPage);
      }
    }
  }, [loadingMore, hasMore, loading, searchText, currentPage, isImageSearch, imageUri]);

  // 切换筛选器显示状态
  const toggleFilter = useCallback(() => {
    setIsFilterVisible(!isFilterVisible);
  }, [isFilterVisible]);

  // 处理点击产品
  const handleProductPress = useCallback(
    (product: Product) => {

      if(product.original_min_price === 0 || product.original_min_price === null){
          Toast.show({
            type: "error",
            text1: t("productDiscontinued"),
          });
          return;
      }
      navigation.navigate("ProductDetail", {
        offer_id: product.offer_id,
        price: product.min_price,
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
        <IconComponent name="image-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>{t("noResults")}</Text>
        <Text style={styles.emptySubtext}>{t("tryDifferentImage")}</Text>
      </View>
    ),
    [t]
  );

  // 渲染产品项
  const renderProductItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductItem
        product={item}
        onPress={handleProductPress}
        t={t}
        userStore={userStore}
      />
    ),
    [handleProductPress, t, userStore]
  );

  // 创建产品列表项的key提取器
  const keyExtractor = useCallback(
    (item: Product, index: number) => `${item.offer_id}-${index}`,
    []
  );

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

  // 处理排序
  const handleSort = useCallback(
    (field: "price" | "time", order: "asc" | "desc") => {
      setSortField(field);
      setSortOrder(order);
      // 本地排序，不发送API请求
      setProducts((prevProducts) => {
        const sortedProducts = [...prevProducts];
        if (field === "price") {
          sortedProducts.sort((a, b) => {
            const priceA = a.min_price || 0;
            const priceB = b.min_price || 0;
            return order === "asc" ? priceA - priceB : priceB - priceA;
          });
        } else if (field === "time") {
          sortedProducts.sort((a, b) => {
            // 假设产品有create_time字段，如果没有可以使用其他时间相关字段
            const timeA = new Date(a.create_date || 0).getTime();
            const timeB = new Date(b.create_date || 0).getTime();
            return order === "asc" ? timeA - timeB : timeB - timeA;
          });
        }
        return sortedProducts;
      });
    },
    []
  );

  // 处理标签切换
  const handleTabChange = useCallback(
    (tab: "default" | "volume" | "price") => {
      // 如果点击的是已经激活的价格标签，则切换排序顺序
      if (tab === "price" && activeTab === "price") {
        // 如果当前是价格升序，则切换为降序；如果是降序或未设置，则切换为升序
        const newOrder = sortOrder === "asc" ? "desc" : "asc";
        handleSort("price", newOrder);
        scrollToTop();
      } else {
        setActiveTab(tab);
        // 根据标签类型设置排序规则
        if (tab === "price") {
          // 默认价格从低到高
          handleSort("price", "asc");
          scrollToTop();
        } else if (tab === "volume") {
          // 按销量排序
          const sortedProducts = [...originalProducts];
          sortedProducts.sort((a, b) => {
            const volumeA = a.sold_out || 0;
            const volumeB = b.sold_out || 0;
            return volumeB - volumeA; // 从高到低排序
          });
          setProducts(sortedProducts);
          scrollToTop();
        } else {
          // 默认排序 - 恢复到原始数据顺序
          setProducts([...originalProducts]);
          scrollToTop();
        }
      }
    },
    [handleSort, activeTab, sortOrder, originalProducts, scrollToTop]
  );

  // 渲染列表底部加载更多
  const renderFooter = useCallback(() => {
    if (!hasMore)
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>{t("noMoreData")}</Text>
        </View>
      );
    if (loadingMore)
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="small" color="#0066FF" />
          <Text style={styles.footerText}>{t("loadingMore")}</Text>
        </View>
      );
    return <View style={styles.footerSpace} />;
  }, [loadingMore, hasMore, t]);

  // 只在组件加载时执行一次搜索
  useEffect(() => {
    console.log("useEffect: imageUri", imageUri);

    if (imageUri && !imageProcessed.current) {
      setLoading(true);
      setShowSkeleton(true);
      setIsImageSearchLoading(true);
      setCurrentPage(1);
      console.log("useEffect: 图片URI存在且未处理，设置加载状态。");
    } else if (!imageUri) {
      console.log("useEffect: 没有图片URI，立即结束加载状态。");
      setLoading(false);
      setShowSkeleton(false);
      setIsImageSearchLoading(false);
      return;
    }

    if (imageProcessed.current) {
      console.log("useEffect: 已处理过图片，跳过。");
      return;
    }

    console.log("useEffect: 首次加载或imageUri变化，处理图片", imageUri);
    imageProcessed.current = true;

    searchByImage(imageUri, false, 1);
  }, [imageUri]);

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
              onPress={() => handleTabChange("default")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "default" && styles.activeTabText,
                ]}
              >
                {t("default")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "volume" && styles.activeTabButton,
              ]}
              onPress={() => handleTabChange("volume")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "volume" && styles.activeTabText,
                ]}
              >
                {t("volume")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "price" && styles.activeTabButton,
              ]}
              onPress={() => handleTabChange("price")}
            >
              <View style={styles.tabButtonContent}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "price" && styles.activeTabText,
                  ]}
                >
                  {t("price")}
                </Text>
                {activeTab === "price" && (
                  <View style={styles.tabIcon}>
                    <IconComponent
                      name={
                        sortOrder === "desc" ? "chevron-down" : "chevron-up"
                      }
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
                        onPress={() => handleSort("price", "asc")}
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
                            color="#ff6600"
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
                        onPress={() => handleSort("price", "desc")}
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
                            color="#ff6600"
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.sortDivider} />
                  <View style={styles.sortGroup}>
                    <Text style={styles.sortLabel}>{t("time")}:</Text>
                    <View style={styles.sortButtons}>
                      <TouchableOpacity
                        style={[
                          styles.sortButton,
                          sortField === "time" && sortOrder === "asc"
                            ? styles.sortButtonActive
                            : {},
                        ]}
                        onPress={() => handleSort("time", "asc")}
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
                            color="#ff6600"
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
                        onPress={() => handleSort("time", "desc")}
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
                            color="#ff6600"
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
              renderSkeletonGrid()
            ) : (
              <>
                <FlatList
                  ref={flatListRef}
                  data={products}
                  renderItem={renderProductItem}
                  keyExtractor={keyExtractor}
                  numColumns={2}
                  contentContainerStyle={styles.productGrid}
                  ListEmptyComponent={renderEmptyList}
                  ListFooterComponent={renderFooter}
                  showsVerticalScrollIndicator={false}
                  initialNumToRender={4}
                  maxToRenderPerBatch={8}
                  windowSize={3}
                  removeClippedSubviews={Platform.OS !== "web"}
                  updateCellsBatchingPeriod={50}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={0.2}
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
        
        {/* 图片搜索全屏加载覆盖层 */}
        {isImageSearchLoading && (
          <View style={styles.fullScreenLoading}>
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color="#0066FF" />
              <Text style={styles.loadingText}>{t("searchingImage") || "Searching image"}</Text>
              <Text style={styles.loadingSubtext}>{t("pleaseWait") || "Please wait"}</Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  safeAreaContent: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 0 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 8,
    height: widthUtils(40, 40).height,
    marginHorizontal: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 4,
    fontSize: isSmallScreen ? 14 : 16,
    color: "#333",
    height: widthUtils(40, 40).height,
    paddingRight: 30,
  },
  clearButton: {
    position: "absolute",
    right: 10,
    top: "50%",
    marginTop: -10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#333",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    position: "relative",
  },
  tabButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  tabIcon: {
    marginLeft: 4,
  },
  tabText: {
    fontSize: fontSize(16),
    color: "#000",
  },
  activeTabText: {
    color: "#0933a1",
    fontWeight: "bold",
  },
  activeTabButton: {
    // borderBottomColor: "#0933a1",
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingVertical: 8,
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
  sortScrollView: {
    flexGrow: 0,
  },
  sortGroup: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  sortLabel: {
    fontSize: fontSize(16),
    color: "#666",
    marginRight: 8,
  },
  sortButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginLeft: 4,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  sortButtonActive: {
    borderColor: "#ff6600",
    backgroundColor: "#fff8f5",
  },
  sortButtonText: {
    fontSize: fontSize(14),
    color: "#666",
  },
  sortButtonTextActive: {
    color: "#ff6600",
    fontWeight: "bold",
  },
  sortDivider: {
    width: 1,
    height: widthUtils(20, 20).height,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 16,
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
    width: widthUtils(20, 20).width,
    height: widthUtils(20, 20).height,
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
    fontSize: fontSize(14),
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
    backgroundColor: "#EAEAEA",
    justifyContent: "center",
    alignItems: "center",
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
    backgroundColor: "#EAEAEA",
    borderRadius: 4,
  },
  fullScreenLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  loadingText: {
    fontSize: fontSize(18),
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: fontSize(14),
    color: "#666",
  },
});
