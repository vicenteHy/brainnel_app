import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Product } from "../../../services/api/productApi";
import { getSubjectTransLanguage } from "../../../utils/languageUtils";
import { styles } from "../styles";

type IconProps = {
  name: string;
  size: number;
  color: string;
};

const IconComponent = React.memo(({ name, size, color }: IconProps) => {
  const Icon = Ionicons as any;
  return <Icon name={name} size={size} color={color} />;
});

// 懒加载图片组件
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
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    
    const onLoad = useCallback(() => {
      setIsLoaded(true);
    }, []);
    
    const onError = useCallback(() => {
      setHasError(true);
      setIsLoaded(true);
    }, []);
    
    return (
      <View style={[style, { overflow: "hidden" }]}>
        {!isLoaded && !hasError && (
          <View
            style={[
              style,
              styles.imagePlaceholder,
              { position: "absolute", zIndex: 1 },
            ]}
          />
        )}
        {hasError && (
          <View
            style={[
              style,
              styles.imagePlaceholder,
              { position: "absolute", zIndex: 1 },
            ]}
          >
            <IconComponent name="image-outline" size={24} color="#999" />
            <Text
              style={{ fontSize: 12, color: "#999", marginTop: 4 }}
            >
              加载失败
            </Text>
          </View>
        )}
        <Image
          source={{ uri }}
          style={[style, { opacity: isLoaded ? 1 : 0 }]}
          resizeMode={resizeMode}
          onLoad={onLoad}
          onError={onError}
        />
      </View>
    );
  },
);

interface ProductItemProps {
  item: Product & { _uniqueId?: number };
  onPress: (item: Product) => void;
  userStore: any;
  t: any;
}

export const ProductItem = React.memo(
  ({ item, onPress, userStore, t }: ProductItemProps) => (
    <TouchableOpacity
      onPress={() => onPress(item)}
      activeOpacity={0.9}
      style={styles.beautyProductCard1}
    >
      <View style={styles.beautyCardContainer1}>
        {item.product_image_urls && item.product_image_urls.length > 0 ? (
          <LazyImage
            uri={item.product_image_urls[0]}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.productImage as any, styles.imagePlaceholder]}>
            <IconComponent name="image-outline" size={24} color="#999" />
          </View>
        )}
        {userStore.user?.user_id && userStore.user?.vip_level > 0 && (
          <View style={styles.vipButtonContainer}>
            <TouchableOpacity style={styles.vipButton}>
              <Text style={styles.vipButtonText}>VIP</Text>
              <Text style={styles.vipLabelBold}>
                {userStore.user?.vip_level}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={styles.beautyProductCard}>
        <Text
          style={styles.beautyProductTitle}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {getSubjectTransLanguage(item) || item.subject_trans}
        </Text>
        <View style={styles.beautyProductInfoRow}>
          <View style={styles.flexRowCentered}>
            {userStore.user?.user_id && (
              <Text style={styles.priceLabel1}>
                {item.original_min_price || "0"}
                {item.currency || "FCFA"}
              </Text>
            )}
            <View style={styles.priceContainer}>
              <Text style={styles.highlightedText}>
                {item.min_price || "0"}
              </Text>
              <Text style={styles.highlightedText1}>
                {userStore.user?.currency || item.currency || "FCFA"}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.beautySalesInfo}>
          {/* {item.sold_out || "0"}+ {t("homePage.sales")} */}
        </Text>
      </View>
    </TouchableOpacity>
  ),
  (prevProps, nextProps) => {
    return (
      prevProps.item._uniqueId === nextProps.item._uniqueId &&
      prevProps.item.offer_id === nextProps.item.offer_id &&
      prevProps.item.min_price === nextProps.item.min_price &&
      prevProps.userStore.user?.user_id === nextProps.userStore.user?.user_id
    );
  },
);