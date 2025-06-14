import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
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
  const [pagesData, setPagesData] = useState<Record<number, PageData>>({});

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
      
      // 当用户滑动到新页面时，立即为该页面加载数据（如果还没有数据）
      const categoryId = allCategories[position].category_id;
      if (!pagesData[categoryId]) {
        setTimeout(() => {
          setPagesData(prev => ({
            ...prev,
            [categoryId]: getPageData(categoryId)
          }));
        }, 0);
      }
    }
  }, [allCategories, onCategoryChange, pagesData, getPageData]);

  // 在useEffect中更新页面数据，只获取当前页面和相邻页面的数据
  useEffect(() => {
    const newPagesData: Record<number, PageData> = {};
    
    // 只获取当前页面和相邻页面的数据，减少不必要的数据获取
    allCategories.forEach((category, index) => {
      const isActive = category.category_id === selectedCategoryId;
      const isAdjacent = Math.abs(index - currentIndex) <= 1;
      
      if (isActive || isAdjacent) {
        newPagesData[category.category_id] = getPageData(category.category_id);
      }
    });
    
    // 如果是特殊页面，也获取其数据
    if (currentIndex === -999) {
      newPagesData[selectedCategoryId] = getPageData(selectedCategoryId);
    }
    
    setPagesData(newPagesData);
  }, [allCategories, selectedCategoryId, currentIndex, getPageData]);

  // 获取默认页面数据
  const getDefaultPageData = useCallback((categoryId: number): PageData => {
    return {
      categoryId,
      products: [],
      loading: false,
      hasMore: true,
      page: 1,
      initialized: false,
    };
  }, []);


  // 如果是特殊情况（选中的分类不在allCategories中），直接渲染单个页面
  if (currentIndex === -999) {
    const pageData = pagesData[selectedCategoryId] || getDefaultPageData(selectedCategoryId);
    return (
      <View style={{ flex: 1 }}>
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
      offscreenPageLimit={1}
    >
      {allCategories.map((category, index) => {
        const isActive = category.category_id === selectedCategoryId;
        const isAdjacent = Math.abs(index - currentIndex) <= 1;
        
        // 只渲染当前页面和相邻页面，其他页面显示轻量级占位符
        if (!isActive && !isAdjacent) {
          return (
            <View key={category.category_id} style={{ flex: 1, backgroundColor: '#f5f5f5' }} />
          );
        }
        
        const pageData = pagesData[category.category_id] || getDefaultPageData(category.category_id);

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
      })}
    </PagerView>
  );
};