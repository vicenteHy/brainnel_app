import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Keyboard,
  SafeAreaView,
  StatusBar,
  Image,
  Platform,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import SearchIcon from "../components/SearchIcon";
import { productApi } from "../services/api/productApi";
import useAnalyticsStore from "../store/analytics";
import fontSize from "../utils/fontsizeUtils";
import useActivityStore from "../store/activityStore";

// 图标组件 - 使用React.memo优化渲染
const IconComponent = React.memo(({ name, size, color }: { name: string; size: number; color: string }) => {
  const Icon = Ionicons as any;
  return <Icon name={name} size={size} color={color} />;
});

// 搜索历史存储键
const SEARCH_HISTORY_KEY = 'search_history';

// 搜索标签组件 - 使用React.memo优化渲染
const SearchTagItem = React.memo(({ 
  tag, 
  onPress,
  showDeleteButton = false,
  onDelete
}: { 
  tag: string; 
  onPress: (tag: string) => void;
  showDeleteButton?: boolean;
  onDelete?: (tag: string) => void;
}) => (
  <View style={styles.searchTagWrapper}>
    <TouchableOpacity 
      style={[styles.searchTag, showDeleteButton && styles.searchTagWithDelete]}
      onPress={() => onPress(tag)}
    >
      <Text style={styles.searchTagText}>{tag}</Text>
      
      {showDeleteButton && onDelete && (
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => onDelete(tag)}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <IconComponent name="close" size={16} color="#333" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  </View>
));

// 空搜索历史组件
const EmptySearchHistory = React.memo(() => {
  const { t } = useTranslation();
  return (
    <View style={styles.emptyStateContainer}>
      {/* 历史搜索为空的图片 */}
      <Image 
        source={require('../../assets/seachnull.png')}
        style={styles.emptyStateImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyStateText}>{t('noRecentSearches')}</Text>
    </View>
  );
});

export const SearchScreen = ({ route }: any) => {
  const [searchText, setSearchText] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { t } = useTranslation();
  const [trendingSearchTerms, setTrendingSearchTerms] = useState<string[]>([]);

  // 获取热门搜索词
  const loadHotTerms = useCallback(async () => {
    try {
      const res = await productApi.getHotTerms();
      setTrendingSearchTerms(res.terms || []);
    } catch (error) {
      setTrendingSearchTerms([]);
      console.error('Failed to load hot terms:', error);
    }
  }, []);

  // 只在页面聚焦时加载历史记录和热搜词
  useFocusEffect(
    useCallback(() => {
      loadSearchHistory();
      loadHotTerms();
    }, [loadHotTerms])
  );

  // 页面访问统计
  useEffect(() => {
    const analyticsStore = useAnalyticsStore.getState();
    analyticsStore.logPageView('search', 'home');
    
    return () => {
      analyticsStore.logPageLeave('search');
    };
  }, []);

  // 从AsyncStorage加载搜索历史 - 优化异步操作
  const loadSearchHistory = async () => {
    try {
      setIsLoading(true);
      const historyJson = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (historyJson) {
        const history = JSON.parse(historyJson);
        setSearchHistory(history);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存搜索历史 - 使用useCallback优化函数引用
  const saveSearchHistory = useCallback(async (searchTerm: string) => {
    try {
      // 如果搜索词为空，不保存
      if (!searchTerm.trim()) return;

      // 创建新的历史记录，将新搜索词放在最前面
      const newHistory = [searchTerm, ...searchHistory.filter(item => item !== searchTerm)];
      
      // 只保留最近10条
      const trimmedHistory = newHistory.length > 10 ? newHistory.slice(0, 10) : newHistory;
      
      // 先更新UI状态，再进行异步存储操作
      setSearchHistory(trimmedHistory);
      
      // 异步存储操作不阻塞UI
      AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(trimmedHistory))
        .catch(error => console.error('Failed to save search history:', error));
    } catch (error) {
      console.error('Failed to process search history:', error);
    }
  }, [searchHistory]);

  // 清除指定的搜索历史 - 使用useCallback优化函数引用
  const removeSearchHistoryItem = useCallback(async (searchTerm: string) => {
    try {
      const newHistory = searchHistory.filter(item => item !== searchTerm);
      
      // 先更新UI状态，再进行异步存储操作
      setSearchHistory(newHistory);
      
      // 异步存储操作不阻塞UI
      AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
        .catch(error => console.error('Failed to remove search history item:', error));
    } catch (error) {
      console.error('Failed to remove search history item:', error);
    }
  }, [searchHistory]);

  // 清除所有搜索历史 - 使用useCallback优化函数引用
  const clearAllSearchHistory = useCallback(async () => {
    try {
      // 先更新UI状态，再进行异步存储操作
      setSearchHistory([]);
      
      // 异步存储操作不阻塞UI
      AsyncStorage.removeItem(SEARCH_HISTORY_KEY)
        .catch(error => console.error('Failed to clear search history:', error));
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  }, []);

  // 清除搜索框文本 - 使用useCallback优化函数引用
  const clearSearchText = useCallback(() => {
    setSearchText('');
  }, []);

  // 检查是否为产品ID格式（纯数字，长度8-15位）
  const isProductId = useCallback((text: string) => {
    const trimmed = text.trim();
    return /^\d{8,15}$/.test(trimmed);
  }, []);

  // 处理搜索提交 - 使用useCallback优化函数引用
  const handleSearch = useCallback(async () => {
    if (searchText.trim()) {
      const trimmedText = searchText.trim();
      const isIdSearch = isProductId(trimmedText);
      
      // 记录搜索事件，区分ID搜索和关键词搜索
      const analyticsStore = useAnalyticsStore.getState();
      analyticsStore.logSearch(trimmedText, isIdSearch ? "product_id_search" : "search");
      
      // 上报文本搜索任务完成（任务2）
      const activityStore = useActivityStore.getState();
      const taskData = await activityStore.reportTaskComplete(2);
      
      saveSearchHistory(trimmedText);
      Keyboard.dismiss();
      // 导航到搜索结果页面，并传递搜索关键词和任务信息
      navigation.navigate('SearchResult', { 
        keyword: trimmedText,
        taskCompleted: taskData ? {
          taskName: taskData.task_name,
          reward: `+${taskData.reward_value} FCFA`
        } : null
      });
    }
  }, [searchText, saveSearchHistory, navigation, isProductId]);

  // 点击搜索标签
  const handleTagPress = async (tag: string) => {
    // 记录搜索事件
    const analyticsStore = useAnalyticsStore.getState();
    analyticsStore.logSearch(tag, "search");
    
    // 上报文本搜索任务完成（任务2）
    const activityStore = useActivityStore.getState();
    const taskData = await activityStore.reportTaskComplete(2);
    
    setSearchText(tag);
    saveSearchHistory(tag);
    // 导航到搜索结果页面，并传递搜索关键词和任务信息
    navigation.navigate('SearchResult', { 
      keyword: tag,
      taskCompleted: taskData ? {
        taskName: taskData.task_name,
        reward: `+${taskData.reward_value} FCFA`
      } : null
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView>
        <View style={styles.safeAreaContent}>
          <View style={styles.container}>
            {/* 搜索栏 */}
            <View style={styles.searchHeader}>
              <View style={styles.searchBar}>
                <View style={{marginRight: 8,marginLeft: 4}}>
                  <SearchIcon color="#373737" size={20} />
                </View>
                <TextInput
                  style={[
                    styles.searchInput,
                    isProductId(searchText) && styles.productIdInput
                  ]}
                  placeholder={t('searchProducts')}
                  placeholderTextColor="#777"
                  value={searchText}
                  onChangeText={setSearchText}
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                  autoFocus={true}
                />
                {/* 产品ID搜索提示 */}
                {isProductId(searchText) && (
                  <View style={styles.productIdHint}>
                    <Text style={styles.productIdHintText}>🔍 {t('productIdSearch')}</Text>
                  </View>
                )}
                {searchText.length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearButton} 
                    onPress={clearSearchText}
                    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  >
                    <IconComponent name="close-circle" size={18} color="#777" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>

            {/* 最近搜索 */}
            {!isLoading && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderContainer}>
                  <Text style={styles.sectionTitle}>{t('searchHistory')}</Text>
                  {searchHistory.length > 0 && (
                    <TouchableOpacity onPress={clearAllSearchHistory}>
                      <IconComponent name="trash-outline" size={20} color="#ccc" />
                    </TouchableOpacity>
                  )}
                </View>
                
                {searchHistory.length > 0 ? (
                  <View style={styles.tagContainer}>
                    {searchHistory.map((tag, index) => (
                      <SearchTagItem
                        key={`recent-${index}`}
                        tag={tag}
                        onPress={() => handleTagPress(tag)}
                        showDeleteButton={true}
                        onDelete={removeSearchHistoryItem}
                      />
                    ))}
                  </View>
                ) : (
                  <EmptySearchHistory />
                )}
              </View>
            )}
            
            {/* 热门搜索 */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>{t('hotSearch')}</Text>
              <View style={styles.tagContainer}>
                {trendingSearchTerms.map((tag, index) => (
                  <SearchTagItem
                    key={`trending-${index}`}
                    tag={tag}
                    onPress={() => handleTagPress(tag)}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeAreaContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'android' ? 0 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: 20,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: fontSize(16),
    color: '#333',
    height: 40,
  },
  productIdInput: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#0066FF',
    fontWeight: '600',
  },
  productIdHint: {
    position: 'absolute',
    top: -25,
    right: 15,
    backgroundColor: '#0066ff1a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0066ff4d',
  },
  productIdHintText: {
    fontSize: fontSize(11),
    color: '#0066FF',
    fontWeight: '600',
  },
  clearButton: {
    padding: 2,
    marginRight: 5,
  },
  cancelButton: {
    marginLeft: 10,
    padding: 5,
  },
  cancelButtonText: {
    fontSize: fontSize(16),
    color: '#333',
  },
  sectionContainer: {
    paddingHorizontal: 15,
    marginTop: 20,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: fontSize(18),
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  searchTagWrapper: {
    marginRight: 10,
    marginBottom: 10,
  },
  searchTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchTagWithDelete: {
    paddingRight: 40,
  },
  searchTagText: {
    fontSize: fontSize(14),
    color: '#333',
  },
  deleteButton: {
    position: 'absolute',
    right: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  emptyStateImage: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: fontSize(14),
    color: '#9e9e9e',
    fontWeight: 700,
  },
}); 