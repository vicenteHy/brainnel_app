import React, { useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface BoostedSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  onJouerPress?: () => void;
  isAlreadyBoosted?: boolean; // 是否已经助力过
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Figma 设计稿尺寸
const DESIGN_WIDTH = 414;
const DESIGN_HEIGHT = 896;

// 计算缩放比例
const scale = Math.min(screenWidth / DESIGN_WIDTH, screenHeight / DESIGN_HEIGHT);

export const BoostedSuccessModal: React.FC<BoostedSuccessModalProps> = ({
  visible,
  onClose,
  userId = '****6652',
  onJouerPress,
  isAlreadyBoosted = false,
}) => {
  const opacity = useSharedValue(0);
  const contentScale = useSharedValue(0);
  
  const handleJouerPress = () => {
    onClose();
    if (onJouerPress) {
      onJouerPress();
    }
  };

  useEffect(() => {
    if (visible) {
      // 重置动画值
      opacity.value = 0;
      contentScale.value = 0;
      
      // 启动动画
      opacity.value = withTiming(1, { duration: 300 });
      
      // 使用弹簧动画实现弹出效果
      contentScale.value = withSpring(1, {
        damping: 12,
        stiffness: 180,
        mass: 1,
        overshootClamping: false,
        restDisplacementThreshold: 0.001,
        restSpeedThreshold: 0.001,
      });
    } else {
      contentScale.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: contentScale.value }],
    };
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 半透明黑色遮罩 */}
        <Animated.View style={[styles.overlay, animatedOverlayStyle]} />
        
        {/* 弹窗内容容器 */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.contentContainer}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.modalWrapper, animatedContentStyle]}>
                {/* 主要内容图片 */}
                <Image
                  source={require('../../../assets/img/boost/modal_content_new.png')}
                  style={[
                    styles.modalContent,
                    {
                      width: 370 * scale,
                      height: 497 * scale,
                    },
                  ]}
                  resizeMode="contain"
                />
                
                {/* 文字背景和内容 */}
                <View
                  style={[
                    styles.textContainer,
                    {
                      width: 338 * scale,
                      height: 37 * scale,
                      top: 235 * scale,
                    },
                  ]}
                >
                  <Image
                    source={require('../../../assets/img/boost/text_bg_new.svg')}
                    style={styles.textBackground}
                    resizeMode="stretch"
                  />
                  <Text style={[styles.messageText, { fontSize: 14 * scale }]}>
                    {isAlreadyBoosted ? (
                      <>
                        Vous avez déjà aidé l'utilisateur{' '}
                        <Text style={styles.userIdText}>{userId}</Text>
                        {' '}!
                      </>
                    ) : (
                      <>
                        L'utilisateur{' '}
                        <Text style={styles.userIdText}>{userId}</Text>
                        {' '}vous a boosté avec succès !
                      </>
                    )}
                  </Text>
                </View>
                
                {/* JOUER 按钮 - 透明覆盖层 - 只在成功助力时显示 */}
                {!isAlreadyBoosted && (
                  <TouchableOpacity
                    style={[
                      styles.jouerButton,
                      {
                        width: 207 * scale,
                        height: 48 * scale,
                        bottom: 30 * scale,
                      },
                    ]}
                    onPress={handleJouerPress}
                    activeOpacity={0.8}
                  />
                )}
                
                {/* 关闭按钮 - 右上角 */}
                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    {
                      top: -10 * scale,
                      right: -10 * scale,
                      width: 40 * scale,
                      height: 40 * scale,
                    },
                  ]}
                  onPress={onClose}
                  activeOpacity={0.8}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {/* 完全透明的关闭按钮 */}
                </TouchableOpacity>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000B3',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    position: 'relative',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  messageText: {
    color: '#550C21',
    textAlign: 'center',
    fontFamily: 'SF Pro Display',
    zIndex: 1,
  },
  userIdText: {
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  jouerButton: {
    position: 'absolute',
    alignSelf: 'center',
  },
});

export default BoostedSuccessModal;