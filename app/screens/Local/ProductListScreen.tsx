import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
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

export default function LocalProductListScreen() {
  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<LocalProduct[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const isChineseLanguage = i18n.language === 'zh';

  useEffect(() => {
    loadProducts();
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

  const loadProducts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setPage(1);
        setHasMore(true);
      }
      
      console.log('开始加载商品, page:', isRefresh ? 1 : page);
      const response = await fetchLocalProducts({ 
        page: isRefresh ? 1 : page,
        page_size: 20 
      });
      
      console.log('API 响应:', response);
      
      // 确保 response 和 response.items 存在
      const items = response?.items || [];
      console.log('商品数量:', items.length);
      
      if (isRefresh) {
        setProducts(items);
        setFilteredProducts(items);
        // 将商品存入缓存
        productCacheManager.setProducts(items);
      } else {
        const newProducts = [...products, ...items];
        setProducts(newProducts);
        setFilteredProducts(prev => [...prev, ...items]);
        // 将商品存入缓存
        productCacheManager.setProducts(items);
      }
      
      setHasMore(items.length === 20);
      if (!isRefresh) setPage(prev => prev + 1);
    } catch (error) {
      console.error('获取本地商品失败:', error);
      console.error('错误详情:', error.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadProducts();
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
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>{item.price} FCFA</Text>
            {item.original_price > item.price && (
              <Text style={styles.originalPrice}>{item.original_price} FCFA</Text>
            )}
          </View>
          <Text style={styles.productStock}>库存: {item.stock}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无商品</Text>
          </View>
        }
        ListFooterComponent={
          hasMore && !refreshing ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : null
        }
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
    fontSize: 24,
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
    borderRadius: 10,
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
    height: 150,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  productStock: {
    fontSize: 12,
    color: '#666',
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff4444',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
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
    fontSize: 16,
    color: '#999',
  },
});