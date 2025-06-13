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
  const gestureStartX = useSharedValue(0); // 记录手势开始时的容器位置

  // 计算当前页面索引
  const currentIndex = useMemo(() => {
    const index = allCategories.findIndex(cat => cat.category_id === selectedCategoryId);
    // 如果找不到当前选中的分类，可能是用户点击了弹窗中的分类
    // 这种情况下返回一个特殊值来标识
    return index !== -1 ? index : -999;
  }, [allCategories, selectedCategoryId]);

  // 更新容器位置
  useEffect(() => {
    if (!isGestureActive.current && currentIndex !== -999) {
      const targetX = -currentIndex * screenWidth;
      containerTranslateX.value = withTiming(targetX, { 
        duration: 300,
      });
      // 同步更新手势起始位置
      gestureStartX.value = targetX;
    }
  }, [currentIndex, screenWidth]);

  // 手势处理
  const handleGestureEvent = useCallback((event: any) => {
    const { translationX } = event.nativeEvent;
    // 基于手势开始位置计算新位置，无回弹
    containerTranslateX.value = gestureStartX.value + translationX;
  }, []);

  const handleHandlerStateChange = useCallback((event: any) => {
    const { state, translationX, velocityX } = event.nativeEvent;
    
    if (state === State.BEGAN) {
      isGestureActive.current = true;
      // 记录手势开始时的容器位置
      gestureStartX.value = containerTranslateX.value;
    } else if (state === State.END || state === State.CANCELLED) {
      isGestureActive.current = false;
      
      // 更敏感的滑动检测
      const swipeThreshold = screenWidth * 0.15; // 只需滑动10%屏幕宽度
      const velocityThreshold = 200; // 降低速度阈值，更容易触发
      
      let targetIndex = currentIndex;
      
      // 优先基于滑动距离和速度判断
      if (Math.abs(translationX) > swipeThreshold || Math.abs(velocityX) > velocityThreshold) {
        if (translationX > 0 && currentIndex > 0) {
          // 向右滑动，切换到上一个类目
          targetIndex = currentIndex - 1;
        } else if (translationX < 0 && currentIndex < allCategories.length - 1) {
          // 向左滑动，切换到下一个类目
          targetIndex = currentIndex + 1;
        }
      } else {
        // 如果滑动距离和速度都不够，基于当前位置决定
        const currentX = containerTranslateX.value;
        targetIndex = Math.round(-currentX / screenWidth);
        targetIndex = Math.max(0, Math.min(targetIndex, allCategories.length - 1));
      }
      
      // 触发页面切换或对齐
      if (targetIndex !== currentIndex && allCategories[targetIndex]) {
        runOnJS(onCategoryChange)(allCategories[targetIndex].category_id);
      } else {
        // 对齐到当前页面
        const targetX = -targetIndex * screenWidth;
        containerTranslateX.value = withTiming(targetX, { duration: 250 });
        gestureStartX.value = targetX;
      }
    }
  }, [allCategories, currentIndex, onCategoryChange, screenWidth]);

  // 容器动画样式
  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          translateX: containerTranslateX.value
        }
      ],
    };
  });

  // 获取页面数据，为推荐页面和分类页面获取真实数据
  const getPageDataSafe = useCallback((categoryId: number) => {
    // 为推荐页面(-1)和分类页面(>0)获取真实数据
    // 移除selectedCategoryId条件，允许所有有效页面获取数据
    if (categoryId === -1 || categoryId > 0) {
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
  }, [getPageData]);

  // 渲染所有页面
  const renderPages = useMemo(() => {
    // 如果当前选中的分类不在allCategories中，为其创建一个特殊页面
    if (currentIndex === -999) {
      const pageData = getPageDataSafe(selectedCategoryId);
      
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
    }

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

      // 只有当前激活页面才立即获取数据，相邻页面延迟获取
      const pageData = isActive ? getPageDataSafe(category.category_id) : {
        categoryId: category.category_id,
        products: [],
        loading: false,
        hasMore: true,
        page: 1,
        initialized: false,
      };

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
      activeOffsetX={[-5, 5]}
      failOffsetY={[-40, 40]}
      simultaneousHandlers={undefined}
      minPointers={1}
      maxPointers={1}
      enabled={currentIndex !== -999} // 禁用手势当显示特殊页面时
    >
      <Animated.View 
        style={[
          {
            flexDirection: 'row',
            width: currentIndex === -999 ? screenWidth : allCategories.length * screenWidth,
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