import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Share,
  Alert,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Linking, Clipboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import useMiningStore from '../../store/miningStore';
import useUserStore from '../../store/user';
import GiftModal from './GiftModal';
import MiningRewardModal from './MiningRewardModal';
import { updateRewardAmount, playGame, getInvitationLink, getActivityStatus } from '../../services/api/activity';
import useActivityStore from '../../store/activityStore';
import Toast from 'react-native-toast-message';

const { width: screenWidth } = Dimensions.get('window');

const MiningGameScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { user } = useUserStore();
  const {
    balance,
    currentDepth,
    digCount,
    requiredAmount,
    targetAmount,
    dig,
    rechargeDigs,
    getProgress,
    withdraw,
    referralCode,
    addReward,
  } = useMiningStore();
  
  const [isDigging, setIsDigging] = useState(false);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [miningRewardVisible, setMiningRewardVisible] = useState(false);
  const [currentReward, setCurrentReward] = useState(0);
  const [showDigEffect, setShowDigEffect] = useState(false);
  const [currentTotalReward, setCurrentTotalReward] = useState(0);
  const [displayedReward, setDisplayedReward] = useState(0);
  const [userInvitationLink, setUserInvitationLink] = useState<string | null>(null);
  const [targetRewardAmount, setTargetRewardAmount] = useState(0);
  const [isActivityInitialized, setIsActivityInitialized] = useState(false);
  const [showTaskCenterBubble, setShowTaskCenterBubble] = useState(true);
  const [availableGameAttempts, setAvailableGameAttempts] = useState(0);
  const digAnimation = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const bubbleAnimation = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<any>(null);
  const fingerAnimation = useRef(new Animated.Value(0)).current;
  const rippleAnimation = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const taskCenterAnimation = useRef(new Animated.Value(1)).current;

  const progress = getProgress();

  // 数字滚动动画函数
  const animateValue = (start: number, end: number, duration: number) => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
    
    const startTime = Date.now();
    const diff = end - start;
    
    animationRef.current = setInterval(() => {
      const currentTime = Date.now();
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // 使用缓动函数
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = start + (diff * easeProgress);
      
      setDisplayedReward(Math.floor(currentValue));
      
      if (progress >= 1) {
        clearInterval(animationRef.current);
        setDisplayedReward(end);
      }
    }, 16); // 约60fps
  };

  useEffect(() => {
    rechargeDigs();
    const interval = setInterval(rechargeDigs, 60000);
    
    // 获取活动状态数据
    const fetchActivityStatus = async () => {
      try {
        console.log('挖矿游戏 - 获取活动状态数据...');
        const data = await getActivityStatus();
        console.log('挖矿游戏 - 活动状态返回:', data);
        
        // 保存当前累积金额和目标金额
        const currentAmount = parseFloat(data.current_reward_amount) || 0;
        const targetAmount = parseFloat(data.target_reward_amount) || 0;
        const gameAttempts = data.available_game_attempts || 0;
        setCurrentTotalReward(currentAmount);
        setDisplayedReward(currentAmount);
        setTargetRewardAmount(targetAmount);
        setAvailableGameAttempts(gameAttempts);
        setIsActivityInitialized(true);
        
        console.log('挖矿游戏 - 当前累积奖励金额:', currentAmount);
        console.log('挖矿游戏 - 目标奖励金额:', targetAmount);
        console.log('挖矿游戏 - 可用游戏次数:', gameAttempts);
        
        // 如果金额小于4500，显示礼品弹窗
        if (currentAmount < 4500 && !giftModalVisible) {
          setTimeout(() => {
            setGiftModalVisible(true);
          }, 500);
        }
        
        // 同时刷新任务状态
        const activityStore = useActivityStore.getState();
        await activityStore.fetchTasks();
        console.log('挖矿游戏 - 任务状态已刷新');
      } catch (error) {
        console.error('挖矿游戏 - 获取活动状态失败:', error);
        setIsActivityInitialized(true); // 即使失败也标记为已初始化
      }
    };
    
    fetchActivityStatus();
    
    // 任务中心按钮动画
    Animated.loop(
      Animated.sequence([
        Animated.timing(taskCenterAnimation, {
          toValue: 1.1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(taskCenterAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // 手指动画
    Animated.loop(
      Animated.sequence([
        Animated.timing(fingerAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fingerAnimation, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // 涟漪动画 - 持续循环
    Animated.loop(
      Animated.sequence([
        // 重置到初始状态
        Animated.parallel([
          Animated.timing(rippleAnimation, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacity, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        // 开始动画
        Animated.parallel([
          Animated.timing(rippleAnimation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(rippleOpacity, {
              toValue: 0.5,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(rippleOpacity, {
              toValue: 0,
              duration: 1300,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ])
    ).start();
    
    return () => {
      clearInterval(interval);
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, []);

  // 监听页面聚焦事件，从其他页面返回时刷新数据
  useFocusEffect(
    React.useCallback(() => {
      console.log('挖矿页面获得焦点，刷新活动状态...');
      const fetchActivityStatusOnFocus = async () => {
        try {
          const data = await getActivityStatus();
          console.log('页面聚焦 - 活动状态返回:', data);
          
          // 更新状态
          const currentAmount = parseFloat(data.current_reward_amount) || 0;
          const targetAmount = parseFloat(data.target_reward_amount) || 0;
          const gameAttempts = data.available_game_attempts || 0;
          
          // 使用动画更新金额
          animateValue(currentTotalReward, currentAmount, 800);
          setCurrentTotalReward(currentAmount);
          setTargetRewardAmount(targetAmount);
          setAvailableGameAttempts(gameAttempts);
          
          console.log('页面聚焦 - 更新金额:', currentAmount);
        } catch (error) {
          console.error('页面聚焦 - 获取活动状态失败:', error);
        }
      };
      
      fetchActivityStatusOnFocus();
    }, [])
  );

  const handleDig = () => {
    if (isDigging) {
      return;
    }

    if (availableGameAttempts <= 0) {
      Alert.alert(t('提示'), t('游戏次数已用完'));
      return;
    }

    setIsDigging(true);
    
    Animated.parallel([
      Animated.sequence([
        Animated.timing(digAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(digAnimation, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        // 左右震动10次
        ...Array(10).fill(null).flatMap(() => [
          Animated.timing(shakeAnimation, {
            toValue: 3,
            duration: 30,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: -3,
            duration: 30,
            useNativeDriver: true,
          }),
        ]),
        // 最后回到中心
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 30,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // 显示挖掘效果
      setShowDigEffect(true);
      
      // 1秒后恢复初始状态
      setTimeout(async () => {
        setShowDigEffect(false);
        
        try {
          // 调用游戏API获取奖励
          console.log('挖矿游戏 - 调用游戏API...');
          const gameResult = await playGame();
          console.log('挖矿游戏 - 游戏结果:', gameResult);
          
          // 只处理现金奖励 (reward_type = 0)
          if (gameResult.reward_type === 0) {
            const rewardAmount = parseFloat(gameResult.reward_amount) || 0;
            if (rewardAmount > 0) {
              setCurrentReward(rewardAmount);
              setMiningRewardVisible(true);
            }
          }
          
          // 无论是否获得奖励，都调用 getActivityStatus 获取最新的活动数据
          try {
            console.log('挖矿游戏 - 调用 getActivityStatus 获取最新数据...');
            const statusData = await getActivityStatus();
            console.log('挖矿游戏 - 状态数据返回:', statusData);
            
            // 使用API返回的最新累积金额、目标金额和游戏次数
            const updatedAmount = parseFloat(statusData.current_reward_amount) || 0;
            const updatedTarget = parseFloat(statusData.target_reward_amount) || 0;
            const updatedAttempts = statusData.available_game_attempts || 0;
            
            // 滚动动画
            animateValue(currentTotalReward, updatedAmount, 1000);
            setCurrentTotalReward(updatedAmount);
            setTargetRewardAmount(updatedTarget);
            setAvailableGameAttempts(updatedAttempts);
            
            console.log('挖矿游戏 - 更新后的累积金额:', updatedAmount);
            console.log('挖矿游戏 - 更新后的目标金额:', updatedTarget);
            console.log('挖矿游戏 - 更新后的游戏次数:', updatedAttempts);
          } catch (updateError) {
            console.error('挖矿游戏 - 获取最新状态失败:', updateError);
          }
          
          // 如果有消息，可以显示给用户
          if (gameResult.message) {
            console.log('游戏消息:', gameResult.message);
          }
        } catch (error) {
          console.error('挖矿游戏 - 调用游戏API失败:', error);
          Alert.alert(t('错误'), t('游戏失败，请重试'));
        }
        
        setIsDigging(false);
      }, 1000);
    });
  };

  const handleWithdraw = () => {
    if (balance < requiredAmount) {
      Alert.alert(t('提示'), t('余额不足，继续挖矿！'));
      return;
    }
    
    // 直接跳转到提现页面
    navigation.navigate('WithdrawalScreen');
  };

  // 获取邀请链接（先从本地获取，没有则调用API）
  const getOrFetchInvitationLink = async (): Promise<string> => {
    try {
      // 先检查内存中是否有链接
      if (userInvitationLink) {
        return userInvitationLink;
      }

      // 检查本地存储
      const storedLink = await AsyncStorage.getItem('user_invitation_link');
      if (storedLink) {
        setUserInvitationLink(storedLink);
        return storedLink;
      }

      // 调用API获取链接
      const response = await getInvitationLink();
      const invitationLink = response.invitation_link;
      
      // 保存到本地存储和内存
      await AsyncStorage.setItem('user_invitation_link', invitationLink);
      setUserInvitationLink(invitationLink);
      
      return invitationLink;
    } catch (error) {
      console.error('获取邀请链接失败:', error);
      // 如果失败，返回默认链接
      const inviteCode = referralCode || user?.id || 'default';
      return `https://brainnel.com/invite?ref=${inviteCode}`;
    }
  };

  const handleInvite = async () => {
    try {
      const shareUrl = await getOrFetchInvitationLink();
      const shareText = "J'y suis presque pour retirer mon cash sur Brainnel ! Télécharge l'appli, inscris-toi pour me donner un coup de main et tente de gagner 5000 FCFA toi aussi !";
      await Share.share({
        message: shareText + '\n\n' + shareUrl,
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = await getOrFetchInvitationLink();
      const shareText = "J'y suis presque pour retirer mon cash sur Brainnel ! Télécharge l'appli, inscris-toi pour me donner un coup de main et tente de gagner 5000 FCFA toi aussi !";
      await Clipboard.setString(shareText + '\n\n' + shareUrl);
      Toast.show({
        type: 'success',
        text1: t('链接已复制'),
        position: 'top',
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error('复制链接失败:', error);
      Alert.alert(t('错误'), t('复制链接失败，请重试'));
    }
  };

  const handleWhatsApp = async () => {
    try {
      const shareUrl = await getOrFetchInvitationLink();
      const shareText = "J'y suis presque pour retirer mon cash sur Brainnel ! Télécharge l'appli, inscris-toi pour me donner un coup de main et tente de gagner 5000 FCFA toi aussi !";
      
      // 先复制链接
      await Clipboard.setString(shareText + '\n\n' + shareUrl);
      
      // 显示复制成功提示
      Toast.show({
        type: 'success',
        text1: t('链接已复制'),
        position: 'top',
        visibilityTime: 2000,
      });
      
      // 延迟一下再打开WhatsApp
      setTimeout(() => {
        const message = encodeURIComponent(shareText + '\n\n' + shareUrl);
        Linking.openURL(`whatsapp://send?text=${message}`);
      }, 500);
    } catch (error) {
      console.error('分享到WhatsApp失败:', error);
      Alert.alert(t('错误'), t('分享失败，请重试'));
    }
  };

  const handleOpenGift = async () => {
    setGiftModalVisible(false);
    // 添加 500 FCFA 到余额
    const giftAmount = 500;
    addReward(giftAmount);
    
    // 调用更新奖励金额接口（累加当前金额）
    try {
      const newTotalAmount = currentTotalReward + giftAmount;
      console.log('宝箱奖励 - 当前累积金额:', currentTotalReward);
      console.log('宝箱奖励 - 本次奖励金额:', giftAmount);
      console.log('宝箱奖励 - 调用更新奖励金额接口，新的总金额:', newTotalAmount);
      
      const updatedData = await updateRewardAmount(newTotalAmount);
      console.log('宝箱奖励 - 更新奖励金额接口返回:', updatedData);
      
      // 更新本地累积金额和目标金额
      const updatedAmount = parseFloat(updatedData.current_reward_amount) || 0;
      const updatedTarget = parseFloat(updatedData.target_reward_amount) || 0;
      
      // 滚动动画
      animateValue(currentTotalReward, updatedAmount, 1000);
      setCurrentTotalReward(updatedAmount);
      setTargetRewardAmount(updatedTarget);
      
      // 打印详细的返回数据
      console.log('=== 宝箱奖励更新后的活动数据 ===');
      console.log('用户ID:', updatedData.user_id);
      console.log('当前奖励金额:', updatedData.current_reward_amount);
      console.log('目标奖励金额:', updatedData.target_reward_amount);
      console.log('金币面具数量:', updatedData.gold_masks_count);
      console.log('目标金币面具数量:', updatedData.target_gole_masks_count);
      console.log('总邀请数:', updatedData.total_invite_count);
      console.log('有效邀请数:', updatedData.effective_invite_count);
      console.log('推荐人ID:', updatedData.referrer_id);
      console.log('===========================');
    } catch (error) {
      console.error('宝箱奖励 - 更新奖励金额失败:', error);
    }
    
    // 已经有礼物弹窗了，不需要额外的Alert
    console.log('领取奖励成功');
  };

  const digTransform = {
    translateY: digAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 20],
    }),
  };

  const progressWidth = targetRewardAmount > 0 ? (currentTotalReward / targetRewardAmount) * 100 : 0;


  const fingerTranslate = fingerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -7.5],
  });

  const rippleScale = rippleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1.5],
  });

  return (
    <View style={styles.container}>
      {/* 背景图片 */}
      <Image 
        source={require('../../../assets/img/img_6271.svg')} 
        style={styles.backgroundImage}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          {/* 顶部余额卡片包含导航栏 */}
          <ImageBackground 
            source={require('../../../assets/img/mask_group_2x.png')}
            style={styles.topCard}
            resizeMode="cover"
          >
            {/* 导航栏 */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={22} color="#000" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Cash Gratuit</Text>
              <View style={styles.headerRight}>
                <Text style={styles.rulesText}>Règles</Text>
                <Text style={styles.separator}> ｜ </Text>
                <Text style={styles.detailsText}>Détails</Text>
              </View>
            </View>
            
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceAmount}>{displayedReward.toLocaleString()} FCFA</Text>
            </View>
          </ImageBackground>

          {/* 进度条卡片 */}
          <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>Reste</Text>
              <Text style={styles.progressAmount}>{Math.max(0, targetRewardAmount - currentTotalReward).toLocaleString()} FCFA</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.progressLabel}>Objectif</Text>
              <Text style={styles.progressAmount}>{targetRewardAmount.toLocaleString()} FCFA</Text>
            </View>
          </View>

          <View style={styles.progressBarWrapper}>
            <Image 
              source={require('../../../assets/img/rectangle_103_2x.png')}
              style={styles.progressBarBg}
              resizeMode="stretch"
            />
            <LinearGradient
              colors={['#FF5100', '#FFDD9E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBar, { width: `${progressWidth}%` }]}
            />
            <Image 
              source={require('../../../assets/img/group_737.png')}
              style={[styles.progressCoin, { left: `${progressWidth}%` }]}
              resizeMode="contain"
            />
          </View>

          <View style={styles.progressFooter}>
            <Text style={styles.reminderText}>On y est presque !</Text>
            <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw}>
              <Text style={styles.withdrawText}>Retirer</Text>
            </TouchableOpacity>
          </View>
          </View>

          {/* 挖矿游戏区域 */}
          <ImageBackground 
          source={require('../../../assets/img/mask_group_2x1.png')}
          style={styles.gameArea}
          resizeMode="contain"
        >
          <TouchableOpacity 
            style={styles.digButton} 
            onPress={handleDig}
            disabled={isDigging || availableGameAttempts <= 0}
          >
            <Text style={styles.digButtonText}>Forer maintenant ({availableGameAttempts})</Text>
          </TouchableOpacity>

          <View style={styles.minerContainer}>
            {showDigEffect ? (
              <>
                {/* 挖掘通道 */}
                <Image 
                  source={require('../../../assets/img/Vector 87 1.png')} 
                  style={{ position: 'absolute', top: 0, left: -40, transform: [{ scale: 0.52  }] }}
                />
                {/* 在通道尽头的阴影 */}
                <Image 
                  source={require('../../../assets/img/Ellipse 164 2.png')} 
                  style={{ position: 'absolute', top: 80, left: -45, transform: [{ scale: 0.55 }] }}
                />
                {/* 在通道尽头的小人 */}
                <Image 
                  source={require('../../../assets/img/Group 125 1.png')} 
                  style={{ position: 'absolute', top: 150, left: -35, transform: [{ scale: 0.52  }] }}
                />
              </>
            ) : (
              <>
                {/* 阴影保持静止 */}
                <Image 
                  source={require('../../../assets/img/Ellipse 164 2.png')} 
                  style={{ position: 'absolute', top: 80, left: -45, transform: [{ scale: 0.55 }] }}
                />
                {/* 只有小人移动 */}
                <Animated.Image 
                  source={require('../../../assets/img/group_86_2x.png')} 
                  style={[
                    styles.minerImage,
                    { transform: [digTransform, { translateX: shakeAnimation }] }
                  ]}
                />
              </>
            )}
          </View>


          </ImageBackground>

          {/* 金币图标 - 任务中心按钮 */}
          <View style={styles.taskCenterContainer}>
            <Animated.View
              style={{
                transform: [{ scale: taskCenterAnimation }]
              }}
            >
              <TouchableOpacity 
                style={styles.bottomGold}
                onPress={() => {
                  navigation.navigate('TaskCenter');
                }}
              >
                <Image 
                  source={require('../../../assets/img/group_139_1.png')}
                  style={{ width: '100%', height: '100%' }}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* 邀请好友区域 */}
          <ImageBackground 
          source={require('../../../assets/img/group_138_2x.png')}
          style={styles.inviteSection}
          resizeMode="contain"
        >
          <View style={styles.inviteButtons}>
            <View style={{ position: 'relative' }}>
              <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
                <Text style={styles.whatsappText}>WhatsApp</Text>
              </TouchableOpacity>
              
              {/* 手指图标和涟漪效果 - 在按钮外部 */}
              <Animated.View
                style={[
                  styles.fingerContainer,
                  {
                    transform: [{ translateY: fingerTranslate }]
                  }
                ]}
                pointerEvents="none"
              >
                {/* 涟漪效果跟随手指 */}
                <Animated.View 
                  style={[
                    styles.fingerRipple,
                    {
                      opacity: rippleOpacity,
                      transform: [{ scale: rippleScale }]
                    }
                  ]}
                />
                {/* 手指图标 */}
                <Image 
                  source={require('../../../assets/img/finger.png')}
                  style={styles.fingerImage}
                />
              </Animated.View>
            </View>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
              <Text style={styles.copyText}>Copier le lien</Text>
            </TouchableOpacity>
          </View>
          </ImageBackground>
        </View>
      </ScrollView>

      {/* 礼品弹窗 */}
      <GiftModal
        visible={giftModalVisible}
        onClose={() => setGiftModalVisible(false)}
        onOpen={handleOpenGift}
      />
      
      {/* 挖矿奖励弹窗 */}
      <MiningRewardModal
        visible={miningRewardVisible}
        onClose={() => setMiningRewardVisible(false)}
        rewardAmount={currentReward}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F8',
  },
  backgroundImage: {
    position: 'absolute',
    width: screenWidth,
    height: 980,
    top: 0,
    left: 0,
  },
  headerWrapper: {
    backgroundColor: 'transparent',
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 80,
    paddingBottom: 10,
  },
  headerTitle: {
    alignItems: 'center',
    marginLeft: 80,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rulesText: {
    fontSize: 12,
    color: '#AE8623',
  },
  separator: {
    color: '#AE8623',
    fontSize: 12,
  },
  detailsText: {
    fontSize: 12,
    color: '#AE8623',
  },
  content: {
    flex: 1,
  },
  contentWrapper: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  topCard: {
    width: screenWidth,
    height: 220,
  },
  balanceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
    marginTop: -40,
  },
  balanceAmount: {
    marginTop: 10,
    fontSize: 33,
    fontWeight: '600',
    color: '#FF5100',
  },
  progressCard: {
    width: screenWidth - 30,
    backgroundColor: '#FFF5DB',
    borderRadius: 16,
    padding: 20,

  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5100',
    marginTop: 5,
  },
  progressBarWrapper: {
    height: 25,
    position: 'relative',
    marginBottom: 20,
  },
  progressBarBg: {
    position: 'absolute',
    width: '100%',
    height: 25,
  },
  progressBar: {
    position: 'absolute',
    left: 6,
    top: 6,
    height: 10,
    borderRadius: 5,
  },
  progressCoin: {
    position: 'absolute',
    width: 33,
    height: 35,
    top: -5,
    marginLeft: -16,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderText: {
    fontSize: 14,
    color: '#000',
  },
  withdrawButton: {
    width: 104,
    height: 32,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF5100',
    justifyContent: 'center',
    alignItems: 'center',
  },
  withdrawText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF5100',
  },
  gameArea: {
    width: screenWidth,
    height: 455,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
  },
  digButton: {
    width: 224,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 65,
  },
  digButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  minerContainer: {
    position: 'absolute',
    top: 123,
    left: '50%',
    marginLeft: -32.25, // width/2
  },
  minerImage: {
    width: 64.5,
    height: 112,
  },
  rewardContainer: {
    position: 'absolute',
    top: '50%',
    backgroundColor: '#FFD700',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  rewardText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  taskCenterContainer: {
    position: 'absolute',
    bottom: 160,
    right: 3,
    width: 108,
    height: 107,
    zIndex: 999,
  },
  bottomGold: {
    width: 108,
    height: 107,
  },
  guideBubble: {
    position: 'absolute',
    bottom: 120,
    right: 40,
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bubbleArrow: {
    position: 'absolute',
    bottom: -8,
    right: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFF',
  },
  bubbleText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  inviteSection: {
    width: screenWidth,
    height: 152,
    marginRight: 10,
    marginTop: 10,
    position: 'relative',
  },
  inviteButtons: {
    position: 'absolute',
    flexDirection: 'row',
    bottom: 21,
    left: '50%',
    marginLeft: -112, // (104 * 2 + 16) / 2
    gap: 16,
  },
  whatsappButton: {
    width: 104,
    height: 32,
    backgroundColor: '#25D366',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  whatsappText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
  },
  copyButton: {
    width: 104,
    height: 32,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF5100',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF5100',
  },
  fingerIcon: {
    position: 'absolute',
    width: 60,
    height: 60,
    bottom: -35,
    left: -20,
  },
  rippleEffect: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    top: '50%',
    left: '50%',
    marginTop: -100,
    marginLeft: -100,
    zIndex: -1,
  },
  fingerContainer: {
    position: 'absolute',
    width: 60,
    height: 60,
    bottom: -35,
    left: -20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fingerImage: {
    width: 60,
    height: 60,
    top: 10,
    position: 'absolute',
  },
  fingerRipple: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 40,
    backgroundColor: 'green',
    top: -0,  // 向上偏移，让涟漪中心在指尖
    left: 30,   // 向右偏移，对准指尖位置
  },
});

export default MiningGameScreen;