import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../../constants/Colors';
import { 
  fetchLocalProducts, 
  LocalProduct, 
  getFirstProductImage 
} from '../../../services/local/productList';
import { productCacheManager } from '../../../services/local/productCache';
import { useTranslation } from 'react-i18next';
import fontSize from '../../../utils/fontsizeUtils';

export default function LocalFlashSection() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });
  const isChineseLanguage = i18n.language === 'zh' || i18n.language === 'cn';

  // 倒计时逻辑
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // 设置为今天午夜
      
      const difference = midnight.getTime() - now.getTime();
      
      if (difference > 0) {
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        
        setTimeLeft({ hours, minutes, seconds });
      } else {
        // 重置为23:59:59
        setTimeLeft({ hours: 23, minutes: 59, seconds: 59 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  // 加载产品数据
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetchLocalProducts({ 
        page: 1,
        page_size: 10 // 只获取前10个产品
      });
      
      if (response?.items) {
        setProducts(response.items);
        // 将商品存入缓存
        productCacheManager.setProducts(response.items);
      }
    } catch (error) {
      console.error('获取本地货盘商品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = useCallback((product: LocalProduct) => {
    // 将商品数据存入缓存
    productCacheManager.setProduct(product.product_id, product);
    // 跳转到详情页
    navigation.navigate('LocalProductDetail', { productId: product.product_id });
  }, [navigation]);

  const handleViewAll = useCallback(() => {
    navigation.navigate('LocalProductList');
  }, [navigation]);

  const formatTime = (value: number) => {
    return value.toString().padStart(2, '0');
  };

  const renderProduct = (item: LocalProduct) => {
    const name = isChineseLanguage ? item.name_cn : item.name_fr;
    const imageUrl = getFirstProductImage(item);
    const discount = Math.round(item.off * 100);
    
    return (
      <TouchableOpacity
        key={item.product_id}
        style={styles.productCard}
        onPress={() => handleProductPress(item)}
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
        </View>
        <Text style={styles.productName} numberOfLines={2}>
          {name}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>{item.price}</Text>
          <Text style={styles.currency}>FCFA</Text>
        </View>
        {item.original_price > item.price && (
          <Text style={styles.originalPrice}>{item.original_price}FCFA</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (products.length === 0 && !loading) {
    return null; // 如果没有产品，不显示组件
  }

  return (
    <View style={styles.container}>
      {/* 顶部橙色区域 */}
      <LinearGradient
        colors={['#FF5100', '#FF8C00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {/* 闪电图标 */}
          <View style={styles.iconWrapper}>
            <Ionicons name="flash" size={20} color="#FFB700" />
          </View>
          
          {/* 标题 */}
          <Text style={styles.title}>Flash Local</Text>
          
          {/* 倒计时 */}
          <View style={styles.countdown}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeText}>{formatTime(timeLeft.hours)}</Text>
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={styles.timeBlock}>
              <Text style={styles.timeText}>{formatTime(timeLeft.minutes)}</Text>
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={styles.timeBlock}>
              <Text style={styles.timeText}>{formatTime(timeLeft.seconds)}</Text>
            </View>
          </View>
          
          {/* 查看全部按钮 */}
          <TouchableOpacity onPress={handleViewAll} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>
              {isChineseLanguage ? '查看全部' : 'Voir tout'} &gt;
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* 信息横幅 */}
      <View style={styles.infoBanner}>
        <View style={styles.infoBannerContent}>
          <View style={styles.infoItem}>
            <Ionicons name="car-outline" size={20} color="#FF6600" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTextNormal}>
                {isChineseLanguage ? '免费配送' : 'Livraison gratuite en '}
              </Text>
              <Text style={styles.infoTextBold}>
                {isChineseLanguage ? '72小时' : '72h'}
              </Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Ionicons name="cash-outline" size={20} color="#FF6600" />
            <Text style={[styles.infoTextNormal, { marginLeft: 6 }]}>
              {isChineseLanguage ? '货到付款' : 'Paiement à la livraison'}
            </Text>
          </View>
        </View>
      </View>

      {/* 产品列表 */}
      <View style={styles.productSection}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productList}
          >
            {products.slice(0, 10).map(renderProduct)}
            
            {/* 查看更多按钮 */}
            <TouchableOpacity 
              style={styles.viewMoreCard}
              onPress={handleViewAll}
            >
              <Ionicons name="arrow-forward-circle" size={40} color={Colors.primary} />
              <Text style={styles.viewMoreText}>
                {isChineseLanguage ? '查看更多' : 'Voir plus'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    marginTop: 0,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#FF8C00',
  },
  header: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize(16),
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 8,
    flex: 0,
  },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  viewAllButton: {
    paddingLeft: 5,
  },
  viewAllText: {
    color: '#FFF',
    fontSize: fontSize(12),
    fontWeight: '500',
  },
  timeBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: 'center',
  },
  timeText: {
    fontSize: fontSize(14),
    fontWeight: 'bold',
    color: '#FF6600',
  },
  timeSeparator: {
    fontSize: fontSize(14),
    fontWeight: 'bold',
    color: '#FFF',
    marginHorizontal: 2,
  },
  infoBanner: {
    backgroundColor: '#FFF8F0',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  infoBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  infoTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  infoTextNormal: {
    fontSize: fontSize(12),
    color: '#666',
  },
  infoTextBold: {
    fontSize: fontSize(12),
    fontWeight: 'bold',
    color: '#FF5100',
  },
  infoDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 10,
  },
  productSection: {
    paddingTop: 8,
    paddingBottom: 10,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productList: {
    paddingHorizontal: 5,
  },
  productCard: {
    width: 120,
    marginRight: 12,
  },
  imageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderImage: {
    backgroundColor: '#F0F0F0',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF5100',
    borderRadius: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    color: '#fff',
    fontSize: fontSize(11),
    fontWeight: 'bold',
  },
  productName: {
    fontSize: fontSize(12),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    height: 32,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentPrice: {
    fontSize: fontSize(16),
    fontWeight: 'bold',
    color: Colors.primary,
  },
  currency: {
    fontSize: fontSize(13),
    fontWeight: 'bold',
    color: Colors.primary,
    marginLeft: 2,
  },
  originalPrice: {
    fontSize: fontSize(11),
    color: '#999',
    textDecorationLine: 'line-through',
  },
  viewMoreCard: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  viewMoreText: {
    marginTop: 8,
    fontSize: fontSize(13),
    color: Colors.primary,
    fontWeight: '500',
  },
});