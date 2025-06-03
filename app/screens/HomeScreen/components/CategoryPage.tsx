import React, { useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  RefreshControl,
  Platform,
  Dimensions,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Product } from '../../../services/api/productApi';
import { ProductItem, ProductSkeleton, FeatureNavigationBar, CarouselBanner } from './';
import { styles } from '../styles';

// Icon组件
const IconComponent = React.memo(({ name, size, color }: { name: string; size: number; color: string }) => {
  const Icon = Ionicons as any;
  return <Icon name={name} size={size} color={color} />;
});

interface PageData {
  categoryId: number;
  products: Product[];
  loading: boolean;
  hasMore: boolean;
  page: number;
  initialized: boolean;
}

interface CategoryPageProps {
  categoryId: number;
  pageData: PageData;
  onLoadMore: (categoryId: number) => void;
  onRefresh: (categoryId: number) => void;
  onProductPress: (item: Product) => void;
  onCameraPress: () => void;
  userStore: any;
  t: (key: string) => string;
  isActive: boolean; // 是否为当前活跃页面
  subcategories?: any[]; // 二级分类数据
  subcategoriesLoading?: boolean; // 二级分类加载状态
  onSubcategoryPress?: (subcategoryId: number) => void; // 二级分类点击事件
  onViewAllSubcategories?: (categoryId: number) => void; // 查看全部二级分类
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  categoryId,
  pageData,
  onLoadMore,
  onRefresh,
  onProductPress,
  onCameraPress,
  userStore,
  t,
  isActive,
  subcategories = [],
  subcategoriesLoading = false,
  onSubcategoryPress,
  onViewAllSubcategories,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const screenWidth = Dimensions.get('window').width;
  const loadMoreRef = useRef(false); // 防止重复调用加载更多
  
  // 本地图片不需要预加载，直接使用即可
  
  // 当loading状态变化时重置防重复标志
  React.useEffect(() => {
    if (!pageData.loading) {
      loadMoreRef.current = false;
    }
  }, [pageData.loading]);

  // 渲染产品项
  const renderProductItem = useCallback(
    ({ item }: { item: Product & { _uniqueId?: number } }) => (
      <ProductItem
        item={item}
        onPress={onProductPress}
        userStore={userStore}
        t={t}
      />
    ),
    [onProductPress, userStore, t],
  );

