
import React, { useCallback, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import useUserStore from "../store/user";
import { getSubjectTransLanguage } from "../utils/languageUtils";
import fontSize from "../utils/fontsizeUtils";
import widthUtils from "../utils/widthUtils";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
    type Product,
  } from "../services/api/productApi";


// 商品图片懒加载组件
const LazyImage = React.memo(
  ({
    uri,
    style,
    resizeMode,
  }: {
    uri: string;
    style: any;
    resizeMode: any;
  }) => {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [hasError, setHasError] = React.useState(false);

    return (
      <View style={[style, { overflow: "hidden" }]}> 
        {!isLoaded && !hasError && (
          <View style={[style, styles.imagePlaceholder, { position: 'absolute', zIndex: 1 }]} />
        )}
        {hasError && (
          <View style={[style, styles.imagePlaceholder, { position: 'absolute', zIndex: 1 }]}> 
            <Text style={{ fontSize: fontSize(12), color: "#999", marginTop: 4 }}>
              加载失败
            </Text>
          </View>
        )}
        <Image
          source={{ uri }}
          style={[style, { opacity: isLoaded ? 1 : 0 }]}
          resizeMode={resizeMode}
          onLoad={() => setIsLoaded(true)}
          onError={() => { setHasError(true); setIsLoaded(true); }}
        />
      </View>
    );
  }
);

// 1. 定义导航参数类型
type RootStackParamList = {
    ProductDetail: { offer_id: number; price: number };
    // ...其他页面
  };
  
// 商品项组件
const ProductItem = React.memo(
  ({
    product,
    onPress,
  }: {
    product: Product;
    onPress: (product: Product) => void;
  }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => onPress(product)}
      activeOpacity={0.7}
      key={product.offer_id}
    >
      <View style={styles.productImageContainer}>
        {product.product_image_urls[0] ? (
          <LazyImage
            uri={product.product_image_urls[0]}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.placeholderText}>无图片</Text>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.categoryText} numberOfLines={2}>
          {getSubjectTransLanguage(product)}
        </Text>
        <View style={styles.beautyProductInfoRow}>
          <View style={styles.flexRowCentered}>
            <View style={styles.priceContainer}>
              <Text style={styles.highlightedText}>
                {product.min_price || "0"}
              </Text>
              <Text style={styles.highlightedText1}>
                {product.currency || "FCFA"}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.productSales}>
          {product.sold_out} {product.sold_out === 0 ? "" : "+"} 销量
        </Text>
      </View>
    </TouchableOpacity>
  )
);

export default function ProductList({ products }: { products: Product[] }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const userStore = useUserStore();
  const flatListRef = useRef<FlatList>(null);

  // 跳转到详情页
  const handleProductPress = useCallback(
    (product: Product) => {
      navigation.navigate("ProductDetail", {
        offer_id: product.offer_id,
        price: product.min_price,
      });
    },
    [navigation]
  );

  // 渲染商品项
  const renderProductItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductItem
        product={item}
        onPress={handleProductPress}
      />
    ),
    [handleProductPress]
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item, index) => `${item.offer_id}-${index}`}
        numColumns={1}
        contentContainerStyle={styles.productGrid}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  productGrid: {
    padding: 8,
  },
  productCard: {
    flex: 1,
    margin: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
  },
  productImageContainer: {
    height: widthUtils(190, 190).height,
    backgroundColor: "#f9f9f9",
    alignItems: "center",
    justifyContent: "center",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  placeholderText: {
    color: "#999",
    fontSize: fontSize(14),
  },
  productInfo: {
    padding: 8,
  },
  categoryText: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "600",
    marginBottom: 4,
  },
  beautyProductInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  flexRowCentered: {},
  priceContainer: {
    flexDirection: "row",
  },
  highlightedText: {
    fontWeight: "700",
    fontSize: fontSize(24),
    color: "#ff5100",
  },
  highlightedText1: {
    fontWeight: "700",
    fontSize: fontSize(14),
    color: "#ff5100",
  },
  productSales: {
    fontSize: fontSize(14),
    fontWeight: "600",
    color: "#7c7c7c",
  },
  imagePlaceholder: {
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
});
