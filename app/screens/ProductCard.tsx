import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  ProductDetailParams,
  ProductGroupList,
} from "../services/api/productApi";
import { 
  ProductHeader, 
  MultiSkuSelector, 
  SingleSkuSelector, 
  NoSkuSelector, 
  BottomActionBar, 
  ProductCardModals 
} from "./ProductCard/components";
import { useProductCard } from "./ProductCard/hooks/useProductCard";
import widthUtils from "../utils/widthUtils";

interface ProductCardProps {
  onClose: () => void;
  product: ProductDetailParams;
  groupList: ProductGroupList[];
}

const ProductCard: React.FC<ProductCardProps> = ({
  onClose,
  product: localProduct,
  groupList: localGroupList,
}) => {
  const {
    // 状态
    deleteModalVisible,
    alertModalVisible,
    alertMessage,
    quantityInputVisible,
    quantityInput,
    mainProductQuantity,
    skuQuantities,
    
    // Store 数据
    imgTitle,
    price,
    totalPrice,
    selectedSize,
    vip_level,
    vip_discount,
    
    // 方法
    showCustomAlert,
    handleQuantityInputConfirm,
    handleQuantityPress,
    handleSkuQuantityChange,
    addCartHandel,
    cancelDelete,
    handleNavigateToCart,
    setMainProductQuantity,
    setQuantityInput,
    setQuantityInputVisible,
    setEditingItem,
    setAlertModalVisible,
  } = useProductCard({ localProduct, localGroupList });

  // 渲染SKU选择器
  const renderSkuSelector = () => {
    // 有多个SKU的商品
    if (localProduct.skus && localProduct.skus.length > 1) {
      return (
        <MultiSkuSelector
          product={localProduct}
          skuQuantities={skuQuantities}
          onQuantityChange={handleSkuQuantityChange}
          onQuantityPress={handleQuantityPress}
        />
      );
    }

    // 只有一个sku且为文字
    if (localProduct.skus && localProduct.skus.length === 1 && !localProduct.skus[0].sku_image_url) {
      return (
        <SingleSkuSelector
          product={localProduct}
          mainProductQuantity={mainProductQuantity}
          onQuantityChange={setMainProductQuantity}
        />
      );
    }

    // 无SKU商品
    if (!localProduct.skus || localProduct.skus.length === 0) {
      return (
        <NoSkuSelector
          product={localProduct}
          mainProductQuantity={mainProductQuantity}
          onQuantityChange={setMainProductQuantity}
          onQuantityPress={handleQuantityPress}
        />
      );
    }

    return null;
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.container}>
          <ProductHeader
            imgTitle={imgTitle}
            price={price}
            product={localProduct}
            vip_level={vip_level}
            vip_discount={vip_discount}
            onClose={onClose}
          />
          
          {renderSkuSelector()}
        </View>
      </ScrollView>

      <BottomActionBar
        selectedSize={selectedSize}
        totalPrice={totalPrice}
        product={localProduct}
        onAddToCart={addCartHandel}
      />

      <ProductCardModals
        deleteModalVisible={deleteModalVisible}
        alertModalVisible={alertModalVisible}
        alertMessage={alertMessage}
        quantityInputVisible={quantityInputVisible}
        quantityInput={quantityInput}
        onCancelDelete={cancelDelete}
        onNavigateToCart={handleNavigateToCart}
        onAlertConfirm={() => setAlertModalVisible(false)}
        onAlertCancel={() => setAlertModalVisible(false)}
        onQuantityInputConfirm={handleQuantityInputConfirm}
        onQuantityInputCancel={() => {
          setQuantityInputVisible(false);
          setEditingItem(null);
          setQuantityInput("");
        }}
        onQuantityInputChange={setQuantityInput}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 19,
    paddingBottom: widthUtils(118, 118).height,
  },
});

export default ProductCard;