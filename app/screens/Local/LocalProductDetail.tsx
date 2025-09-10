import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import type { StyleProp, ImageStyle } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../constants/Colors';
import fontSize from '../../utils/fontsizeUtils';
import type { 
  LocalProduct, 
  LocalProductSku,
} from '../../services/local/productList';
import { 
  parseProductImages,
  fetchLocalProducts 
} from '../../services/local/productList';
import { productCacheManager } from '../../services/local/productCache';
import { useTranslation } from 'react-i18next';
import PagerView from 'react-native-pager-view';
import useUserStore from '../../store/user';
import { loginModalStyles } from '../HomeScreen/styles';

const { width: screenWidth } = Dimensions.get('window');

// 自适应高度的图片组件
const AutoHeightImage = ({ uri, style }: { uri: string; style?: StyleProp<ImageStyle> }) => {
  const [imageHeight, setImageHeight] = useState(screenWidth); // 默认高度
  
  useEffect(() => {
    Image.getSize(uri, (width, height) => {
      // 计算图片在屏幕宽度下的实际高度
      const scaledHeight = (screenWidth / width) * height;
      setImageHeight(scaledHeight);
    }, (error) => {
      console.error('获取图片尺寸失败:', error);
    });
  }, [uri]);
  
  return (
    <Image
      source={{ uri }}
      style={[style, { width: screenWidth, height: imageHeight }]}
      resizeMode="contain"
    />
  );
};

