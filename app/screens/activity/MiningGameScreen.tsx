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
  StatusBar,
  ImageBackground,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Linking, Clipboard } from 'react-native';
import useMiningStore from '../../store/miningStore';
import useUserStore from '../../store/user';

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
  } = useMiningStore();
  
  const [isDigging, setIsDigging] = useState(false);
  const [showReward, setShowReward] = useState(0);
  const digAnimation = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const rewardAnimation = useRef(new Animated.Value(0)).current;

  const progress = getProgress();

  useEffect(() => {
    rechargeDigs();
    const interval = setInterval(rechargeDigs, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleDig = () => {
    if (isDigging || digCount <= 0) {
      if (digCount <= 0) {
        Alert.alert(t('提示'), t('挖矿次数已用完，请稍后再试或邀请好友获得更多次数'));
      }
      return;
    }

    setIsDigging(true);
    
    Animated.parallel([
      Animated.sequence([
        Animated.timing(digAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(digAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      const reward = dig();
      if (reward) {
        setShowReward(reward);
        Animated.sequence([
          Animated.timing(rewardAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(rewardAnimation, {
            toValue: 0,
            duration: 300,
            delay: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowReward(0);
        });
      }
      setIsDigging(false);
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

  const digTransform = {
    translateY: digAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 20],
    }),
  };

  const progressWidth = (balance / targetAmount) * 100;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* 背景图片 */}
      <Image 
        source={require('../../../assets/img/img_6271.svg')} 
        style={styles.backgroundImage}
      />
      
      {/* 顶部状态栏 */}
      <View style={styles.statusBar}>
        <Text style={styles.time}>14:19</Text>
        <View style={styles.statusIcons}>
          <Ionicons name="cellular" size={13} color="#000" />
          <Ionicons name="wifi" size={13} color="#000" style={{ marginLeft: 6 }} />
          <View style={styles.battery}>
            <View style={styles.batteryFill} />
          </View>
        </View>
      </View>

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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          {/* 顶部余额卡片 */}
          <ImageBackground 
            source={require('../../../assets/img/mask_group_2x.png')}
            style={styles.topCard}
            resizeMode="cover"
          >
            <View style={styles.balanceContainer}>
              <Image 
                source={require('../../../assets/img/group_737.png')}
                style={styles.balanceCoin}
              />
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
            />
            <View style={[styles.progressBar, { width: `${progressWidth}%` }]} />
            <Image 
              source={require('../../../assets/img/group_737.png')}
              style={[styles.progressCoin, { left: `${progressWidth}%` }]}
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
          resizeMode="cover"
        >
          <TouchableOpacity 
            style={styles.digButton} 
            onPress={handleDig}
            disabled={isDigging}
          >
            <Text style={styles.digButtonText}>Forer maintenant({digCount})</Text>
          </TouchableOpacity>

          <Animated.View 
            style={[
              styles.minerContainer,
              { transform: [digTransform, { translateX: shakeAnimation }] }
            ]}
          >
            <Image 
              source={require('../../../assets/img/group_86_2x.png')} 
              style={styles.minerImage}
            />
          </Animated.View>

          {showReward > 0 && (
            <Animated.View 
              style={[
                styles.rewardContainer,
                {
                  opacity: rewardAnimation,
                  transform: [{
                    translateY: rewardAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, -50],
                    }),
                  }],
                },
              ]}
            >
              <Text style={styles.rewardText}>+{showReward} FCFA</Text>
            </Animated.View>
          )}

          {/* 金币图标 - 任务中心按钮 */}
          <TouchableOpacity 
            style={styles.bottomGold}
            onPress={() => Alert.alert('任务中心', '任务中心功能即将开放')}
          >
            <Image 
              source={require('../../../assets/img/group_139_1.png')}
              style={{ width: '100%', height: '100%' }}
            />
          </TouchableOpacity>
          </ImageBackground>

          {/* 邀请好友区域 */}
          <ImageBackground 
          source={require('../../../assets/img/group_138_2x.png')}
          style={styles.inviteSection}
          resizeMode="cover"
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
    height: 980 ,
    top: 0,
    left: 0,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingTop: 16,
    height: 30,
  },
  time: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    letterSpacing: 1,
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  battery: {
    width: 26,
    height: 13,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 2,
    marginLeft: 6,
    padding: 2,
  },
  batteryFill: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rulesText: {
    fontSize: 14,
    color: '#AE8623',
  },
  separator: {
    color: '#AE8623',
    fontSize: 14,
  },
  detailsText: {
    fontSize: 14,
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
    width: screenWidth - 34,
    height: 191,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 45,
  },
  balanceCoin: {
    width: 35,
    height: 35,
    marginRight: 10,
  },
  balanceAmount: {
    fontSize: 33,
    fontWeight: '600',
    color: '#FF5100',
  },
  progressCard: {
    width: screenWidth - 34,
    marginTop: -18,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    height: 18,
    position: 'relative',
    marginBottom: 20,
  },
  progressBarBg: {
    position: 'absolute',
    width: '100%',
    height: 18,
    borderRadius: 9,
  },
  progressBar: {
    position: 'absolute',
    left: 4,
    top: 4,
    height: 10,
    backgroundColor: '#FF5100',
    borderRadius: 5,
  },
  progressCoin: {
    position: 'absolute',
    width: 33,
    height: 35,
    top: -8,
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
    width: screenWidth - 34,
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
    bottom: 73,
    right: 3,
    width: 108,
    height: 107,
  },
  inviteSection: {
    width: screenWidth - 34,
    height: 152,
    marginTop: 7,
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