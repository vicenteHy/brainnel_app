import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { fetchLevel1Categories, LocalCategory } from '../../../services/local/categoryApi';
import fontSize from '../../../utils/fontsizeUtils';

export default function LocalFlashSection() {
  const navigation = useNavigation<any>();
  const [categories, setCategories] = useState<LocalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 39 });

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
  };

  // 要显示的分类ID顺序
  const displayCategoryIds = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

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

  // 加载分类数据
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetchLevel1Categories();
      
      // 筛选并排序要显示的分类
      const filteredCategories = displayCategoryIds
        .map(id => response.find(cat => cat.category_id === id))
        .filter(cat => cat !== undefined) as LocalCategory[];
      
      setCategories(filteredCategories);
    } catch (error) {
      console.error('获取分类失败:', error);
    } finally {
      setLoading(false);
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

        {/* 分类网格 */}
        <View style={styles.categoriesGrid}>
          {/* 第一行 */}
          <View style={styles.categoryRow}>
            {categories.slice(0, 5).map((category) => (
              <TouchableOpacity
                key={category.category_id}
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(category)}
              >
                {categoryIcons[category.category_id] && (
                  <Image 
                    source={categoryIcons[category.category_id]} 
                    style={styles.categoryIcon}
                  />
                )}
                <Text style={styles.categoryName} numberOfLines={2}>
                  {category.name_fr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 第二行 */}
          <View style={styles.categoryRow}>
            {categories.slice(5, 10).map((category) => (
              <TouchableOpacity
                key={category.category_id}
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(category)}
              >
                {categoryIcons[category.category_id] && (
                  <Image 
                    source={categoryIcons[category.category_id]} 
                    style={styles.categoryIcon}
                  />
                )}
                <Text style={styles.categoryName} numberOfLines={2}>
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
    paddingBottom: 16,
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
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryItem: {
    width: '18%',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 68,
    height: 68,
    borderRadius: 14,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  categoryName: {
    fontSize: fontSize(11),
    color: '#333',
    textAlign: 'center',
    lineHeight: 14,
  },
});