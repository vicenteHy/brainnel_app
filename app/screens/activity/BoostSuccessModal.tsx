import React, { useEffect, useState } from 'react';
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
import { getActivityStatus } from '../../services/api/activity';
import { navigationRef } from '../../navigation/AppNavigator';
import { SpinWheelModal } from './SpinWheelModal';

interface BoostSuccessModalProps {
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

export const BoostSuccessModal: React.FC<BoostSuccessModalProps> = ({
  visible,
  onClose,
  userId = '****8307',
  onJouerPress,
  isAlreadyBoosted = false,
}) => {
  const opacity = useSharedValue(0);
  const contentScale = useSharedValue(0);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  
  const handleJouerPress = async () => {
    try {
      console.log('[BoostSuccessModal] 检查活动状态...');
      // 调用 getActivityStatus 接口判断用户是否参加过活动
      const statusData = await getActivityStatus();
      console.log('[BoostSuccessModal] 活动状态返回:', statusData);
      
      // 关闭弹窗
      onClose();
      
      // 如果成功获取状态，说明用户已经参加过活动，跳转到 MiningGameScreen
      if (navigationRef.isReady()) {
        navigationRef.navigate('MiningGameScreen');
      }
    } catch (error: any) {
      console.log('[BoostSuccessModal] 获取活动状态错误:', error);
      
      // 如果返回404，说明用户未参加活动，显示转盘弹窗
      if (error?.response?.status === 404 || error?.status === 404) {
        console.log('[BoostSuccessModal] 用户未参加活动，显示转盘弹窗');
        
        // 关闭当前弹窗
        onClose();
        
        // 显示转盘弹窗
        setShowSpinWheel(true);
      } else {
        // 其他错误，也关闭弹窗并执行默认行为
        console.error('[BoostSuccessModal] 获取活动状态失败:', error);
        onClose();
        if (onJouerPress) {
          onJouerPress();
        }
      }
    }
  };
  
  const handleSpinWheelClose = () => {
    setShowSpinWheel(false);
    // 转盘关闭后跳转到挖矿页面
    if (navigationRef.isReady()) {
      navigationRef.navigate('MiningGameScreen');
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
                  source={require('../../../assets/img/boost/modal_content.png')}
                  style={[
                    styles.modalContent,
                    {
                      width: 370 * scale,
                      height: 532 * scale,
                    },
                  ]}
                  resizeMode="contain"
                />
                
                {/* 文字背景和内容 */}
                <View
                  style={[
                    styles.textContainer,
                    {
                      width: 304 * scale,
                      height: 33 * scale,
                      top: 276 * scale,
                    },
                  ]}
                >
                  <Image
                    source={require('../../../assets/img/boost/text_bg.svg')}
                    style={styles.textBackground}
                    resizeMode="stretch"
                  />
                  <Text style={[styles.messageText, { fontSize: 12.6 * scale }]}>
                    {isAlreadyBoosted ? (
                      <>
                        Vous avez déjà aidé cet utilisateur{' '}
                        <Text style={styles.userIdText}>{userId}</Text> !
                      </>
                    ) : (
                      <>
                        Vous avez boosté avec succès l'utilisateur{' '}
                        <Text style={styles.userIdText}>{userId}</Text> !
                      </>
                    )}
                  </Text>
                </View>
                
                {/* JOUER 按钮 - 透明覆盖层 */}
                <TouchableOpacity
                  style={[
                    styles.jouerButton,
                    {
                      width: 180 * scale,
                      height: 45 * scale,
                      top: 430 * scale,
                    },
                  ]}
                  onPress={handleJouerPress}
                  activeOpacity={0.8}
                />
                
                {/* 关闭按钮 - 右上角 */}
                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    {
                      top: 0 * scale,
                      right: 0 * scale,
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
      
      {/* 转盘弹窗 */}
      <SpinWheelModal
        visible={showSpinWheel}
        onClose={handleSpinWheelClose}
        onSpinPress={() => {}}
        onWin={(amount) => {
          console.log('[BoostSuccessModal] 转盘中奖金额:', amount);
          handleSpinWheelClose();
        }}
      />
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

export default BoostSuccessModal;