import React, { useCallback, useMemo, useState, useEffect } from "react";
import { View, TouchableOpacity, Image, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { styles } from "../styles";
import { SpinWheelModal } from "../../activity/SpinWheelModal";
import { WinningModal } from "../../activity/WinningModal";
import useUserStore from "../../../store/user";
import { getActivityStatus } from "../../../services/api/activity";

interface CarouselBannerProps {
  onCameraPress: () => void;
  onLoginRequired: () => void;
}

export const CarouselBanner = React.memo(
  ({ onCameraPress, onLoginRequired }: CarouselBannerProps) => {
    const screenWidth = Dimensions.get("window").width;
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const [showSpinWheel, setShowSpinWheel] = useState(false);
    const [showWinningModal, setShowWinningModal] = useState(false);
    const [currentRewardAmount, setCurrentRewardAmount] = useState(0);
    const userStore = useUserStore();
    
    const bannerData = useMemo(
      () => ({
        imgUrl: require("../../../../assets/img/activity.png"),
        add: "TikTokScreen",
      }),
      [],
    );

    // 获取用户活动状态
    useEffect(() => {
      const fetchActivityStatus = async () => {
        if (userStore.user?.user_id) {
          try {
            const status = await getActivityStatus();
            const amount = parseFloat(status.current_reward_amount) || 0;
            console.log('[CarouselBanner] 获取到的活动金额:', amount);
            setCurrentRewardAmount(amount);
          } catch (error) {
            console.log('获取活动状态失败:', error);
          }
        }
      };
      fetchActivityStatus();
    }, [userStore.user?.user_id]);

    const handleBannerPress = useCallback(() => {
      // 检查用户是否已登录
      if (!userStore.user?.user_id) {
        // 用户未登录，显示登录弹窗
        onLoginRequired();
      } else {
        // 用户已登录，检查金额
        console.log('[CarouselBanner] 点击时的金额:', currentRewardAmount);
        if (currentRewardAmount >= 4000) {
          // 金额大于等于4000，直接跳转到挖矿游戏
          navigation.navigate('MiningGameScreen');
        } else {
          // 金额小于4000，显示转盘弹窗
          setShowSpinWheel(true);
        }
      }
    }, [userStore.user, onLoginRequired, currentRewardAmount, navigation]);
    
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
            // 跳转到挖矿游戏
            navigation.navigate('MiningGameScreen');
          }}
        />
      </View>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.onCameraPress === nextProps.onCameraPress && prevProps.onLoginRequired === nextProps.onLoginRequired;
  },
);