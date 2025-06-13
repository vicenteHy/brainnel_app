import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { CategoryPage } from './CategoryPage';
import { Product } from '../../../services/api/productApi';

interface PageData {
  categoryId: number;
  products: Product[];
  loading: boolean;
  hasMore: boolean;
  page: number;
  initialized: boolean;
}

interface MultiPageContainerProps {
  allCategories: any[];
  selectedCategoryId: number;
  onCategoryChange: (categoryId: number) => void;
  getPageData: (categoryId: number) => PageData;
  onLoadMore: (categoryId: number) => void;
  onRefresh: (categoryId: number) => void;
  onProductPress: (item: Product) => void;
  onCameraPress: () => void;
  userStore: any;
  t: (key: string) => string;
  subcategories?: any[];
  subcategoriesLoading?: boolean;
  onSubcategoryPress?: (subcategoryId: number) => void;
  onViewAllSubcategories?: (categoryId: number) => void;
}

export const MultiPageContainer: React.FC<MultiPageContainerProps> = ({
  allCategories,
  selectedCategoryId,
  onCategoryChange,
  getPageData,
  onLoadMore,
  onRefresh,
  onProductPress,
  onCameraPress,
  userStore,
  t,
  subcategories = [],
  subcategoriesLoading = false,
  onSubcategoryPress,
  onViewAllSubcategories,
}) => {
  const pagerRef = useRef<PagerView>(null);

  // 计算当前页面索引
  const currentIndex = useMemo(() => {
    const index = allCategories.findIndex(cat => cat.category_id === selectedCategoryId);
    // 如果找不到当前选中的分类，可能是用户点击了弹窗中的分类
    // 这种情况下返回一个特殊值来标识
    return index !== -1 ? index : -999;
  }, [allCategories, selectedCategoryId]);

  // 更新页面位置
  useEffect(() => {
    if (currentIndex !== -999 && pagerRef.current) {
      // 使用 setPageWithoutAnimation 避免动画冲突
      pagerRef.current.setPageWithoutAnimation(currentIndex);
    }
  }, [currentIndex]);

  // 处理页面切换
  const handlePageSelected = useCallback((e: any) => {
    const position = e.nativeEvent.position;
    if (allCategories[position]) {
      onCategoryChange(allCategories[position].category_id);
    }
  }, [allCategories, onCategoryChange]);

  // 渲染特殊页面（当前选中的分类不在allCategories中）
  const renderSpecialPage = useCallback(() => {
    const pageData = getPageData(selectedCategoryId);
    
    return (
      <CategoryPage
        key={selectedCategoryId}
        categoryId={selectedCategoryId}
        pageData={pageData}
        onLoadMore={onLoadMore}
        onRefresh={onRefresh}
        onProductPress={onProductPress}
        onCameraPress={onCameraPress}
        userStore={userStore}
        t={t}
        isActive={true}
        subcategories={subcategories}
        subcategoriesLoading={subcategoriesLoading}
        onSubcategoryPress={onSubcategoryPress}
        onViewAllSubcategories={onViewAllSubcategories}
      />
    );
  }, [
    selectedCategoryId,
    getPageData,
    onLoadMore,
    onRefresh,
    onProductPress,
    onCameraPress,
    userStore,
    t,
    subcategories,
    subcategoriesLoading,
    onSubcategoryPress,
    onViewAllSubcategories,
  ]);

  // 渲染页面
  const renderPage = useCallback((category: any) => {
    const isActive = category.category_id === selectedCategoryId;
    const pageData = getPageData(category.category_id);

    return (
      <View key={category.category_id} style={{ flex: 1 }}>
        <CategoryPage
          categoryId={category.category_id}
          pageData={pageData}
          onLoadMore={onLoadMore}
          onRefresh={onRefresh}
          onProductPress={onProductPress}
          onCameraPress={onCameraPress}
          userStore={userStore}
          t={t}
          isActive={isActive}
          subcategories={isActive ? subcategories : []}
          subcategoriesLoading={isActive ? subcategoriesLoading : false}
          onSubcategoryPress={onSubcategoryPress}
          onViewAllSubcategories={onViewAllSubcategories}
        />
      </View>
    );
  }, [
    selectedCategoryId,
    getPageData,
    onLoadMore,
    onRefresh,
    onProductPress,
    onCameraPress,
    userStore,
    t,
    subcategories,
    subcategoriesLoading,
    onSubcategoryPress,
    onViewAllSubcategories,
  ]);

  // 如果是特殊情况（选中的分类不在allCategories中），直接渲染单个页面
  if (currentIndex === -999) {
    return (
      <View style={{ flex: 1 }}>
        {renderSpecialPage()}
      </View>
    );
  }

  return (
    <PagerView
      ref={pagerRef}
      style={{ flex: 1 }}
      initialPage={Math.max(0, currentIndex)}
      onPageSelected={handlePageSelected}
      scrollEnabled={true}
      orientation="horizontal"
    >
      {allCategories.map(renderPage)}
    </PagerView>
  );
};