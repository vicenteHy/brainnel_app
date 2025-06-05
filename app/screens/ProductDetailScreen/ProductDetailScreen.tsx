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
import { styles } from "./styles";
import widthUtils from "../../utils/widthUtils";

export default function ProductDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { t } = useTranslation();
  const { updateCartItemCount } = useCartStore();
  const { user } = useUserStore();

  // 页面加载时更新购物车数量
  useEffect(() => {
    if (user?.user_id) {
      updateCartItemCount();
    }
  }, [user?.user_id]);

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
    navigation.navigate("MainTabs", { screen: "Cart" });
  };

  const handleProductPress = (item: any) => {
    navigation.push("ProductDetail", {
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
        subject_trans: product.subject || product.subject_trans,
        min_price: product.price,
        offer_id: product.offer_id,
        default_message: t('defaultProductMessage'),
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
                
                <SimilarProducts
                  similars={similars}
                  isSimilarsFlag={isSimilarsFlag}
                  onProductPress={handleProductPress}
                  onViewAllPress={handleViewAllPress}
                  renderSkeletonItems={renderSkeletonItems}
                />
                
                <ProductDetails product={product} />
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