import React, {
  useCallback,
  useState,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  InteractionManager,
  Image,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  productApi,
  type Product,
  type Category,
} from "../../services/api/productApi";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import useUserStore from "../../store/user";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useGlobalStore } from "../../store/useGlobalStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCategoryImageSource } from "../../utils/categoryImageUtils";
import { eventBus } from "../../utils/eventBus";

// 导入拆分的组件
import {
  SearchBar,
  MultiPageContainer,
} from "./components";

// 导入样式
import { styles, loginModalStyles } from "./styles";

// 导入自定义 hook
import { useMultiPageData } from "./hooks/useMultiPageData";

type IconProps = {
  name: string;
  size: number;
  color: string;
};

const IconComponent = React.memo(({ name, size, color }: IconProps) => {
  const Icon = Ionicons as any;
  return <Icon name={name} size={size} color={color} />;
});

export const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { t } = useTranslation();
  const userStore = useUserStore();
  const { country, currency } = useGlobalStore();
  const horizontalScrollRef = useRef<ScrollView>(null);
  
  // 缓存用户相关数据，避免不必要的重新渲染
  const memoizedUserStore = useMemo(() => ({
    user: userStore.user,
  }), [userStore.user]);

  // 获取正确语言的类目名称
  const getCategoryName = useCallback((category: Category) => {
    const currentLanguage = i18n.language;
    switch(currentLanguage) {
      case 'en':
        return category.name_en || category.name;
      case 'fr':
        return category.name;
      case 'cn':
      case 'zh':
        return category.name_cn || category.name;
      default:
        return category.name;
    }
  }, []);

  // 存储每个分类按钮的宽度信息
  const categoryWidthsRef = useRef<Map<number, number>>(new Map());
  const categoryPositionsRef = useRef<Map<number, number>>(new Map());
  const isScrollingRef = useRef(false); // 防止重复滚动的标志位

  // 组件挂载日志
  useEffect(() => {
    console.log('[HomeScreen] Component mounted', {
      timestamp: new Date().toISOString(),
      hasUser: !!userStore.user?.user_id
    });
    
    return () => {
      console.log('[HomeScreen] Component will unmount', {
        timestamp: new Date().toISOString()
      });
    };
  }, []);

  // 加载用户是否已关闭过登录弹窗的状态
  useEffect(() => {
    const loadDismissedLoginModalState = async () => {
      try {
        const dismissed = await AsyncStorage.getItem('@login_modal_dismissed');
        if (dismissed === 'true') {
          setHasUserDismissedLoginModal(true);
        }
      } catch (error) {
        console.error('加载登录弹窗关闭状态失败:', error);
      }
    };
    loadDismissedLoginModalState();
  }, []);


  
  // 本地状态
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(-1); // -1 表示推荐页
  const [galleryUsed, setGalleryUsed] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false); // 不依赖userStore初始化，在useEffect中处理
  const [hasUserDismissedLoginModal, setHasUserDismissedLoginModal] = useState(false); // 用户是否已关闭过登录弹窗

  // 调试selectedCategoryId变化
  useEffect(() => {
    console.log('[HomeScreen] selectedCategoryId changed to:', selectedCategoryId, {
      timestamp: new Date().toISOString()
    });
  }, [selectedCategoryId]);

  // 分类相关状态
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [showAllSubcategories, setShowAllSubcategories] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // 使用多页面数据管理hook
  const {
    getPageData,
    loadPageData,
    refreshPageData,
    loadMoreData,
    preloadAdjacentPages,
    cleanupPageData,
    allCategories,
  } = useMultiPageData(categories);

  // 记录分类按钮的位置信息
  const handleCategoryLayout = useCallback((categoryId: number, event: any) => {
    const { x, width } = event.nativeEvent.layout;
    categoryWidthsRef.current.set(categoryId, width);
    categoryPositionsRef.current.set(categoryId, x);
  }, []);

  // 精确居中当前选中的分类
  const scrollCategoryToCenter = useCallback((categoryId: number, immediate = false) => {
    if (!horizontalScrollRef.current || isScrollingRef.current) return;
    
    const executeScroll = () => {
      const position = categoryPositionsRef.current.get(categoryId);
      const width = categoryWidthsRef.current.get(categoryId);
      
      if (position !== undefined && width !== undefined) {
        const screenWidth = Dimensions.get('window').width;
        const containerPadding = 10; // categoryScroll的paddingHorizontal
        
        // 计算目标分类的中心点位置
        const itemCenterX = position + (width / 2);
        
        // 计算需要滚动的距离，使分类居中显示
        const scrollToX = Math.max(0, itemCenterX - (screenWidth / 2) + containerPadding);
        
        isScrollingRef.current = true;
        horizontalScrollRef.current?.scrollTo({
          x: scrollToX,
          animated: !immediate,
        });
        
        // 重置滚动标志位
        setTimeout(() => {
          isScrollingRef.current = false;
        }, immediate ? 0 : 300);
      } else {
        // 如果还没有布局信息，使用简单估算
        const categoryIndex = allCategories.findIndex(cat => cat.category_id === categoryId);
        if (categoryIndex !== -1) {
          const estimatedItemWidth = 80;
          const screenWidth = Dimensions.get('window').width;
          const scrollToX = Math.max(0, (categoryIndex * estimatedItemWidth) - (screenWidth / 2));
          
          isScrollingRef.current = true;
          horizontalScrollRef.current?.scrollTo({
            x: scrollToX,
            animated: !immediate,
          });
          
          // 重置滚动标志位
          setTimeout(() => {
            isScrollingRef.current = false;
          }, immediate ? 0 : 300);
        }
      }
    };
    
    if (immediate) {
      executeScroll();
    } else {
      // 只在有布局信息时才延迟，否则立即执行
      const hasLayoutInfo = categoryPositionsRef.current.has(categoryId);
      if (hasLayoutInfo) {
        executeScroll();
      } else {
        setTimeout(executeScroll, 50);
      }
    }
  }, [allCategories]);

  // 切换类目的函数
  const handleCategoryChange = useCallback((categoryId: number) => {
    console.log(`[HomeScreen] handleCategoryChange called - categoryId: ${categoryId}`);
    setSelectedCategoryId(categoryId);
    
    // 使用requestAnimationFrame确保在下一帧执行滚动，避免冲突
    requestAnimationFrame(() => {
      scrollCategoryToCenter(categoryId);
    });
    
    // 为推荐页面和分类页面自动加载数据
    if (categoryId === -1 || categoryId > 0) {
      const pageData = getPageData(categoryId);
      console.log(`[HomeScreen] 检查页面数据 - categoryId: ${categoryId}`, {
        initialized: pageData.initialized,
        loading: pageData.loading,
        productsLength: pageData.products.length
      });
      
      // 如果页面没有初始化或者没有产品数据，则加载数据
      if (!pageData.initialized || pageData.products.length === 0) {
        console.log(`[HomeScreen] 触发loadPageData - categoryId: ${categoryId}`);
        loadPageData(categoryId);
      }
    }
    
    // 延迟清理数据，确保页面切换完成
    setTimeout(() => {
      cleanupPageData(categoryId);
    }, 100);
  }, [scrollCategoryToCenter, getPageData, loadPageData, cleanupPageData]);

  // 处理产品点击
  const handleProductPress = useCallback(
    (item: Product) => {
      InteractionManager.runAfterInteractions(() => {
        navigation.navigate("ProductDetail", {
          offer_id: item.offer_id,
          price: item.min_price,
        });
      });
    },
    [navigation],
  );

  // 处理二级分类点击
  const handleSubcategoryPress = useCallback(
    (subcategoryId: number) => {
      console.log(`[HomeScreen] 二级分类点击 - subcategoryId: ${subcategoryId}`);
      InteractionManager.runAfterInteractions(() => {
        navigation.navigate("SearchResult", {
          category_id: subcategoryId,
        });
      });
    },
    [navigation],
  );

  // 处理查看全部二级分类
  const handleViewAllSubcategories = useCallback(
    (categoryId: number) => {
      console.log(`[HomeScreen] 查看全部二级分类 - categoryId: ${categoryId}`);
      InteractionManager.runAfterInteractions(() => {
        // 可以导航到专门的二级分类页面，或者显示弹窗
        // 这里示例导航到搜索结果页面，显示该一级分类下的所有产品
        navigation.navigate("SearchResult", {
          category_id: categoryId,
        });
      });
    },
    [navigation],
  );

  // 处理相机按钮点击
  const handleCameraPress = useCallback(() => {
    setShowImagePickerModal(true);
  }, []);

  // 处理关闭登录弹窗
  const handleDismissLoginModal = useCallback(async () => {
    setShowLoginModal(false);
    setHasUserDismissedLoginModal(true);
    try {
      await AsyncStorage.setItem('@login_modal_dismissed', 'true');
      console.log('[HomeScreen] 用户关闭登录弹窗，已保存状态');
    } catch (error) {
      console.error('保存登录弹窗关闭状态失败:', error);
    }
  }, []);

  // 图片选择器相关函数
  const cleanupImagePickerCache = async () => {
    try {
      if (Platform.OS === "web") {
        console.log("Cache cleanup skipped on web platform");
        setGalleryUsed(false);
        return;
      }
      const cacheDir = `${FileSystem.cacheDirectory}ImagePicker`;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (dirInfo.exists && dirInfo.isDirectory) {
        await FileSystem.deleteAsync(cacheDir, { idempotent: true });
        console.log("已清理ImagePicker缓存:", cacheDir);
      } else {
        console.log("ImagePicker缓存目录不存在或不是目录，无需清理:", cacheDir);
      }
      console.log("已清理ImagePicker缓存");
      setGalleryUsed(false);
    } catch (error) {
      console.log("清理缓存错误", error);
      setGalleryUsed(false);
    }
  };

  const handleChooseFromGallery = useCallback(async () => {
    setShowImagePickerModal(false);
    setTimeout(async () => {
      try {
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.status !== "granted") {
          console.log("相册权限被拒绝");
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 1,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          navigation.navigate("ImageSearchResultScreen", {
            image: result.assets[0].uri,
            type: 1,
          });
        }
      } catch (error) {
        console.error("相册错误:", error);
        await cleanupImagePickerCache();
      }
    }, 500);
  }, [navigation]);

  const handleTakePhoto = useCallback(async () => {
    setShowImagePickerModal(false);
    setTimeout(async () => {
      try {
        const permissionResult =
          await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.status !== "granted") {
          console.log("相机权限被拒绝");
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 1,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          navigation.navigate("ImageSearchResultScreen", {
            image: result.assets[0].uri,
            type: 1,
          });
        }
      } catch (error) {
        console.error("相机错误:", error);
        await cleanupImagePickerCache();
      }
    }, 500);
  }, [navigation]);

  const resetAppState = useCallback(() => {
    setGalleryUsed(false);
    cleanupImagePickerCache();
    Alert.alert(t('banner.inquiry.camera_reset'), t('banner.inquiry.camera_reset_message'));
  }, [t]);

  // 获取一级类目并初始化数据（只在组件挂载时执行一次）
  useEffect(() => {
    console.log('[HomeScreen] fetchCategories useEffect triggered', {
      timestamp: new Date().toISOString(),
      categoriesLength: categories.length
    });
    
    const fetchCategories = async () => {
      try {
        console.log('[HomeScreen] Calling getFirstCategory API');
        const res = await productApi.getFirstCategory();
        console.log('[HomeScreen] getFirstCategory API response:', res.length, 'categories');
        setCategories(res);
        
        // 不再自动加载推荐数据，等用户手动触发
        // loadPageData(-1);
      } catch (e) {
        console.error("获取一级类目失败", e);
      }
    };
    fetchCategories();
  }, []); // 只在组件挂载时执行一次

  // 当分类数据加载完成后，进行初始定位并加载推荐数据
  useEffect(() => {
    if (categories.length > 0) {
      setTimeout(() => {
        scrollCategoryToCenter(selectedCategoryId, true); // 使用immediate模式
        
        // 自动加载推荐页面数据
        if (selectedCategoryId === -1) {
          const pageData = getPageData(-1);
          if (!pageData.initialized || pageData.products.length === 0) {
            console.log('[HomeScreen] 自动加载推荐页面数据');
            loadPageData(-1);
          }
        }
      }, 150); // 稍微增加延迟确保DOM完全更新
    }
  }, [categories.length, selectedCategoryId]); // 移除函数依赖，只保留数据依赖

  // 获取二级类目
  useEffect(() => {
    if (selectedCategoryId > 0) {
      const fetchSubcategories = async () => {
        setSubcategoriesLoading(true);
        setShowAllSubcategories(false); // 切换分类时重置展开状态
        try {
          const res = await productApi.getSecondCategory(selectedCategoryId);
          setSubcategories(res);
        } catch (e) {
          setSubcategories([]);
        } finally {
          setSubcategoriesLoading(false);
        }
      };
      fetchSubcategories();
    } else {
      setSubcategories([]);
      setSubcategoriesLoading(false);
      setShowAllSubcategories(false);
    }
  }, [selectedCategoryId]);

  // 监听登录状态变化
  useEffect(() => {
    if (userStore.user?.user_id) {
      setShowLoginModal(false);
      // 用户登录成功后，重置弹窗关闭状态，这样下次未登录时可以再次显示
      setHasUserDismissedLoginModal(false);
      AsyncStorage.removeItem('@login_modal_dismissed').catch(console.error);
      
      // 用户登录后，如果当前在推荐页面，刷新数据以获取个性化推荐
      if (selectedCategoryId === -1) {
        setTimeout(() => {
          console.log('[HomeScreen] 用户登录后刷新推荐数据');
          refreshPageData(-1);
        }, 500); // 稍微延迟，确保登录状态完全更新
      }
    } else {
      // 用户未登录且未关闭过弹窗时才显示登录弹窗
      if (!hasUserDismissedLoginModal) {
        setShowLoginModal(true);
      }
    }
  }, [userStore.user?.user_id, selectedCategoryId, refreshPageData, hasUserDismissedLoginModal]);

  // 监听设置变更事件，强制刷新首页数据
  useEffect(() => {
    const handleSettingsChanged = () => {
      console.log('[HomeScreen] 设置发生变更，强制刷新首页数据');
      
      // 强制刷新当前页面的数据
      if (selectedCategoryId === -1) {
        // 如果当前在推荐页面，刷新推荐数据
        setTimeout(() => {
          console.log('[HomeScreen] 刷新推荐页面数据');
          refreshPageData(-1);
        }, 300);
      } else if (selectedCategoryId > 0) {
        // 如果当前在分类页面，刷新分类数据
        setTimeout(() => {
          console.log('[HomeScreen] 刷新分类页面数据:', selectedCategoryId);
          refreshPageData(selectedCategoryId);
        }, 300);
      }
      
      // 重新获取一级类目（可能因为语言变更需要重新获取）
      setTimeout(async () => {
        try {
          console.log('[HomeScreen] 重新获取一级类目');
          const res = await productApi.getFirstCategory();
          setCategories(res);
        } catch (error) {
          console.error('[HomeScreen] 重新获取一级类目失败:', error);
        }
      }, 500);
    };

    // 监听设置变更事件
    eventBus.on('settingsChanged', handleSettingsChanged);
    eventBus.on('refreshSetting', handleSettingsChanged);
    
    // 清理监听器
    return () => {
      eventBus.off('settingsChanged', handleSettingsChanged);
      eventBus.off('refreshSetting', handleSettingsChanged);
    };
  }, [selectedCategoryId, refreshPageData]);


  // 渲染分类区域（性能优化版）
  const renderCategorySection = useMemo(
    () => (
      <View style={styles.category}>
        <View style={styles.categoryScrollContainer}>
          <ScrollView
            bounces={false}
            overScrollMode="never"
            ref={horizontalScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            removeClippedSubviews={true}
            scrollEventThrottle={16}
          >
            {/* 推荐按钮 */}
            <TouchableOpacity
              key="recommendations"
              style={[
                styles.categoryItem,
                selectedCategoryId === -1 && styles.categoryItemActive,
              ]}
              onPress={() => handleCategoryChange(-1)}
              onLayout={(event) => handleCategoryLayout(-1, event)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategoryId === -1 && styles.categoryTextActive,
                ]}
              >
                {t("common.recommendations")}
              </Text>
            </TouchableOpacity>
            
            {/* 其他分类 */}
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.category_id}
                style={[
                  styles.categoryItem,
                  selectedCategoryId === cat.category_id &&
                    styles.categoryItemActive,
                ]}
                onPress={() => handleCategoryChange(cat.category_id)}
                onLayout={(event) => handleCategoryLayout(cat.category_id, event)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategoryId === cat.category_id &&
                      styles.categoryTextActive,
                  ]}
                >
                  {getCategoryName(cat)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* 渐变遮罩 */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.categoryFadeOverlay}
            pointerEvents="none"
          />
          
          {/* 查看全部按钮 */}
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => setShowCategoryModal(true)}
          >
            <IconComponent
              name="chevron-down-outline"
              size={25}
              color="#666"
            />
          </TouchableOpacity>
        </View>
      </View>
    ),
    [categories, selectedCategoryId, t],
  );

  // 渲染子分类区域
  const renderSubcategorySection = useMemo(() => {
    if (selectedCategoryId === 0 || selectedCategoryId === -1) return null;

    if (subcategoriesLoading) {
      return (
        <View style={styles.subcategoryContainer}>
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <ActivityIndicator size="small" color="#FF5100" />
          </View>
        </View>
      );
    }

    if (subcategories.length === 0) return null;

    const renderSubcategoryItem = (item: any) => {
      // 获取类目图片源（本地优先，网络备用）
      const imageSource = getCategoryImageSource(item.category_id, item.image, item.name);
      
      return (
        <TouchableOpacity
          key={item.category_id}
          style={styles.subcategoryItem}
          onPress={() => {
            navigation.navigate("SearchResult", {
              category_id: item.category_id,
            });
          }}
        >
          <View style={styles.subcategoryImagePlaceholder}>
            {imageSource ? (
              <Image
                source={imageSource}
                style={{ width: 40, height: 40, borderRadius: 20 }}
              />
            ) : (
              <IconComponent name="grid-outline" size={20} color="#666" />
            )}
          </View>
          <Text
            style={styles.subcategoryText}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      );
    };

    const renderShowAllButton = () => (
      <TouchableOpacity
        key="show-all"
        style={styles.subcategoryItem}
        onPress={() => setShowAllSubcategories(!showAllSubcategories)}
      >
        <View style={styles.subcategoryImagePlaceholder}>
          <IconComponent 
            name={showAllSubcategories ? "chevron-up-outline" : "chevron-forward-outline"} 
            size={24} 
            color="#000000" 
          />
        </View>
        <Text style={[styles.subcategoryText, { color: "#000000" }]}>
          {showAllSubcategories ? t("common.collapse") : t("common.viewAll")}
        </Text>
      </TouchableOpacity>
    );

    if (showAllSubcategories) {
      // 显示所有分类，每行5个，收起按钮放在最后一个分类后面
      const itemsPerRow = 5;
      const rows = [];
      
      for (let i = 0; i < subcategories.length; i += itemsPerRow) {
        const rowItems = subcategories.slice(i, i + itemsPerRow);
        rows.push(rowItems);
      }
      
      // 在最后一行添加收起按钮
      const lastRowIndex = rows.length - 1;
      const lastRow = rows[lastRowIndex];
      if (lastRow && lastRow.length < itemsPerRow) {
        // 最后一行还有空间，在现有的React Fragment中直接添加收起按钮
        // 不需要修改数组结构
      }

      return (
        <View style={styles.subcategoryContainer}>
          <View style={styles.subcategoryContent}>
            {rows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.subcategoryRow}>
                {row.map(renderSubcategoryItem)}
                {rowIndex === lastRowIndex && renderShowAllButton()}
              </View>
            ))}
          </View>
        </View>
      );
    } else {
      const itemsPerRow = 5;
      const maxItemsWithoutShowAll = itemsPerRow * 2; // 10个

      // 如果总数不超过10个，直接显示所有分类，不显示"全部"按钮
      if (subcategories.length <= maxItemsWithoutShowAll) {
        const rows = [];
        for (let i = 0; i < subcategories.length; i += itemsPerRow) {
          const rowItems = subcategories.slice(i, i + itemsPerRow);
          rows.push(rowItems);
        }

        return (
          <View style={styles.subcategoryContainer}>
            <View style={styles.subcategoryContent}>
              {rows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.subcategoryRow}>
                  {row.map(renderSubcategoryItem)}
                </View>
              ))}
            </View>
          </View>
        );
      }
      
      // 如果总数超过10个，显示前两排，第二排最后一个位置放"全部"按钮
      const firstRow = subcategories.slice(0, itemsPerRow);
      const secondRowItems = subcategories.slice(itemsPerRow, itemsPerRow * 2 - 1);

      return (
        <View style={styles.subcategoryContainer}>
          <View style={styles.subcategoryContent}>
            <View style={styles.subcategoryRow}>
              {firstRow.map(renderSubcategoryItem)}
            </View>
            <View style={styles.subcategoryRow}>
              {secondRowItems.map(renderSubcategoryItem)}
              {renderShowAllButton()}
            </View>
          </View>
        </View>
      );
    }
  }, [selectedCategoryId, subcategories, subcategoriesLoading, showAllSubcategories, navigation, t]);


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#fff"
        translucent={false}
      />
      <View style={styles.safeAreaContent}>
        <View style={styles.container}>
          {/* 固定的搜索栏和分类栏 */}
          <View style={styles.fixedHeader}>
            <SearchBar onCameraPress={handleCameraPress} />
            {renderCategorySection}
          </View>

            {/* 登录弹窗 */}
            {showLoginModal && !userStore.user?.user_id && (
            <>
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  zIndex: 999,
                }}
                activeOpacity={1}
                onPress={handleDismissLoginModal}
              />
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "#fff",
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  paddingTop: 24,
                  paddingHorizontal: 24,
                  paddingBottom: 12,
                  zIndex: 1000,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TouchableOpacity
                  style={loginModalStyles.closeButton}
                  onPress={handleDismissLoginModal}
                >
                  <Text style={loginModalStyles.closeButtonText}>×</Text>
                </TouchableOpacity>
                <Text style={loginModalStyles.title}>
                  {t("login.required", "请先登录")}
                </Text>
                <Text style={loginModalStyles.subtitle}>
                  {t("login.tip", "登录后可享受更多服务")}
                </Text>
                <TouchableOpacity
                  style={loginModalStyles.loginButton}
                  onPress={() => {
                    handleDismissLoginModal();
                    navigation.navigate("Login");
                  }}
                >
                  <Text style={loginModalStyles.loginButtonText}>
                    {t("login.now", "立即登录")}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* 多页面容器 */}
          <View style={styles.scrollableContent}>
            <MultiPageContainer
              allCategories={allCategories}
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={handleCategoryChange}
              getPageData={getPageData}
              onLoadMore={loadMoreData}
              onRefresh={refreshPageData}
              onProductPress={handleProductPress}
              onCameraPress={handleCameraPress}
              userStore={memoizedUserStore}
              t={t}
              subcategories={subcategories}
              subcategoriesLoading={subcategoriesLoading}
              onSubcategoryPress={handleSubcategoryPress}
              onViewAllSubcategories={handleViewAllSubcategories}
            />
          </View>

          {/* 图片选择弹窗 */}
          {showImagePickerModal && (
            <>
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  zIndex: 999,
                }}
                activeOpacity={1}
                onPress={() => setShowImagePickerModal(false)}
              />
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "#fff",
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  paddingTop: 12,
                  paddingHorizontal: 20,
                  paddingBottom: 2,
                  zIndex: 1000,
                }}
              >
                {!galleryUsed ? (
                  <TouchableOpacity
                    style={styles.imagePickerOption}
                    onPress={handleTakePhoto}
                  >
                    <IconComponent
                      name="camera-outline"
                      size={24}
                      color="#333"
                    />
                    <Text style={styles.imagePickerText}>
                      {t("homePage.takePhoto")}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.imagePickerOption}
                    onPress={resetAppState}
                  >
                    <IconComponent
                      name="refresh-outline"
                      size={24}
                      color="#333"
                    />
                    <Text style={styles.imagePickerText}>重置相机功能</Text>
                  </TouchableOpacity>
                )}
                <View style={styles.imagePickerDivider} />
                <TouchableOpacity
                  style={styles.imagePickerOption}
                  onPress={handleChooseFromGallery}
                >
                  <IconComponent name="images-outline" size={24} color="#333" />
                  <Text style={styles.imagePickerText}>
                    {t("homePage.chooseFromGallery")}
                  </Text>
                </TouchableOpacity>
                <View style={styles.imagePickerDivider} />
                <TouchableOpacity
                  style={styles.imagePickerCancelButton}
                  onPress={() => setShowImagePickerModal(false)}
                >
                  <Text style={styles.imagePickerCancelText}>
                    {t("homePage.cancel")}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* 分类选择弹窗 */}
          {showCategoryModal && (
            <>
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  zIndex: 999,
                }}
                activeOpacity={1}
                onPress={() => setShowCategoryModal(false)}
              />
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "#fff",
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  height: "70%",
                  zIndex: 1000,
                }}
              >
                <View
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f0f0f0",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: "#333",
                    }}
                  >
                    {t("common.allCategories")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowCategoryModal(false)}
                    style={{
                      position: "absolute",
                      right: 20,
                      width: 24,
                      height: 24,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconComponent name="close-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView
                  style={{
                    flex: 1,
                  }}
                  contentContainerStyle={{
                    paddingBottom: 20,
                  }}
                  showsVerticalScrollIndicator={false}
                >
                  {/* 推荐选项 */}
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 18,
                      borderBottomWidth: 1,
                      borderBottomColor: "#f0f0f0",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                    onPress={() => {
                      handleCategoryChange(-1);
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#333",
                        fontWeight: "normal",
                      }}
                    >
                      {t("common.recommendations")}
                    </Text>
                    {selectedCategoryId === -1 && (
                      <IconComponent
                        name="checkmark-outline"
                        size={20}
                        color="#FF5100"
                      />
                    )}
                  </TouchableOpacity>
                  
                  {/* 其他分类选项 */}
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.category_id}
                      style={{
                        paddingHorizontal: 20,
                        paddingVertical: 18,
                        borderBottomWidth: 1,
                        borderBottomColor: "#f0f0f0",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                      onPress={() => {
                        handleCategoryChange(category.category_id);
                        setShowCategoryModal(false);
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          color: "#333",
                          fontWeight: "normal",
                        }}
                      >
                        {category.name}
                      </Text>
                      {selectedCategoryId === category.category_id && (
                        <IconComponent
                          name="checkmark-outline"
                          size={20}
                          color="#FF5100"
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};