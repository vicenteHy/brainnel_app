import React, { useRef, useEffect } from "react";
import { View, Animated } from "react-native";
import { styles } from "../styles";

export const ProductSkeleton = React.memo(() => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
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

  return (
    <View style={styles.beautyProductCard1}>
      <View style={styles.skeletonImage}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        />
      </View>
      <View style={styles.beautyProductCard}>
        <View style={styles.skeletonTitle}>
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
        </View>
        <View style={[styles.skeletonTitle, { width: "60%" }]}>
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
        </View>
        <View style={styles.beautyProductInfoRow}>
          <View style={styles.flexRowCentered}>
            <View style={styles.skeletonPrice}>
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
        <View style={styles.skeletonSales}>
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