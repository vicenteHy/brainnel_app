import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
  ScrollView,
  Animated,
  Modal,
  StatusBar,
} from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { 
  fetchLocalProducts, 
  getFirstProductImage,
} from '../../services/local/productList';
import type { LocalProduct } from '../../services/local/productList';
import { fetchLevel1Categories } from '../../services/local/categoryApi';
import type { LocalCategory } from '../../services/local/categoryApi';
import { productCacheManager } from '../../services/local/productCache';
import { useTranslation } from 'react-i18next';
import fontSize from '../../utils/fontsizeUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 骨架图组件
const ProductSkeleton = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.productCard}>
      <Animated.View style={[styles.imageContainer, styles.skeletonImage, { opacity }]} />
      <View style={styles.productInfo}>
        <Animated.View style={[styles.skeletonText, { width: '80%', height: 16, marginBottom: 8, opacity }]} />
        <Animated.View style={[styles.skeletonText, { width: '60%', height: 14, marginBottom: 8, opacity }]} />
        <View style={styles.stockContainer}>
          <Animated.View style={[styles.skeletonText, { width: '40%', height: 12, marginBottom: 4, opacity }]} />
          <Animated.View style={[styles.progressBarBackground, styles.skeletonProgress, { opacity }]} />
        </View>
        <View style={styles.priceRow}>
          <Animated.View style={[styles.skeletonText, { width: '50%', height: 18, marginBottom: 8, opacity }]} />
        </View>
        <Animated.View style={[styles.buyButton, styles.skeletonButton, { opacity }]} />
      </View>
    </View>
  );
};

