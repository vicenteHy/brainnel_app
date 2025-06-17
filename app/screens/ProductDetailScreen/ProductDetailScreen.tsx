import React, { useEffect } from "react";
import {
  View,
  ScrollView,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Text,
  Platform,
  Animated,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from 'react-i18next';
import useCartStore from "../../store/cartStore";
import useUserStore from "../../store/user";
import {
  ProductHeader,
  ProductImageCarousel,
  ProductInfo,
  ProductAttributes,
  SimilarProducts,
  ProductDetails,
  BottomActionBar,
  ImagePickerModal,
} from "./components";
import ProductCard from "../ProductCard";
import { useProductDetail } from "./hooks/useProductDetail";
import { useSimilarProducts } from "./hooks/useSimilarProducts";
import { useImagePicker } from "./hooks/useImagePicker";
import { useBrowseHistoryStore } from "../../store/browseHistory";
import { useRoute } from "@react-navigation/native";
import { RouteProp } from "@react-navigation/native";
import { styles } from "./styles";
import widthUtils from "../../utils/widthUtils";

type ProductDetailRouteParams = {
  offer_id: string;
  searchKeyword?: string;
  price: number;
  is_live_item?: boolean;
};

export default function ProductDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<Record<string, ProductDetailRouteParams>, string>>();
  const { t } = useTranslation();
  const { updateCartItemCount } = useCartStore();
  const { user } = useUserStore();
  const { addBrowseItem } = useBrowseHistoryStore();

  // 检查是否为直播商品
  const isLiveItem = route.params?.is_live_item || false;

  const {
    product,
    groupList,
    isLoading,
    showBottomSheet,
    setShowBottomSheet,
    handleSizeSelect,
    handleColorSelect,
    expandedGroups,
    toggleExpand,
    getDisplayAttributes,
  } = useProductDetail();

  // 页面加载时更新购物车数量
  useEffect(() => {
    if (user?.user_id) {
      updateCartItemCount();
    }
  }, [user?.user_id]);

  // 添加浏览记录
  useEffect(() => {
    if (product && product.offer_id && product.subject_trans) {
      const browseItem = {
        product_id: product.offer_id,
        product_name: product.subject_trans,
        product_image: product.product_image_urls?.[0] || '',
        price: typeof product.price === 'string' ? parseFloat(product.price) || 0 : product.price || 0,
        currency: product.currency || user.currency || '$',
        category_id: product.category_id,
        seller_id: product.seller_open_id,
      };
      
      addBrowseItem(browseItem).catch(error => {
        console.warn('Failed to add browse history:', error);
      });
    }
  }, [product, addBrowseItem, user.currency]);

  const { similars, isSimilarsFlag, renderSkeletonItems } = useSimilarProducts();

  const {
    showImagePickerModal,
    setShowImagePickerModal,
    galleryUsed,
    handleTakePhoto,
    handleChooseFromGallery,
    resetAppState,
  } = useImagePicker();

  const handleBackPress = () => {
    if (showBottomSheet) {
      setShowBottomSheet(false);
    } else {
      navigation.goBack();
    }
  };

  const handleSearchPress = () => {
    navigation.navigate("Search");
  };

  const handleCameraPress = () => {
    setShowImagePickerModal(true);
  };

  const handleCartPress = () => {
    navigation.navigate("CartScreen");
  };

  const handleProductPress = (item: any) => {
    navigation.navigate("ProductDetail", {
      offer_id: item.offer_id,
      price: item.min_price,
    });
  };

  const handleViewAllPress = () => {
    if (product?.offer_id) {
      console.log('查看所有关联商品 - 产品ID:', product.offer_id);
      console.log('产品名称:', product.subject || product.subject_trans);
      navigation.navigate("RelatedProductsScreen", {
        product_id: product.offer_id,
        product_name: product.subject || product.subject_trans,
      });
    } else {
      console.log('无法获取产品ID，product:', product);
    }
  };

  const handleChatNowPress = () => {
    if (product) {
      navigation.navigate("ProductChatScreen", {
        product_image_urls: product.product_image_urls,
        subject: product.subject,
        subject_trans: product.subject_trans,
        subject_trans_en: product.subject_trans_en,
        min_price: product.price,
        offer_id: product.offer_id,
      });
    }
  };

  const handleStorePress = () => {
    handleViewAllPress();
  };

  const handleAddToCartPress = () => {
    setShowBottomSheet(true);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5100" />
          <Text style={styles.loadingText}>{t('loading_product_details')}</Text>
        </View>
      </SafeAreaView>
    );
  }


  // 如果没有产品数据，显示错误信息
  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>商品信息加载失败</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        <View style={styles.container}>
          <ProductHeader
            onBackPress={handleBackPress}
            onSearchPress={handleSearchPress}
            onCameraPress={handleCameraPress}
            onCartPress={handleCartPress}
          />
          
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollViewContent,
              { paddingBottom: widthUtils(80, 80).height }
            ]}
          >
            <View style={styles.productLayoutContainer}>
              <ProductImageCarousel product={product} />
              
              <View style={styles.productContentContainer}>
                <ProductInfo product={product} />
                
                <ProductAttributes
                  groupList={groupList}
                  expandedGroups={expandedGroups}
                  toggleExpand={toggleExpand}
                  getDisplayAttributes={getDisplayAttributes}
                  handleSizeSelect={handleSizeSelect}
                  handleColorSelect={handleColorSelect}
                />
                
                {/* 只有非直播商品才显示相关产品 */}
                {!isLiveItem && (
                  <SimilarProducts
                    similars={similars}
                    isSimilarsFlag={isSimilarsFlag}
                    onProductPress={handleProductPress}
                    onViewAllPress={handleViewAllPress}
                    renderSkeletonItems={renderSkeletonItems}
                  />
                )}
                
                <ProductDetails product={product} isLiveItem={isLiveItem} />
              </View>
            </View>
          </ScrollView>
          
          <BottomActionBar
            onStorePress={handleStorePress}
            onChatNowPress={handleChatNowPress}
            onAddToCartPress={handleAddToCartPress}
          />
        </View>
      </View>

      <ImagePickerModal
        showImagePickerModal={showImagePickerModal}
        setShowImagePickerModal={setShowImagePickerModal}
        galleryUsed={galleryUsed}
        handleTakePhoto={handleTakePhoto}
        handleChooseFromGallery={handleChooseFromGallery}
        resetAppState={resetAppState}
      />

      {showBottomSheet && product && (
        <View style={styles.bottomSheetOverlay}>
          <TouchableOpacity 
            style={styles.backgroundOverlay}
            onPress={() => setShowBottomSheet(false)}
            activeOpacity={1}
          />
          <Animated.View style={[styles.bottomSheet]}>
            <ProductCard
              onClose={() => setShowBottomSheet(false)}
              product={product}
              groupList={groupList}
            />
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}