import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Dimensions,
} from 'react-native';
import { PanGestureHandler, State } from "react-native-gesture-handler";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  runOnJS,
} from "react-native-reanimated";
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
  const screenWidth = Dimensions.get('window').width;
  const translateX = useSharedValue(0);
  const containerTranslateX = useSharedValue(0);
  const isGestureActive = useRef(false);

  // 计算当前页面索引
  const currentIndex = useMemo(() => {
    return allCategories.findIndex(cat => cat.category_id === selectedCategoryId);
  }, [allCategories, selectedCategoryId]);

  // 更新容器位置
  useEffect(() => {
    if (!isGestureActive.current) {
      containerTranslateX.value = withTiming(-currentIndex * screenWidth, { duration: 300 });
    }
  }, [currentIndex, screenWidth]);

  // 手势处理
  const handleGestureEvent = useCallback((event: any) => {
    const { translationX } = event.nativeEvent;
    const maxTranslation = screenWidth * 0.5;
    const limitedTranslation = Math.max(-maxTranslation, Math.min(maxTranslation, translationX));
    translateX.value = limitedTranslation;
  }, [screenWidth]);

  const handleHandlerStateChange = useCallback((event: any) => {
    const { state, translationX } = event.nativeEvent;
    
    if (state === State.BEGAN) {
      isGestureActive.current = true;
    } else if (state === State.END || state === State.CANCELLED) {
      isGestureActive.current = false;
      const threshold = screenWidth * 0.2;
      
      if (Math.abs(translationX) > threshold) {
        let newIndex = currentIndex;
        
        if (translationX > 0 && currentIndex > 0) {
          // 向右滑动，切换到上一个类目
          newIndex = currentIndex - 1;
        } else if (translationX < 0 && currentIndex < allCategories.length - 1) {
          // 向左滑动，切换到下一个类目
          newIndex = currentIndex + 1;
        }
        
        if (newIndex !== currentIndex && allCategories[newIndex]) {
          runOnJS(onCategoryChange)(allCategories[newIndex].category_id);
        }
      }
      
      translateX.value = withTiming(0, { duration: 300 });
    }
  }, [allCategories, currentIndex, onCategoryChange, screenWidth]);

  // 容器动画样式
  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          translateX: containerTranslateX.value + translateX.value 
        }
      ],
    };
  });

  // 获取页面数据，为推荐页面和分类页面获取真实数据
  const getPageDataSafe = useCallback((categoryId: number) => {
    // 为推荐页面(-1)和分类页面(>0)获取真实数据
    if ((categoryId === -1 || categoryId > 0) && categoryId === selectedCategoryId) {
      return getPageData(categoryId);
    }
    
    // 其他情况返回默认空数据
    return {
      categoryId,
      products: [],
      loading: false,
      hasMore: true,
      page: 1,
      initialized: false,
    };
  }, [selectedCategoryId, getPageData]);

  // 渲染所有页面
  const renderPages = useMemo(() => {
    return allCategories.map((category, index) => {
      const isActive = category.category_id === selectedCategoryId;
      const isAdjacent = Math.abs(index - currentIndex) <= 1;
      
      // 只渲染当前页面和相邻页面
      if (!isActive && !isAdjacent) {
        return (
          <View 
            key={category.category_id} 
            style={{ width: screenWidth, backgroundColor: "#f5f5f5", height: '100%' }} 
          />
        );
      }

      const pageData = getPageDataSafe(category.category_id);

      return (
        <CategoryPage
          key={category.category_id}
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
      );
    });
  }, [
    allCategories,
    selectedCategoryId,
    currentIndex,
    screenWidth,
    getPageDataSafe,
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

  return (
    <PanGestureHandler
      onGestureEvent={handleGestureEvent}
      onHandlerStateChange={handleHandlerStateChange}
      activeOffsetX={[-20, 20]}
      failOffsetY={[-10, 10]}
    >
      <Animated.View 
        style={[
          {
            flexDirection: 'row',
            width: allCategories.length * screenWidth,
            height: '100%', // 确保高度占满
          },
          containerAnimatedStyle
        ]}
      >
        {renderPages}
      </Animated.View>
    </PanGestureHandler>
  );
};