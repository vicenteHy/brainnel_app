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
                source={require('../../assets/giftModal/giftBox.png')}
                style={styles.openedGiftImage}
                resizeMode="contain"
              />
              
              <Text style={styles.jackpotTitle}>JACKPOT!</Text>
              
              <Text style={styles.congratsText}>
                Félicitations ! Votre chance de débutant vous a fait gagner le grand prix !
              </Text>
              
              <TouchableOpacity
                style={styles.claimButton}
                onPress={handleClaim}
                activeOpacity={0.8}
              >
                <Text style={styles.claimButtonText}>Réclamer la récompense</Text>
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
    width: screenWidth * 0.8,
    height: 300,
    marginBottom: 20,
  },
  jackpotTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  congratsText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginHorizontal: 40,
    marginBottom: 30,
    lineHeight: 24,
  },
  claimButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  claimButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default GiftModal;