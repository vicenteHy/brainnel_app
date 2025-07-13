import React, { useState, useEffect } from 'react';
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
  runOnJS,
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface GiftModalProps {
  visible: boolean;
  onClose: () => void;
  onOpen: () => void;
}

const GiftModal: React.FC<GiftModalProps> = ({ visible, onClose, onOpen }) => {
  const [isOpened, setIsOpened] = useState(false);
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.8);
  const rotateAnim = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // 重置状态
      setIsOpened(false);
      fadeAnim.value = 0;
      scaleAnim.value = 0.8;
      rotateAnim.value = 0;
      contentOpacity.value = 0;
      
      // 入场动画
      fadeAnim.value = withTiming(1, { duration: 300 });
      scaleAnim.value = withSpring(1, {
        damping: 12,
        stiffness: 100,
      });
    }
  }, [visible]);

  const handleOpenGift = () => {
    // 打开动画
    rotateAnim.value = withTiming(360, { duration: 600 });
    scaleAnim.value = withSequence(
      withTiming(1.2, { duration: 300 }),
      withTiming(1, { duration: 300 })
    );
    
    // 延迟显示打开后的内容
    setTimeout(() => {
      setIsOpened(true);
      contentOpacity.value = withTiming(1, { duration: 300 });
    }, 600);
  };

  const handleClaim = () => {
    onOpen();
  };

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
    };
  });

  const giftBoxAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scaleAnim.value },
        { rotate: `${rotateAnim.value}deg` },
      ],
    };
  });

  const openedContentAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
    };
  });

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.overlay} />
        
        <Animated.View style={[styles.contentContainer, containerAnimatedStyle]}>
          {!isOpened ? (
            <>
              <Animated.Image
                source={require('../../assets/giftModal/giftBox.png')}
                style={[styles.giftBoxImage, giftBoxAnimatedStyle]}
                resizeMode="contain"
              />
              
              <Text style={styles.bonusText}>
                Un Bonus Spécial juste pour Vous !
              </Text>
              
              <TouchableOpacity
                onPress={handleOpenGift}
                activeOpacity={0.8}
              >
                <Image
                  source={require('../../assets/giftModal/openButton.png')}
                  style={styles.openButton}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </>
          ) : (
            <Animated.View style={[styles.openedContainer, openedContentAnimatedStyle]}>
              <Image
                source={require('../../assets/giftModal/opened_gift.png')}
                style={styles.openedGiftImage}
                resizeMode="contain"
              />
              
              <Text style={styles.jackpotTitle}>JACKPOT!</Text>
              
              <Text style={styles.congratsText}>
                Félicitations ! Votre chance de débutant{'\n'}vous a fait gagner le grand prix !
              </Text>
              
              <TouchableOpacity
                onPress={handleClaim}
                activeOpacity={0.8}
              >
                <Image
                  source={require('../../assets/giftModal/claim_button.png')}
                  style={styles.claimButtonImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </Animated.View>
          )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  contentContainer: {
    alignItems: 'center',
    paddingTop: 50,
  },
  giftBoxImage: {
    width: screenWidth,
    height: 522,
  },
  bonusText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    width: 262,
    marginTop: -180,
    fontFamily: 'System',
  },
  openButton: {
    width: 224,
    height: 54,
    marginTop: 45,
  },
  openedContainer: {
    alignItems: 'center',
  },
  openedGiftImage: {
    width: screenWidth,
    height: 522,
    marginTop: -60,
    marginBottom: -120,
  },
  jackpotTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
    fontFamily: 'SF Pro Display',
  },
  congratsText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
    width: 276,
    fontFamily: 'SF Pro Display',
  },
  claimButtonImage: {
    width: 224,
    height: 54,
  },
});

export default GiftModal;