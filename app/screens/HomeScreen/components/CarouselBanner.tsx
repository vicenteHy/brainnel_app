import React, { useCallback, useMemo, useState } from "react";
import { View, TouchableOpacity, Image, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { styles } from "../styles";
import { SpinWheelModal } from "../../activity/SpinWheelModal";
import { WinningModal } from "../../activity/WinningModal";

interface CarouselBannerProps {
  onCameraPress: () => void;
}

export const CarouselBanner = React.memo(
  ({ onCameraPress }: CarouselBannerProps) => {
    const screenWidth = Dimensions.get("window").width;
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const [showSpinWheel, setShowSpinWheel] = useState(false);
    const [showWinningModal, setShowWinningModal] = useState(false);
    
    const bannerData = useMemo(
      () => ({
        imgUrl: require("../../../../assets/img/activity.png"),
        add: "TikTokScreen",
      }),
      [],
    );

    const handleBannerPress = useCallback(() => {
      setShowSpinWheel(true);
    }, []);
    
    const handleSpinPress = useCallback(() => {
      // 处理转盘旋转逻辑
      console.log('Spin wheel pressed');
    }, []);
    
    const handleWin = useCallback((amount: number) => {
      setShowWinningModal(true);
    }, []);
    
    return (
      <View style={styles.swiperContainer}>
        <TouchableOpacity
          onPress={handleBannerPress}
          activeOpacity={1}
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#f2f2f2",
            borderRadius: 0,
            overflow: "hidden",
            height: 240,
            
          }}
        >
          <Image
            source={bannerData.imgUrl}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
            defaultSource={require("../../../../assets/img/activity.png")}
          />
        </TouchableOpacity>
        
        <SpinWheelModal
          visible={showSpinWheel}
          onClose={() => setShowSpinWheel(false)}
          onSpinPress={handleSpinPress}
          onWin={handleWin}
          currentCoins={0}
          totalCoins={5000}
        />
        
        <WinningModal
          visible={showWinningModal}
          onClose={() => setShowWinningModal(false)}
          onContinue={() => {
            setShowWinningModal(false);
            // 可以在这里添加其他逻辑
          }}
        />
      </View>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.onCameraPress === nextProps.onCameraPress;
  },
);