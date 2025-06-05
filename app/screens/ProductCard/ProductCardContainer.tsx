import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  ProductDetailParams,
  ProductGroupList,
} from "../../services/api/productApi";
import { 
  ProductHeader, 
  UnifiedSkuSelector, 
  BottomActionBar, 
  ProductCardModals 
} from "./components";
import { useProductCard } from "./hooks/useProductCard";
import widthUtils from "../../utils/widthUtils";

interface ProductCardContainerProps {
  onClose: () => void;
  product: ProductDetailParams;
  groupList: ProductGroupList[];
}

const ProductCardContainer: React.FC<ProductCardContainerProps> = ({
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
    handleAddToCart,
    handleCancelDelete,
    handleNavigateToCart,
    setMainProductQuantity,
    setQuantityInput,
    setQuantityInputVisible,
    setEditingItem,
    setAlertModalVisible,
  } = useProductCard({ localProduct, localGroupList });

  // 渲染SKU选择器
  const renderSkuSelector = () => {
    return (
      <UnifiedSkuSelector
        product={localProduct}
        skuQuantities={skuQuantities}
        mainProductQuantity={mainProductQuantity}
        onQuantityChange={(index, quantity) => {
          // 对于无SKU和单SKU的情况，index为0，直接设置主产品数量
          if (!localProduct.skus || localProduct.skus.length <= 1) {
            setMainProductQuantity(quantity);
          } else {
            // 对于多SKU的情况，使用原有的处理逻辑
            handleSkuQuantityChange(index, quantity);
          }
        }}
        onQuantityPress={handleQuantityPress}
      />
    );
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
        onAddToCart={handleAddToCart}
      />

      <ProductCardModals
        deleteModalVisible={deleteModalVisible}
        alertModalVisible={alertModalVisible}
        alertMessage={alertMessage}
        quantityInputVisible={quantityInputVisible}
        quantityInput={quantityInput}
        onCancelDelete={handleCancelDelete}
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

export default ProductCardContainer; 