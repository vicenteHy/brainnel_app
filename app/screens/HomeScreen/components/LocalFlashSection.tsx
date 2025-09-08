import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchLevel1Categories, LocalCategory } from '../../../services/local/categoryApi';
import fontSize from '../../../utils/fontsizeUtils';
import useUserStore from '../../../store/user';

export default function LocalFlashSection() {
  const navigation = useNavigation<any>();
  const [categories, setCategories] = useState<LocalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 39 });
  const { user } = useUserStore();
  const [isIvoryCoastUser, setIsIvoryCoastUser] = useState(false);
  const [checkingCountry, setCheckingCountry] = useState(true);

  // 分类图标映射
  const categoryIcons: { [key: number]: any } = {
    4: require('../../../../assets/local/4.png'),
    5: require('../../../../assets/local/5.png'),
    6: require('../../../../assets/local/6.png'),
    7: require('../../../../assets/local/7.png'),
    8: require('../../../../assets/local/8.png'),
    9: require('../../../../assets/local/9.png'),
    10: require('../../../../assets/local/10.png'),
    11: require('../../../../assets/local/11.png'),
    12: require('../../../../assets/local/12.png'),
    13: require('../../../../assets/local/13.png'),
    17: require('../../../../assets/local/17.png'),
    18: require('../../../../assets/local/18.png'),
  };

  // 要显示的分类ID集合 (4*3布局，共12个分类)
  // 将使用后端返回的顺序，而不是预定义的顺序
  const displayCategoryIds = new Set([4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 17, 18]);

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

  // 检查用户国家
  useEffect(() => {
    console.log('[LocalFlashSection] useEffect触发 - user变化');
    checkUserCountry();
  }, [user]);

  // 加载分类数据
  useEffect(() => {
    console.log('[LocalFlashSection] useEffect触发 - isIvoryCoastUser:', isIvoryCoastUser);
    if (isIvoryCoastUser) {
      loadCategories();
    }
  }, [isIvoryCoastUser]);

  const checkUserCountry = async () => {
    console.log('[LocalFlashSection] 开始检查用户国家...');
    let isCI = false; // 使用局部变量跟踪状态
    
    try {
      // 先检查用户信息中的国家
      console.log('[LocalFlashSection] 用户信息:', {
        country: user?.country,
        country_en: user?.country_en,
        country_code: user?.country_code,
        user_id: user?.user_id,
        username: user?.username
      });

      const isFromIvoryCoastByUser = user?.country === 'Côte d\'Ivoire' || 
                                     user?.country === 'Ivory Coast' || 
                                     user?.country === 'CI' ||
                                     user?.country_en === 'Ivory Coast' ||
                                     user?.country_en === 'Côte d\'Ivoire' ||
                                     user?.country_code === 225;

      console.log('[LocalFlashSection] 用户信息中是否为科特迪瓦:', isFromIvoryCoastByUser);

      if (isFromIvoryCoastByUser) {
        console.log('[LocalFlashSection] ✅ 用户来自科特迪瓦（基于用户信息）');
        isCI = true;
      } else {
        // 如果用户信息中没有，检查本地存储的国家选择
        console.log('[LocalFlashSection] 用户信息中未找到科特迪瓦，检查本地存储...');
        const savedCountry = await AsyncStorage.getItem('@selected_country');
        console.log('[LocalFlashSection] 本地存储的国家数据:', savedCountry);
        
        if (savedCountry) {
          const parsedCountry = JSON.parse(savedCountry);
          console.log('[LocalFlashSection] 解析后的国家数据:', parsedCountry);
          
          // 检查是否是科特迪瓦（国家代码225）
          if (parsedCountry.country === 225) {
            console.log('[LocalFlashSection] ✅ 用户选择了科特迪瓦（基于本地存储）');
            isCI = true;
          } else {
            console.log('[LocalFlashSection] ❌ 用户选择的国家不是科特迪瓦，国家代码:', parsedCountry.country);
            isCI = false;
          }
        } else {
          console.log('[LocalFlashSection] ❌ 本地存储中没有国家选择');
          isCI = false;
        }
      }
    } catch (error) {
      console.error('[LocalFlashSection] 检查用户国家失败:', error);
      isCI = false;
    } finally {
      console.log('[LocalFlashSection] 国家检查完成，最终状态 - 是否为科特迪瓦用户:', isCI);
      setIsIvoryCoastUser(isCI);
      setCheckingCountry(false);
    }
  };

  const loadCategories = async () => {
    console.log('[LocalFlashSection] 开始加载分类数据...');
    try {
      setLoading(true);
      const response = await fetchLevel1Categories();
      
      // 详细的后端返回数据调试日志
      console.log('=== 后端返回的完整分类数据 ===');
      console.log('[LocalFlashSection] 总分类数量:', response?.length);
      console.log('[LocalFlashSection] 完整分类列表:', JSON.stringify(response, null, 2));
      
      // 显示每个分类的详细信息
      if (response && Array.isArray(response)) {
        response.forEach((category, index) => {
          console.log(`[LocalFlashSection] 分类 ${index + 1}:`, {
            id: category.category_id,
            name_fr: category.name_fr,
            name_en: category.name_en,
            description: category.description,
            parent_id: category.parent_id,
            level: category.level,
            is_active: category.is_active,
            sort_order: category.sort_order
          });
        });
      }
      
      console.log('=== 开始筛选要显示的分类 ===');
      console.log('[LocalFlashSection] 目标分类ID集合:', Array.from(displayCategoryIds));
      
      // 根据后端返回的顺序筛选要显示的分类
      const filteredCategories = response
        .filter(cat => displayCategoryIds.has(cat.category_id))
        .slice(0, 12); // 确保最多显示12个分类
      
      // 输出筛选详情
      filteredCategories.forEach(category => {
        console.log(`[LocalFlashSection] 分类ID ${category.category_id} 详情:`, {
          name_fr: category.name_fr,
          name_en: category.name_en,
          is_active: category.is_active
        });
      });
      
      console.log('=== 筛选结果 ===');
      console.log('[LocalFlashSection] 筛选后的分类数量:', filteredCategories.length);
      console.log('[LocalFlashSection] 筛选后的分类列表(按后端顺序):', 
        filteredCategories.map(cat => ({
          id: cat.category_id,
          name_fr: cat.name_fr,
          name_en: cat.name_en
        }))
      );
      
      // 检查哪些目标分类没有找到
      const foundIds = filteredCategories.map(cat => cat.category_id);
      const missingIds = Array.from(displayCategoryIds).filter(id => !foundIds.includes(id));
      if (missingIds.length > 0) {
        console.warn('[LocalFlashSection] 未找到的分类ID:', missingIds);
      }
      
      setCategories(filteredCategories);
    } catch (error) {
      console.error('[LocalFlashSection] 获取分类失败:', error);
      console.error('[LocalFlashSection] 错误堆栈:', error.stack);
    } finally {
      setLoading(false);
      console.log('[LocalFlashSection] 分类加载完成');
    }
  };

  const handleCategoryPress = (category: LocalCategory) => {
    navigation.navigate('LocalProductList', { 
      category_id: category.category_id,
      categoryName: category.name_fr 
    });
  };

  const handleViewAll = () => {
    navigation.navigate('LocalProductList');
  };

  const formatTime = (value: number) => {
    return value.toString().padStart(2, '0');
  };

  // 如果正在检查国家或用户不是科特迪瓦用户，不显示组件
  if (checkingCountry || !isIvoryCoastUser) {
    console.log('[LocalFlashSection] 组件不显示 - checkingCountry:', checkingCountry, ', isIvoryCoastUser:', isIvoryCoastUser);
    return null;
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5100" />
        </View>
      </View>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* 顶部橙色区域 */}
      <LinearGradient
        colors={['#FF5100', '#FF5100']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {/* 左侧：闪电图标和标题 */}
          <View style={styles.headerLeft}>
            <View style={styles.iconWrapper}>
              <Ionicons name="flash" size={20} color="#FF5100" />
            </View>
            <Text style={styles.title}>Flash Local</Text>
          </View>

          {/* 中间：倒计时 */}
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

          {/* 右侧：查看全部 */}
          <TouchableOpacity onPress={handleViewAll} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>VOIR TOUT</Text>
            <Ionicons name="chevron-forward" size={12} color="#FFF" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* 主内容区域 */}
      <View style={styles.contentContainer}>
        {/* 信息横幅 */}
        <View style={styles.infoBanner}>
          <View style={styles.infoItem}>
            <Image 
              source={require('../../../../assets/local/delivery.png')} 
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              Livraison en <Text style={styles.infoTextBold}>3 - 7 jours</Text>
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Image 
              source={require('../../../../assets/local/cash.png')} 
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>Paiement à la livraison</Text>
          </View>
        </View>

        {/* 分类网格 - 4*3布局 */}
        <View style={styles.categoriesGrid}>
          {/* 第一行 */}
          <View style={styles.categoryRow}>
            {categories.slice(0, 4).map((category) => (
              <TouchableOpacity
                key={category.category_id}
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryIconWrapper}>
                  {categoryIcons[category.category_id] && (
                    <Image 
                      source={categoryIcons[category.category_id]} 
                      style={styles.categoryIcon}
                    />
                  )}
                </View>
                <Text style={styles.categoryName} numberOfLines={2} adjustsFontSizeToFit>
                  {category.name_fr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 第二行 */}
          <View style={styles.categoryRow}>
            {categories.slice(4, 8).map((category) => (
              <TouchableOpacity
                key={category.category_id}
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryIconWrapper}>
                  {categoryIcons[category.category_id] && (
                    <Image 
                      source={categoryIcons[category.category_id]} 
                      style={styles.categoryIcon}
                    />
                  )}
                </View>
                <Text style={styles.categoryName} numberOfLines={2} adjustsFontSizeToFit>
                  {category.name_fr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 第三行 */}
          <View style={[styles.categoryRow, styles.lastCategoryRow]}>
            {categories.slice(8, 12).map((category) => (
              <TouchableOpacity
                key={category.category_id}
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryIconWrapper}>
                  {categoryIcons[category.category_id] && (
                    <Image 
                      source={categoryIcons[category.category_id]} 
                      style={styles.categoryIcon}
                    />
                  )}
                </View>
                <Text style={styles.categoryName} numberOfLines={2} adjustsFontSizeToFit>
                  {category.name_fr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
    marginBottom: 6,
    marginHorizontal: 8,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FF5100',
    borderWidth: 2,
    borderColor: '#FF5100',
  },
  loadingContainer: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  header: {
    paddingHorizontal:5,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize(15),
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 10,
  },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBlock: {
    backgroundColor: '#FFF',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    minWidth: 28,
    alignItems: 'center',
  },
  timeText: {
    fontSize: fontSize(14),
    fontWeight: 'bold',
    color: '#FF5100',
  },
  timeSeparator: {
    fontSize: fontSize(14),
    fontWeight: 'bold',
    color: '#FFF',
    marginHorizontal: 3,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#FFF',
    fontSize: fontSize(11),
    fontWeight: '600',
  },
  contentContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingBottom: 2,
  },
  infoBanner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#FFEBD4',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    resizeMode: 'contain',
  },
  infoText: {
    fontSize: fontSize(13),
    color: '#333',
  },
  infoTextBold: {
    fontWeight: 'bold',
    color: '#FF5100',
  },
  categoriesGrid: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 0,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Platform.OS === 'android' ? 6 : 8,
    paddingHorizontal: 2,
  },
  lastCategoryRow: {
    marginBottom: 2,
  },
  categoryItem: {
    flex: 1,
    maxWidth: screenWidth / 4.2,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  categoryIcon: {
    width: screenWidth / 5.5,
    height: screenWidth / 5.5,
    borderRadius: 12,
    marginBottom: 4,
    resizeMode: 'contain',
  },
  categoryName: {
    fontSize: fontSize(10),
    color: '#333',
    textAlign: 'center',
    lineHeight: fontSize(12),
    minHeight: fontSize(20),
    paddingHorizontal: 2,
  },
  categoryIconWrapper: {
    width: screenWidth / 5.5,
    height: screenWidth / 5.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
});