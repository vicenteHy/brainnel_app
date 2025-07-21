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
} from 'react-native-reanimated';
import fontSize from '../../utils/fontsizeUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MaskRewardModalProps {
  visible: boolean;
  onClose: () => void;
  rewardAmount: number;
}

const MaskRewardModal: React.FC<MaskRewardModalProps> = ({ 
  visible, 
  onClose, 
  rewardAmount 
}) => {
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      // 重置动画
      fadeAnim.value = 0;
      scaleAnim.value = 0.8;
      
      // 入场动画
      fadeAnim.value = withTiming(1, { duration: 300 });
      scaleAnim.value = withSpring(1, {
        damping: 12,
        stiffness: 100,
      });
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
        {/* 背景遮罩 */}
        <View style={styles.overlay} />
        
        <Animated.View style={[styles.contentContainer, containerAnimatedStyle]}>
          <Animated.View style={[styles.backgroundContainer, contentAnimatedStyle]}>
            {/* 背景图片 */}
            <Image
              source={require('../../../assets/img/mask_reward_bg.png')}
              style={styles.backgroundImage}
              resizeMode="contain"
            />
            
            {/* 奖励文字 */}
            <Text style={styles.rewardText}>
              +{rewardAmount} Masque{rewardAmount > 1 ? 's' : ''}
            </Text>
            
            {/* 接受按钮 - 使用图片 */}
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
              activeOpacity={0.8}
            >
              <Image
                source={require('../../../assets/img/accept_button.png')}
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
    width: 370,
    height: 457,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundImage: {
    width: 370,
    height: 457,
    position: 'absolute',
  },
  rewardText: {
    position: 'absolute',
    top: 335,
    fontSize: fontSize(23),
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: '#00000040',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
    fontFamily: 'SF Pro Display',
  },
  acceptButton: {
    position: 'absolute',
    bottom: -45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonImage: {
    width: 224,
    height: 54,
  },
});

export default MaskRewardModal;