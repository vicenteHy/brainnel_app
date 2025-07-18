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
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

interface WinningModalProps {
  visible: boolean;
  onClose: () => void;
  onContinue: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Figma 设计稿尺寸
const DESIGN_WIDTH = 414;
const DESIGN_HEIGHT = 896;

// 使用全屏展示
const MODAL_WIDTH = screenWidth;
const MODAL_HEIGHT = screenHeight;

// 计算缩放比例
const designScale = MODAL_WIDTH / DESIGN_WIDTH;

export const WinningModal: React.FC<WinningModalProps> = ({
  visible,
  onClose,
  onContinue,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  
  const handleContinue = () => {
    onClose();
    onContinue();
  };

  useEffect(() => {
    if (visible) {
      // 重置动画值
      scale.value = 0;
      opacity.value = 0;
      
      // 启动动画
      opacity.value = withTiming(1, { duration: 300 });
      
      // 使用弹簧动画实现 bounce 效果
      scale.value = withSpring(1, {
        damping: 12,  // 阻尼，控制弹跳的衰减
        stiffness: 180,  // 刚度，控制弹跳的速度
        mass: 1,  // 质量，影响动画的惯性
        overshootClamping: false,  // 允许超过目标值
        restDisplacementThreshold: 0.001,
        restSpeedThreshold: 0.001,
      });
    } else {
      // 关闭时重置
      scale.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        {/* 半透明黑色遮罩 */}
        <View style={styles.darkOverlay} />

        {/* 居中的动画容器 */}
        <View style={styles.centerContainer}>
          <Animated.View
            style={[
              styles.contentWrapper,
              animatedContentStyle,
            ]}
          >
            {/* 中奖内容主体 - 包含标题、金币、横幅等 */}
            <Image
              source={require('../../../assets/img/winning_content.png')}
              style={[
                styles.winningContent,
                {
                  width: MODAL_WIDTH,
                  height: 522 * designScale,
                  top: 105 * designScale,
                },
              ]}
              resizeMode="contain"
            />

            {/* 底部文字 */}
            <View
              style={[
                styles.messageContainer,
                {
                  top: 527 * designScale,
                  left: 76 * designScale,
                  width: 262 * designScale,
                },
              ]}
            >
              <Text style={[styles.messageText, { fontSize: 16 * designScale }]}>
                INCROYABLE ! Vous êtes le plus chanceux aujourd'hui !
              </Text>
            </View>

            {/* 继续按钮 */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                {
                  width: 224 * designScale,
                  height: 54 * designScale,
                  left: 95 * designScale,
                  top: 597 * designScale,
                },
              ]}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Image
                source={require('../../../assets/img/continue_button.png')}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* 关闭按钮 - 右上角的X */}
            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  top: 120 * designScale,
                  right: 30 * designScale,
                  width: 40 * designScale,
                  height: 40 * designScale,
                },
              ]}
              onPress={onClose}
              activeOpacity={1}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {/* 透明的点击区域，X按钮在图片中 */}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000099',
  },
  centerContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapper: {
    width: screenWidth,
    height: screenHeight,
    position: 'relative',
  },
  winningContent: {
    position: 'absolute',
    left: 0,
  },
  messageContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  messageText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'SF Pro Display',
    lineHeight: 22,
  },
  continueButton: {
    position: 'absolute',
    zIndex: 10,
  },
  closeButton: {
    position: 'absolute',
    zIndex: 100,
    backgroundColor: 'transparent',
  },
});