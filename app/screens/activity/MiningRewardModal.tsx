import React, { useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import fontSize from '../../utils/fontsizeUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MiningRewardModalProps {
  visible: boolean;
  onClose: () => void;
  rewardAmount: number;
}

const MiningRewardModal: React.FC<MiningRewardModalProps> = ({ 
  visible, 
  onClose, 
  rewardAmount 
}) => {
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.8);
  const coinScaleAnim = useSharedValue(0);
  const coinRotateAnim = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // 重置动画
      fadeAnim.value = 0;
      scaleAnim.value = 0.8;
      coinScaleAnim.value = 0;
      coinRotateAnim.value = 0;
      
      // 入场动画
      fadeAnim.value = withTiming(1, { duration: 300 });
      scaleAnim.value = withSpring(1, {
        damping: 12,
        stiffness: 100,
      });
      
      // 金币动画
      setTimeout(() => {
        coinScaleAnim.value = withSequence(
          withTiming(1.2, { duration: 300 }),
          withSpring(1, { damping: 10, stiffness: 100 })
        );
        coinRotateAnim.value = withTiming(360, { duration: 600 });
      }, 200);
    }
  }, [visible]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
    };
  });

  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleAnim.value }],
    };
  });

  const coinAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: coinScaleAnim.value },
        { rotate: `${coinRotateAnim.value}deg` },
      ],
    };
  });

  const handleAccept = () => {
    // 退出动画
    fadeAnim.value = withTiming(0, { duration: 300 });
    scaleAnim.value = withTiming(0.8, { duration: 300 });
    
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={handleAccept}
    >
      <View style={styles.modalContainer}>
        <View style={styles.overlay} />
        
        <Animated.View style={[styles.contentContainer, containerAnimatedStyle]}>
          <Animated.View style={[styles.backgroundContainer, contentAnimatedStyle]}>
            {/* 背景图片 */}
            <Image
              source={require('../../assets/miningReward/mining_reward_bg.png')}
              style={styles.backgroundImage}
              resizeMode="contain"
            />
            
            {/* 金币图标区域 - 使用动画 */}
            <Animated.View style={[styles.coinContainer, coinAnimatedStyle]}>
              {/* 这里的金币图标已经包含在背景图中 */}
            </Animated.View>
            
            {/* 奖励金额文字 */}
            <Text style={styles.rewardText}>+{rewardAmount} FCFA</Text>
            
            {/* 接受按钮 */}
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
              activeOpacity={0.8}
            >
              <Image
                source={require('../../assets/miningReward/accept_button.png')}
                style={styles.acceptButtonImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000099',
  },
  contentContainer: {
    alignItems: 'center',
  },
  backgroundContainer: {
    width: screenWidth,
    height: 522,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundImage: {
    width: screenWidth,
    height: 522,
    position: 'absolute',
  },
  coinContainer: {
    position: 'absolute',
    top: 180,
    width: 150,
    height: 150,
  },
  rewardText: {
    position: 'absolute',
    top: 362,
    fontSize: fontSize(26),
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: '#00000040',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
    fontFamily: 'SF Pro Display',
  },
  acceptButton: {
    position: 'absolute',
    bottom: 45,
  },
  acceptButtonImage: {
    width: 224,
    height: 54,
  },
});

export default MiningRewardModal;