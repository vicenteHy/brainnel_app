import { useState, useCallback, useRef } from "react";
import { productApi, ProductParams, type Product } from "../../../services/api/productApi";

export const useSearchProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const lastLoadTime = useRef(0);

  const searchProducts = useCallback(
    async (params: ProductParams, isLoadMore = false) => {
      if (isLoadMore && loadingMore) {
        console.log('阻止重复加载更多请求');
        return;
      }
      if (!isLoadMore && loading) {
        console.log('阻止重复初始加载请求');
        return;
      }
      
      if (!isLoadMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      try {
        // 确保空的keyword不被发送到API
        const cleanParams = { ...params };
        if (!cleanParams.keyword || cleanParams.keyword.trim() === '') {
          delete cleanParams.keyword;
        }
        
        const res = await productApi.getSearchProducts(cleanParams);
        
        if (isLoadMore) {
          setProducts(prev => {
            const newProducts = res.products.filter(
              newProduct => !prev.some(
                existingProduct => existingProduct.offer_id === newProduct.offer_id
              )
            );
            return [...prev, ...newProducts];
          });
          
          setCurrentPage(prev => prev + 1);
        } else {
          setProducts(res.products);
          setCurrentPage(1);
        }
        
        // 判断是否还有更多数据
        setHasMore(res.products.length === cleanParams.page_size);
        console.log('搜索完成:', {
          获取产品数: res.products.length,
          页面大小: cleanParams.page_size,
          还有更多: res.products.length === cleanParams.page_size,
          是否加载更多: isLoadMore
        });
        return res;
      } catch (error) {
        console.error("Error searching products:", error);
        setHasMore(false);
        if (!isLoadMore) {
          setProducts([]);
        }
        throw error;
      } finally {
        if (isLoadMore) {
          setTimeout(() => {
            setLoadingMore(false);
          }, 300);
        } else {
          setLoading(false);
        }
      }
    },
    [loading, loadingMore]
  );

  const handleLoadMore = useCallback((baseParams: Omit<ProductParams, 'page'>) => {
    // 更严格的加载更多条件检查
    if (!hasMore || loadingMore || loading) {
      console.log('阻止加载更多:', { hasMore, loadingMore, loading });
      return;
    }
    
    // 增加防抖间隔到1秒，避免频繁请求
    const now = Date.now();
    if (now - lastLoadTime.current < 1000) {
      console.log('防抖阻止，时间间隔太短');
      return;
    }
    lastLoadTime.current = now;
    
    console.log('开始加载更多产品 - 页面:', currentPage + 1);
    setLoadingMore(true);
    
    // 确保空的keyword不被发送到API
    const cleanBaseParams = { ...baseParams };
    if (!cleanBaseParams.keyword || cleanBaseParams.keyword.trim() === '') {
      delete cleanBaseParams.keyword;
    }
    
    const loadMoreParams = {
      ...cleanBaseParams,
      page: currentPage + 1,
    };
    
    console.log('加载更多参数:', loadMoreParams);
    productApi.getSearchProducts(loadMoreParams)
      .then(res => {
        setProducts(prev => {
          const newProducts = res.products.filter(
            newProduct => !prev.some(
              existingProduct => existingProduct.offer_id === newProduct.offer_id
            )
          );
          return [...prev, ...newProducts];
        });
        
        setCurrentPage(prev => prev + 1);
        // 判断是否还有更多数据：当返回的产品数量等于请求的page_size时，说明可能还有更多
        setHasMore(res.products.length === loadMoreParams.page_size);
        console.log('加载更多成功:', {
          获取产品数: res.products.length,
          还有更多: res.products.length === loadMoreParams.page_size
        });
      })
      .catch(error => {
        console.error("加载更多失败:", error);
        // 加载失败时不改变hasMore状态，允许用户重试
      })
      .finally(() => {
        setTimeout(() => {
          setLoadingMore(false);
        }, 300);
      });
  }, [hasMore, loadingMore, currentPage]);

  const handleRefresh = useCallback((baseParams: Omit<ProductParams, 'page'>) => {
    if (refreshing) return;
    
    setRefreshing(true);
    
    // 确保空的keyword不被发送到API
    const cleanBaseParams = { ...baseParams };
    if (!cleanBaseParams.keyword || cleanBaseParams.keyword.trim() === '') {
      delete cleanBaseParams.keyword;
    }
    
    const refreshParams = {
      ...cleanBaseParams,
      page: 1,
    };
    
    productApi.getSearchProducts(refreshParams)
      .then(res => {
        setProducts(res.products);
        setCurrentPage(1);
        setHasMore(res.products.length === refreshParams.page_size);
        console.log('刷新完成:', {
          获取产品数: res.products.length,
          页面大小: refreshParams.page_size,
          还有更多: res.products.length === refreshParams.page_size
        });
      })
      .catch(error => {
        console.error("刷新失败:", error);
      })
      .finally(() => {
        setTimeout(() => {
          setRefreshing(false);
        }, 300);
      });
  }, [refreshing]);

  return {
    products,
    loading,
    hasMore,
    loadingMore,
    currentPage,
    refreshing,
    searchProducts,
    handleLoadMore,
    handleRefresh,
  };
};