export default function LocalProductDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { i18n } = useTranslation();
  const { productId } = route.params as { productId: number };
  const { user } = useUserStore();
  
  const [product, setProduct] = useState<LocalProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedAttributes, setSelectedAttributes] = useState<{ [key: string]: number }>({});
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [progressPercentage] = useState(Math.random() * 20 + 80); // 生成80-100之间的随机百分比
  
  const isChineseLanguage = i18n.language === 'zh' || i18n.language === 'cn';
  const pagerRef = useRef<PagerView>(null);

  // 倒计时逻辑
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      
      const difference = midnight.getTime() - now.getTime();
      
      if (difference > 0) {
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        
        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft({ hours: 23, minutes: 59, seconds: 59 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  // 加载商品数据
  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      const cachedProduct = productCacheManager.getProduct(productId);
      if (cachedProduct) {
        setProduct(cachedProduct);
        setLoading(false);
        return;
      }
      const response = await fetchLocalProducts({ page: 1, page_size: 100 });
      const foundProduct = response.items.find(p => p.product_id === productId);
      if (foundProduct) {
        setProduct(foundProduct);
        productCacheManager.setProduct(productId, foundProduct);
      } else {
        Alert.alert('错误', '商品不存在');
        navigation.goBack();
      }
    } catch (error) {
      console.error('获取商品详情失败:', error);
      Alert.alert('错误', '获取商品详情失败');
    } finally {
      setLoading(false);
    }
  }, [productId, navigation]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const formatTime = (value: number) => {
    return value.toString().padStart(2, '0');
  };

  // 获取商品轮播图片（使用image_url字段）
  const getProductImages = (): string[] => {
    if (!product) return [];
    // image_url 是轮播图
    const images = parseProductImages(product.image_url);
    return images.length > 0 ? images : [];
  };
  
  // 获取商品详情图片（使用description_fr/description_cn字段）
  const getDescriptionImages = (): string[] => {
    if (!product) return [];
    const description = isChineseLanguage ? product.description_cn : product.description_fr;
    if (!description) return [];
    
    // description可能是字符串数组或JSON字符串
    if (Array.isArray(description)) {
      return description;
    } else if (typeof description === 'string') {
      try {
        const parsed = JSON.parse(description);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // 如果不是JSON，可能是单个URL
        return description.startsWith('http') ? [description] : [];
      }
    }
    return [];
  };

  // 获取所有属性类型
  const getAttributeTypes = (): string[] => {
    if (!product || !product.skus) return [];
    const attrTypes = new Set<string>();
    
    product.skus.forEach(sku => {
      if (sku.attr_key_1) attrTypes.add(sku.attr_key_1);
      if (sku.attr_key_2) attrTypes.add(sku.attr_key_2);
    });
    
    return Array.from(attrTypes);
  };

  // 获取指定属性的所有选项
  const getAttributeOptions = (attrKey: string): Array<{ value: string; image?: string; sku?: LocalProductSku }> => {
    if (!product || !product.skus) return [];
    const optionsMap = new Map<string, { image?: string; sku?: LocalProductSku }>();
    
    product.skus.forEach(sku => {
      if (sku.attr_key_1 === attrKey && sku.attr_value_1) {
        const existing = optionsMap.get(sku.attr_value_1);
        if (!existing || sku.image_url) {
          optionsMap.set(sku.attr_value_1, { 
            image: sku.image_url || existing?.image,
            sku: sku
          });
        }
      }
      if (sku.attr_key_2 === attrKey && sku.attr_value_2) {
        const existing = optionsMap.get(sku.attr_value_2);
        if (!existing || sku.image_url) {
          optionsMap.set(sku.attr_value_2, { 
            image: sku.image_url || existing?.image,
            sku: sku
          });
        }
      }
    });
    
    return Array.from(optionsMap.entries()).map(([value, data]) => ({
      value,
      image: data.image,
      sku: data.sku
    }));
  };

  // 获取当前选择的SKU
  const getSelectedSku = (): LocalProductSku | undefined => {
    if (!product || !product.skus) return undefined;
    
    const attributeTypes = getAttributeTypes();
    
    // 如果只有一个SKU，直接返回
    if (product.skus.length === 1) {
      return product.skus[0];
    }
    
    // 查找匹配所有选中属性的SKU
    return product.skus.find(sku => {
      return attributeTypes.every(attrType => {
        const selectedIndex = selectedAttributes[attrType];
        if (selectedIndex === undefined) return true; // 未选择该属性，跳过
        
        const options = getAttributeOptions(attrType);
        const selectedValue = options[selectedIndex]?.value;
        if (!selectedValue) return true;
        
        return (sku.attr_key_1 === attrType && sku.attr_value_1 === selectedValue) ||
               (sku.attr_key_2 === attrType && sku.attr_value_2 === selectedValue);
      });
    });
  };

  // 获取当前价格
  const getCurrentPrice = (): number => {
    const sku = getSelectedSku();
    return sku ? sku.price : (product?.price || 0);
  };

  // 获取当前库存
  const getCurrentStock = (): number => {
    const sku = getSelectedSku();
    return sku ? sku.stock : (product?.stock || 0);
  };

  // 保留占位：加入购物车逻辑后续补充

  const handleBuyNow = () => {
    if (!user?.user_id) {
      setShowLoginModal(true);
      return;
    }
    
    // 保存选择的商品信息和数量到缓存，供后续页面使用
    const selectedSku = getSelectedSku();
    const orderData = {
      product: product as LocalProduct,
      selectedSku,
      quantity,
      selectedAttributes,
      totalPrice: getCurrentPrice() * quantity,
    };
    
    // 将订单数据存储到产品缓存管理器
    productCacheManager.setOrderData(orderData);
    
    // 导航到本地地址填写页面
    navigation.navigate('LocalAddressForm' as never, { 
      quantity,
      productId: product?.product_id,
      selectedAttributes,
      totalPrice: getCurrentPrice() * quantity 
    } as never);
  };

  const handleDismissLoginModal = useCallback(() => {
    setShowLoginModal(false);
  }, []);

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    const maxStock = getCurrentStock();
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>商品不存在</Text>
      </View>
    );
  }

  const attributeTypes = getAttributeTypes();
  const currentPrice = getCurrentPrice();
  const discount = Math.round(product.off * 100);
  const productName = isChineseLanguage ? product.name_cn : product.name_fr;
  const productContent = isChineseLanguage ? product.content_cn : product.content_fr; // 文字详情
  const descriptionImages = getDescriptionImages(); // 详情图片
  
  // 获取显示的图片（包含选中SKU的图片）
  const getDisplayImages = (): string[] => {
    const baseImages = getProductImages();
    const selectedSku = getSelectedSku();
    
    // 如果选中的SKU有图片，将其添加到轮播图开头
    if (selectedSku?.image_url && !baseImages.includes(selectedSku.image_url)) {
      return [selectedSku.image_url, ...baseImages];
    }
    
    return baseImages;
  };
  
  const images = getDisplayImages();
  // 基于库存类型的配送时长文案（仅文案，不增加图标）
  const isLocalStock = product?.is_local_stock === 1;
  const deliveryDurationText = isChineseLanguage ? (isLocalStock ? '3天' : '7天') : (isLocalStock ? '3 jours' : '7 jours');
  // 构建稳定 key 的辅助函数
  const buildKeys = (arr: string[]) => {
    const counts = new Map<string, number>();
    return arr.map((item) => {
      const prev = counts.get(item) || 0;
      const next = prev + 1;
      counts.set(item, next);
      return next === 1 ? item : `${item}__${next}`;
    });
  };

  const imageKeys = buildKeys(images);
  const descImageKeys = buildKeys(descriptionImages);
  
  // 为每个属性类型的选项构建keys
  const attributeOptionsKeys: { [key: string]: string[] } = {};
  attributeTypes.forEach(attrType => {
    const options = getAttributeOptions(attrType);
    const keyBases = options.map(o => `${o.value}-${o.image ?? 'noimg'}`);
    attributeOptionsKeys[attrType] = buildKeys(keyBases);
  });
 
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 图片轮播 */}
        {images.length > 0 && (
          <View style={styles.imageContainer}>
            <PagerView 
              ref={pagerRef}
              style={styles.pagerView} 
              initialPage={0}
              onPageSelected={(e) => setSelectedImageIndex(e.nativeEvent.position)}
            >
              {images.map((image, i) => (
                <View key={`img-${imageKeys[i]}`} style={styles.imageSlide}>
                  <Image source={{ uri: image }} style={styles.productImage} />
                </View>
              ))}
            </PagerView>
            
            {/* 顶部导航栏 - 覆盖在图片上 */}
            <View style={styles.overlayHeader}>
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                style={styles.overlayHeaderButton}
              >
                <Ionicons name="chevron-back" size={24} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleFavorite} 
                style={styles.overlayHeaderButton}
              >
                <Ionicons 
                  name={isFavorite ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isFavorite ? "#FF5100" : "#333"} 
                />
              </TouchableOpacity>
            </View>
            
            {/* 图片指示器 */}
            <View style={styles.imageIndicators}>
              {images.map((_, i) => (
                <View
                  key={`ind-${imageKeys[i]}`}
                  style={[
                    styles.indicator,
                    i === selectedImageIndex && styles.activeIndicator
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* 商品信息 */}
        <View style={styles.infoSection}>
          <Text style={styles.productId}>ID:{product.product_id}</Text>
          
          {/* 商品标题 */}
          <Text style={styles.productTitle}>{productName}</Text>
          
          {/* 销量信息 */}
          <Text style={styles.salesInfo}>
            {isChineseLanguage ? '1k+ 上月销量' : '1k+ vendus au cours du dernier mois'}
          </Text>
        </View>

        {/* Flash Local价格区域 */}
        <View style={styles.flashLocalContainer}>
          <LinearGradient
            colors={['#FF5100', '#FF8C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.flashHeader}
          >
            <View style={styles.flashHeaderContent}>
              <View style={styles.flashTitleRow}>
                <View style={styles.iconWrapper}>
                  <Ionicons name="flash" size={20} color="#FFB700" />
                </View>
                <Text style={styles.flashTitle}>Flash Local</Text>
              </View>
              
              <View style={styles.countdown}>
                <Text style={styles.countdownLabel}>TEMPS RESTANT</Text>
                <View style={styles.countdownTime}>
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
              </View>
            </View>
          </LinearGradient>

          <View style={styles.flashContent}>
            {/* 配送信息 */}
            <View style={styles.deliveryInfo}>
              <View style={styles.deliveryItem}>
                <Ionicons name="car-outline" size={18} color="#FF6600" />
                <Text style={styles.deliveryText}>
                  {isChineseLanguage ? '免费配送' : 'Livraison gratuite en '}
                  <Text style={styles.deliveryHighlight}>
                    {deliveryDurationText}
                  </Text>
                </Text>
              </View>
              <View style={styles.deliveryItem}>
                <Ionicons name="cash-outline" size={18} color="#FF6600" />
                <Text style={styles.deliveryText}>
                  {isChineseLanguage ? '货到付款' : 'Paiement à la livraison'}
                </Text>
              </View>
            </View>

            {/* 价格信息 */}
            <View style={styles.priceRow}>
              <View style={styles.priceContainer}>
                <Text style={styles.currentPrice}>{currentPrice}</Text>
                <Text style={styles.currency}>FCFA</Text>
              </View>
              
              {discount > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{discount}%</Text>
                </View>
              )}
              
              {product.original_price > currentPrice && (
                <Text style={styles.originalPrice}>
                  Prix d'origine: {product.original_price}FCFA
                </Text>
              )}
            </View>

            {/* 剩余库存 */}
            <View style={styles.stockRow}>
              <Text style={styles.stockLabel}>PLUS QUE {getCurrentStock()}</Text>
              <View style={styles.stockBarWrapper}>
                <View style={styles.stockBar}>
                  <LinearGradient
                    colors={['#FF8C00', '#FF5100']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.stockFill, { width: `${progressPercentage}%` }]}
                  />
                </View>
                <Image 
                  source={require('../../../assets/local/inventory.png')} 
                  style={[styles.stockIcon, { left: `${progressPercentage}%` }]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* 动态属性选择 */}
        {attributeTypes.map(attrType => {
          const options = getAttributeOptions(attrType);
          const selectedIndex = selectedAttributes[attrType] || 0;
          const keys = attributeOptionsKeys[attrType] || [];
          
          if (options.length === 0) return null;
          
          // 如果只有一个选项，自动选中且不显示选择器
          if (options.length === 1) {
            if (selectedAttributes[attrType] === undefined) {
              setSelectedAttributes(prev => ({ ...prev, [attrType]: 0 }));
            }
            return null;
          }
          
          const hasImages = options.some(o => o.image);
          
          return (
            <View key={attrType} style={styles.optionSection}>
              <Text style={styles.optionTitle}>
                {attrType}: <Text style={styles.optionValue}>
                  {options[selectedIndex]?.value || (isChineseLanguage ? '请选择' : 'Sélectionner')}
                </Text>
              </Text>
              
              {hasImages ? (
                // 有图片的属性使用横向滚动
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
                  {options.map((option, i) => (
                    <TouchableOpacity
                      key={`${attrType}-${keys[i]}`}
                      style={[
                        styles.colorOption,
                        i === selectedIndex && styles.selectedColorOption
                      ]}
                      onPress={() => {
                        setSelectedAttributes(prev => ({ ...prev, [attrType]: i }));
                        // 如果选择的属性有图片，重置轮播图
                        if (option.image) {
                          setSelectedImageIndex(0);
                          pagerRef.current?.setPage(0);
                        }
                      }}
                    >
                      {option.image ? (
                        <Image source={{ uri: option.image }} style={styles.colorImage} />
                      ) : (
                        <View style={styles.textOptionInner}>
                          <Text style={styles.optionImageText} numberOfLines={2}>
                            {option.value}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                // 无图片的属性使用网格布局
                <View style={styles.sizeGrid}>
                  {options.map((option, i) => (
                    <TouchableOpacity
                      key={`${attrType}-${keys[i]}`}
                      style={[
                        styles.sizeOption,
                        i === selectedIndex && styles.selectedSizeOption
                      ]}
                      onPress={() => setSelectedAttributes(prev => ({ ...prev, [attrType]: i }))}
                    >
                      <Text style={[
                        styles.sizeText,
                        i === selectedIndex && styles.selectedSizeText
                      ]} numberOfLines={2}>
                        {option.value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* 数量选择 */}
        <View style={styles.optionSection}>
          <View style={styles.quantityRow}>
            <Text style={styles.quantityTitle}>Quantité:</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Ionicons name="remove" size={14} color={quantity <= 1 ? '#ccc' : '#333'} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(1)}
                disabled={quantity >= getCurrentStock()}
              >
                <Ionicons name="add" size={14} color={quantity >= getCurrentStock() ? '#ccc' : '#333'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 商品详情 */}
        {(productContent || descriptionImages.length > 0) && (
          <>
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>
                {isChineseLanguage ? '商品详情' : 'Détails du produit'}
              </Text>
              
              {/* 文字详情（已替换为结构化渲染，保留但不显示） */}
              {false && productContent && (
                <Text style={styles.detailContent}>{productContent}</Text>
              )}
              {/* 文字详情（按换行与冒号拆分，字段加粗） */}
              {productContent && (
                Array.isArray(productContent)
                  ? (() => {
                      const pcLines = productContent.map(s => String(s));
                      const pcKeys = buildKeys(pcLines);
                      return pcLines.map((line, i) => (
                        <View key={`pc-line-${pcKeys[i]}`} style={styles.detailItemRow}>
                          <Text style={styles.bullet}>•</Text>
                          <Text style={styles.detailContent}>{line}</Text>
                        </View>
                      ));
                    })()
                  : (() => {
                      const lines = String(productContent)
                        .split(/\r?\n/)
                        .map(l => l.trim())
                        .filter(l => l.length > 0);
                      const parsed = lines.map(l => {
                        const parts = l.split(/[:：]\s*/);
                        if (parts.length >= 2) {
                          const key = parts.shift() || '';
                          const value = parts.join(': ').trim();
                          return { key: key.trim(), value };
                        }
                        return { key: '', value: l };
                      });
                      const hasStructured = parsed.some(p => p.key);
                      if (!hasStructured) {
                        const lineKeys = buildKeys(lines);
                        return lines.map((l, i) => (
                          <View key={`pc-plain-${lineKeys[i]}`} style={styles.detailItemRow}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.detailContent}>{l}</Text>
                          </View>
                        ));
                      }
                      const pairBases = parsed.map(p => (p.key ? `${p.key}-${p.value}` : p.value));
                      const pairKeys = buildKeys(pairBases);
                      return parsed.map((item, i) => (
                        <View key={`pc-pair-${pairKeys[i]}`} style={styles.detailItemRow}>
                          <Text style={styles.bullet}>•</Text>
                          <Text style={styles.detailContent}>
                            {item.key ? <Text style={styles.detailKey}>{item.key}</Text> : null}
                            {item.key ? <Text style={styles.detailColon}>: </Text> : null}
                            <Text style={styles.detailValue}>{item.value}</Text>
                          </Text>
                        </View>
                      ));
                    })()
              )}
            </View>
            
            {/* 详情图片 - 放在detailSection外面实现全宽 */}
            {descriptionImages.length > 0 && (
              <View style={styles.descriptionImagesContainer}>
                {descriptionImages.map((imageUrl, i) => (
                  <AutoHeightImage 
                    key={`desc-${descImageKeys[i]}`}
                    uri={imageUrl}
                    style={styles.descriptionImage}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* 登录弹窗 */}
      {showLoginModal && !user?.user_id && (
        <Modal
          animationType="none"
          transparent={true}
          visible={showLoginModal}
          onRequestClose={handleDismissLoginModal}
        >
          <View style={loginModalStyles.overlay}>
            <View style={loginModalStyles.bottomSheet}>
              <TouchableOpacity
                style={loginModalStyles.closeButton}
                onPress={handleDismissLoginModal}
              >
                <Text style={loginModalStyles.closeButtonText}>×</Text>
              </TouchableOpacity>
              <Text style={loginModalStyles.title}>Veuillez vous connecter</Text>
              <Text style={loginModalStyles.subtitle}>Connectez-vous pour profiter de plus de services</Text>
              <TouchableOpacity
                style={loginModalStyles.loginButton}
                onPress={() => {
                  handleDismissLoginModal();
                  navigation.navigate('Login' as never);
                }}
              >
                <Text style={loginModalStyles.loginButtonText}>Se connecter maintenant</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 底部操作栏 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.buyButton} onPress={handleBuyNow}>
          <Text style={styles.buyButtonText}>
            {isChineseLanguage ? '立即购买' : 'Acheter maintenant'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: fontSize(16),
    color: '#999',
  },
  overlayHeader: {
    position: 'absolute',
    top: Platform.OS === 'android' ? Constants.statusBarHeight + 10 : 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    zIndex: 1,
  },
  overlayHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: screenWidth,
    backgroundColor: '#f5f5f5',
  },
  pagerView: {
    width: screenWidth,
    height: screenWidth,
  },
  imageSlide: {
    width: screenWidth,
    height: screenWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: screenWidth,
    height: screenWidth,
    resizeMode: 'contain',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  activeIndicator: {
    backgroundColor: '#FF5100',
    width: 20,
  },
  infoSection: {
    padding: 15,
    backgroundColor: '#fff',
  },
  productId: {
    fontSize: fontSize(12),
    color: '#999',
    marginBottom: 8,
  },
  productTitle: {
    fontSize: fontSize(16),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: fontSize(14),
    color: '#666',
    lineHeight: fontSize(20),
    marginBottom: 8,
  },
  salesInfo: {
    fontSize: fontSize(12),
    color: '#999',
  },
  flashLocalContainer: {
    marginHorizontal: 10,
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FF8C00',
  },
  flashHeader: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  flashHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flashTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  flashTitle: {
    fontSize: fontSize(16),
    fontWeight: 'bold',
    color: '#FFF',
  },
  countdown: {
    alignItems: 'flex-end',
  },
  countdownLabel: {
    fontSize: fontSize(10),
    color: '#FFF',
    marginBottom: 4,
  },
  countdownTime: {
    flexDirection: 'row',
    alignItems: 'center',
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
  flashContent: {
    backgroundColor: '#FFF8F0',
    padding: 15,
  },
  deliveryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  deliveryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryText: {
    marginLeft: 6,
    fontSize: fontSize(12),
    color: '#666',
  },
  deliveryHighlight: {
    fontWeight: 'bold',
    color: '#FF5100',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 10,
  },
  currentPrice: {
    fontSize: fontSize(24),
    fontWeight: 'bold',
    color: '#FF5100',
  },
  currency: {
    fontSize: fontSize(14),
    fontWeight: 'bold',
    color: '#FF5100',
    marginLeft: 4,
  },
  discountBadge: {
    backgroundColor: '#ff4444',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 10,
  },
  discountText: {
    color: '#fff',
    fontSize: fontSize(12),
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: fontSize(12),
    color: '#999',
    textDecorationLine: 'line-through',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: fontSize(12),
    color: '#FF5100',
    fontWeight: 'bold',
    marginRight: 10,
  },
  stockBarWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  stockBar: {
    height: 4,
    backgroundColor: '#FFE5D9',
    borderRadius: 2,
  },
  stockFill: {
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
  optionSection: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  optionTitle: {
    fontSize: fontSize(14),
    color: '#333',
    marginBottom: 10,
    fontWeight: '500',
  },
  quantityTitle: {
    fontSize: fontSize(14),
    color: '#333',
    marginBottom: 0,
    fontWeight: '500',
  },
  optionValue: {
    fontWeight: 'bold',
  },
  optionScroll: {
    marginTop: 10,
  },
  colorOption: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginRight: 10,
    padding: 2,
    overflow: 'hidden',
  },
  selectedColorOption: {
    borderColor: '#FF5100',
  },
  colorImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  colorSample: {
    flex: 1,
    borderRadius: 4,
  },
  textOptionInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  optionImageText: {
    fontSize: fontSize(10),
    color: '#333',
    textAlign: 'center',
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  sizeOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  selectedSizeOption: {
    borderColor: '#FF5100',
    backgroundColor: '#FFF8F0',
  },
  sizeText: {
    fontSize: fontSize(14),
    color: '#333',
  },
  selectedSizeText: {
    color: '#FF5100',
    fontWeight: 'bold',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: fontSize(15),
    fontWeight: 'bold',
    marginHorizontal: 12,
    minWidth: 30,
    textAlign: 'center',
  },
  detailSection: {
    padding: 15,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  detailTitle: {
    fontSize: fontSize(16),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  detailContent: {
    fontSize: fontSize(14),
    color: '#666',
    lineHeight: fontSize(20),
    marginBottom: 0,
    flex: 1,
    flexShrink: 1,
  },
  detailItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bullet: {
    width: 14,
    textAlign: 'center',
    color: '#333',
    marginTop: 6,
    marginRight: 8,
  },
  detailKey: {
    fontSize: fontSize(14),
    fontWeight: 'bold',
    color: '#333',
  },
  detailColon: {
    fontSize: fontSize(14),
    color: '#333',
  },
  detailValue: {
    fontSize: fontSize(14),
    color: '#666',
  },
  descriptionImagesContainer: {
    marginTop: 0,
    backgroundColor: '#fff',
  },
  descriptionImage: {
    marginBottom: 5, // 添加图片之间的间距，避免遮挡
  },
  bottomBar: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  buyButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#FF5100',
  },
  buyButtonText: {
    fontSize: fontSize(16),
    color: '#fff',
    fontWeight: 'bold',
  },
});