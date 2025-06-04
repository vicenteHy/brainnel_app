import { useState, useRef, useCallback, useEffect } from 'react';
import { productApi, Product } from '../../../services/api/productApi';
import { networkQualityDetector, LoadingStrategy } from '../../../utils/networkQuality';
import useUserStore from '../../../store/user';

interface ProductCache {
  products: Product[];
  isLoading: boolean;
  timestamp: number;
}

export const useSmartProductData = (selectedCategoryId: number = -1) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPlaceholders, setLoadingPlaceholders] = useState(0);
  
  const userStore = useUserStore();
  
  // 智能预加载相关状态
  const [loadingStrategy, setLoadingStrategy] = useState<LoadingStrategy>(() => 
    networkQualityDetector.getPerformanceAdjustedStrategy()
  );
  const [preloadCache, setPreloadCache] = useState<ProductCache>({
    products: [],
    isLoading: false,
    timestamp: 0,
  });
  
  // 请求管理
  const activeRequests = useRef(new Set<string>());
  const requestQueue = useRef<Array<() => void>>([]);
  const preloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTime = useRef(0);
  
  // 产品去重管理
  const seenProductIds = useRef(new Set<string>());
  const productUniqueId = useRef(0);

  // 监听网络质量变化，动态调整加载策略
  useEffect(() => {
    const unsubscribe = networkQualityDetector.onQualityChange((quality) => {
      const newStrategy = networkQualityDetector.getPerformanceAdjustedStrategy();
      setLoadingStrategy(newStrategy);
      
      console.log('[SmartProductData] 网络质量变化，更新加载策略:', {
        networkType: quality.type,
        strategy: newStrategy,
      });
    });

    return unsubscribe;
  }, []);

  // 处理产品数据去重和唯一ID
  const processProductData = useCallback((newProducts: Product[]) => {
    const uniqueProducts: Product[] = [];

    newProducts.forEach((product) => {
      const productKey = `${product.offer_id}-${product.min_price}`;
      
      if (selectedCategoryId === -1) {
        // 推荐页面：允许重复产品以确保无限滚动
        const processedProduct = {
          ...product,
          _uniqueId: ++productUniqueId.current,
          _isFromCache: false,
        };
        uniqueProducts.push(processedProduct);
      } else if (!seenProductIds.current.has(productKey)) {
        // 其他页面：严格去重
        seenProductIds.current.add(productKey);
        const processedProduct = {
          ...product,
          _uniqueId: ++productUniqueId.current,
          _isFromCache: false,
        };
        uniqueProducts.push(processedProduct);
      }
    });

    return uniqueProducts;
  }, [selectedCategoryId]);

  // 执行API请求（带并发控制）
  const executeRequest = useCallback(async (
    requestId: string,
    apiCall: () => Promise<Product[]>
  ): Promise<Product[]> => {
    // 检查并发限制
    if (activeRequests.current.size >= loadingStrategy.maxConcurrentRequests) {
      console.log('[SmartProductData] 达到并发限制，请求排队:', requestId);
      return new Promise((resolve) => {
        requestQueue.current.push(async () => {
          const result = await executeRequest(requestId, apiCall);
          resolve(result);
        });
      });
    }

    activeRequests.current.add(requestId);
    
    try {
      console.log('[SmartProductData] 执行请求:', requestId);
      const result = await apiCall();
      console.log('[SmartProductData] 请求完成:', requestId, `获取${result.length}个产品`);
      return result;
    } catch (error) {
      console.error('[SmartProductData] 请求失败:', requestId, error);
      throw error;
    } finally {
      activeRequests.current.delete(requestId);
      
      // 执行队列中的下一个请求
      if (requestQueue.current.length > 0) {
        const nextRequest = requestQueue.current.shift();
        if (nextRequest) {
          setTimeout(nextRequest, 100); // 短暂延迟避免请求过于密集
        }
      }
    }
  }, [loadingStrategy.maxConcurrentRequests]);

  // 获取推荐产品
  const fetchRecommendations = useCallback(async (count: number): Promise<Product[]> => {
    return executeRequest(`recommendations-${count}`, () =>
      productApi.getPersonalRecommendations({
        count,
        ...(userStore.user?.user_id ? { user_id: userStore.user.user_id } : {}),
      })
    );
  }, [userStore.user?.user_id, executeRequest]);

  // 预加载下一批产品
  const preloadNextBatch = useCallback(async () => {
    if (selectedCategoryId !== -1) return; // 只为推荐页面预加载
    if (preloadCache.isLoading) return; // 避免重复预加载
    
    setPreloadCache(prev => ({ ...prev, isLoading: true }));
    
    try {
      console.log('[SmartProductData] 开始预加载:', loadingStrategy.preloadCount);
      const newProducts = await fetchRecommendations(loadingStrategy.preloadCount);
      const processedProducts = processProductData(newProducts);
      
      setPreloadCache({
        products: processedProducts,
        isLoading: false,
        timestamp: Date.now(),
      });
      
      console.log('[SmartProductData] 预加载完成:', processedProducts.length);
    } catch (error) {
      console.error('[SmartProductData] 预加载失败:', error);
      setPreloadCache(prev => ({ ...prev, isLoading: false }));
    }
  }, [selectedCategoryId, loadingStrategy.preloadCount, fetchRecommendations, processProductData]);

  // 智能触发预加载
  const checkAndTriggerPreload = useCallback((currentProductsLength: number, visibleIndex: number) => {
    if (selectedCategoryId !== -1) return;
    if (preloadCache.isLoading || !hasMore) return;
    
    const remainingPercentage = ((currentProductsLength - visibleIndex) / currentProductsLength) * 100;
    
    if (remainingPercentage <= loadingStrategy.triggerThreshold) {
      console.log('[SmartProductData] 触发预加载:', {
        remainingPercentage,
        threshold: loadingStrategy.triggerThreshold,
        currentLength: currentProductsLength,
        visibleIndex,
      });
      
      // 延迟执行预加载，避免滚动过程中频繁触发
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
      
      preloadTimeoutRef.current = setTimeout(() => {
        preloadNextBatch();
      }, 200);
    }
  }, [selectedCategoryId, preloadCache.isLoading, hasMore, loadingStrategy.triggerThreshold, preloadNextBatch]);

  // 获取初始产品数据
  const fetchInitialProducts = useCallback(async () => {
    if (selectedCategoryId !== -1) return; // 只处理推荐页面
    
    setLoading(true);
    setProducts([]);
    seenProductIds.current.clear();
    productUniqueId.current = 0;
    
    try {
      console.log('[SmartProductData] 获取初始产品:', loadingStrategy.initialCount);
      const newProducts = await fetchRecommendations(loadingStrategy.initialCount);
      const processedProducts = processProductData(newProducts);
      
      setProducts(processedProducts);
      setHasMore(processedProducts.length > 0);
      
      // 立即开始预加载下一批
      setTimeout(() => {
        preloadNextBatch();
      }, 500);
      
    } catch (error) {
      console.error('[SmartProductData] 获取初始产品失败:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId, loadingStrategy.initialCount, fetchRecommendations, processProductData, preloadNextBatch]);

  // 加载更多产品（智能版）
  const handleLoadMore = useCallback(() => {
    if (selectedCategoryId !== -1) return;
    if (loadingMore || !hasMore) return;
    
    // 防抖处理
    const now = Date.now();
    if (now - lastScrollTime.current < 300) return;
    lastScrollTime.current = now;
    
    setLoadingMore(true);
    setLoadingPlaceholders(loadingStrategy.preloadCount);
    
    // 优先使用预加载的产品
    if (preloadCache.products.length > 0 && !preloadCache.isLoading) {
      console.log('[SmartProductData] 使用预加载缓存:', preloadCache.products.length);
      
      const cachedProducts = preloadCache.products.map(p => ({ ...p, _isFromCache: true }));
      
      setProducts(prev => [...prev, ...cachedProducts]);
      setPreloadCache({ products: [], isLoading: false, timestamp: 0 });
      setLoadingMore(false);
      setLoadingPlaceholders(0);
      
      // 立即开始下一轮预加载
      setTimeout(() => {
        preloadNextBatch();
      }, 100);
      
      return;
    }
    
    // 如果没有缓存，直接请求
    fetchRecommendations(loadingStrategy.preloadCount)
      .then(newProducts => {
        const processedProducts = processProductData(newProducts);
        setProducts(prev => [...prev, ...processedProducts]);
        setHasMore(processedProducts.length > 0);
        
        // 开始下一轮预加载
        setTimeout(() => {
          preloadNextBatch();
        }, 200);
      })
      .catch(error => {
        console.error('[SmartProductData] 加载更多失败:', error);
        setHasMore(false);
      })
      .finally(() => {
        setLoadingMore(false);
        setLoadingPlaceholders(0);
      });
  }, [
    selectedCategoryId,
    loadingMore,
    hasMore,
    loadingStrategy.preloadCount,
    preloadCache,
    fetchRecommendations,
    processProductData,
    preloadNextBatch,
  ]);

  // 刷新产品列表
  const handleRefresh = useCallback(async () => {
    if (selectedCategoryId !== -1) return;
    
    setRefreshing(true);
    
    // 清除预加载缓存
    setPreloadCache({ products: [], isLoading: false, timestamp: 0 });
    
    try {
      await fetchInitialProducts();
    } catch (error) {
      console.error('[SmartProductData] 刷新失败:', error);
    } finally {
      setRefreshing(false);
    }
  }, [selectedCategoryId, fetchInitialProducts]);

  // 组件挂载时初始化
  useEffect(() => {
    if (selectedCategoryId === -1) {
      fetchInitialProducts();
    }
  }, [selectedCategoryId]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, []);

  // 调试信息
  useEffect(() => {
    console.log('[SmartProductData] 状态更新:', {
      productsCount: products.length,
      loading,
      loadingMore,
      hasMore,
      preloadCacheCount: preloadCache.products.length,
      preloadCacheLoading: preloadCache.isLoading,
      strategy: loadingStrategy,
    });
  }, [products.length, loading, loadingMore, hasMore, preloadCache, loadingStrategy]);

  return {
    products,
    loading,
    loadingMore,
    hasMore,
    refreshing,
    loadingPlaceholders,
    loadingStrategy,
    preloadCache,
    handleLoadMore,
    handleRefresh,
    checkAndTriggerPreload, // 新增：用于在滚动时触发预加载检查
  };
};