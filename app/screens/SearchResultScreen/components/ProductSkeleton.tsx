import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import widthUtils from "../../../utils/widthUtils";

const ProductSkeleton = React.memo(() => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );

    shimmerAnimation.start();

    return () => {
      shimmerAnimation.stop();
    };
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const styles = {
    productCard: {
      flex: 1,
      margin: 8,
      backgroundColor: "#fff",
      borderRadius: 8,
      overflow: "hidden" as "hidden",
    },
    productImageContainer: {
      height: widthUtils(190, 190).height,
      backgroundColor: "#f9f9f9",
      alignItems: "center" as "center",
      justifyContent: "center" as "center",
    },
    imagePlaceholder: {
      backgroundColor: '#EAEAEA',
      justifyContent: 'center' as 'center',
      alignItems: 'center' as 'center',
      borderRadius: 8,
    },
    productInfo: {
      padding: 8,
    },
    skeletonText: {
      backgroundColor: '#EAEAEA',
      borderRadius: 4,
      overflow: "hidden" as "hidden",
      position: "relative" as "relative",
    },
    shimmer: {
      width: "30%",
      height: "100%",
      backgroundColor: "rgba(255, 255, 255, 0.3)",
      position: "absolute" as "absolute",
      top: 0,
      left: 0,
    },
  };

  return (
    <View style={styles.productCard}>
      <View style={[styles.productImageContainer, styles.imagePlaceholder]}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        />
      </View>
      <View style={styles.productInfo}>
        <View style={[styles.skeletonText, { width: '90%', height: 16, marginBottom: 8 }]}>
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
        </View>
        <View style={[styles.skeletonText, { width: '70%', height: 16, marginBottom: 8 }]}>
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
        </View>
        <View style={[styles.skeletonText, { width: '40%', height: 24, marginBottom: 4 }]}>
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
        </View>
        <View style={[styles.skeletonText, { width: '30%', height: 12 }]}>
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
});

export default ProductSkeleton;