  // 渲染骨架屏
  const renderSkeletonGrid = useCallback(() => {
    const skeletonArray = Array(8).fill(null);
    return (
      <View style={styles.skeletonContainer}>
        <FlatList
          data={skeletonArray}
          renderItem={() => <ProductSkeleton />}
          keyExtractor={(_, index) => `skeleton-${categoryId}-${index}`}
          numColumns={2}
          columnWrapperStyle={styles.productCardGroup}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 8 }}
        />
      </View>
    );
  }, [categoryId]);

  // 键提取器
  const keyExtractor = useCallback(
    (item: Product & { _uniqueId?: number }, index: number) => {
      // 推荐页面使用uniqueId确保每个项目都有唯一键值
      if (categoryId === -1) {
        return item._uniqueId 
          ? `recommend-${item._uniqueId}` 
          : `recommend-${item.offer_id}-${index}`;
      }
      return item._uniqueId
        ? `product-${categoryId}-${item._uniqueId}`
        : `${categoryId}-${item.offer_id}-${index}`;
    },
    [categoryId],
  );

  // 渲染二级分类项
  const renderSubcategoryItem = useCallback((item: any) => (
    <TouchableOpacity
      key={item.category_id}
      style={styles.subcategoryItem}
      onPress={() => onSubcategoryPress?.(item.category_id)}
    >
      <View style={styles.subcategoryImagePlaceholder}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />
        ) : (
          <IconComponent name="grid-outline" size={20} color="#666" />
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
  ), [onSubcategoryPress]);


  // 渲染"查看全部"按钮
  const renderViewAllButton = useCallback(() => (
    <TouchableOpacity
      key="view-all"
      style={styles.subcategoryItem}
      onPress={() => {
        console.log(`[CategoryPage] 查看全部二级分类 - categoryId: ${categoryId}`);
        onViewAllSubcategories?.(categoryId);
      }}
    >
      <View style={styles.subcategoryImagePlaceholder}>
        <IconComponent name="grid" size={20} color="#ff5100" />
      </View>
      <Text
        style={[styles.subcategoryText, { color: '#ff5100', fontWeight: '600' }]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {t('common.viewAll') || '查看全部'}
      </Text>
    </TouchableOpacity>
  ), [categoryId, onViewAllSubcategories, t]);

  // 二级分类组件
  const subcategoryComponent = useMemo(() => {
    if (categoryId <= 0) return null;

    if (subcategoriesLoading) {
      return (
        <View style={styles.subcategoryContainer}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 100 }}>
            <ActivityIndicator size="small" color="#ff5100" />
          </View>
        </View>
      );
    }

    if (subcategories.length === 0) return null;

    const itemsPerRow = 5;
    const maxRows = 3;
    const maxItemsToShow = (maxRows * itemsPerRow) - 1; // 减1是为了给"查看全部"留位置
    
    // 如果分类数量少于等于最大显示数量，直接显示所有分类
    if (subcategories.length <= maxItemsToShow) {
      const rows = [];
      for (let i = 0; i < subcategories.length; i += itemsPerRow) {
        const rowItems = subcategories.slice(i, i + itemsPerRow);
        rows.push(rowItems);
      }

      return (
        <View style={styles.subcategoryContainer}>
          <View style={styles.subcategoryContent}>
            {rows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.subcategoryRow}>
                {row.map(renderSubcategoryItem)}
              </View>
            ))}
          </View>
        </View>
      );
    }

    // 如果分类数量超过最大显示数量，显示部分分类+查看全部按钮
    const itemsToShow = subcategories.slice(0, maxItemsToShow);
    const rows = [];
    
    for (let i = 0; i < itemsToShow.length; i += itemsPerRow) {
      const rowItems = itemsToShow.slice(i, i + itemsPerRow);
      rows.push(rowItems);
    }

    // 在最后一行的最后位置添加"查看全部"按钮
    const lastRowIndex = rows.length - 1;
    const lastRow = rows[lastRowIndex];
    
    // 如果最后一行已满，创建新行
    if (lastRow.length === itemsPerRow) {
      rows.push([]);
    }

    return (
      <View style={styles.subcategoryContainer}>
        <View style={styles.subcategoryContent}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.subcategoryRow}>
              {row.map(renderSubcategoryItem)}
              {/* 在最后一行添加"查看全部"按钮 */}
              {rowIndex === rows.length - 1 && renderViewAllButton()}
            </View>
          ))}
        </View>
      </View>
    );
  }, [categoryId, subcategories, subcategoriesLoading, renderSubcategoryItem, renderViewAllButton, t]);

  // 列表头部组件
  const listHeaderComponent = useMemo(
    () => (
      <>
        {categoryId === -1 ? (
          // 推荐页面显示功能导航和轮播图
          <>
            <FeatureNavigationBar />
            <CarouselBanner onCameraPress={onCameraPress} />
          </>
        ) : (
          // 分类页面显示二级分类
          subcategoryComponent
        )}
      </>
    ),
    [categoryId, onCameraPress, subcategoryComponent],
  );

  // 刷新控制
  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={pageData.loading && pageData.products.length === 0}
        onRefresh={() => onRefresh(categoryId)}
        colors={["#ff5100"]}
        tintColor="#ff5100"
        progressBackgroundColor="transparent"
      />
    ),
    [pageData.loading, pageData.products.length, onRefresh, categoryId],
  );

  // 处理加载更多
  const handleLoadMore = useCallback(() => {
    // 防止重复调用
    if (loadMoreRef.current) {
      console.log(`[CategoryPage] 防重复调用 - categoryId: ${categoryId}`);
      return;
    }

    console.log(`[CategoryPage] handleLoadMore called for category ${categoryId}:`, {
      hasMore: pageData.hasMore,
      loading: pageData.loading,
      isActive: isActive,
      productsCount: pageData.products.length
    });
    
    if (pageData.hasMore && !pageData.loading && isActive) {
      loadMoreRef.current = true;
      console.log(`[CategoryPage] 触发加载更多 - categoryId: ${categoryId}`);
      onLoadMore(categoryId);
    } else {
      console.log(`[CategoryPage] 加载更多被阻止 - categoryId: ${categoryId}`, {
        hasMore: pageData.hasMore,
        loading: pageData.loading,
        isActive: isActive
      });
    }
  }, [pageData.hasMore, pageData.loading, isActive, onLoadMore, categoryId]);

  // 列表内容容器样式
  const flatListContentContainerStyle = useMemo(
    () => ({
      paddingBottom: 8,
      backgroundColor: "#f5f5f5",
    }),
    [],
  );

  // 如果页面未初始化且不是当前活跃页面，返回空视图
  if (!pageData.initialized && !isActive) {
    return <View style={{ width: screenWidth, backgroundColor: "#f5f5f5" }} />;
  }
  
  // 只有当用户明确交互过（如下拉刷新），且推荐页面为空时才自动加载
  // 这里暂时完全禁用自动加载，等用户滑动到底部或下拉刷新时才触发

  // console.log(`[CategoryPage] Rendering categoryId: ${categoryId}`, {
  //   isActive,
  //   pageDataLoading: pageData.loading,
  //   pageDataProductsLength: pageData.products.length,
  //   pageDataInitialized: pageData.initialized
  // });

  return (
    <View style={{ width: screenWidth, flex: 1 }}>
      {pageData.loading && pageData.products.length === 0 ? (
        // 正在加载且没有数据时显示骨架屏
        <ScrollView refreshControl={refreshControl}>
          {listHeaderComponent}
          {renderSkeletonGrid()}
        </ScrollView>
      ) : pageData.products.length === 0 ? (
        // 没有数据且没在加载时，显示空状态，但仍可下拉刷新
        <ScrollView 
          refreshControl={refreshControl}
          contentContainerStyle={{ flex: 1 }}
        >
          {listHeaderComponent}
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center',
            paddingBottom: 100 
          }}>
            <Text style={{ fontSize: 16, color: '#999' }}>
              {categoryId === -1 
                ? '下拉刷新获取推荐商品' 
                : `下拉刷新获取分类商品`}
            </Text>
          </View>
        </ScrollView>
      ) : (
        // 有数据时显示正常列表
        <FlatList
          ref={flatListRef}
          data={pageData.products}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.productCardGroup}
          renderItem={renderProductItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={flatListContentContainerStyle}
          ListHeaderComponent={listHeaderComponent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          refreshControl={refreshControl}
          initialNumToRender={isActive ? 10 : 0} // 非活跃页面不预渲染
          maxToRenderPerBatch={isActive ? 10 : 2}
          windowSize={isActive ? 10 : 3}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
          scrollEventThrottle={16}
          getItemLayout={undefined} // 让FlatList自动计算布局，提高性能
        />
      )}
    </View>
  );
};