export default function LocalProductListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { i18n } = useTranslation();
  
  // 从路由参数获取分类ID（必须在useState之前定义）
  type LocalRouteParams = { category_id?: number };
  const initialCategoryId = (route as unknown as { params?: LocalRouteParams }).params?.category_id;
  
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(false); // 分类切换加载状态
  const [searchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<LocalProduct[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [categories, setCategories] = useState<LocalCategory[]>([]);
  // 如果有初始分类ID，直接使用它作为初始值
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    typeof initialCategoryId === 'number' ? initialCategoryId : null
  );
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const isChineseLanguage = i18n.language === 'zh';
  const scrollViewRef = useRef<ScrollView>(null);
  const categoryPositionsRef = useRef<Map<number, number>>(new Map());
  const categoryWidthsRef = useRef<Map<number, number>>(new Map());
  const isScrollingRef = useRef(false);
  const currentScrollXRef = useRef(0);
  const justOpenedRef = useRef(false);
  // const categoryName = (route as unknown as { params?: { categoryName?: string } }).params?.categoryName; // 未使用
  
  // 调试日志
  console.log('========== ProductListScreen 初始化 ==========');
  console.log('route.params:', (route as any).params);
  console.log('解析的 initialCategoryId:', initialCategoryId);
  console.log('initialCategoryId 类型:', typeof initialCategoryId);
  console.log('==========================================');
  
  // 使用ref来跟踪下一页，避免状态更新的异步问题
  const nextPageRef = useRef(1);
  const isInitialLoad = useRef(true);
  const previousCategoryId = useRef<number | null | undefined>(undefined);

  // 加载分类数据
  const loadCategories = useCallback(async () => {
    try {
      const response = await fetchLevel1Categories();
      setCategories(response);
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // 初始化选中的分类 - 将放到函数声明之后

  // 注意：此 effect 依赖 loadInitialProducts/loadProductsWithSkeleton 的定义位置，
  // 需要在它们声明之后再定义该 effect。为避免“使用前声明”报错，
  // 我们将该 effect 移动到函数声明之后（见文件更下方）。

  useEffect(() => {
    if (searchQuery) {
      const filtered = products.filter(product => {
        const name = isChineseLanguage ? product.name_cn : product.name_fr;
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products, isChineseLanguage]);

  // 记录分类标签布局（x 与 width）
  const handleCategoryLayout = useCallback((categoryId: number, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    categoryWidthsRef.current.set(categoryId, width);
    categoryPositionsRef.current.set(categoryId, x);
  }, []);

  // 精确居中当前选中的分类
  const scrollCategoryToCenter = useCallback((categoryId: number | null, immediate = false) => {
    if (!scrollViewRef.current || isScrollingRef.current) return;

    const effectiveId = categoryId === null ? -1 : categoryId;

    const executeScroll = () => {
      const position = categoryPositionsRef.current.get(effectiveId);
      const width = categoryWidthsRef.current.get(effectiveId);

      if (position !== undefined && width !== undefined) {
        const containerPadding = 10; // 与 styles.categoriesContent 的 paddingHorizontal 保持一致
        const itemCenterX = position + (width / 2);
        const scrollToX = Math.max(0, itemCenterX - (screenWidth / 2) + containerPadding);

        isScrollingRef.current = true;
        currentScrollXRef.current = scrollToX;
        scrollViewRef.current?.scrollTo({
          x: scrollToX,
          animated: !immediate,
        });

        setTimeout(() => {
          isScrollingRef.current = false;
        }, immediate ? 0 : 300);
      } else {
        // 简单估算（当还没有布局信息时）
        const estimatedItemWidth = 80;
        const index = effectiveId === -1 ? 0 : (categories.findIndex(c => c.category_id === effectiveId) + 1);
        const scrollToX = Math.max(0, (index * estimatedItemWidth) - (screenWidth / 2));

        isScrollingRef.current = true;
        currentScrollXRef.current = scrollToX;
        scrollViewRef.current?.scrollTo({
          x: scrollToX,
          animated: !immediate,
        });

        setTimeout(() => {
          isScrollingRef.current = false;
        }, immediate ? 0 : 300);
      }
    };

    if (immediate) {
      executeScroll();
    } else {
      const hasLayoutInfo = categoryPositionsRef.current.has(effectiveId);
      if (hasLayoutInfo) {
        executeScroll();
      } else {
        setTimeout(executeScroll, 50);
      }
    }
  }, [categories]);

  // 统一入口：根据 tabId 解析 categoryId 并调用滚动
  const scrollToTab = useCallback((tabId: string, immediate = false) => {
    if (tabId === 'all') {
      scrollCategoryToCenter(null, immediate);
      return;
    }
    if (tabId.startsWith('cat-')) {
      const id = Number(tabId.replace('cat-', ''));
      if (!Number.isNaN(id)) {
        scrollCategoryToCenter(id, immediate);
      }
    }
  }, [scrollCategoryToCenter]);

  // 处理分类选择
  const handleCategorySelect = useCallback((categoryId: number | null) => {
    setShowCategoryModal(false);
    if (categoryId !== selectedCategoryId) {
      setSelectedCategoryId(categoryId);
      // 滚动到对应的分类标签
      requestAnimationFrame(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ x: currentScrollXRef.current, animated: false });
        }
        requestAnimationFrame(() => {
          if (categoryId === null) {
            scrollToTab('all');
          } else {
            scrollToTab(`cat-${categoryId}`);
          }
        });
      });
    }
  }, [selectedCategoryId, scrollToTab]);

  // 这些 effect 将在函数声明之后插入（见下文）

  // moved above with useCallback

  const loadInitialProducts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('\n========== ProductListScreen: 开始加载初始商品 ==========');
      console.log('选中的分类ID:', selectedCategoryId);
      console.log('请求参数: { page: 1, page_size: 20, category_id:', selectedCategoryId, '}');
      console.log('调用时间:', new Date().toISOString());
      
      const response = await fetchLocalProducts({ 
        page: 1,
        page_size: 20,
        category_id: selectedCategoryId ?? undefined,
      });
      
      console.log('\n========== ProductListScreen: 接收到响应 ==========');
      console.log('响应对象:', response);
      console.log('响应 total:', response?.total);
      console.log('响应 page:', response?.page);
      console.log('响应 page_size:', response?.page_size);
      
      const items = response?.items || [];
      console.log('商品数组长度:', items.length);
      if (items.length > 0) {
        console.log('第一个商品ID:', items[0].product_id);
        console.log('第一个商品名称:', items[0].name_cn);
      }
      
      setProducts(items);
      setFilteredProducts(items);
      productCacheManager.setProducts(items);
      // 确保标签在数据加载后仍保持居中（先恢复之前的偏移，再居中）
      requestAnimationFrame(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ x: currentScrollXRef.current, animated: false });
        }
        requestAnimationFrame(() => {
          scrollCategoryToCenter(selectedCategoryId, true);
        });
      });
      
      // 重置页码
      nextPageRef.current = 2;
      
      // 判断是否还有更多
      const hasMoreData = items.length === 20;
      setHasMore(hasMoreData);
      
      console.log('设置 hasMore:', hasMoreData);
      console.log('下一页页码:', nextPageRef.current);
      console.log('========== 初始加载完成 ==========\n');
    } catch (error) {
      console.error('\n========== ProductListScreen: 加载失败 ==========');
      console.error('错误对象:', error);
      const message = (error as Error)?.message ?? 'Unknown error';
      console.error('错误消息:', message);
      console.error('==========================================\n');
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId, scrollCategoryToCenter]);

  // 分类切换时的加载（使用骨架图）
  const loadProductsWithSkeleton = useCallback(async () => {
    try {
      setCategoryLoading(true);
      console.log('\n========== 切换分类，使用骨架图加载 ==========');
      console.log('选中的分类ID:', selectedCategoryId);
      
      const response = await fetchLocalProducts({ 
        page: 1,
        page_size: 20,
        category_id: selectedCategoryId ?? undefined,
      });
      
      const items = response?.items || [];
      console.log('加载商品数量:', items.length);
      
      setProducts(items);
      setFilteredProducts(items);
      productCacheManager.setProducts(items);
      // 确保分类切换加载完成后标签仍保持居中（先恢复之前的偏移，再居中）
      requestAnimationFrame(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ x: currentScrollXRef.current, animated: false });
        }
        requestAnimationFrame(() => {
          scrollCategoryToCenter(selectedCategoryId, true);
        });
      });
      
      // 重置页码
      nextPageRef.current = 2;
      
      // 判断是否有更多数据
      const hasMoreData = items.length === 20;
      setHasMore(hasMoreData);
      
      console.log('========== 分类切换加载完成 ==========\n');
    } catch (error) {
      console.error('\n========== 分类切换加载失败 ==========');
      console.error('错误:', error);
      console.error('==========================================\n');
    } finally {
      setCategoryLoading(false);
    }
  }, [selectedCategoryId, scrollCategoryToCenter]);

  const loadMoreProducts = async () => {
    // 防止重复加载
    if (isLoadingMore || !hasMore) {
      return;
    }
    
    try {
      setIsLoadingMore(true);
      const currentPage = nextPageRef.current;
      
      console.log('\n========== ProductListScreen: 加载更多商品 ==========');
      console.log('当前页码:', currentPage);
      console.log('当前已有商品数:', products.length);
      console.log('请求参数: { page:', currentPage, ', page_size: 20 }');
      console.log('调用时间:', new Date().toISOString());
      
      const response = await fetchLocalProducts({ 
        page: currentPage,
        page_size: 20,
        category_id: selectedCategoryId ?? undefined,
      });
      
      console.log('\n========== ProductListScreen: 加载更多 - 接收到响应 ==========');
      console.log('响应 total:', response?.total);
      console.log('响应 page:', response?.page);
      console.log('响应 page_size:', response?.page_size);
      
      const newItems = response?.items || [];
      console.log('新商品数量:', newItems.length);
      
      if (newItems.length > 0) {
        const updatedProducts = [...products, ...newItems];
        setProducts(updatedProducts);
        setFilteredProducts(updatedProducts);
        productCacheManager.setProducts(updatedProducts);
        
        // 更新页码
        nextPageRef.current = currentPage + 1;
        
        // 判断是否还有更多
        const hasMoreData = newItems.length === 20;
        setHasMore(hasMoreData);
        
        console.log('更新后商品总数:', updatedProducts.length);
        console.log('下一页页码:', nextPageRef.current);
        console.log('还有更多数据:', hasMoreData);
      } else {
        setHasMore(false);
        console.log('没有更多商品了');
      }
      
      console.log('========== 加载更多完成 ==========\n');
    } catch (error) {
      console.error('\n========== ProductListScreen: 加载更多失败 ==========');
      console.error('错误:', error);
      console.error('==========================================\n');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleEndReached = () => {
    if (!isLoadingMore && hasMore && !loading) {
      loadMoreProducts();
    }
  };

  // 初始化时滚动到选中的分类（放在依赖都已声明之后）
  useEffect(() => {
    console.log('========== 初始化选中分类滚动 effect ==========');
    console.log('initialCategoryId:', initialCategoryId);
    console.log('typeof initialCategoryId:', typeof initialCategoryId);
    
    if (typeof initialCategoryId === 'number') {
      console.log('滚动到分类:', initialCategoryId);
      setTimeout(() => {
        scrollToTab(`cat-${initialCategoryId}`, true);
      }, 300);
    } else {
      console.log('没有初始分类ID，不需要滚动');
    }
    console.log('==========================================');
  }, [initialCategoryId, scrollToTab]);

  // 当选中的分类改变时，重新加载产品（放在依赖都已声明之后）
  useEffect(() => {
    console.log('========== selectedCategoryId 变化 ==========');
    console.log('当前 selectedCategoryId:', selectedCategoryId);
    console.log('之前 previousCategoryId:', previousCategoryId.current);
    console.log('isInitialLoad:', isInitialLoad.current);
    console.log('==========================================');
    
    // 如果是初始加载
    if (isInitialLoad.current) {
      console.log('执行初始加载');
      loadInitialProducts();
      isInitialLoad.current = false;
    } 
    // 如果不是初始加载，且分类确实发生了改变
    else if (previousCategoryId.current !== selectedCategoryId) {
      console.log('执行分类切换加载');
      loadProductsWithSkeleton();
    }
    
    previousCategoryId.current = selectedCategoryId;
  }, [selectedCategoryId, loadProductsWithSkeleton, loadInitialProducts]);

  // 分类列表加载完成后（或布局完成后），如果来自首页并带有初始分类，则再次确保标签居中
  useEffect(() => {
    if (typeof initialCategoryId === 'number' && selectedCategoryId === initialCategoryId && categories.length > 0) {
      requestAnimationFrame(() => {
        const hasLayout = categoryPositionsRef.current.has(initialCategoryId);
        if (hasLayout) {
          scrollCategoryToCenter(initialCategoryId, true);
        } else {
          setTimeout(() => scrollCategoryToCenter(initialCategoryId, true), 80);
        }
      });
    }
  }, [categories, initialCategoryId, selectedCategoryId, scrollCategoryToCenter]);

  const renderProduct = ({ item }: { item: LocalProduct }) => {
    const name = isChineseLanguage ? item.name_cn : item.name_fr;
    const imageUrl = getFirstProductImage(item);
    const discount = Math.round(item.off * 100);
    const localStock = item.is_local_stock === 1; // 后端可选字段
    const deliveryDays = localStock ? '3 jours' : '7 jours';
    
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => {
          // 将商品数据存入缓存
          productCacheManager.setProduct(item.product_id, item);
          // 跳转到详情页
          // @ts-expect-error navigation type generic not specified in this file
          navigation.navigate('LocalProductDetail' as never, { productId: item.product_id } as never);
        }}
      >
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Ionicons name="image-outline" size={30} color="#ccc" />
            </View>
          )}
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}
          {/* @ts-expect-error LocalProduct may optionally include is_top */}
          {item.is_top === 1 && (
            <View style={styles.globalVersionBadge}>
              <Text style={styles.globalVersionText}>Global Version</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            <Ionicons name="flash" size={14} color="#0BB505" style={{ marginTop: 4 }} />
            <Text style={styles.deliveryText}> {deliveryDays} </Text>
            {name}
          </Text>
          <View style={styles.stockContainer}>
            <Text style={styles.productStock}>PLUS QUE {item.stock}</Text>
            <View style={styles.progressBarWrapper}>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={['#FF8C00', '#FF5100']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${Math.max(Math.min(((10 - item.stock) / 10) * 100, 100), 0)}%` }]}
                />
              </View>
              <Image 
                source={require('../../../assets/local/inventory.png')} 
                style={[styles.stockIcon, { left: `${Math.max(Math.min(((10 - item.stock) / 10) * 100, 100), 0)}%` }]}
              />
            </View>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>
              {item.price} <Text style={styles.currencyText}>FCFA</Text>
            </Text>
            {item.original_price > item.price && (
              <Text style={styles.originalPrice}>{item.original_price} FCFA</Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.buyButton}
            onPress={() => {
              // 将商品数据存入缓存
              productCacheManager.setProduct(item.product_id, item);
              // 跳转到详情页
              // @ts-expect-error navigation type generic not specified in this file
              navigation.navigate('LocalProductDetail' as never, { productId: item.product_id } as never);
            }}
          >
            <Text style={styles.buyButtonText}>Acheter</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  // 渲染分类模态框
  const renderCategoryModal = () => {
    console.log('渲染分类模态框, showCategoryModal:', showCategoryModal, 'categories.length:', categories.length);
    return (
    <Modal
      visible={showCategoryModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowCategoryModal(false)}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1} 
          onPress={() => {
            if (justOpenedRef.current) {
              console.log('忽略刚打开时的遮罩点击');
              return;
            }
            setShowCategoryModal(false);
          }}
        />
        <Animated.View 
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: showCategoryModal ? 0 : screenHeight * 0.5 }] }
          ]}
        >
          <View style={styles.bottomSheetHandle} />
          <View style={styles.categoryModalHeader}>
            <Text style={styles.categoryModalTitle}>Choisir une catégorie</Text>
            <TouchableOpacity 
              onPress={() => setShowCategoryModal(false)}
              style={styles.categoryModalClose}
            >
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.categoryModalBody} showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.categoryModalItem,
                selectedCategoryId === null && styles.categoryModalItemActive
              ]}
              onPress={() => handleCategorySelect(null)}
            >
              <Text style={[
                styles.categoryModalItemText,
                selectedCategoryId === null && styles.categoryModalItemTextActive
              ]}>
                Tous
              </Text>
              {selectedCategoryId === null && (
                <Ionicons name="checkmark" size={16} color="#FF5100" />
              )}
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.category_id}
                style={[
                  styles.categoryModalItem,
                  selectedCategoryId === category.category_id && styles.categoryModalItemActive
                ]}
                onPress={() => handleCategorySelect(category.category_id)}
              >
                <Text style={[
                  styles.categoryModalItemText,
                  selectedCategoryId === category.category_id && styles.categoryModalItemTextActive
                ]}>
                  {category.name_fr}
                </Text>
                {selectedCategoryId === category.category_id && (
                  <Ionicons name="checkmark" size={16} color="#FF5100" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
    );
  };





  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {renderCategoryModal()}
      
      {/* 固定的头部 */}
      <View style={styles.fixedHeader}>
        {/* 白色标题栏 */}
        <SafeAreaView edges={['top']} style={styles.whiteHeaderBar}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Liste des produits</Text>
            <View style={styles.backButton} />
          </View>
        </SafeAreaView>

        {/* 固定的分类标签和筛选 - 直接连接标题栏 */}
        <View style={styles.filterSection}>
          <ScrollView 
            ref={scrollViewRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScrollView}
            contentContainerStyle={styles.categoriesContent}
            onScroll={(e) => {
              currentScrollXRef.current = e.nativeEvent.contentOffset.x;
            }}
            scrollEventThrottle={16}
          >
            {/* 全部分类 */}
            <TouchableOpacity 
              style={[styles.tab, selectedCategoryId === null && styles.activeTab]}
              onLayout={(e) => handleCategoryLayout(-1, e)}
              onPress={() => {
                if (!categoryLoading) {
                  setSelectedCategoryId(null);
                  requestAnimationFrame(() => {
                    if (scrollViewRef.current) {
                      scrollViewRef.current.scrollTo({ x: currentScrollXRef.current, animated: false });
                    }
                    requestAnimationFrame(() => {
                      scrollToTab('all');
                    });
                  });
                }
              }}
            >
              <Text 
                style={[styles.tabText, selectedCategoryId === null && styles.activeTabText]}
                numberOfLines={1}
              >
                Tous
              </Text>
            </TouchableOpacity>
            
            {/* 动态分类列表 */}
            {categories.map((category) => (
              <TouchableOpacity 
                key={category.category_id}
                style={[styles.tab, selectedCategoryId === category.category_id && styles.activeTab]}
                onLayout={(e) => handleCategoryLayout(category.category_id, e)}
                onPress={() => {
                  if (!categoryLoading) {
                    setSelectedCategoryId(category.category_id);
                    requestAnimationFrame(() => {
                      if (scrollViewRef.current) {
                        scrollViewRef.current.scrollTo({ x: currentScrollXRef.current, animated: false });
                      }
                      requestAnimationFrame(() => {
                        scrollToTab(`cat-${category.category_id}`);
                      });
                    });
                  }
                }}
              >
                <Text 
                  style={[styles.tabText, selectedCategoryId === category.category_id && styles.activeTabText]}
                  numberOfLines={1}
                >
                  {category.name_fr}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.categoryDropdownButton}
            onPress={() => {
              console.log('分类按钮被点击，当前分类数量:', categories.length);
              setShowCategoryModal(true);
              justOpenedRef.current = true;
              setTimeout(() => {
                justOpenedRef.current = false;
              }, 200);
            }}
          >
            <Ionicons name="grid-outline" size={18} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 可滑动的商品列表 */}
      <View style={styles.scrollableContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : categoryLoading ? (
          // 分类切换时显示骨架图
          <FlatList
            data={Array(6).fill(null).map((_, index) => ({ id: `skeleton-${index}` }))}
            renderItem={() => <ProductSkeleton />}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.productList}
            columnWrapperStyle={styles.columnWrapper}
            scrollEnabled={false}
          />
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={(item) => `${item.product_id}`}
            numColumns={2}
            contentContainerStyle={styles.productList}
            columnWrapperStyle={styles.columnWrapper}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // 恢复灰色背景
  },
  whiteHeaderBar: {
    backgroundColor: '#fff',
    width: '100%',
  },
  headerWrapper: {
    width: '100%',
  },
  headerBackground: {
    width: '100%',
    height: 220, // 调整高度
    justifyContent: 'flex-start',
  },
  headerOverlay: {
    position: 'absolute',
    top: 50, // 考虑paddingTop
    left: 0,
    right: 0,
    zIndex: 1,
  },
  headerSafeArea: {
    flex: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    height: 48,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize(18),
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  filterSection: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoriesScrollView: {
    flex: 1,
  },
  categoriesContent: {
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  tab: {
    marginHorizontal: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    minWidth: 50,
  },
  activeTab: {
    backgroundColor: '#FF5100',
  },
  tabText: {
    fontSize: fontSize(14),
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  categoryDropdownButton: {
    position: 'relative',
    marginRight: 16,
    marginLeft: 8,
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF5100',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: fontSize(10),
    fontWeight: 'bold',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productList: {
    paddingHorizontal: 8,
    paddingTop: 10, // 增加顶部内边距，确保第一排产品完全显示
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  productCard: {
    width: screenWidth / 2 - 12, // 调整宽度以适应新的内边距
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: screenWidth / 2 - 12, // 调整高度以保持正方形比例
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF5100',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: fontSize(12),
    fontWeight: 'bold',
  },
  globalVersionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  globalVersionText: {
    color: '#333',
    fontSize: fontSize(10),
    fontWeight: '500',
  },
  productInfo: {
    padding: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  deliveryText: {
    marginLeft: 4,
    color: '#0BB505',
    fontSize: fontSize(12),
    fontWeight: '500',
  },
  productNameInline: {
    flex: 1,
  },
  productName: {
    fontSize: fontSize(14),
    color: '#333',
    marginBottom: 8,
    minHeight: 36,
    lineHeight: 18,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productStock: {
    fontSize: fontSize(10),
    color: '#BF6D47',
    marginRight: 8,
  },
  progressBarWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  stockIcon: {
    width: 16,
    height: 16,
    position: 'absolute',
    top: -6,
    marginLeft: -8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productPrice: {
    fontSize: fontSize(16),
    fontWeight: 'bold',
    color: '#FF5100',
    marginRight: 8,
  },
  currencyText: {
    fontSize: fontSize(12),
  },
  originalPrice: {
    fontSize: fontSize(12),
    color: '#999',
    textDecorationLine: 'line-through',
  },
  buyButton: {
    backgroundColor: '#FF5100',
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: fontSize(14),
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  // 骨架图样式
  skeletonImage: {
    backgroundColor: '#f0f0f0',
  },
  skeletonText: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  skeletonProgress: {
    backgroundColor: '#f0f0f0',
  },
  skeletonButton: {
    backgroundColor: '#f0f0f0',
  },
  // 新增固定头部样式
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  // 新增可滚动内容样式
  scrollableContent: {
    flex: 1,
    marginTop: 165, // 调整顶部边距，因为减少了头部高度
  },
  // 模态框样式
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: screenHeight * 0.5,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    zIndex: 1001,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    paddingBottom: 12,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  categoryModalContainer: {
    width: screenWidth * 0.86,
    maxHeight: Math.min(screenHeight * 0.7, 560),
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 1001,
    elevation: 10, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  categoryModalContent: {
    width: '100%',
  },
  categoryModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryModalTitle: {
    fontSize: fontSize(16),
    fontWeight: 'bold',
    color: '#333',
  },
  categoryModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryModalBody: {
    maxHeight: Math.min(screenHeight * 0.7, 560) - 60,
    paddingHorizontal: 20,
  },
  categoryModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  categoryModalItemActive: {
    // 选中态只改变文本颜色与显示勾选，不修改背景和下划线
  },
  categoryModalItemText: {
    fontSize: fontSize(15),
    color: '#333',
    flex: 1,
  },
  categoryModalItemTextActive: {
    color: '#FF5100',
    fontWeight: '500',
  },
});