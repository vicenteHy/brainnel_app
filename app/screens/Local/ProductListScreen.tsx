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
    return () => animation.stop();
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
  
  type LocalRouteParams = { category_id?: number };
  const initialCategoryId = (route as unknown as { params?: LocalRouteParams }).params?.category_id;
  
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [searchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<LocalProduct[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [categories, setCategories] = useState<LocalCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    typeof initialCategoryId === 'number' ? initialCategoryId : null
  );
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const isChineseLanguage = i18n.language === 'zh';
  const scrollViewRef = useRef<ScrollView>(null);
  const justOpenedRef = useRef(false);
  
  const nextPageRef = useRef(1);
  const isInitialLoad = useRef(true);
  const previousCategoryId = useRef<number | null | undefined>(undefined);
  
  // Refs for category scrolling
  const categoryWidthsRef = useRef<Map<number, number>>(new Map());
  const categoryPositionsRef = useRef<Map<number, number>>(new Map());
  const isScrollingRef = useRef(false);
  const currentScrollXRef = useRef(0);

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
      // 滚动到对应的分类标签 - 简化异步处理
      setTimeout(() => {
        if (categoryId === null) {
          scrollToTab('all');
        } else {
          scrollToTab(`cat-${categoryId}`);
        }
      }, 100);
    }
  }, [selectedCategoryId, scrollToTab]);

  // 这些 effect 将在函数声明之后插入（见下文）

  // moved above with useCallback

  const loadInitialProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetchLocalProducts({ 
        page: 1,
        page_size: 20,
        category_id: selectedCategoryId ?? undefined,
      });
      
      const items = response?.items || [];
      
      setProducts(items);
      setFilteredProducts(items);
      productCacheManager.setProducts(items);
      
      nextPageRef.current = 2;
      const hasMoreData = items.length === 20;
      setHasMore(hasMoreData);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId]);

  // 分类切换时的加载（使用骨架图）
  const loadProductsWithSkeleton = useCallback(async () => {
    try {
      setCategoryLoading(true);
      
      const response = await fetchLocalProducts({ 
        page: 1,
        page_size: 20,
        category_id: selectedCategoryId ?? undefined,
      });
      
      const items = response?.items || [];
      
      setProducts(items);
      setFilteredProducts(items);
      productCacheManager.setProducts(items);
      
      nextPageRef.current = 2;
      const hasMoreData = items.length === 20;
      setHasMore(hasMoreData);
    } catch (error) {
      console.error('Failed to load products:', error);
      // 确保错误时也重置状态
      setProducts([]);
      setFilteredProducts([]);
      setHasMore(false);
    } finally {
      // 确保状态重置 - 添加延迟以避免 iOS 渲染问题
      setTimeout(() => {
        setCategoryLoading(false);
      }, 0);
    }
  }, [selectedCategoryId]);

  const loadMoreProducts = async () => {
    if (isLoadingMore || !hasMore) {
      return;
    }
    
    try {
      setIsLoadingMore(true);
      const currentPage = nextPageRef.current;
      
      const response = await fetchLocalProducts({ 
        page: currentPage,
        page_size: 20,
        category_id: selectedCategoryId ?? undefined,
      });
      
      const newItems = response?.items || [];
      
      if (newItems.length > 0) {
        const updatedProducts = [...products, ...newItems];
        setProducts(updatedProducts);
        setFilteredProducts(updatedProducts);
        productCacheManager.setProducts(updatedProducts);
        
        nextPageRef.current = currentPage + 1;
        const hasMoreData = newItems.length === 20;
        setHasMore(hasMoreData);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more products:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleEndReached = () => {
    if (!isLoadingMore && hasMore && !loading) {
      loadMoreProducts();
    }
  };


  useEffect(() => {
    if (isInitialLoad.current) {
      loadInitialProducts();
      isInitialLoad.current = false;
    } else if (previousCategoryId.current !== selectedCategoryId) {
      loadProductsWithSkeleton();
    }
    previousCategoryId.current = selectedCategoryId;
  }, [selectedCategoryId, loadProductsWithSkeleton, loadInitialProducts]);


  const renderProduct = ({ item }: { item: LocalProduct }) => {
    const name = isChineseLanguage ? item.name_cn : item.name_fr;
    const imageUrl = getFirstProductImage(item);
    const discount = Math.round(item.off * 100);
    const localStock = item.is_local_stock === 1;
    const deliveryDays = localStock ? '3 jours' : '7 jours';
    const progressPercentage = Math.random() * 20 + 80; // 生成80-100之间的随机百分比
    
    return (
      <TouchableOpacity
        style={styles.productCard}
        activeOpacity={1}
        onPress={() => {
          productCacheManager.setProduct(item.product_id, item);
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
                  style={[styles.progressBarFill, { width: `${progressPercentage}%` }]}
                />
              </View>
              <Image 
                source={require('../../../assets/local/inventory.png')} 
                style={[styles.stockIcon, { left: `${progressPercentage}%` }]}
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
              productCacheManager.setProduct(item.product_id, item);
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
    return null;
  };

  // 渲染分类模态框
  const renderCategoryModal = () => {
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {renderCategoryModal()}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liste des produits</Text>
        <View style={styles.backButton} />
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryTabs}>
        <ScrollView 
          ref={scrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          <TouchableOpacity 
            style={[styles.tab, selectedCategoryId === null && styles.activeTab]}
            onPress={() => {
              if (!categoryLoading && selectedCategoryId !== null) {
                setSelectedCategoryId(null);
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
          
          {categories.map((category) => (
            <TouchableOpacity 
              key={category.category_id}
              style={[styles.tab, selectedCategoryId === category.category_id && styles.activeTab]}
              onPress={() => {
                if (!categoryLoading && selectedCategoryId !== category.category_id) {
                  setSelectedCategoryId(category.category_id);
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

      {/* Product List Container */}
      <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : categoryLoading ? (
          <FlatList
            data={Array(6).fill(null).map((_, index) => ({ id: `skeleton-${index}` }))}
            renderItem={() => <ProductSkeleton />}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.productList}
            columnWrapperStyle={styles.columnWrapper}
            scrollEnabled={false}
            bounces={false}
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
            scrollEnabled={true}
            bounces={true}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
            windowSize={10}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
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
  categoryTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: 16,
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
    backgroundColor: '#f5f5f5',
  },
  productList: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 20,
    backgroundColor: '#f5f5f5',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  productCard: {
    width: screenWidth / 2 - 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: screenWidth / 2 - 12,
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
    elevation: 10,
    shadowColor: '#000',
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
  categoryModalItemActive: {},
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