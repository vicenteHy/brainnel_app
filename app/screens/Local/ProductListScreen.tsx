import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Searchbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import { 
  fetchLocalProducts, 
  LocalProduct, 
  getFirstProductImage,
  parseProductImages 
} from '../../services/local/productList';
import { productCacheManager } from '../../services/local/productCache';
import { useTranslation } from 'react-i18next';
import fontSize from '../../utils/fontsizeUtils';

export default function LocalProductListScreen() {
  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<LocalProduct[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isChineseLanguage = i18n.language === 'zh';
  
  // 使用ref来跟踪下一页，避免状态更新的异步问题
  const nextPageRef = useRef(1);

  useEffect(() => {
    loadInitialProducts();
  }, []);

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

  const loadInitialProducts = async () => {
    try {
      setLoading(true);
      console.log('\n========== ProductListScreen: 开始加载初始商品 ==========');
      console.log('请求参数: { page: 1, page_size: 20 }');
      console.log('调用时间:', new Date().toISOString());
      
      const response = await fetchLocalProducts({ 
        page: 1,
        page_size: 20 
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
      console.error('错误消息:', error?.message);
      console.error('==========================================\n');
    } finally {
      setLoading(false);
    }
  };

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
        page_size: 20 
      });
      
      console.log('\n========== ProductListScreen: 加载更多 - 接收到响应 ==========');
      console.log('响应 total:', response?.total);
      console.log('响应 page:', response?.page);
      console.log('响应 page_size:', response?.page_size);
      
      const items = response?.items || [];
      console.log('新返回商品数:', items.length);
      if (items.length > 0) {
        console.log('新商品ID列表:', items.map(item => item.product_id));
      }
      
      let newItemsAdded = 0;
      
      if (items.length > 0) {
        // 过滤重复的产品
        const existingIds = new Set(products.map(p => p.product_id));
        console.log('现有商品ID集合:', Array.from(existingIds));
        
        const newItems = items.filter(item => !existingIds.has(item.product_id));
        newItemsAdded = newItems.length;
        
        console.log('过滤后新增商品数:', newItemsAdded);
        if (newItemsAdded > 0) {
          console.log('新增商品ID:', newItems.map(item => item.product_id));
        }
        
        if (newItems.length > 0) {
          const updatedProducts = [...products, ...newItems];
          setProducts(updatedProducts);
          
          // 如果没有搜索，更新过滤后的产品列表
          if (!searchQuery) {
            setFilteredProducts(updatedProducts);
          }
          
          productCacheManager.setProducts(newItems);
          
          // 只有真正添加了新产品才更新页码
          nextPageRef.current = currentPage + 1;
          
          // 判断是否还有更多（基于total和当前产品数）
          if (response.total && updatedProducts.length >= response.total) {
            setHasMore(false);
          }
        } else {
          // 如果所有产品都是重复的，说明没有更多数据了
          console.log('警告: 所有返回的商品都是重复的！');
          console.log('设置 hasMore: false (全部重复)');
          setHasMore(false);
        }
      } else {
        // 没有返回任何产品
        console.log('警告: API返回空数组！');
        console.log('设置 hasMore: false (空数组)');
        setHasMore(false);
      }
      
      console.log('当前总商品数:', products.length);
      console.log('当前 hasMore 状态:', hasMore);
      console.log('下一页页码:', nextPageRef.current);
      console.log('========== 加载更多完成 ==========\n');
    } catch (error) {
      console.error('\n========== ProductListScreen: 加载更多失败 ==========');
      console.error('错误对象:', error);
      console.error('错误消息:', error?.message);
      console.log('设置 hasMore: false (错误)');
      setHasMore(false); // 出错时停止加载
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

  const renderProduct = ({ item }: { item: LocalProduct }) => {
    const name = isChineseLanguage ? item.name_cn : item.name_fr;
    const imageUrl = getFirstProductImage(item);
    const discount = Math.round(item.off * 100);
    
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => {
          // 将商品数据存入缓存
          productCacheManager.setProduct(item.product_id, item);
          // 跳转到详情页
          navigation.navigate('LocalProductDetail', { productId: item.product_id });
        }}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.placeholderImage]} />
        )}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
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
                  style={[styles.progressBarFill, { width: `${Math.min((item.stock / 10) * 100, 100)}%` }]}
                />
              </View>
              <Image 
                source={require('../../../assets/local/inventory.png')} 
                style={[styles.stockIcon, { left: `${Math.min((item.stock / 10) * 100, 100)}%` }]}
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
          <TouchableOpacity style={styles.buyButton}>
            <Text style={styles.buyButtonText}>Acheter</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!hasMore) return null;
    
    if (isLoadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>本地货盘</Text>
        <Searchbar
          placeholder="搜索商品"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.product_id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无商品</Text>
          </View>
        }
        ListFooterComponent={renderFooter}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: fontSize(24),
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.text,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    flex: 0.48,
    backgroundColor: '#fff',
    borderRadius: 8, // 统一使用8px圆角
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  productImage: {
    width: '100%',
    aspectRatio: 1, // 1:1 正方形比例
    resizeMode: 'cover',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: fontSize(14),
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: fontSize(18),
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: 8,
  },
  currencyText: {
    fontSize: fontSize(12),
    fontWeight: 'normal',
    color: Colors.primary,
  },
  originalPrice: {
    fontSize: fontSize(12),
    color: '#999',
    textDecorationLine: 'line-through',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  stockIcon: {
    width: 16,
    height: 16,
    position: 'absolute',
    top: -6,
    marginLeft: -8, // 让图标居中在进度条末端
  },
  productStock: {
    fontSize: fontSize(10),
    color: '#BF6D47',
    marginRight: 8,
    fontWeight: '600',
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
  placeholderImage: {
    backgroundColor: '#f0f0f0',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF5100',
    borderRadius: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountText: {
    color: '#fff',
    fontSize: fontSize(12),
    fontWeight: 'bold',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: fontSize(16),
    color: '#999',
  },
  buyButton: {
    backgroundColor: '#FF5100',
    borderRadius: 25,
    paddingVertical: 8,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%', // 与图片宽度一致
  },
  buyButtonText: {
    color: '#fff',
    fontSize: fontSize(14),
    fontWeight: '600',
  },
});