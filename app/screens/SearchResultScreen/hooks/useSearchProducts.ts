import { useState, useCallback, useRef } from "react";
import { productApi, ProductParams, type Product } from "../../../services/api/productApi";

export const useSearchProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [originalProducts, setOriginalProducts] = useState<Product[]>([]);
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
      
      console.log('发起请求:', isLoadMore ? '加载更多' : '初始加载', params);
      
      if (!isLoadMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      try {
        const res = await productApi.getSearchProducts(params);
        console.log('请求成功, 获取商品数:', res.products.length);
        
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
          setOriginalProducts(res.products);
          setCurrentPage(1);
        }
        
        setHasMore(res.products.length === params.page_size);
        return res;
      } catch (error) {
        console.error("Error searching products:", error);
        setHasMore(false);
        if (!isLoadMore) {
          setProducts([]);
          setOriginalProducts([]);
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
    if (!hasMore || loadingMore) {
      return;
    }
    
    const now = Date.now();
    if (now - lastLoadTime.current < 500) {
      return;
    }
    lastLoadTime.current = now;
    
    setLoadingMore(true);
    
    const loadMoreParams = {
      ...baseParams,
      page: currentPage + 1,
    };
    
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
        setHasMore(res.products.length === loadMoreParams.page_size);
      })
      .catch(error => {
        console.error("加载更多失败:", error);
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
    
    const refreshParams = {
      ...baseParams,
      page: 1,
    };
    
    productApi.getSearchProducts(refreshParams)
      .then(res => {
        setProducts(res.products);
        setOriginalProducts(res.products);
        setCurrentPage(1);
        setHasMore(res.products.length === refreshParams.page_size);
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
    setProducts,
    originalProducts,
    setOriginalProducts,
    loading,
    setLoading,
    hasMore,
    loadingMore,
    currentPage,
    refreshing,
    searchProducts,
    handleLoadMore,
    handleRefresh,
  };
};