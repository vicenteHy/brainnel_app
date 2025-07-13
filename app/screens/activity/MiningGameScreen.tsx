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
import useMiningStore from '../../store/miningStore';
import useUserStore from '../../store/user';
import GiftModal from './GiftModal';
import MiningRewardModal from './MiningRewardModal';
import { enterActivity, updateRewardAmount } from '../../services/api/activity';

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
  const [isActivityInitialized, setIsActivityInitialized] = useState(false);
  const digAnimation = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const progress = getProgress();

  useEffect(() => {
    rechargeDigs();
    const interval = setInterval(rechargeDigs, 60000);
    
    // 获取当前活动数据
    const initActivity = async () => {
      try {
        console.log('挖矿游戏 - 获取当前活动数据...');
        const data = await enterActivity(0);
        console.log('挖矿游戏 - 活动数据返回:', data);
        
        // 保存当前累积金额
        const currentAmount = parseFloat(data.current_reward_amount) || 0;
        setCurrentTotalReward(currentAmount);
        setIsActivityInitialized(true);
        
        console.log('挖矿游戏 - 当前累积奖励金额:', currentAmount);
      } catch (error) {
        console.error('挖矿游戏 - 获取活动数据失败:', error);
        setIsActivityInitialized(true); // 即使失败也标记为已初始化
      }
    };
    
    initActivity();
    
    // 页面加载完成后显示礼品弹窗
    setTimeout(() => {
      setGiftModalVisible(true);
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  const handleDig = () => {
    if (isDigging) {
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
      setTimeout(() => {
        setShowDigEffect(false);
        const reward = dig();
        if (reward) {
          setCurrentReward(reward);
          setMiningRewardVisible(true);
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
    
    Alert.alert(
      t('确认提现'),
      t(`确定要提现 ${balance} FCFA 吗？`),
      [
        { text: t('取消'), style: 'cancel' },
        {
          text: t('确定'),
          onPress: async () => {
            const success = withdraw(balance);
            if (success) {
              Alert.alert(t('成功'), t('提现申请已提交，请等待处理'));
            }
          },
        },
      ]
    );
  };

  const handleInvite = async () => {
    try {
      const inviteCode = referralCode || user?.id || 'default';
      const shareUrl = `https://brainnel.com/invite?ref=${inviteCode}`;
      await Share.share({
        message: t('Invitez des amis, recevez plus de forages ! Chaque ami qui rejoint vous donne 1 chance de forage en plus.') + '\n\n' + shareUrl,
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  const handleCopyLink = () => {
    const inviteCode = referralCode || user?.id || 'default';
    const shareUrl = `https://brainnel.com/invite?ref=${inviteCode}`;
    Clipboard.setString(shareUrl);
    Alert.alert(t('成功'), t('链接已复制'));
  };

  const handleWhatsApp = () => {
    const inviteCode = referralCode || user?.id || 'default';
    const shareUrl = `https://brainnel.com/invite?ref=${inviteCode}`;
    const message = encodeURIComponent(t('Invitez des amis, recevez plus de forages !') + '\n' + shareUrl);
    Linking.openURL(`whatsapp://send?text=${message}`);
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
      
      // 更新本地累积金额
      const updatedAmount = parseFloat(updatedData.current_reward_amount) || 0;
      setCurrentTotalReward(updatedAmount);
      
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
    
    // 显示成功提示
    Alert.alert(
      t('Félicitations !'),
      t('Vous avez reçu 500 FCFA !'),
      [
        { 
          text: t('OK'), 
          onPress: () => {
            console.log('领取奖励成功');
          } 
        }
      ]
    );
  };

  const digTransform = {
    translateY: digAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 20],
    }),
  };

  const progressWidth = (balance / targetAmount) * 100;

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
              <Text style={styles.balanceAmount}>{balance.toLocaleString()} FCFA</Text>
            </View>
          </ImageBackground>

          {/* 进度条卡片 */}
          <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>Requis</Text>
              <Text style={styles.progressAmount}>{requiredAmount.toLocaleString()} FCFA</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.progressLabel}>Objectif</Text>
              <Text style={styles.progressAmount}>{targetAmount.toLocaleString()} FCFA</Text>
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
            disabled={isDigging}
          >
            <Text style={styles.digButtonText}>Forer maintenant</Text>
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
          <TouchableOpacity 
            style={styles.bottomGold}
            onPress={() => navigation.navigate('TaskCenter')}
          >
            <Image 
              source={require('../../../assets/img/group_139_1.png')}
              style={{ width: '100%', height: '100%' }}
            />
          </TouchableOpacity>

          {/* 邀请好友区域 */}
          <ImageBackground 
          source={require('../../../assets/img/group_138_2x.png')}
          style={styles.inviteSection}
          resizeMode="contain"
        >
          <View style={styles.inviteButtons}>
            <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
              <Text style={styles.whatsappText}>WhatsApp</Text>
            </TouchableOpacity>
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
  bottomGold: {
    position: 'absolute',
    bottom: 160,
    right: 3,
    width: 108,
    height: 107,
    zIndex: 999,
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
});

export default MiningGameScreen;