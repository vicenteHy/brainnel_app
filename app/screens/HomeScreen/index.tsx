import React, {
  useCallback,
  useState,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  InteractionManager,
  Image,
  ScrollView,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  productApi,
  type Product,
  type Category,
} from "../../services/api/productApi";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import useUserStore from "../../store/user";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useGlobalStore } from "../../store/useGlobalStore";

// 导入拆分的组件
import {
  SearchBar,
  CarouselBanner,
  ProductItem,
  FeatureNavigationBar,
  ProductSkeleton,
} from "./components";

// 导入样式
import { styles, loginModalStyles } from "./styles";

// 导入自定义 hook
import { useProductData } from "./hooks/useProductData";

type IconProps = {
  name: string;
  size: number;
  color: string;
};

const IconComponent = React.memo(({ name, size, color }: IconProps) => {
  const Icon = Ionicons as any;
  return <Icon name={name} size={size} color={color} />;
});

export const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { t } = useTranslation();
  const userStore = useUserStore();
  const { country, currency } = useGlobalStore();
  const flatListRef = useRef<FlatList>(null);
  const horizontalScrollRef = useRef<ScrollView>(null);
  
  // 使用自定义 hook 管理产品数据
  const {
    products,
    loading,
    loadingMore,
    hasMore,
    refreshing,
    loadingPlaceholders,
    currencyVersion,
    params,
    handleLoadMore,
    handleRefresh,
  } = useProductData();

  // 本地状态
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
  const [galleryUsed, setGalleryUsed] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(!userStore.user?.user_id);

  // 分类相关状态
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);

  // 处理产品点击
  const handleProductPress = useCallback(
    (item: Product) => {
      InteractionManager.runAfterInteractions(() => {
        navigation.navigate("ProductDetail", {
          offer_id: item.offer_id,
          searchKeyword: params.keyword,
          price: item.min_price,
        });
      });
    },
    [navigation, params.keyword],
  );

  // 处理相机按钮点击
  const handleCameraPress = useCallback(() => {
    setShowImagePickerModal(true);
  }, []);

  // 图片选择器相关函数
  const cleanupImagePickerCache = async () => {
    try {
      if (Platform.OS === "web") {
        console.log("Cache cleanup skipped on web platform");
        setGalleryUsed(false);
        return;
      }
      const cacheDir = `${FileSystem.cacheDirectory}ImagePicker`;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (dirInfo.exists && dirInfo.isDirectory) {
        await FileSystem.deleteAsync(cacheDir, { idempotent: true });
        console.log("已清理ImagePicker缓存:", cacheDir);
      } else {
        console.log("ImagePicker缓存目录不存在或不是目录，无需清理:", cacheDir);
      }
      console.log("已清理ImagePicker缓存");
      setGalleryUsed(false);
    } catch (error) {
      console.log("清理缓存错误", error);
      setGalleryUsed(false);
    }
  };

  const handleChooseFromGallery = useCallback(async () => {
    setShowImagePickerModal(false);
    setTimeout(async () => {
      try {
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.status !== "granted") {
          console.log("相册权限被拒绝");
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 1,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          navigation.navigate("ImageSearchResultScreen", {
            image: result.assets[0].uri,
            type: 1,
          });
        }
      } catch (error) {
        console.error("相册错误:", error);
        await cleanupImagePickerCache();
      }
    }, 500);
  }, [navigation]);

  const handleTakePhoto = useCallback(async () => {
    setShowImagePickerModal(false);
    setTimeout(async () => {
      try {
        const permissionResult =
          await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.status !== "granted") {
          console.log("相机权限被拒绝");
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 1,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          navigation.navigate("ImageSearchResultScreen", {
            image: result.assets[0].uri,
            type: 1,
          });
        }
      } catch (error) {
        console.error("相机错误:", error);
        await cleanupImagePickerCache();
      }
    }, 500);
  }, [navigation]);

  const resetAppState = useCallback(() => {
    setGalleryUsed(false);
    cleanupImagePickerCache();
    Alert.alert("已重置", "现在您可以使用相机功能了");
  }, []);

  // 获取一级类目
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await productApi.getFirstCategory();
        setCategories(res);
      } catch (e) {
        console.error("获取一级类目失败", e);
      }
    };
    fetchCategories();
  }, []);

  // 获取二级类目
  useEffect(() => {
    if (selectedCategoryId) {
      const fetchSubcategories = async () => {
        setSubcategoriesLoading(true);
        try {
          const res = await productApi.getSecondCategory(selectedCategoryId);
          setSubcategories(res);
        } catch (e) {
          setSubcategories([]);
        } finally {
          setSubcategoriesLoading(false);
        }
      };
      fetchSubcategories();
    } else {
      setSubcategories([]);
      setSubcategoriesLoading(false);
    }
  }, [selectedCategoryId]);

  // 监听登录状态变化
  useEffect(() => {
    if (userStore.user?.user_id) {
      setShowLoginModal(false);
    }
  }, [userStore.user?.user_id]);

  // 渲染产品项
  const renderProductItem = useCallback(
    ({ item }: { item: Product & { _uniqueId?: number } }) => (
      <ProductItem
        item={item}
        onPress={handleProductPress}
        userStore={userStore}
        t={t}
      />
    ),
    [handleProductPress, userStore, t],
  );

  // 渲染骨架屏网格
  const renderSkeletonGrid = useCallback(() => {
    const skeletonArray = Array(8).fill(null);
    return (
      <View style={styles.skeletonContainer}>
        <FlatList
          data={skeletonArray}
          renderItem={() => <ProductSkeleton />}
          keyExtractor={(_, index) => `skeleton-${index}`}
          numColumns={2}
          columnWrapperStyle={styles.productCardGroup}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 8 }}
        />
      </View>
    );
  }, []);

  // 渲染分类区域
  const renderCategorySection = useMemo(
    () => (
      <View style={styles.category}>
        <View style={styles.categoryScrollContainer}>
          <ScrollView
            bounces={false}
            overScrollMode="never"
            ref={horizontalScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.category_id}
                style={[
                  styles.categoryItem,
                  selectedCategoryId === cat.category_id &&
                    styles.categoryItemActive,
                ]}
                onPress={() => setSelectedCategoryId(cat.category_id)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategoryId === cat.category_id &&
                      styles.categoryTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    ),
    [categories, selectedCategoryId],
  );

  // 渲染子分类区域
  const renderSubcategorySection = useMemo(() => {
    if (selectedCategoryId === 0) return null;

    if (subcategoriesLoading) {
      return (
        <View style={styles.subcategoryContainer}>
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <ActivityIndicator size="small" color="#ff5100" />
          </View>
        </View>
      );
    }

    if (subcategories.length === 0) return null;

    const itemsPerRow = 5;
    const totalPages = Math.ceil(subcategories.length / (itemsPerRow * 2));
    const pages = [];

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const startIndex = pageIndex * itemsPerRow * 2;
      const pageFirstRow = subcategories.slice(
        startIndex,
        startIndex + itemsPerRow,
      );
      const pageSecondRow = subcategories.slice(
        startIndex + itemsPerRow,
        startIndex + itemsPerRow * 2,
      );
      pages.push({ firstRow: pageFirstRow, secondRow: pageSecondRow });
    }

    const renderSubcategoryItem = (item: any) => (
      <TouchableOpacity
        key={item.category_id}
        style={styles.subcategoryItem}
        onPress={() => {
          navigation.navigate("SearchResult", {
            category_id: item.category_id,
          });
        }}
      >
        <View style={styles.subcategoryImagePlaceholder}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={{ width: 50, height: 50, borderRadius: 25 }}
            />
          ) : (
            <IconComponent name="grid-outline" size={24} color="#666" />
          )}
        </View>
        <Text
          style={styles.subcategoryText}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );

    return (
      <View style={styles.subcategoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subcategoryContent}
          pagingEnabled={totalPages > 1}
        >
          {pages.map((page, pageIndex) => (
            <View key={pageIndex} style={styles.subcategoryPage}>
              <View style={styles.subcategoryRow}>
                {page.firstRow.map(renderSubcategoryItem)}
              </View>
              <View style={styles.subcategoryRow}>
                {page.secondRow.map(renderSubcategoryItem)}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }, [selectedCategoryId, subcategories, subcategoriesLoading, navigation]);

  // 渲染项目（包括占位符）
  const renderItem = useCallback(
    ({
      item,
      index,
    }: {
      item: (Product & { _uniqueId?: number }) | null;
      index: number;
    }) => {
      if (
        index >= products.length &&
        index < products.length + loadingPlaceholders
      ) {
        return <ProductSkeleton />;
      }

      if (!item) {
        return <ProductSkeleton />;
      }

      return renderProductItem({ item });
    },
    [products.length, loadingPlaceholders, renderProductItem],
  );

  // 键提取器
  const keyExtractor = useCallback(
    (item: (Product & { _uniqueId?: number }) | null, index: number) => {
      if (!item) {
        return `placeholder-${index}-${Date.now()}`;
      }

      return item._uniqueId
        ? `product-${item._uniqueId}`
        : `${item.offer_id}-${index}-${Date.now()}`;
    },
    [],
  );

  // 列表数据
  const flatListData = useMemo(() => {
    const baseData = [...products];
    if (loadingPlaceholders > 0) {
      const placeholders = Array(loadingPlaceholders).fill(null);
      return [...baseData, ...placeholders];
    }
    return baseData;
  }, [products, loadingPlaceholders]);

  // 列表头部组件
  const listHeaderComponent = useMemo(
    () => (
      <>
        <FeatureNavigationBar />
        <CarouselBanner onCameraPress={handleCameraPress} />
        {renderSubcategorySection}
      </>
    ),
    [handleCameraPress, renderSubcategorySection],
  );

  // 列表尾部组件
  const listFooterComponent = useMemo(() => {
    if (!hasMore && !loadingPlaceholders) {
      return (
        <View style={{ padding: 8, alignItems: "center" }}>
          <Text>{t("common.noMoreData")}</Text>
        </View>
      );
    }
    if (loadingMore) {
      return (
        <View style={{ padding: 8, alignItems: "center" }}>
          <Text>{t("loading")}</Text>
        </View>
      );
    }
    return null;
  }, [hasMore, loadingPlaceholders, loadingMore, t]);

  // 刷新控制
  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        colors={["#ff5100"]}
        tintColor="#ff5100"
        progressBackgroundColor="transparent"
      />
    ),
    [refreshing, handleRefresh],
  );

  // 额外数据
  const extraData = useMemo(
    () =>
      `${products.length}-${loadingPlaceholders}-${currencyVersion}`,
    [products.length, loadingPlaceholders, currencyVersion],
  );

  // 列表内容容器样式
  const flatListContentContainerStyle = useMemo(
    () => ({
      paddingBottom: 8,
      backgroundColor: "#f5f5f5",
    }),
    [],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#fff"
        translucent={false}
      />
      <View style={styles.safeAreaContent}>
        <View style={styles.container}>
          {/* 固定的搜索栏和分类栏 */}
          <View style={styles.fixedHeader}>
            <SearchBar onCameraPress={handleCameraPress} />
            {renderCategorySection}
          </View>

          {/* 登录弹窗 */}
          {showLoginModal && !userStore.user?.user_id && (
            <>
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  zIndex: 999,
                }}
                activeOpacity={1}
                onPress={() => setShowLoginModal(false)}
              />
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "#fff",
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  paddingTop: 24,
                  paddingHorizontal: 24,
                  paddingBottom: 12,
                  zIndex: 1000,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TouchableOpacity
                  style={loginModalStyles.closeButton}
                  onPress={() => setShowLoginModal(false)}
                >
                  <Text style={loginModalStyles.closeButtonText}>×</Text>
                </TouchableOpacity>
                <Text style={loginModalStyles.title}>
                  {t("login.required", "请先登录")}
                </Text>
                <Text style={loginModalStyles.subtitle}>
                  {t("login.tip", "登录后可享受更多服务")}
                </Text>
                <TouchableOpacity
                  style={loginModalStyles.loginButton}
                  onPress={() => {
                    setShowLoginModal(false);
                    navigation.navigate("Login");
                  }}
                >
                  <Text style={loginModalStyles.loginButtonText}>
                    {t("login.now", "立即登录")}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* 可滚动内容区域 */}
          <View style={styles.scrollableContent}>
            {loading ? (
              <ScrollView refreshControl={refreshControl}>
                {listHeaderComponent}
                {renderSkeletonGrid()}
              </ScrollView>
            ) : (
              <FlatList
                ref={flatListRef}
                data={flatListData}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                columnWrapperStyle={styles.productCardGroup}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={flatListContentContainerStyle}
                ListHeaderComponent={listHeaderComponent}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={3}
                ListFooterComponent={listFooterComponent}
                refreshControl={refreshControl}
                initialNumToRender={6}
                maxToRenderPerBatch={8}
                windowSize={10}
                removeClippedSubviews={Platform.OS !== "web"}
                updateCellsBatchingPeriod={50}
                getItemLayout={undefined}
                extraData={extraData}
              />
            )}
          </View>

          {/* 图片选择弹窗 */}
          {showImagePickerModal && (
            <>
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  zIndex: 999,
                }}
                activeOpacity={1}
                onPress={() => setShowImagePickerModal(false)}
              />
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "#fff",
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  paddingTop: 12,
                  paddingHorizontal: 20,
                  paddingBottom: 2,
                  zIndex: 1000,
                }}
              >
                {!galleryUsed ? (
                  <TouchableOpacity
                    style={styles.imagePickerOption}
                    onPress={handleTakePhoto}
                  >
                    <IconComponent
                      name="camera-outline"
                      size={24}
                      color="#333"
                    />
                    <Text style={styles.imagePickerText}>
                      {t("homePage.takePhoto")}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.imagePickerOption}
                    onPress={resetAppState}
                  >
                    <IconComponent
                      name="refresh-outline"
                      size={24}
                      color="#333"
                    />
                    <Text style={styles.imagePickerText}>重置相机功能</Text>
                  </TouchableOpacity>
                )}
                <View style={styles.imagePickerDivider} />
                <TouchableOpacity
                  style={styles.imagePickerOption}
                  onPress={handleChooseFromGallery}
                >
                  <IconComponent name="images-outline" size={24} color="#333" />
                  <Text style={styles.imagePickerText}>
                    {t("homePage.chooseFromGallery")}
                  </Text>
                </TouchableOpacity>
                <View style={styles.imagePickerDivider} />
                <TouchableOpacity
                  style={styles.imagePickerCancelButton}
                  onPress={() => setShowImagePickerModal(false)}
                >
                  <Text style={styles.imagePickerCancelText}>
                    {t("homePage.cancel")}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};