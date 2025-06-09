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
import { getCategoryImageSource } from '../../../utils/categoryImageUtils';
import i18n from '../../../i18n';

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
  onViewAllSubcategories?: (categoryId: number) => void; // 查看全部子分类
  // 新增：智能预加载相关
  checkAndTriggerPreload?: (categoryId: number, visibleIndex: number) => void;
  loadingStrategy?: any;
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
  checkAndTriggerPreload,
  loadingStrategy,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const screenWidth = Dimensions.get('window').width;
  const loadMoreRef = useRef(false); // 防止重复调用加载更多
  const [showAllSubcategories, setShowAllSubcategories] = React.useState(false); // 控制是否显示所有二级分类
  const [isUserRefreshing, setIsUserRefreshing] = React.useState(false); // 跟踪是否是用户主动下拉刷新

  // 获取正确语言的类目名称
  const getCategoryName = useCallback((category: any) => {
    const currentLanguage = i18n.language;
    switch(currentLanguage) {
      case 'en':
        return category.name_en || category.name;
      case 'fr':
        return category.name;
      case 'cn':
      case 'zh':
        return category.name_cn || category.name;
      default:
        return category.name;
    }
  }, []);
  
  // 智能预加载相关
  const lastVisibleIndex = useRef(0);
  const preloadCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // 本地图片不需要预加载，直接使用即可
  
  // 当分类切换时重置展开状态和用户刷新状态
  React.useEffect(() => {
    setShowAllSubcategories(false);
    setIsUserRefreshing(false);
  }, [categoryId]);
  
  // 当loading状态变化时重置防重复标志
  React.useEffect(() => {
    if (!pageData.loading) {
      loadMoreRef.current = false;
    }
  }, [pageData.loading]);

  // 清理预加载检查定时器
  React.useEffect(() => {
    return () => {
      if (preloadCheckTimeout.current) {
        clearTimeout(preloadCheckTimeout.current);
      }
    };
  }, []);

  // 处理可见项变化（智能预加载）
  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (!isActive || categoryId !== -1 || !checkAndTriggerPreload) return; // 只为推荐页面和活跃状态检查
    
    if (viewableItems.length === 0) return;
    
    // 获取最后一个可见项的索引
    const maxVisibleIndex = Math.max(...viewableItems.map((item: any) => item.index || 0));
    
    // 只有当滚动前进时才检查预加载
    if (maxVisibleIndex > lastVisibleIndex.current) {
      lastVisibleIndex.current = maxVisibleIndex;
      
      // 防抖处理，避免滚动过程中频繁触发
      if (preloadCheckTimeout.current) {
        clearTimeout(preloadCheckTimeout.current);
      }
      
      preloadCheckTimeout.current = setTimeout(() => {
        checkAndTriggerPreload(categoryId, maxVisibleIndex);
      }, 150);
    }
  }, [isActive, categoryId, checkAndTriggerPreload]);

  // 可见项配置
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // 50%可见时算作可见
    minimumViewTime: 100, // 最小可见时间100ms
  }).current;

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
  const renderSubcategoryItem = useCallback((item: any) => {
    // 获取类目图片源（本地优先，网络备用）
    const imageSource = getCategoryImageSource(item.category_id, item.image, item.name);
    
    return (
      <TouchableOpacity
        key={item.category_id}
        style={styles.subcategoryItem}
        onPress={() => onSubcategoryPress?.(item.category_id)}
      >
        <View style={styles.subcategoryImagePlaceholder}>
          {imageSource ? (
            <Image
              source={imageSource}
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
          {getCategoryName(item)}
        </Text>
      </TouchableOpacity>
    );
  }, [onSubcategoryPress]);


  // 渲染"查看全部/收起"按钮
  const renderViewAllButton = useCallback(() => (
    <TouchableOpacity
      key="view-all"
      style={styles.subcategoryItem}
      onPress={() => {
        console.log(`[CategoryPage] 切换显示状态 - categoryId: ${categoryId}, showAll: ${!showAllSubcategories}`);
        setShowAllSubcategories(!showAllSubcategories);
      }}
    >
      <View style={styles.subcategoryImagePlaceholder}>
        <IconComponent 
          name={showAllSubcategories ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#ff5100" 
        />
      </View>
      <Text
        style={[styles.subcategoryText, { color: '#ff5100', fontWeight: '600' }]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {showAllSubcategories ? (t('common.collapse') || '收起') : (t('common.viewAll') || '查看全部')}
      </Text>
    </TouchableOpacity>
  ), [categoryId, showAllSubcategories, t]);

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
    
    // 如果分类数量少于等于最大显示数量，直接显示所有分类（不需要查看全部按钮）
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

    // 如果分类数量超过最大显示数量
    let itemsToShow: any[];
    let needsViewAllButton = true;

    if (showAllSubcategories) {
      // 显示所有分类
      itemsToShow = subcategories;
      needsViewAllButton = true; // 显示"收起"按钮
    } else {
      // 只显示前几个分类
      itemsToShow = subcategories.slice(0, maxItemsToShow);
      needsViewAllButton = true; // 显示"查看全部"按钮
    }

    const rows = [];
    for (let i = 0; i < itemsToShow.length; i += itemsPerRow) {
      const rowItems = itemsToShow.slice(i, i + itemsPerRow);
      rows.push(rowItems);
    }

    // 添加查看全部/收起按钮到最后
    if (needsViewAllButton) {
      const lastRowIndex = rows.length - 1;
      const lastRow = rows[lastRowIndex];
      
      // 如果最后一行已满或没有行，创建新行
      if (!lastRow || lastRow.length === itemsPerRow) {
        rows.push([]);
      }
    }

    return (
      <View style={styles.subcategoryContainer}>
        <View style={styles.subcategoryContent}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.subcategoryRow}>
              {row.map(renderSubcategoryItem)}
              {/* 在最后一行添加查看全部/收起按钮 */}
              {needsViewAllButton && rowIndex === rows.length - 1 && renderViewAllButton()}
            </View>
          ))}
        </View>
      </View>
    );
  }, [categoryId, subcategories, subcategoriesLoading, showAllSubcategories, renderSubcategoryItem, renderViewAllButton]);

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

  // 处理用户下拉刷新
  const handleUserRefresh = useCallback(() => {
    setIsUserRefreshing(true);
    onRefresh(categoryId);
  }, [onRefresh, categoryId]);

  // 监听loading状态变化，重置用户刷新标志
  React.useEffect(() => {
    if (!pageData.loading && isUserRefreshing) {
      setIsUserRefreshing(false);
    }
  }, [pageData.loading, isUserRefreshing]);

  // 刷新控制 - 只有用户主动下拉刷新时才显示加载动画
  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={isUserRefreshing && pageData.loading}
        onRefresh={handleUserRefresh}
        colors={["#ff5100"]}
        tintColor="#ff5100"
        progressBackgroundColor="transparent"
      />
    ),
    [isUserRefreshing, pageData.loading, handleUserRefresh],
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

  // 渲染底部加载指示器
  const renderFooter = useCallback(() => {
    // 如果没有更多数据或者当前没有产品，不显示底部加载指示器
    if (!pageData.hasMore || pageData.products.length === 0) {
      return null;
    }

    // 如果正在加载更多，显示加载动画
    if (pageData.loading && pageData.products.length > 0) {
      return (
        <View style={{
          paddingVertical: 20,
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
        }}>
          <ActivityIndicator size="small" color="#ff5100" />
          <Text style={{
            marginTop: 8,
            fontSize: 14,
            color: '#666',
            textAlign: 'center',
          }}>
            {t('common.loading') || '正在加载...'}
          </Text>
        </View>
      );
    }

    // 默认情况下不显示任何内容
    return null;
  }, [pageData.hasMore, pageData.loading, pageData.products.length, t]);

  // 列表内容容器样式
  const flatListContentContainerStyle = useMemo(
    () => ({
      paddingBottom: 8,
      backgroundColor: "#f5f5f5",
    }),
    [],
  );

  // 移除这个条件判断，因为它会在页面切换时导致空白
  // 让所有页面都正常渲染，由下面的逻辑来处理不同状态
  
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
      {(pageData.loading && pageData.products.length === 0 && !isUserRefreshing) || (!pageData.initialized && pageData.products.length === 0) ? (
        // 页面初次加载时显示骨架屏，不显示下拉刷新动画
        <ScrollView refreshControl={refreshControl}>
          {listHeaderComponent}
          {renderSkeletonGrid()}
        </ScrollView>
      ) : pageData.products.length === 0 ? (
        // 用户下拉刷新时没有数据，或已初始化但没有数据时，显示空状态
        isUserRefreshing && pageData.loading ? (
          // 用户下拉刷新时显示骨架屏和下拉刷新动画
          <ScrollView refreshControl={refreshControl}>
            {listHeaderComponent}
            {renderSkeletonGrid()}
          </ScrollView>
        ) : (
          // 已初始化但没有数据时，显示空状态，提示用户下拉刷新
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
        )
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
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3} // 提高触发阈值，避免过早加载
          refreshControl={refreshControl}
          initialNumToRender={isActive ? (loadingStrategy?.initialCount || 6) : 0} // 减少初始渲染数量
          maxToRenderPerBatch={isActive ? 6 : 2} // 减少每批渲染数量
          windowSize={isActive ? 8 : 3} // 优化窗口大小
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={100} // 增加批处理间隔，减少频繁更新
          scrollEventThrottle={32} // 降低滚动事件频率
          getItemLayout={undefined} // 让FlatList自动计算布局，提高性能
          // 智能预加载相关
          onViewableItemsChanged={categoryId === -1 ? handleViewableItemsChanged : undefined}
          viewabilityConfig={categoryId === -1 ? viewabilityConfig : undefined}
        />
      )}
    </View>
  );
};