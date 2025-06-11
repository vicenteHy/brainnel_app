import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ListRenderItem,
  Platform,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import fontSize from "../utils/fontsizeUtils";
import widthUtils from "../utils/widthUtils";

import { categoriesApi, Category } from "../services/api/categories";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { getSubCategoryTransLanguage } from "../utils/languageUtils";
import useAnalyticsStore from "../store/analytics";
import BackIcon from "../components/BackIcon";
import { getCategoryImageSource } from "../utils/categoryImageUtils";
import { eventBus } from "../utils/eventBus";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MENU_WIDTH = widthUtils(140, 140).width; // 增加菜单宽度
const AVAILABLE_WIDTH = SCREEN_WIDTH - MENU_WIDTH - 20; // 20 for padding
const NUM_COLUMNS = 4;
const ITEM_MARGIN = "2.66%";
const ITEM_WIDTH = AVAILABLE_WIDTH / NUM_COLUMNS - AVAILABLE_WIDTH * 0.0266;

const categoryOrderConfig = {
  categoryPopularityOrder: [
    { keywords: ["electronics", "phone", "mobile"], priority: 1 },
    { keywords: ["fashion", "clothing", "apparel"], priority: 2 },
    { keywords: ["home", "furniture"], priority: 3 },
    { keywords: ["beauty", "cosmetics"], priority: 4 },
    { keywords: ["sports", "fitness"], priority: 5 },
  ]
};

