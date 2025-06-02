import { useState, useRef, useCallback, useEffect } from 'react';
import { productApi, ProductParams, Product } from '../../../services/api/productApi';
import { getCurrentLanguage } from '../../../i18n';
import { eventBus } from '../../../utils/eventBus';
import useUserStore from '../../../store/user';

export const useProductData = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingPlaceholders, setLoadingPlaceholders] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [hotTerms, setHotTerms] = useState<string[]>([]);
  const [currencyVersion, setCurrencyVersion] = useState(0);

  const userStore = useUserStore();
  
  // 添加用于去重的Set和唯一ID生成器
  const seenProductIds = useRef(new Set<string>());
  const productUniqueId = useRef(0);
  
  // 添加防抖相关的ref
  const loadMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastLoadMoreTime = useRef(0);
  
  // 添加请求状态管理
  const isRequestInProgress = useRef(false);
  const requestQueue = useRef<Array<() => void>>([]);

  const [params, setParams] = useState<ProductParams>({
    keyword: "pen",
    sort_order: "desc",
    sort_by: "default",
    language: getCurrentLanguage(),
    page: 1,
    page_size: 10,
    ...(userStore.user?.user_id ? { user_id: userStore.user.user_id } : {}),
  });

  // 请求队列管理器
  const executeNextRequest = useCallback(() => {
    if (requestQueue.current.length > 0 && !isRequestInProgress.current) {
      const nextRequest = requestQueue.current.shift();
      if (nextRequest) {
        nextRequest();
      }
    }
  }, []);

  // 添加请求到队列
  const addToRequestQueue = useCallback(
    (request: () => void) => {
      requestQueue.current.push(request);
      executeNextRequest();
    },
    [executeNextRequest],
  );

  // 优化的产品数据处理函数
  const processProductData = useCallback((newProducts: Product[]) => {
    const uniqueProducts: Product[] = [];

    newProducts.forEach((product) => {
      const productKey = `${product.offer_id}-${product.min_price}`;
      if (!seenProductIds.current.has(productKey)) {
        seenProductIds.current.add(productKey);
        const processedProduct = {
          ...product,
          _uniqueId: ++productUniqueId.current,
        };
        uniqueProducts.push(processedProduct);
      }
    });

    return uniqueProducts;
  }, []);

  // 重置产品数据状态
  const resetProductState = useCallback(() => {
    setProducts([]);
    setCurrentPage(1);
    setHasMore(true);
    seenProductIds.current.clear();
    productUniqueId.current = 0;
  }, []);

  // 获取随机关键词
  const getRandomKeyword = useCallback(() => {
    if (hotTerms.length === 0) return "pen";
    const randomIndex = Math.floor(Math.random() * hotTerms.length);
    const keyword = hotTerms[randomIndex];
    console.log("获取随机关键词:", keyword);
    return keyword;
  }, [hotTerms]);

  // 获取初始产品数据
  const fetchInitialProducts = useCallback(
    async (keyword: string) => {
      setLoading(true);
      resetProductState();
      try {
        const initialParams = {
          ...params,
          keyword,
          page: 1,
          page_size: 10,
        };
        
        const firstPageRes = await productApi.getSearchProducts(initialParams);
        const processedFirstPage = processProductData(firstPageRes.products);

        setProducts(processedFirstPage);
        setTotalItems(firstPageRes.total || 0);
        
        if (hotTerms.length > 0) {
          const usedKeywords = new Set([keyword]);
          
          const getUniqueKeyword = () => {
            if (hotTerms.length <= usedKeywords.size || hotTerms.length <= 1) {
              return hotTerms[Math.floor(Math.random() * hotTerms.length)];
            }
            
            let attempts = 0;
            while (attempts < 10) {
              const randomIndex = Math.floor(Math.random() * hotTerms.length);
              const candidateKeyword = hotTerms[randomIndex];
              if (!usedKeywords.has(candidateKeyword)) {
                usedKeywords.add(candidateKeyword);
                return candidateKeyword;
              }
              attempts++;
            }
            return hotTerms[Math.floor(Math.random() * hotTerms.length)];
          };

          const remainingRequests = Array.from(
            { length: 3 },
            async (_, index) => {
              const pageKeyword = getUniqueKeyword();
              const pageParams = {
                ...params,
                keyword: pageKeyword,
                page: index + 2,
                page_size: 10,
              };
              return productApi.getSearchProducts(pageParams);
            },
          );

          const additionalResults = await Promise.all(remainingRequests);
          const additionalProducts = additionalResults.flatMap(
            (result) => result.products,
          );
          const processedAdditionalProducts = processProductData(additionalProducts);

          setProducts((prev) => [...prev, ...processedAdditionalProducts]);
          setCurrentPage(4);
          setHasMore(
            processedFirstPage.length + processedAdditionalProducts.length <
              (firstPageRes.total || 0),
          );
        } else {
          setCurrentPage(1);
          setHasMore(processedFirstPage.length < (firstPageRes.total || 0));
        }
      } catch (error) {
        console.error("获取产品数据失败:", error);
      } finally {
        setLoading(false);
      }
    },
    [params, hotTerms, processProductData, resetProductState],
  );

  // 加载更多产品
  const handleLoadMore = useCallback(() => {
    const now = Date.now();

    if (now - lastLoadMoreTime.current < 1000) {
      return;
    }

    if (
      !hasMore ||
      loadingMore ||
      hotTerms.length === 0 ||
      isRequestInProgress.current
    )
      return;
    
    lastLoadMoreTime.current = now;

    if (loadMoreTimeoutRef.current) {
      clearTimeout(loadMoreTimeoutRef.current);
    }

    loadMoreTimeoutRef.current = setTimeout(() => {
      const loadMoreRequest = () => {
        isRequestInProgress.current = true;
        setLoadingMore(true);
        setLoadingPlaceholders(10);
        
        const newKeyword = getRandomKeyword();
        const loadMoreParams = {
          ...params,
          keyword: newKeyword,
          page: currentPage + 1,
          page_size: 10,
        };

        productApi
          .getSearchProducts(loadMoreParams)
          .then((res) => {
            const processedNewProducts = processProductData(res.products);

            setProducts((prev) => {
              const newTotal = prev.length + processedNewProducts.length;
              setHasMore(newTotal < (res.total || 0));
              return [...prev, ...processedNewProducts];
            });

            setCurrentPage((prev) => prev + 1);
          })
          .catch((error) => {
            console.error("加载更多失败:", error);
          })
          .finally(() => {
            setLoadingMore(false);
            setLoadingPlaceholders(0);
            isRequestInProgress.current = false;
            executeNextRequest();
          });
      };

      addToRequestQueue(loadMoreRequest);
    }, 300);
  }, [
    hasMore,
    loadingMore,
    hotTerms,
    getRandomKeyword,
    params,
    currentPage,
    processProductData,
    addToRequestQueue,
    executeNextRequest,
  ]);

  // 刷新产品列表
  const handleRefresh = useCallback(async () => {
    if (hotTerms.length === 0) return;
    setRefreshing(true);
    try {
      const refreshKeyword = getRandomKeyword();
      console.log("刷新，使用关键词:", refreshKeyword);
      await fetchInitialProducts(refreshKeyword);
    } catch (error) {
      console.error("刷新失败:", error);
    } finally {
      setRefreshing(false);
    }
  }, [hotTerms, getRandomKeyword, fetchInitialProducts]);

  // 初始化应用数据
  useEffect(() => {
    const initApp = async () => {
      try {
        const response = await productApi.getHotTerms();
        const terms = response.terms || [];
        setHotTerms(terms);
        
        if (terms.length > 0) {
          const randomIndex = Math.floor(Math.random() * terms.length);
          const randomKeyword = terms[randomIndex];
          
          setParams((prev) => ({
            ...prev,
            keyword: randomKeyword,
          }));
          
          await fetchInitialProducts(randomKeyword);
        } else {
          await fetchInitialProducts("pen");
        }
      } catch (error) {
        console.error("初始化失败:", error);
        await fetchInitialProducts("pen");
      }
    };
    initApp();
  }, []);

  // 监听设置变更事件
  useEffect(() => {
    const handleRefreshSetting = async () => {
      console.log("接收到refreshSetting事件，重新加载产品数据");
      try {
        const response = await productApi.getHotTerms();
        const terms = response.terms || [];
        setHotTerms(terms);
        
        if (terms.length > 0) {
          const randomIndex = Math.floor(Math.random() * terms.length);
          const randomKeyword = terms[randomIndex];
          
          setParams((prev) => ({
            ...prev,
            keyword: randomKeyword,
            language: getCurrentLanguage(),
          }));
          
          setLoading(true);
          setProducts([]);
          setCurrentPage(1);
          setHasMore(true);
          
          const initialParams = {
            keyword: randomKeyword,
            sort_order: "desc",
            sort_by: "default",
            language: getCurrentLanguage(),
            page: 1,
            page_size: 10,
            ...(userStore.user?.user_id
              ? { user_id: userStore.user.user_id }
              : {}),
          };
          
          const firstPageRes = await productApi.getSearchProducts(initialParams);
          setProducts(firstPageRes.products);
          setTotalItems(firstPageRes.total || 0);
          setCurrentPage(1);
          setHasMore(firstPageRes.products.length < (firstPageRes.total || 0));
          setLoading(false);
        } else {
          setParams((prev) => ({
            ...prev,
            language: getCurrentLanguage(),
          }));
          setLoading(true);
          setProducts([]);
          setCurrentPage(1);
          setHasMore(true);
          
          const initialParams = {
            keyword: "pen",
            sort_order: "desc",
            sort_by: "default",
            language: getCurrentLanguage(),
            page: 1,
            page_size: 10,
          };
          
          const firstPageRes = await productApi.getSearchProducts(initialParams);
          setProducts(firstPageRes.products);
          setTotalItems(firstPageRes.total || 0);
          setCurrentPage(1);
          setHasMore(firstPageRes.products.length < (firstPageRes.total || 0));
          setLoading(false);
        }
        setCurrencyVersion((v) => v + 1);
      } catch (error) {
        console.error("重新加载产品数据失败:", error);
        setLoading(false);
      }
    };

    eventBus.on("refreshSetting", handleRefreshSetting);
    
    return () => {
      eventBus.off("refreshSetting", handleRefreshSetting);
    };
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
    };
  }, []);

  return {
    products,
    loading,
    loadingMore,
    hasMore,
    refreshing,
    loadingPlaceholders,
    hotTerms,
    currencyVersion,
    params,
    handleLoadMore,
    handleRefresh,
  };
};