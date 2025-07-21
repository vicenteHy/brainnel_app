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
  Modal,
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
import MaskGameModal from './MaskGameModal';
import MaskRewardModal from './MaskRewardModal';
import RewardRulesModal from './RewardRulesModal';
import EmptySpinModal from './EmptySpinModal';
import RulesModal from './RulesModal';
import { updateRewardAmount, playGame, getInvitationLink, getActivityStatus, exchangeMasks } from '../../services/api/activity';
import useActivityStore from '../../store/activityStore';
import Toast from 'react-native-toast-message';
import fontSize from '../../utils/fontsizeUtils';

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
  const [maskRewardVisible, setMaskRewardVisible] = useState(false);
  const [emptySpinModalVisible, setEmptySpinModalVisible] = useState(false);
  const modalTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  
  // 检查是否有任何 Modal 正在显示
  const isAnyModalVisible = () => {
    return giftModalVisible || miningRewardVisible || maskRewardVisible || maskGameModalVisible || showWithdrawGuide || emptySpinModalVisible;
  };
  const [currentReward, setCurrentReward] = useState(0);
  const [currentRewardType, setCurrentRewardType] = useState(0); // 0: 现金, 1: 面具
  const [showDigEffect, setShowDigEffect] = useState(false);
  const [currentTotalReward, setCurrentTotalReward] = useState(0);
  const [displayedReward, setDisplayedReward] = useState(0);
  const [userInvitationLink, setUserInvitationLink] = useState<string | null>(null);
  const [targetRewardAmount, setTargetRewardAmount] = useState(0);
  const [isActivityInitialized, setIsActivityInitialized] = useState(false);
  const [showTaskCenterBubble, setShowTaskCenterBubble] = useState(true);
  const [availableGameAttempts, setAvailableGameAttempts] = useState(0);
  const [showTaskGuide, setShowTaskGuide] = useState(false);
  const [showInviteGuide, setShowInviteGuide] = useState(false);
  const [showRedeemGuide, setShowRedeemGuide] = useState(false);
  const [showWithdrawGuide, setShowWithdrawGuide] = useState(false);
  const [maskGameModalVisible, setMaskGameModalVisible] = useState(false);
  const [isMaskGameMode, setIsMaskGameMode] = useState(false);
  const [goldMasksCount, setGoldMasksCount] = useState(0);
  const [targetGoldMasksCount, setTargetGoldMasksCount] = useState(20);
  const [isRewardRulesVisible, setIsRewardRulesVisible] = useState(false);
  const [isRulesModalVisible, setIsRulesModalVisible] = useState(false);
  const digAnimation = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const bubbleAnimation = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<any>(null);
  const fingerAnimation = useRef(new Animated.Value(0)).current;
  const rippleAnimation = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const taskCenterAnimation = useRef(new Animated.Value(1)).current;
  const notificationAnimation = useRef(new Animated.Value(0)).current;
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const notificationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const progress = getProgress();
  
  // 随机国家列表（法语）
  const countries = [
    "Côte d'Ivoire",
    "Bénin",
    "Togo",
    "Cameroun",
    "République démocratique du Congo",
    "Burkina Faso",
    "Sénégal",
    "Mali"
  ];
  
  // 生成随机电话号码后四位
  const getRandomPhone = () => {
    const lastFour = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `****${lastFour}`;
  };
  
  // 生成三位随机数
  const getRandomThreeDigits = () => {
    return Math.floor(Math.random() * 900 + 100).toString();
  };
  
  // 获取随机国家
  const getRandomCountry = () => {
    return countries[Math.floor(Math.random() * countries.length)];
  };
  
  // 通知文案生成函数
  const generateNotification = (index: number) => {
    const templates = [
      () => `Quelle rapidité ! L'utilisateur ${getRandomPhone()} a raflé 5000 FCFA en quelques secondes !`,
      () => `La cagnotte est prise d'assaut ! Agissez maintenant !`,
      () => `À l'instant, l'utilisateur ${getRandomPhone()} de ${getRandomCountry()} vient d'encaisser 5000 FCFA !`,
      () => `Un autre utilisateur chanceux, ${getRandomPhone()}, a empoché l'argent !`,
      () => `Un autre prix vient d'être réclamé ! La cagnotte diminue à toute vitesse !`,
      () => `Ne te laisse pas devancer ! L'utilisateur ${getRandomPhone()} a déjà sécurisé sa récompense`,
      () => `Retirer son gain est un jeu d'enfant aujourd'hui ! Déjà ${getRandomThreeDigits()} utilisateurs de plus ont réussi`
    ];
    
    return templates[index % templates.length]();
  };
  
  // 生成新的通知集合
  const refreshNotifications = () => {
    return Array.from({ length: 7 }, (_, i) => generateNotification(i));
  };
  
  // 初始化通知数组
  const [notifications, setNotifications] = useState<string[]>(() => refreshNotifications());

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
    
    // 通知动画逻辑
    const showNotification = () => {
      // 每次显示前刷新通知内容
      const newNotifications = refreshNotifications();
      setNotifications(newNotifications);
      
      // 淡入动画
      Animated.timing(notificationAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // 停留2秒后淡出
        setTimeout(() => {
          Animated.timing(notificationAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            // 更新到下一条通知
            setCurrentNotificationIndex(prev => (prev + 1) % 7);
          });
        }, 2000);
      });
    };
    
    // 立即显示第一条通知
    showNotification();
    
    // 每4秒循环一次（2秒显示 + 2秒间隔）
    notificationIntervalRef.current = setInterval(() => {
      showNotification();
    }, 4000);
    
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
        const goldMasks = data.gold_masks_count || 0;
        const targetMasks = data.target_gole_masks_count || 20;
        setCurrentTotalReward(currentAmount);
        setDisplayedReward(currentAmount);
        setTargetRewardAmount(targetAmount);
        setAvailableGameAttempts(gameAttempts);
        setGoldMasksCount(goldMasks);
        setTargetGoldMasksCount(targetMasks);
        setIsActivityInitialized(true);
        
        console.log('挖矿游戏 - 当前累积奖励金额:', currentAmount);
        console.log('挖矿游戏 - 目标奖励金额:', targetAmount);
        console.log('挖矿游戏 - 可用游戏次数:', gameAttempts);
        
        // 如果金额小于4500，显示礼品弹窗
        if (currentAmount < 4500 && !giftModalVisible && !maskGameModalVisible && !miningRewardVisible && !maskRewardVisible) {
          const timeout = setTimeout(() => {
            // 再次检查是否没有其他弹窗
            if (!maskGameModalVisible && !miningRewardVisible && !maskRewardVisible) {
              setGiftModalVisible(true);
            }
          }, 500);
          modalTimeoutsRef.current.push(timeout);
        }
        // 如果金额等于4999，显示面具游戏弹窗（只在没有其他弹窗时显示）
        else if (Math.floor(currentAmount) === 4999 && !maskGameModalVisible && !giftModalVisible && !miningRewardVisible && !maskRewardVisible) {
          const timeout = setTimeout(() => {
            // 再次检查是否没有其他弹窗
            if (!giftModalVisible && !miningRewardVisible && !maskRewardVisible) {
              setMaskGameModalVisible(true);
            }
          }, 500);
          modalTimeoutsRef.current.push(timeout);
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
    
    // 手指和涟漪同步动画
    Animated.loop(
      Animated.sequence([
        // 手指下移
        Animated.timing(fingerAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        // 手指到达最低点时触发涟漪
        Animated.parallel([
          // 手指上移
          Animated.timing(fingerAnimation, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          // 涟漪效果
          Animated.sequence([
            // 重置涟漪
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
            // 涟漪扩散
            Animated.parallel([
              Animated.timing(rippleAnimation, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.timing(rippleOpacity, {
                  toValue: 0.5,
                  duration: 100,
                  useNativeDriver: true,
                }),
                Animated.timing(rippleOpacity, {
                  toValue: 0,
                  duration: 700,
                  useNativeDriver: true,
                }),
              ]),
            ]),
          ]),
        ]),
      ])
    ).start();
    
    return () => {
      clearInterval(interval);
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
      // 清理所有定时器
      modalTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      modalTimeoutsRef.current = [];
      // 清理通知定时器
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
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
          const goldMasks = data.gold_masks_count || 0;
          const targetMasks = data.target_gole_masks_count || 20;
          
          // 使用动画更新金额
          animateValue(currentTotalReward, currentAmount, 800);
          setCurrentTotalReward(currentAmount);
          setTargetRewardAmount(targetAmount);
          setAvailableGameAttempts(gameAttempts);
          setGoldMasksCount(goldMasks);
          setTargetGoldMasksCount(targetMasks);
          
          console.log('页面聚焦 - 更新金额:', currentAmount);
          
          // 检查是否需要显示面具游戏弹窗（只在没有其他弹窗时显示）
          if (Math.floor(currentAmount) === 4999 && !maskGameModalVisible && !giftModalVisible && !miningRewardVisible && !maskRewardVisible) {
            const timeout = setTimeout(() => {
              if (!giftModalVisible && !miningRewardVisible && !maskRewardVisible) {
                setMaskGameModalVisible(true);
              }
            }, 500);
            modalTimeoutsRef.current.push(timeout);
          }
          // 如果金额达到 5000，显示提现引导（只在没有其他弹窗时显示）
          else if (currentAmount >= 5000 && !showWithdrawGuide && !maskGameModalVisible && !giftModalVisible && !miningRewardVisible && !maskRewardVisible) {
            const timeout = setTimeout(() => {
              if (!maskGameModalVisible && !giftModalVisible && !miningRewardVisible && !maskRewardVisible) {
                setShowWithdrawGuide(true);
              }
            }, 500);
            modalTimeoutsRef.current.push(timeout);
          }
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

    // 检查金额是否达到5000，显示提现引导
    if (currentTotalReward >= 5000) {
      setShowWithdrawGuide(true);
      return;
    }

    // 检查是否达到20个面具，显示兑换引导
    if (goldMasksCount >= targetGoldMasksCount) {
      setShowRedeemGuide(true);
      return;
    }

    if (availableGameAttempts <= 0) {
      // 显示任务引导
      setShowTaskGuide(true);
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
          
          // 处理奖励 (reward_type = 0: 现金, 1: 面具)
          const rewardAmount = parseFloat(gameResult.reward_amount) || 0;
          if (rewardAmount > 0) {
            setCurrentReward(rewardAmount);
            setCurrentRewardType(gameResult.reward_type);
            
            if (gameResult.reward_type === 0) {
              setMiningRewardVisible(true);
            } else {
              setMaskRewardVisible(true);
            }
          } else if (rewardAmount === 0) {
            // 当奖励为0时，显示空转盘弹窗
            setEmptySpinModalVisible(true);
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
            const updatedMasks = statusData.gold_masks_count || 0;
            const updatedTargetMasks = statusData.target_gole_masks_count || 20;
            
            // 滚动动画
            animateValue(currentTotalReward, updatedAmount, 1000);
            setCurrentTotalReward(updatedAmount);
            setTargetRewardAmount(updatedTarget);
            setAvailableGameAttempts(updatedAttempts);
            setGoldMasksCount(updatedMasks);
            setTargetGoldMasksCount(updatedTargetMasks);
            
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
    if (currentTotalReward < 5000) {
      // 按钮已禁用，不需要额外处理
      return;
    }
    
    // 直接跳转到提现页面
    navigation.navigate('WithdrawalScreen');
  };
  
  // 兑换面具函数
  const handleExchangeMasks = async () => {
    if (goldMasksCount < targetGoldMasksCount) {
      Alert.alert(t('提示'), t('面具数量不足'));
      return;
    }
    
    try {
      console.log('开始兑换面具...');
      const response = await exchangeMasks();
      console.log('兑换面具结果:', response);
      
      // 更新状态
      const updatedData = response.updated_rewards;
      const updatedAmount = parseFloat(updatedData.current_reward_amount) || 0;
      const updatedTarget = parseFloat(updatedData.target_reward_amount) || 0;
      const updatedMasks = updatedData.gold_masks_count || 0;
      const updatedTargetMasks = updatedData.target_gole_masks_count || 20;
      
      // 更新所有状态
      animateValue(currentTotalReward, updatedAmount, 1000);
      setCurrentTotalReward(updatedAmount);
      setTargetRewardAmount(updatedTarget);
      setGoldMasksCount(updatedMasks);
      setTargetGoldMasksCount(updatedTargetMasks);
      
      // 如果金额达到 5000，切换回挖现金模式并显示提现引导
      if (updatedAmount >= 5000) {
        setIsMaskGameMode(false);
        setTimeout(() => {
          setShowWithdrawGuide(true);
        }, 1000);
      }
      
      Toast.show({
        type: 'success',
        text1: 'Échange réussi',
        position: 'top',
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error('兑换面具失败:', error);
      Alert.alert('Erreur', 'Échange échoué, veuillez réessayer');
    }
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
        text1: 'Lien copié',
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
      
      // 直接打开WhatsApp，不显示提示
      const message = encodeURIComponent(shareText + '\n\n' + shareUrl);
      Linking.openURL(`whatsapp://send?text=${message}`);
    } catch (error) {
      console.error('分享到WhatsApp失败:', error);
      Alert.alert(t('错误'), t('分享失败，请重试'));
    }
  };

  const handleOpenGift = async () => {
    // 先关闭礼品弹窗
    setGiftModalVisible(false);
    
    // 清理所有待执行的定时器
    modalTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    modalTimeoutsRef.current = [];
    
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
      const updatedMasks = updatedData.gold_masks_count || 0;
      const updatedTargetMasks = updatedData.target_gole_masks_count || 20;
      
      // 滚动动画
      animateValue(currentTotalReward, updatedAmount, 1000);
      setCurrentTotalReward(updatedAmount);
      setTargetRewardAmount(updatedTarget);
      setGoldMasksCount(updatedMasks);
      setTargetGoldMasksCount(updatedTargetMasks);
      
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
      
      // 检查是否需要显示面具游戏弹窗（只在没有其他弹窗时显示）
      if (Math.floor(updatedAmount) === 4999 && !maskGameModalVisible && !giftModalVisible && !miningRewardVisible && !maskRewardVisible) {
        const timeout = setTimeout(() => {
          if (!giftModalVisible && !miningRewardVisible && !maskRewardVisible) {
            setMaskGameModalVisible(true);
          }
        }, 500);
        modalTimeoutsRef.current.push(timeout);
      }
      // 如果金额达到 5000，显示提现引导（只在没有其他弹窗时显示）
      else if (updatedAmount >= 5000 && !showWithdrawGuide && !maskGameModalVisible && !giftModalVisible && !miningRewardVisible && !maskRewardVisible) {
        const timeout = setTimeout(() => {
          if (!maskGameModalVisible && !giftModalVisible && !miningRewardVisible && !maskRewardVisible) {
            setShowWithdrawGuide(true);
          }
        }, 500);
        modalTimeoutsRef.current.push(timeout);
      }
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
      
      {/* 通知弹窗 */}
      <Animated.View 
        style={[
          styles.notificationContainer,
          {
            opacity: notificationAnimation,
            transform: [{
              translateY: notificationAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0]
              })
            }]
          }
        ]}
        pointerEvents="none"
      >
        <View style={styles.notificationContent}>
          <Image 
            source={require('../../../assets/logo/logo.png')} 
            style={styles.notificationLogo}
          />
          <Text style={styles.notificationText} numberOfLines={2}>
            {notifications[currentNotificationIndex] || ''}
          </Text>
        </View>
      </Animated.View>

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
                <TouchableOpacity onPress={() => setIsRulesModalVisible(true)}>
                  <Text style={styles.rulesText}>Règles</Text>
                </TouchableOpacity>
                <Text style={styles.separator}> ｜ </Text>
                <TouchableOpacity onPress={() => setIsRewardRulesVisible(true)}>
                  <Text style={styles.detailsText}>Détails</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceAmount}>{displayedReward.toLocaleString()} FCFA</Text>
            </View>
          </ImageBackground>

          {/* 进度条卡片 */}
          <View style={styles.progressCard}>
            {!isMaskGameMode ? (
              <>
                {/* 挖现金进度条 */}
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
                  <TouchableOpacity 
                    style={[
                      styles.withdrawButton, 
                      currentTotalReward < 5000 && styles.withdrawButtonDisabled
                    ]} 
                    onPress={handleWithdraw}
                  >
                    <Text style={[
                      styles.withdrawText,
                      currentTotalReward < 5000 && styles.withdrawTextDisabled
                    ]}>Retirer</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* 面具游戏进度条 */}
                <View style={styles.maskGameHeader}>
                  <Text style={styles.maskGameTitle}>Presque prêt à retirer 5,000 FCFA</Text>
                  <Text style={styles.maskGameSubtitle}>Utilisez 20 Masques Dorés pour débloquer le dernier FCFA</Text>
                </View>
                
                <View style={styles.maskStats}>
                  <View style={styles.maskStatItem}>
                    <Text style={styles.maskStatLabel}>MASQUES GAGNÉS</Text>
                    <Text style={styles.maskStatValue}>{currentTotalReward.toLocaleString()}</Text>
                  </View>
                  <View style={styles.maskStatItem}>
                    <Text style={styles.maskStatLabel}>MASQUES REÇUS</Text>
                    <Text style={styles.maskStatValueOrange}>{goldMasksCount}</Text>
                  </View>
                  <View style={styles.maskStatItem}>
                    <Text style={styles.maskStatLabel}>MASQUES REQUIS</Text>
                    <Text style={styles.maskStatValueGray}>{targetGoldMasksCount}</Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={[styles.exchangeButton, goldMasksCount < targetGoldMasksCount && styles.exchangeButtonDisabled]} 
                  onPress={handleExchangeMasks}
                  disabled={goldMasksCount < targetGoldMasksCount}
                >
                  <Text style={[styles.exchangeButtonText, goldMasksCount < targetGoldMasksCount && styles.exchangeButtonTextDisabled]}>
                    Échanger
                  </Text>
                </TouchableOpacity>
              </>
            )}
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
            disabled={isDigging}
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
      
      {/* 挖矿奖励弹窗 - 现金 */}
      <MiningRewardModal
        visible={miningRewardVisible}
        onClose={() => {
          setMiningRewardVisible(false);
          // 关闭挖矿奖励弹窗后，检查是否需要显示面具游戏弹窗
          console.log('检查面具游戏弹窗条件:', {
            currentTotalReward,
            floorValue: Math.floor(currentTotalReward),
            isEqual4999: Math.floor(currentTotalReward) === 4999,
            maskGameModalVisible
          });
          if (Math.floor(currentTotalReward) === 4999 && !maskGameModalVisible && !giftModalVisible) {
            console.log('触发面具游戏弹窗！');
            const timeout = setTimeout(() => {
              if (!giftModalVisible && !maskRewardVisible) {
                setMaskGameModalVisible(true);
              }
            }, 300);
            modalTimeoutsRef.current.push(timeout);
          }
        }}
        rewardAmount={currentReward}
      />
      
      {/* 面具奖励弹窗 */}
      <MaskRewardModal
        visible={maskRewardVisible}
        onClose={() => {
          setMaskRewardVisible(false);
          // 如果在面具游戏模式，可能需要检查是否达到兑换条件
        }}
        rewardAmount={currentReward}
      />
      
      {/* 面具游戏弹窗 */}
      <MaskGameModal
        visible={maskGameModalVisible}
        onClose={() => setMaskGameModalVisible(false)}
        onStart={() => {
          setMaskGameModalVisible(false);
          setIsMaskGameMode(true);
          console.log('开始收集面具模式');
        }}
      />
      
      {/* 奖励规则弹窗 */}
      <RewardRulesModal
        visible={isRewardRulesVisible}
        onClose={() => setIsRewardRulesVisible(false)}
      />
      
      <EmptySpinModal
        visible={emptySpinModalVisible}
        onClose={() => setEmptySpinModalVisible(false)}
      />
      
      {/* 规则弹窗 */}
      <RulesModal
        visible={isRulesModalVisible}
        onClose={() => setIsRulesModalVisible(false)}
      />
      
      {/* 任务引导 */}
      {showTaskGuide && (
        <TouchableOpacity 
          style={styles.taskGuideOverlay} 
          activeOpacity={1}
          onPress={() => {
            setShowTaskGuide(false);
            setShowInviteGuide(true);
          }}
        >
          <View style={styles.taskGuideContainer}>
            <Image 
              source={require('../../../assets/img/task_guide.png')}
              style={styles.guideImage}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
      )}
      
      {/* 金币图标 - 任务中心按钮复制版 - 确保在引导层之上 */}
      {showTaskGuide && (
        <View style={[styles.taskCenterContainer, styles.taskCenterHighlight]}>
          <Animated.View
            style={{
              transform: [{ scale: taskCenterAnimation }]
            }}
          >
            <TouchableOpacity 
              style={styles.bottomGold}
              onPress={() => {
                setShowTaskGuide(false);
                setShowInviteGuide(true);
              }}
            >
              <Image 
                source={require('../../../assets/img/group_139_1.png')}
                style={{ width: '100%', height: '100%' }}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
      
      {/* 邀请引导 */}
      {showInviteGuide && (
        <TouchableOpacity 
          style={styles.inviteGuideOverlay} 
          activeOpacity={1}
          onPress={() => setShowInviteGuide(false)}
        >
          <View style={styles.inviteGuideContainer}>
            <Image 
              source={require('../../../assets/img/invitation_guide.png')}
              style={styles.guideImage}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
      )}
      
      {/* 邀请好友区域复制版 - 确保在引导层之上 */}
      {showInviteGuide && (
        <View style={styles.inviteSectionHighlight}>
          <ImageBackground 
            source={require('../../../assets/img/group_138_2x.png')}
            style={styles.inviteSection}
            resizeMode="contain"
          >
            <View style={styles.inviteButtons}>
              <View style={{ position: 'relative' }}>
                <TouchableOpacity 
                  style={styles.whatsappButton} 
                  onPress={() => {
                    setShowInviteGuide(false);
                    handleWhatsApp();
                  }}
                >
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
              <TouchableOpacity 
                style={styles.copyButton} 
                onPress={() => {
                  setShowInviteGuide(false);
                  handleCopyLink();
                }}
              >
                <Text style={styles.copyText}>Copier le lien</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>
      )}
      
      {/* 兑换引导 */}
      {showRedeemGuide && (
        <TouchableOpacity 
          style={styles.redeemGuideOverlay} 
          activeOpacity={1}
          onPress={() => setShowRedeemGuide(false)}
        >
          <View style={styles.redeemGuideContainer}>
            <Image 
              source={require('../../../assets/img/redeem.png')}
              style={styles.guideImage}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
      )}
      
      {/* 兑换按钮高亮版 - 确保在引导层之上 */}
      {showRedeemGuide && isMaskGameMode && (
        <View style={styles.exchangeButtonHighlight}>
          <View style={styles.progressCard}>
            <View style={styles.maskGameHeader}>
              <Text style={styles.maskGameTitle}>Presque prêt à retirer 5,000 FCFA</Text>
              <Text style={styles.maskGameSubtitle}>Utilisez 20 Masques Dorés pour débloquer le dernier FCFA</Text>
            </View>
            
            <View style={styles.maskStats}>
              <View style={styles.maskStatItem}>
                <Text style={styles.maskStatLabel}>MASQUES GAGNÉS</Text>
                <Text style={styles.maskStatValue}>{currentTotalReward.toLocaleString()}</Text>
              </View>
              <View style={styles.maskStatItem}>
                <Text style={styles.maskStatLabel}>MASQUES REÇUS</Text>
                <Text style={styles.maskStatValueOrange}>{goldMasksCount}</Text>
              </View>
              <View style={styles.maskStatItem}>
                <Text style={styles.maskStatLabel}>MASQUES REQUIS</Text>
                <Text style={styles.maskStatValueGray}>{targetGoldMasksCount}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.exchangeButton, styles.exchangeButtonHighlighted]} 
              onPress={() => {
                setShowRedeemGuide(false);
                handleExchangeMasks();
              }}
            >
              <Text style={styles.exchangeButtonText}>
                Échanger
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* 提现引导 */}
      {showWithdrawGuide && (
        <TouchableOpacity 
          style={styles.withdrawGuideOverlay} 
          activeOpacity={1}
          onPress={() => setShowWithdrawGuide(false)}
        >
          <View style={styles.withdrawGuideContainer}>
            <Image 
              source={require('../../../assets/img/withdraw.png')}
              style={styles.guideImage}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
      )}
      
      {/* 提现按钮高亮版 - 确保在引导层之上 */}
      {showWithdrawGuide && !isMaskGameMode && (
        <View style={styles.withdrawButtonHighlight}>
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
              <TouchableOpacity 
                style={[styles.withdrawButton, styles.withdrawButtonHighlighted]} 
                onPress={() => {
                  setShowWithdrawGuide(false);
                  handleWithdraw();
                }}
              >
                <Text style={styles.withdrawText}>Retirer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  withdrawButtonDisabled: {
    backgroundColor: '#E5E5E5',
    borderColor: '#CCCCCC',
  },
  withdrawTextDisabled: {
    color: '#999999',
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
    fontSize: fontSize(16),
    fontWeight: '600',
    color: '#FFF',
    textShadowColor: '#00000040',
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
    fontSize: fontSize(14),
    fontWeight: '500',
    color: '#FFF',
  },
  copyButton: {
    width: 120,
    height: 32,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF5100',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyText: {
    fontSize: fontSize(14),
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
    backgroundColor: '#FFFFFF4D',
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
    borderRadius: 20,
    borderWidth: 6,
    borderColor: 'gray',
    backgroundColor: 'transparent',
    top: -0,  // 向上偏移，让涟漪中心在指尖
    left: 30,   // 向右偏移，对准指尖位置
  },
  guideOverlay: {
    flex: 1,
    backgroundColor: '#000000CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideImage: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.8,
  },
  taskGuideContainer: {
    position: 'absolute',
    bottom: -10,
    width: '100%',
    alignItems: 'center',
  },
  taskGuideOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000CC',
    zIndex: 1000,
  },
  taskCenterHighlight: {
    zIndex: 1001,
  },
  inviteGuideOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000CC',
    zIndex: 1000,
  },
  inviteGuideContainer: {
    position: 'absolute',
    bottom: 100,
    width: '100%',
    alignItems: 'center',
  },
  inviteSectionHighlight: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    zIndex: 1001,
  },
  maskGameHeader: {
    marginBottom: 20,
  },
  maskGameTitle: {
    fontSize: fontSize(18),
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  maskGameSubtitle: {
    fontSize: fontSize(14),
    color: '#666',
    textAlign: 'center',
  },
  maskStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  maskStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  maskStatLabel: {
    fontSize: fontSize(11),
    color: '#999',
    marginBottom: 5,
  },
  maskStatValue: {
    fontSize: fontSize(18),
    fontWeight: '600',
    color: '#FF5100',
  },
  maskStatValueOrange: {
    fontSize: fontSize(18),
    fontWeight: '600',
    color: '#FF5100',
  },
  maskStatValueGray: {
    fontSize: fontSize(18),
    fontWeight: '600',
    color: '#999',
  },
  exchangeButton: {
    backgroundColor: '#FF5100',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  exchangeButtonDisabled: {
    backgroundColor: '#D3D3D3',
  },
  exchangeButtonText: {
    fontSize: fontSize(16),
    fontWeight: '600',
    color: '#FFF',
  },
  exchangeButtonTextDisabled: {
    color: '#999',
  },
  redeemGuideOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000CC',
    zIndex: 1000,
  },
  redeemGuideContainer: {
    position: 'absolute',
    bottom: 220,
    width: '100%',
    alignItems: 'center',
  },
  exchangeButtonHighlight: {
    position: 'absolute',
    top: 180,
    left: 15,
    right: 15,
    zIndex: 1001,
  },
  exchangeButtonHighlighted: {
    shadowColor: '#FF5100',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  withdrawGuideOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000CC',
    zIndex: 1000,
  },
  withdrawGuideContainer: {
    position: 'absolute',
    bottom: 300,
    width: '100%',
    alignItems: 'center',
  },
  withdrawButtonHighlight: {
    position: 'absolute',
    top: 180,
    left: 15,
    right: 15,
    zIndex: 1001,
  },
  withdrawButtonHighlighted: {
    shadowColor: '#FF5100',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  notificationContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 999,
  },
  notificationContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  notificationLogo: {
    width: 24,
    height: 24,
    marginRight: 10,
    borderRadius: 4,
  },
  notificationText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
});

export default MiningGameScreen;