export const CategoryScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [activeMainCategory, setActiveMainCategory] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const analyticsData = useAnalyticsStore.getState();
  useEffect(() => {
    fetchMainCategories();
  }, []);

  useEffect(() => {
    if (activeMainCategory) {
      fetchSubCategories(activeMainCategory);
    }
  }, [activeMainCategory]);

  // 监听设置变更事件，刷新分类数据以更新多语言显示
  useEffect(() => {
    const handleSettingsChanged = () => {
      console.log('[CategoryScreen] 设置发生变更，刷新分类数据');
      
      // 重新获取主分类和子分类数据以更新多语言显示
      setTimeout(async () => {
        console.log('[CategoryScreen] 重新获取分类数据');
        await fetchMainCategories();
        // 如果有活跃的主分类，也重新获取子分类
        if (activeMainCategory) {
          fetchSubCategories(activeMainCategory);
        }
      }, 300);
    };

    // 监听设置变更事件
    eventBus.on('settingsChanged', handleSettingsChanged);
    eventBus.on('refreshSetting', handleSettingsChanged);
    
    // 清理监听器
    return () => {
      eventBus.off('settingsChanged', handleSettingsChanged);
      eventBus.off('refreshSetting', handleSettingsChanged);
    };
  }, [activeMainCategory]);

  const sortCategoriesByPopularity = (categories: Category[]) => {
    return categories.sort((a, b) => {
      const getWeight = (category: Category) => {
        const nameVariants = [
          category.name_cn?.toLowerCase() || '',
          category.name_en?.toLowerCase() || '',
          category.name?.toLowerCase() || ''
        ];
        
        for (const orderItem of categoryOrderConfig.categoryPopularityOrder) {
          for (const keyword of orderItem.keywords) {
            const lowerKeyword = keyword.toLowerCase();
            if (nameVariants.some(name => name.includes(lowerKeyword) || lowerKeyword.includes(name))) {
              return orderItem.priority;
            }
          }
        }
        return 9999; // 未匹配的类目放在最后
      };

      return getWeight(a) - getWeight(b);
    });
  };

  const fetchMainCategories = async () => {
    try {
      const response = await categoriesApi.getCategories();
      const sortedCategories = sortCategoriesByPopularity(response);
      setMainCategories(sortedCategories);
      if (sortedCategories.length > 0) {
        setActiveMainCategory(sortedCategories[0].category_id);
      }
    } catch (error) {
      console.error("Error fetching main categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubCategories = async (parentId: number) => {
    setSubLoading(true);
    try {
      const response = await categoriesApi.getCategory(parentId);
      if (Array.isArray(response)) {
        setSubCategories(response);
      }
    } catch (error) {
      console.error("Error fetching sub categories:", error);
    } finally {
      setSubLoading(false);
    }
  };

  const renderMainCategoryItem: ListRenderItem<Category> = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.menuItem,
        item.category_id === activeMainCategory && styles.menuItemActive,
      ]}
      activeOpacity={1}
      onPress={() => {
        setActiveMainCategory(item.category_id);
        analyticsData.logCategory({
          category_id: item.category_id,
          level: item.level,
          category_name: item.name,
        }, "category");
      }}
    >
      <Text
        style={[
          styles.menuText,
          item.category_id === activeMainCategory && styles.menuTextActive,
        ]}
        numberOfLines={3}
        ellipsizeMode="tail"
      >
        {getSubCategoryTransLanguage(item)}
      </Text>
    </TouchableOpacity>
  );

  const renderSubCategoryItem: ListRenderItem<Category> = ({ item }) => {
    // 获取类目图片源（本地优先，网络备用）
    const imageSource = getCategoryImageSource(item.category_id, item.image, item.name);
    
    return (
      <TouchableOpacity
        style={styles.subCategoryItem}
        activeOpacity={1}
        onPress={() => {
          analyticsData.logSubCategory({
            category_id: item.category_id,
            category_name: item.name,
          }, "category");
          navigation.navigate("SearchResult", { category_id: item.category_id });
        }}
      >
        {imageSource ? (
          <Image
            source={imageSource}
            style={styles.subCategoryImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.subCategoryImage, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 12, color: '#999' }}>无图片</Text>
          </View>
        )}
        <View style={styles.subCategoryInfo}>
          <Text
            style={styles.subCategoryName}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {getSubCategoryTransLanguage(item)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#FF5100" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        {/* 添加页面头部 */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            activeOpacity={1}
            onPress={() => navigation.goBack()}
          >
            <BackIcon size={fontSize(24)} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Catégories</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.container}>
          <View style={styles.leftMenu}>
            <FlatList
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              data={mainCategories}
              renderItem={renderMainCategoryItem}
              keyExtractor={(item) => item.category_id.toString()}
            />
          </View>
          <View style={styles.rightContent}>
            {subLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FF5100" />
              </View>
            ) : (
              <FlatList
                data={subCategories}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                renderItem={renderSubCategoryItem}
                keyExtractor={(item) => item.category_id.toString()}
                numColumns={NUM_COLUMNS}
                contentContainerStyle={styles.productGrid}
                columnWrapperStyle={styles.columnWrapper}
              />
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  safeAreaContent: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 0 : 0,
  },
  header: {
    height: 60,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 5,
  },
  placeholder: {
    width: fontSize(24) + 10,
  },
  headerTitle: {
    fontSize: fontSize(18),
    fontWeight: "bold",
    color: "#333",
  },
  container: {
    flex: 1,
    flexDirection: "row",
  },
  leftMenu: {
    width: MENU_WIDTH,
    backgroundColor: "#f5f5f5",
    borderRightWidth: 1,
    borderColor: "#fff",
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
    minHeight: 60,
  },
  menuItemActive: {
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderRightColor: "#fff",
  },
  menuText: {
    fontSize: fontSize(12),
    color: "#333",
    textAlign: "center",
    lineHeight: fontSize(14),
    flexWrap: "wrap",
  },
  menuTextActive: {
    color: "#FF5100",
    fontWeight: "bold",
  },
  rightContent: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingTop: 12,
  },
  productGrid: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  columnWrapper: {
    justifyContent: "flex-start",
    marginBottom: 15,
  },
  subCategoryItem: {
    width: ITEM_WIDTH,
    overflow: "hidden",
    marginRight: ITEM_MARGIN,
  },
  subCategoryImage: {
    width: "100%",
    height: ITEM_WIDTH,
    borderRadius: 8,
  },
  subCategoryInfo: {
    padding: 8,
    minHeight: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  subCategoryName: {
    fontSize: fontSize(11),
    color: "#333",
    textAlign: "center",
    lineHeight: fontSize(13),
    flexWrap: "wrap",
  },
});
