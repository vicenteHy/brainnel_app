import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, Image, Dimensions, ScrollView } from "react-native";
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
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const userStore = useUserStore();
    
    const bannerData = useMemo(
      () => [
        {
          imgUrl: require("../../../../assets/img/activity1.png"),
          add: "TikTokScreen",
        },
      ],
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

    // 自动轮播
    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % bannerData.length;
          scrollViewRef.current?.scrollTo({
            x: nextIndex * screenWidth,
            animated: true,
          });
          return nextIndex;
        });
      }, 3000);

      return () => clearInterval(timer);
    }, [bannerData.length, screenWidth]);

    const handleScroll = (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / screenWidth);
      setCurrentIndex(index);
    };

    const handleBannerPress = useCallback(async (index: number) => {
      // 如果正在刷新或正在检查状态，禁用点击
      if (isRefreshing || isCheckingStatus) {
        return;
      }
      
      // 活动 banner 的点击逻辑
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
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={{ height: 240 }}
        >
          {bannerData.map((banner, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleBannerPress(index)}
              activeOpacity={1}
              style={{
                width: screenWidth,
                height: 240,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#f2f2f2",
              }}
              disabled={isRefreshing || isCheckingStatus}
            >
              <Image
                source={banner.imgUrl}
                style={{ 
                  width: "100%", 
                  height: "100%"
                }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <View style={{
          position: 'absolute',
          bottom: 10,
          left: 0,
          right: 0,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {bannerData.map((_, index) => (
            <View
              key={index}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: currentIndex === index ? '#FF6600' : 'rgba(255, 255, 255, 0.5)',
                marginHorizontal: 4,
              }}
            />
          ))}
        </View>
        
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