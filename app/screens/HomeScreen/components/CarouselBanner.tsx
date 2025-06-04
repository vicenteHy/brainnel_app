import React, { useState, useCallback, useMemo } from "react";
import { View, TouchableOpacity, Image, Dimensions } from "react-native";
import Carousel from "react-native-reanimated-carousel";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { styles } from "../styles";

interface CarouselBannerProps {
  onCameraPress: () => void;
}

export const CarouselBanner = React.memo(
  ({ onCameraPress }: CarouselBannerProps) => {
    const screenWidth = Dimensions.get("window").width;
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const [currentIndex, setCurrentIndex] = useState(0);
    
    const data = useMemo(
      () => [
        {
          imgUrl: require("../../../../assets/img/banner en (5)_compressed.png"),
          add: "TikTokScreen",
        },
        {
          imgUrl: require("../../../../assets/img/banner en (3)_compressed.png"),
          add: "MemberIntroduction",
        },
        {
          imgUrl: require("../../../../assets/img/banner en (4)_compressed.png"),
          add: "CompanyScreen",
        },
      ],
      [],
    );

    const handleBannerPress = useCallback(
      (screenName: string) => {
        navigation.navigate(screenName);
      },
      [navigation],
    );
    
    const onSnapToItem = useCallback((index: number) => {
      setCurrentIndex(index);
    }, []);
    
    return (
      <View style={styles.swiperContainer}>
        <Carousel
          loop
          width={screenWidth}
          data={data}
          height={300}
          modeConfig={{
            parallaxScrollingScale: 0.9,
            parallaxScrollingOffset: 50,
          }}
          onSnapToItem={onSnapToItem}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleBannerPress(item.add)}
              key={item.imgUrl}
              activeOpacity={1}
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#f2f2f2",
                borderRadius: 0,
                overflow: "hidden",
              }}
            >
              <Image
                source={item.imgUrl}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
                defaultSource={require("../../../../assets/img/banner en (3).png")}
              />
            </TouchableOpacity>
          )}
        />
        {/* 轮播图指示灯 */}
        <View style={styles.indicatorContainer}>
          {data.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex
                  ? styles.activeIndicator
                  : styles.inactiveIndicator,
              ]}
            />
          ))}
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.onCameraPress === nextProps.onCameraPress;
  },
);