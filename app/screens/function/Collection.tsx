import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import widthUtils from "../../utils/widthUtils";
import fontSize from "../../utils/fontsizeUtils";
import BackIcon from "../../components/BackIcon";
import { useNavigation } from "@react-navigation/native";
import { productApi } from "../../services/api/productApi";
import {getSubjectTransLanguage} from "../../utils/languageUtils";
import { useTranslation } from "react-i18next";
import useUserStore from "../../store/user";


// 收藏商品项组件
const FavoriteItem = ({
  favoriteItem,
  onDelete,
  addToCart,
}: {
  favoriteItem: any;
  onDelete: (offerId: number) => void;
  addToCart: (product: any) => void;
}) => {
  const product = favoriteItem.product;
  const navigation = useNavigation();
  const { t } = useTranslation();
  const userStore = useUserStore();
  return (
    <View style={styles.item}>
      <Image 
        source={{ uri: product.product_image_urls[0] || 'https://via.placeholder.com/100' }} 
        style={styles.image} 
      />
      <TouchableOpacity style={styles.info} onPress={() => {
        (navigation as any).navigate("ProductDetail", {
          offer_id: product.offer_id,
        });
      }}>
        <Text style={styles.title} numberOfLines={2}>
          {getSubjectTransLanguage(product) || product.subject_trans}
        </Text>
        <Text style={styles.price}>
          {(userStore.user?.currency || product.currency || 'FCFA')} {
            product.min_price && typeof product.min_price === 'number' 
              ? product.min_price.toFixed(2) 
              : 'N/A'
          }
          {product.original_min_price && product.original_min_price > product.min_price && (
            <Text style={styles.originalPrice}>
              {' '}{(userStore.user?.currency || product.currency || 'FCFA')} {
                typeof product.original_min_price === 'number' 
                  ? product.original_min_price.toFixed(2) 
                  : product.original_min_price
              }
            </Text>
          )}
        </Text>
        <View style={styles.actions}>
          {/* <TouchableOpacity style={[styles.btn, styles.cart]} onPress={() => {
            addToCart(product)
          }}>
            <Text style={styles.cartText}>加入购物车</Text>
          </TouchableOpacity> */}
          <TouchableOpacity 
            style={[styles.btn, styles.delete]}
            onPress={() => onDelete(product.offer_id)}
          >
            <Text style={styles.deleteText}>{t('common.delete') || '删除'}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export const Collection = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  
  // 状态管理
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  const PAGE_SIZE = 10;

  // 获取收藏列表
  const fetchFavorites = useCallback(async (page: number = 1, isRefresh: boolean = false) => {
    try {
      if (!isRefresh && page === 1) {
        setLoading(true);
      } else if (!isRefresh && page > 1) {
        setLoadingMore(true);
      }

      const response = await productApi.getCollectProductList(page, PAGE_SIZE);
      
      if (isRefresh || page === 1) {
        setFavorites(response.items);
        setCurrentPage(1);
      } else {
        // 避免重复添加数据
        setFavorites(prev => {
          const newItems = response.items.filter(
            newItem => !prev.some(existingItem => existingItem.product.offer_id === newItem.product.offer_id)
          );
          return [...prev, ...newItems];
        });
      }
      
      setTotal(response.total);
      setHasMore(response.items.length === PAGE_SIZE && favorites.length + response.items.length < response.total);
      
      if (!isRefresh && page > 1) {
        setCurrentPage(page);
      }
      
    } catch (error) {
      console.error("获取收藏列表失败:", error);
      Alert.alert("错误", "获取收藏列表失败，请重试");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [favorites.length]);

  // 初始化加载
  useEffect(() => {
    fetchFavorites(1);
  }, []);

  // 下拉刷新
  const handleRefresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    fetchFavorites(1, true);
  }, [refreshing, fetchFavorites]);

  // 触底加载更多
  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    fetchFavorites(currentPage + 1);
  }, [hasMore, loadingMore, loading, currentPage, fetchFavorites]);

  // 删除收藏
  const handleDelete = useCallback(async (offerId: number) => {
    setFavorites(prev => prev.filter(item => item.product.offer_id !== offerId));
    setTotal(prev => prev - 1);
    productApi.deleteCollectProduct(offerId);
  }, []);


  const addToCart = useCallback((product: any) => {
    console.log(product);
  }, []);

  // 滚动事件处理
  const handleScroll = useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      handleLoadMore();
    }
  }, [handleLoadMore]);

  // 渲染加载指示器
  const renderLoadingIndicator = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FF6F30" />
      <Text style={styles.loadingText}>{t('common.loading') || '加载中...'}</Text>
    </View>
  );

  // 渲染底部加载更多指示器
  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="small" color="#FF6F30" />
          <Text style={styles.footerText}>{t('common.loading_more') || '加载更多...'}</Text>
        </View>
      );
    }
    
    if (!hasMore && favorites.length > 0) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>{t('common.no_more_data') || '没有更多数据了'}</Text>
        </View>
      );
    }
    
    return null;
  };

  // 渲染空状态
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t('favorites.empty_title') || '暂无收藏商品'}</Text>
      <Text style={styles.emptySubtext}>{t('favorites.empty_subtitle') || '去逛逛，收藏喜欢的商品吧'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <BackIcon size={fontSize(22)} />
          </TouchableOpacity>
          <Text style={styles.titles}>{t('favorites.title') || '我的收藏'} ({total})</Text>
          <View style={styles.placeholder} />
        </View>
        
        {loading ? (
          renderLoadingIndicator()
        ) : (
          <ScrollView 
            style={styles.container} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#FF6F30"]}
                tintColor="#FF6F30"
              />
            }
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {favorites.length === 0 ? (
              renderEmptyState()
            ) : (
              <>
                {favorites.map((item) => (
                  <FavoriteItem 
                    key={item.product.offer_id} 
                    favoriteItem={item}
                    onDelete={handleDelete}
                    addToCart={addToCart}
                  />
                ))}
                {renderFooter()}
              </>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeAreaContent: {
    flex: 1,
    paddingTop: 0,
    backgroundColor: "#f5f5f5",
  },
  containerBox: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingInline: 19,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    width: "100%",
    paddingVertical: 15,
  },
  titles: {
    fontSize: fontSize(20),
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    width: widthUtils(24, 24).width,
  },
  placeholder: {
    width: widthUtils(24, 24).width,
  },
  container: {
    backgroundColor: "#f5f5f5",

    flex: 1,
  },
  item: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: widthUtils(100, 100).width,
    height: widthUtils(100, 100).height,
    borderRadius: 8,
    marginRight: 12,
  },
  info: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: fontSize(15),
    color: "#333",
    lineHeight: 20,
    marginBottom: 6,
  },
  price: {
    color: "#FF6F30",
    fontSize: fontSize(16),
    marginBottom: 10,
    fontWeight: "600",
  },
  originalPrice: {
    color: "#999",
    fontSize: fontSize(14),
    textDecorationLine: "line-through",
    marginLeft: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cart: {
    backgroundColor: "#FF6F30",
  },
  delete: {
    backgroundColor: "#FF6F30",
    borderWidth: 0,
  },
  cartText: {
    color: "#fff",
    fontSize: fontSize(14),
  },
  deleteText: {
    color: "#fff",
    fontSize: fontSize(14),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: fontSize(14),
  },
  footerContainer: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    color: "#999",
    fontSize: fontSize(12),
    marginTop: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: fontSize(16),
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: fontSize(14),
    color: "#999",
  },
});
