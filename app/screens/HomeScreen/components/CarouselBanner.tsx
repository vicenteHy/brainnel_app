import React, { useCallback, useMemo, useState, useEffect } from "react";
import { View, TouchableOpacity, Image, Dimensions } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { styles } from "../styles";
import { SpinWheelModal } from "../../activity/SpinWheelModal";
import { WinningModal } from "../../activity/WinningModal";
import { ActivityCompletedModal } from "../../activity/ActivityCompletedModal";
import useUserStore from "../../../store/user";
import { getActivityStatus } from "../../../services/api/activity";

interface CarouselBannerProps {
  onCameraPress: () => void;
  onLoginRequired: () => void;
  isRefreshing?: boolean;
}

export const CarouselBanner = React.memo(
  ({ onCameraPress, onLoginRequired, isRefreshing = false }: CarouselBannerProps) => {
    const screenWidth = Dimensions.get("window").width;
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const [showSpinWheel, setShowSpinWheel] = useState(false);
    const [showWinningModal, setShowWinningModal] = useState(false);
    const [showActivityCompletedModal, setShowActivityCompletedModal] = useState(false);
    const [currentRewardAmount, setCurrentRewardAmount] = useState(0);
    const [isActivityFinished, setIsActivityFinished] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const userStore = useUserStore();
    
    const bannerData = useMemo(
      () => ({
        imgUrl: require("../../../../assets/img/activity1.png"),
        add: "TikTokScreen",
      }),
      [],
    );

    // 定义获取活动状态的函数
    const fetchActivityStatus = useCallback(async () => {
      if (userStore.user?.user_id) {
        try {
          const status = await getActivityStatus();
          const amount = parseFloat(status.current_reward_amount) || 0;
          const finished = status.is_finished === 1;
          setCurrentRewardAmount(amount);
          setIsActivityFinished(finished);
        } catch (error) {
        }
      }
    }, [userStore.user?.user_id]);

    // 获取用户活动状态 - 组件挂载时
    useEffect(() => {
      fetchActivityStatus();
    }, [fetchActivityStatus]);

    // 页面获得焦点时重新获取活动状态
    useFocusEffect(
      useCallback(() => {
        fetchActivityStatus();
      }, [fetchActivityStatus])
    );

    const handleBannerPress = useCallback(async () => {
      // 如果正在刷新或正在检查状态，禁用点击
      if (isRefreshing || isCheckingStatus) {
        return;
      }
      
      // 检查用户是否已登录
      if (!userStore.user?.user_id) {
        // 用户未登录，显示登录弹窗
        onLoginRequired();
      } else {
        // 设置检查状态标志，防止重复点击
        setIsCheckingStatus(true);
        
        // 用户已登录，先实时获取最新的活动状态
        try {
          const status = await getActivityStatus();
          const latestAmount = parseFloat(status.current_reward_amount) || 0;
          const latestIsFinished = status.is_finished === 1;
          
          // 更新本地状态
          setCurrentRewardAmount(latestAmount);
          setIsActivityFinished(latestIsFinished);
          
          // 使用最新的状态进行判断
          if (latestIsFinished) {
            // 活动已完成，显示提示弹窗
            setShowActivityCompletedModal(true);
          } else {
            // 活动未完成，检查金额
            if (latestAmount >= 4000) {
              // 金额大于等于4000，直接跳转到挖矿游戏
              navigation.navigate('MiningGameScreen');
            } else {
              // 金额小于4000，显示转盘弹窗
              setShowSpinWheel(true);
            }
          }
        } catch (error) {
          console.error('获取活动状态失败:', error);
          // 如果获取失败，使用本地缓存的状态
          if (isActivityFinished) {
            setShowActivityCompletedModal(true);
          } else {
            if (currentRewardAmount >= 4000) {
              navigation.navigate('MiningGameScreen');
            } else {
              setShowSpinWheel(true);
            }
          }
        } finally {
          // 重置检查状态标志
          setIsCheckingStatus(false);
        }
      }
    }, [userStore.user, onLoginRequired, currentRewardAmount, isActivityFinished, navigation, isRefreshing, isCheckingStatus]);
    
    const handleSpinPress = useCallback(() => {
      // 处理转盘旋转逻辑
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
          disabled={isRefreshing || isCheckingStatus}
        >
          <Image
            source={bannerData.imgUrl}
            style={{ 
              width: "100%", 
              height: "100%"
            }}
            resizeMode="cover"
            defaultSource={require("../../../../assets/img/activity1.png")}
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
        
        <ActivityCompletedModal
          visible={showActivityCompletedModal}
          onClose={() => setShowActivityCompletedModal(false)}
        />
      </View>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.onCameraPress === nextProps.onCameraPress && 
           prevProps.onLoginRequired === nextProps.onLoginRequired &&
           prevProps.isRefreshing === nextProps.isRefreshing;
  },
);