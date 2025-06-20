import React, { useCallback, useMemo } from "react";
import { View, TouchableOpacity, Image, Dimensions } from "react-native";
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
    
    const bannerData = useMemo(
      () => ({
        imgUrl: require("../../../../assets/img/Group_1994.png"),
        add: "TikTokScreen",
      }),
      [],
    );

    const handleBannerPress = useCallback(
      (screenName: string) => {
        navigation.navigate(screenName);
      },
      [navigation],
    );
    
    return (
      <View style={styles.swiperContainer}>
        <TouchableOpacity
          onPress={() => handleBannerPress(bannerData.add)}
          activeOpacity={1}
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#f2f2f2",
            borderRadius: 0,
            overflow: "hidden",
            height: 200,
            
          }}
        >
          <Image
            source={bannerData.imgUrl}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
            defaultSource={require("../../../../assets/img/banner en (3).png")}
          />
        </TouchableOpacity>
      </View>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.onCameraPress === nextProps.onCameraPress;
  },
);