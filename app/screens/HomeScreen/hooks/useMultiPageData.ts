import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { productApi, ProductParams, Product } from '../../../services/api/productApi';
import { getCurrentLanguage } from '../../../i18n';
import useUserStore from '../../../store/user';
import { preloadService } from '../../../services/preloadService';

interface PageData {
  categoryId: number;
  products: Product[];
  loading: boolean;
  hasMore: boolean;
  page: number;
  initialized: boolean;
}

export const useMultiPageData = (categories: any[]) => {
  const userStore = useUserStore();
  const [pageDataMap, setPageDataMap] = useState<Map<number, PageData>>(new Map());
  const pageDataMapRef = useRef<Map<number, PageData>>(new Map());
  const seenProductIds = useRef(new Map<number, Set<string>>());
  const productUniqueId = useRef(0);
  const loadingRequests = useRef(new Set<number>()); // 跟踪正在加载的categoryId
  
  // 保持ref和state同步
  useEffect(() => {
    pageDataMapRef.current = pageDataMap;
  }, [pageDataMap]);

  // 获取所有类目（推荐 + 其他类目）
  const allCategories = useMemo(() => [{ category_id: -1, name: "推荐" }, ...categories], [categories]);

  // 初始化页面数据
  const initializePageData = useCallback((categoryId: number): PageData => {
    // console.log(`[useMultiPageData] 初始化页面数据 - categoryId: ${categoryId}`, {
    //   loading: false,
    //   hasMore: true,
    //   page: 1,
    //   initialized: false
    // });
    return {
      categoryId,
      products: [],
      loading: false,
      hasMore: true,
      page: 1,
      initialized: false,
    };
  }, []);

  // 处理产品数据去重
  const processProductData = useCallback((categoryId: number, newProducts: Product[]) => {
    if (!seenProductIds.current.has(categoryId)) {
      seenProductIds.current.set(categoryId, new Set());
    }
    
    const seenIds = seenProductIds.current.get(categoryId)!;
    const uniqueProducts: Product[] = [];

    newProducts.forEach((product) => {
      const productKey = `${product.offer_id}-${product.min_price}`;
      
      if (categoryId === -1) {
        // 推荐页面：完全不去重，每次都返回所有产品以确保无限加载
        const processedProduct = {
          ...product,
          _uniqueId: ++productUniqueId.current,
        };
        uniqueProducts.push(processedProduct);
        // 不添加到seenIds，允许重复
      } else if (categoryId > 0) {
        // 品类页面：完全不去重，因为使用随机接口（一级类目）
        const processedProduct = {
          ...product,
          _uniqueId: ++productUniqueId.current,
        };
        uniqueProducts.push(processedProduct);
        // 不添加到seenIds，允许重复
      } else {
        // 其他页面（如搜索）：严格去重
        if (!seenIds.has(productKey)) {
          seenIds.add(productKey);
          const processedProduct = {
            ...product,
            _uniqueId: ++productUniqueId.current,
          };
          uniqueProducts.push(processedProduct);
        }
      }
    });

    return uniqueProducts;
  }, []);

  // 加载页面数据
  const loadPageData = useCallback(async (categoryId: number, isRefresh = false, isLoadMore = false) => {
    // console.log(`[useMultiPageData] loadPageData被调用 - categoryId: ${categoryId}, isRefresh: ${isRefresh}, isLoadMore: ${isLoadMore}`);
    
    // 跳过无效的categoryId
    if (categoryId === 0) {
      // console.log(`[useMultiPageData] 跳过无效页面 - categoryId: ${categoryId}`);
      return;
    }
    
    // 检查是否已有请求在进行中
    if (loadingRequests.current.has(categoryId)) {
      // console.log(`[useMultiPageData] 请求已在进行中，跳过 - categoryId: ${categoryId}`);
      return;
    }
    
    // 从ref获取最新状态
    const currentData = pageDataMapRef.current.get(categoryId) || initializePageData(categoryId);
    
    // 如果不是刷新操作也不是加载更多，且页面已有数据，则跳过首次加载
    if (!isRefresh && !isLoadMore && currentData.initialized && currentData.products.length > 0) {
      // console.log(`[useMultiPageData] 页面已有数据，跳过首次加载 - categoryId: ${categoryId}`, {
      //   productsLength: currentData.products.length,
      //   initialized: currentData.initialized
      // });
      return;
    }
    
    // console.log(`[useMultiPageData] loadPageData开始 - categoryId: ${categoryId}, isRefresh: ${isRefresh}`, {
    //   currentLoading: currentData.loading,
    //   currentProductsCount: currentData.products.length,
    //   currentPage: currentData.page,
    //   currentHasMore: currentData.hasMore
    // });
    
    // 移除loading状态检查，改为依赖loadingRequests.current防重复
    // 这样可以避免loading状态卡住的问题
    
    // 标记请求开始
    loadingRequests.current.add(categoryId);
    
    // 设置loading状态
    setPageDataMap(prev => {
      const newMap = new Map(prev);
      newMap.set(categoryId, {
        ...currentData,
        loading: true,
      });
      return newMap;
    });
    
    // console.log(`[useMultiPageData] 设置loading=true - categoryId: ${categoryId}`);

    try {
      let apiResponse: Product[] = [];
      
      if (categoryId === -1) {
        // 推荐页面 - 优先使用预加载数据，然后调用API获取更多产品
        // console.log(`[useMultiPageData] 调用推荐API - categoryId: ${categoryId}`);
        
        // 如果是刷新操作，直接调用API获取新数据
        if (isRefresh) {
          apiResponse = await productApi.getPersonalRecommendations({
            count: 20,
            ...(userStore.user?.user_id ? { user_id: userStore.user.user_id } : {}),
          });
        } else if (!isLoadMore && currentData.products.length === 0) {
          // 如果是第一次加载且没有现有产品，尝试使用预加载数据
          const currentUserId = userStore.user?.user_id?.toString();
          const preloadedProducts = await preloadService.getPreloadedRecommendations(currentUserId);
          
          if (preloadedProducts.length > 0) {
            apiResponse = preloadedProducts;
          } else {
            // 如果没有预加载数据，调用API
            apiResponse = await productApi.getPersonalRecommendations({
              count: 20,
              ...(userStore.user?.user_id ? { user_id: userStore.user.user_id } : {}),
            });
          }
        } else {
          // 加载更多时直接调用API
          apiResponse = await productApi.getPersonalRecommendations({
            count: 20,
            ...(userStore.user?.user_id ? { user_id: userStore.user.user_id } : {}),
          });
        }
        
        // console.log(`[useMultiPageData] 推荐API响应 - categoryId: ${categoryId}`, {
        //   responseLength: apiResponse.length
        // });
      } else if (categoryId > 0) {
        // 分类页面 - 调用分类随机产品API
        // 注意：分类页面使用随机API，每次调用都会返回不同的产品，所以不需要特殊处理刷新
        // console.log(`[useMultiPageData] 调用分类API - categoryId: ${categoryId}`, {
        //   count: 20,
        //   user_id: userStore.user?.user_id,
        //   isRefresh: isRefresh
        // });
        
        apiResponse = await productApi.getCategoryRandomProducts({
          category_id: categoryId,
          count: 20,
          ...(userStore.user?.user_id ? { user_id: userStore.user.user_id } : {}),
        });
        
        // console.log(`[useMultiPageData] 分类API响应 - categoryId: ${categoryId}`, {
        //   responseLength: apiResponse.length,
        //   isRefresh: isRefresh
        // });
      } else {
        // console.log(`[useMultiPageData] 未支持的categoryId: ${categoryId}`);
        return;
      }
      
      const processedProducts = processProductData(categoryId, apiResponse);
      
      // console.log(`[useMultiPageData] 处理后的产品 - categoryId: ${categoryId}`, {
      //   processedLength: processedProducts.length,
      //   currentProductsLength: currentData.products.length
      // });
      
      // 从ref获取最新的状态数据
      const freshData = pageDataMapRef.current.get(categoryId) || currentData;
      // console.log(`[useMultiPageData] 重新获取最新数据 - categoryId: ${categoryId}`, {
      //   currentDataProductsLength: currentData.products.length,
      //   freshDataProductsLength: freshData.products.length,
      //   isRefresh: isRefresh
      // });
      
      const newProducts = isRefresh ? processedProducts : [...freshData.products, ...processedProducts];
      
      // console.log(`[useMultiPageData] 更新页面数据 - categoryId: ${categoryId}`, {
      //   currentProductsLength: currentData.products.length,
      //   freshDataProductsLength: freshData.products.length,
      //   newProductsLength: newProducts.length,
      //   processedProductsLength: processedProducts.length,
      //   hasMore: processedProducts.length > 0,
      //   newPage: freshData.page + 1
      // });
      
      const newPageData = {
        categoryId,
        products: newProducts,
        loading: false,
        initialized: true,
        hasMore: processedProducts.length > 0, // 只要API返回了产品就继续允许加载更多
        page: freshData.page + 1, // 记录调用次数
      };
      
      // console.log(`[useMultiPageData] 新页面数据详细信息 - categoryId: ${categoryId}`, {
      //   newPageDataProductsLength: newPageData.products.length,
      //   newPageDataInitialized: newPageData.initialized,
      //   newPageDataLoading: newPageData.loading
      // });
      
      // console.log(`[useMultiPageData] 设置loading=false - categoryId: ${categoryId}`);
      setPageDataMap(prev => {
        const newMap = new Map(prev);
        newMap.set(categoryId, newPageData);
        // console.log(`[useMultiPageData] Map更新后检查 - categoryId: ${categoryId}`, {
        //   mapHasCategory: newMap.has(categoryId),
        //   mapDataProductsLength: newMap.get(categoryId)?.products.length,
        //   mapDataLoading: newMap.get(categoryId)?.loading,
        //   mapDataInitialized: newMap.get(categoryId)?.initialized
        // });
        return newMap;
      });
    } catch (error) {
      // console.error(`加载数据失败 - categoryId: ${categoryId}:`, error);
      // 获取最新状态进行错误处理
      const latestData = pageDataMapRef.current.get(categoryId) || currentData;
      setPageDataMap(prev => {
        const newMap = new Map(prev);
        newMap.set(categoryId, {
          ...latestData,
          loading: false,
          initialized: true, // 即使失败也标记为已初始化，避免重复尝试
        });
        // console.log(`[useMultiPageData] 错误处理完成 - categoryId: ${categoryId}`, {
        //   errorHandled: true,
        //   finalLoading: false,
        //   finalInitialized: true
        // });
        return newMap;
      });
    } finally {
      // 无论成功还是失败，都要清除请求标记
      loadingRequests.current.delete(categoryId);
      // console.log(`[useMultiPageData] 清除请求标记 - categoryId: ${categoryId}`);
    }
  }, [initializePageData, processProductData, userStore.user?.user_id]);

  // 预加载相邻页面 - 只预加载推荐页面
  const preloadAdjacentPages = useCallback((currentCategoryId: number) => {
    // 只为推荐页面预加载相邻页面
    if (currentCategoryId !== -1) {
      return;
    }
    
    const currentIndex = allCategories.findIndex(cat => cat.category_id === currentCategoryId);
    
    // 预加载前一个和后一个页面，但只限推荐页面
    const preloadCategories = [];
    if (currentIndex > 0) {
      const prevCategoryId = allCategories[currentIndex - 1].category_id;
      if (prevCategoryId === -1) { // 只预加载推荐页面
        preloadCategories.push(prevCategoryId);
      }
    }
    if (currentIndex < allCategories.length - 1) {
      const nextCategoryId = allCategories[currentIndex + 1].category_id;
      if (nextCategoryId === -1) { // 只预加载推荐页面
        preloadCategories.push(nextCategoryId);
      }
    }

    preloadCategories.forEach(categoryId => {
      const pageData = pageDataMapRef.current.get(categoryId);
      if (!pageData || !pageData.initialized) {
        loadPageData(categoryId);
      }
    });
  }, [allCategories, loadPageData]);

  // 缓存空数据对象，避免每次创建新对象
  const emptyDataCache = useRef(new Map<number, PageData>());
  
  // 获取页面数据 - 确保获取最新数据
  const getPageData = useCallback((categoryId: number): PageData => {
    // 从state获取数据，这样可以确保组件重新渲染
    const pageData = pageDataMap.get(categoryId);
    if (pageData) {
      return pageData;
    }
    
    // 如果state中没有数据，检查ref中是否有最新数据
    const refPageData = pageDataMapRef.current.get(categoryId);
    if (refPageData) {
      // console.log(`[useMultiPageData] getPageData - state滞后，从ref获取数据 - categoryId: ${categoryId}`, {
      //   hasData: true,
      //   productsLength: refPageData.products.length,
      //   initialized: refPageData.initialized,
      //   loading: refPageData.loading,
      //   refMapSize: pageDataMapRef.current.size,
      //   stateMapSize: pageDataMap.size
      // });
      
      // 强制更新state来触发重新渲染
      setPageDataMap(prev => new Map(prev.set(categoryId, refPageData)));
      
      return refPageData;
    }
    
    // 如果没有数据，返回缓存的空数据对象，避免每次创建新对象
    if (!emptyDataCache.current.has(categoryId)) {
      emptyDataCache.current.set(categoryId, {
        categoryId,
        products: [],
        loading: false,
        hasMore: true,
        page: 1,
        initialized: false,
      });
    }
    
    const emptyData = emptyDataCache.current.get(categoryId)!;
    
    // 移除频繁的空数据日志，减少日志噪音
    // console.log(`[useMultiPageData] getPageData called for empty data - categoryId: ${categoryId}`, {
    //   hasData: false,
    //   productsLength: 0,
    //   initialized: false,
    //   loading: false,
    //   refMapSize: pageDataMapRef.current.size,
    //   stateMapSize: pageDataMap.size,
    //   timestamp: new Date().toISOString()
    // });
    
    return emptyData;
  }, [pageDataMap]);

  // 刷新页面数据
  const refreshPageData = useCallback((categoryId: number) => {
    // 清除该页面的去重记录
    seenProductIds.current.set(categoryId, new Set());
    // 重置页面数据，确保从第一页开始
    const resetPageData = {
      ...initializePageData(categoryId),
      loading: true, // 立即设置loading状态，避免UI闪烁
    };
    setPageDataMap(prev => {
      const newMap = new Map(prev);
      newMap.set(categoryId, resetPageData);
      return newMap;
    });
    // 同步更新ref，确保loadPageData能获取到最新状态
    pageDataMapRef.current.set(categoryId, resetPageData);
    // 使用setTimeout确保状态更新完成后再调用loadPageData
    setTimeout(() => {
      loadPageData(categoryId, true);
    }, 0);
  }, [loadPageData, initializePageData]);

  // 加载更多数据
  const loadMoreData = useCallback((categoryId: number) => {
    // 从ref获取最新状态
    const pageData = pageDataMapRef.current.get(categoryId) || initializePageData(categoryId);
    // console.log(`[useMultiPageData] loadMoreData called for category ${categoryId}:`, {
    //   hasMore: pageData.hasMore,
    //   loading: pageData.loading,
    //   productsCount: pageData.products.length,
    //   page: pageData.page
    // });
    
    if (pageData.hasMore && !pageData.loading) {
      // console.log(`[useMultiPageData] 执行loadPageData (加载更多) - categoryId: ${categoryId}`);
      loadPageData(categoryId, false, true); // isRefresh=false, isLoadMore=true
    } else {
      // console.log(`[useMultiPageData] loadMoreData被阻止 - categoryId: ${categoryId}`, {
      //   hasMore: pageData.hasMore,
      //   loading: pageData.loading
      // });
    }
  }, [loadPageData, initializePageData]);

  // 清理不需要的页面数据（内存优化）
  const cleanupPageData = useCallback((currentCategoryId: number) => {
    const currentIndex = allCategories.findIndex(cat => cat.category_id === currentCategoryId);
    if (currentIndex === -1) return; // 如果找不到当前类目，不执行清理
    
    const keepCategories = new Set();
    
    // 保留当前页面和相邻页面
    if (currentIndex > 0) keepCategories.add(allCategories[currentIndex - 1].category_id);
    keepCategories.add(currentCategoryId);
    if (currentIndex < allCategories.length - 1) keepCategories.add(allCategories[currentIndex + 1].category_id);
    
    // 特别保护：推荐页面(-1)始终保留
    keepCategories.add(-1);

    setPageDataMap(prev => {
      const newMap = new Map();
      prev.forEach((data, categoryId) => {
        if (keepCategories.has(categoryId)) {
          newMap.set(categoryId, data);
        }
      });
      return newMap;
    });

    // 清理去重记录（除了保留的类目）
    Array.from(seenProductIds.current.keys()).forEach(categoryId => {
      if (!keepCategories.has(categoryId)) {
        seenProductIds.current.delete(categoryId);
      }
    });
  }, [allCategories]);

  return useMemo(() => ({
    getPageData,
    loadPageData,
    refreshPageData,
    loadMoreData,
    preloadAdjacentPages,
    cleanupPageData,
    allCategories,
  }), [getPageData, loadPageData, refreshPageData, loadMoreData, preloadAdjacentPages, cleanupPageData, allCategories]);
};