import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import Carousel from 'react-native-reanimated-carousel';
import HeartIcon from '../../../components/HeartIcon';
import HeartRedIcon from '../../../components/HeartIconRed';
import { productApi } from '../../../services/api/productApi';
import useProductCartStore from '../../../store/productCart';
import widthUtils from '../../../utils/widthUtils';
import fontSize from '../../../utils/fontsizeUtils';
import { styles } from '../styles';

interface ProductImageCarouselProps {
  product: any;
}

type ProductDetailRouteParams = {
  offer_id: string;
  searchKeyword?: string;
  price: number;
};

export const ProductImageCarousel: React.FC<ProductImageCarouselProps> = ({
  product,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const screenWidth = Dimensions.get("window").width;
  const { setProduct } = useProductCartStore();
  const route = useRoute<RouteProp<Record<string, ProductDetailRouteParams>, string>>();

  const handleFavoritePress = () => {
    setProduct({
      ...product,
      is_favorited: !product.is_favorited,
    });
    productApi.collectProduct(route.params.offer_id);
  };

  return (
    <View style={styles.imageCarouselContainer}>
      <View style={{ position: "relative" }}>
        <Carousel
          loop
          width={screenWidth}
          data={product?.product_image_urls || []}
          height={widthUtils(430, 430).height}
          onSnapToItem={(index) => setActiveIndex(index)}
          modeConfig={{
            parallaxScrollingScale: 0.9,
            parallaxScrollingOffset: 50,
          }}
          renderItem={({ item }) => (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#f2f2f2",
                borderRadius: 10,
              }}
            >
              <Image
                source={{ uri: item as string }}
                style={{ width: "100%", height: "100%" }}
              />
            </View>
          )}
        />
        
        {/* 收藏按钮 */}
        <View
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            width: 40,
            height: 40,
            backgroundColor: "#efefef",
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity onPress={handleFavoritePress} activeOpacity={1}>
            {product?.is_favorited ? (
              <HeartRedIcon size={20} color="red" />
            ) : (
              <HeartIcon size={20} color="#373737" />
            )}
          </TouchableOpacity>
        </View>
        
        {/* 页面指示器 */}
        <View
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            backgroundColor: "gray",
            borderRadius: 13,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={styles.activeIndexText}>
            {activeIndex + 1}/{product?.product_image_urls?.length}
          </Text>
        </View>
      </View>
    </View>
  );
};