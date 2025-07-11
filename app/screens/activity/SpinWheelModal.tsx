import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  Dimensions,
  TouchableWithoutFeedback,
  Animated,
  Easing,
} from 'react-native';

interface SpinWheelModalProps {
  visible: boolean;
  onClose: () => void;
  onSpinPress: () => void;
  onWin?: (amount: number) => void;
  currentCoins?: number;
  totalCoins?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Figma 设计稿尺寸
const DESIGN_WIDTH = 370;
const DESIGN_HEIGHT = 620;

// 弹窗占屏幕90%
const MODAL_WIDTH = screenWidth * 0.9;
const MODAL_HEIGHT = (MODAL_WIDTH / DESIGN_WIDTH) * DESIGN_HEIGHT;

// 计算缩放比例
const scale = MODAL_WIDTH / DESIGN_WIDTH;

export const SpinWheelModal: React.FC<SpinWheelModalProps> = ({
  visible,
  onClose,
  onSpinPress,
  onWin,
  currentCoins = 0,
  totalCoins = 5000,
}) => {
  const rotateValue = useRef(new Animated.Value(0)).current;
  const [isSpinning, setIsSpinning] = useState(false);

  // 转盘奖品区域数据（8个扇区，每个45度）
  const wheelSections = [
    { value: 4000, angle: 0 },
    { value: 2000, angle: 45 },
    { value: 200, angle: 90 },
    { value: 500, angle: 135 },
    { value: 0, angle: 180 },
    { value: 300, angle: 225 },
    { value: 2000, angle: 270 },
    { value: 1000, angle: 315 },
  ];

  const handleSpin = () => {
    if (isSpinning) return;
    console.log('开始旋转...');

    setIsSpinning(true);
    
    // 重置旋转值
    rotateValue.setValue(0);
    
    // 随机选择一个奖品
    const randomIndex = Math.floor(Math.random() * wheelSections.length);
    const targetAngle = wheelSections[randomIndex].angle;
    const prize = wheelSections[randomIndex].value;
    
    // 计算总旋转角度：多转几圈 + 最终角度
    const totalRotation = 360 * 5 + (360 - targetAngle); // 5圈 + 最终位置
    
    // 执行旋转动画
    Animated.timing(rotateValue, {
      toValue: totalRotation,
      duration: 4000, // 4秒
      easing: Easing.out(Easing.cubic), // 缓出效果
      useNativeDriver: true,
    }).start(() => {
      // 动画结束后
      console.log('动画结束，中奖金额:', prize);
      setIsSpinning(false);
      
      // 显示中奖结果
      setTimeout(() => {
        console.log('通知父组件中奖金额:', prize);
        if (onWin) {
          onWin(prize);
        }
        onClose(); // 关闭转盘弹窗
      }, 500);
    });
  };

  // 将旋转值转换为旋转角度
  const rotation = rotateValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContainer, { width: MODAL_WIDTH, height: MODAL_HEIGHT }]}>
              {/* 转盘完整背景 */}
              <Image
                source={require('../../../assets/img/wheel_game_bg.png')}
                style={[
                  styles.wheelBackground,
                  {
                    width: MODAL_WIDTH,
                    height: MODAL_HEIGHT,
                    left: 0,
                    top: 0,
                  },
                ]}
                resizeMode="contain"
              />

              {/* 转盘主体 - 可旋转 */}
              <Animated.Image
                source={require('../../../assets/img/group_59_2x.png')}
                style={[
                  styles.wheelMain,
                  {
                    width: 328 * scale,
                    height: 334 * scale,
                    left: 22 * scale,
                    top: 145 * scale,
                    transform: [{ rotate: rotation }],
                  },
                ]}
                resizeMode="contain"
              />

              {/* 转盘指针 */}
              <Image
                source={require('../../../assets/img/mask_group_2x2.png')}
                style={[
                  styles.wheelPointer,
                  {
                    width: 76 * scale,
                    height: 101 * scale,
                    left: 152 * scale,
                    top: 250 * scale,
                  },
                ]}
                resizeMode="contain"
              />

              {/* 旋转按钮 */}
              <TouchableOpacity
                style={[
                  styles.spinButton,
                  {
                    width: 224 * scale,
                    height: 54 * scale,
                    left: 75 * scale,
                    top: 447 * scale,
                  },
                ]}
                onPress={handleSpin}
                activeOpacity={0.8}
                disabled={isSpinning}
              >
                <Image
                  source={require('../../../assets/img/spin_button.png')}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              {/* 进度条区域 */}
              <View
                style={[
                  styles.progressSection,
                  {
                    left: 45 * scale,
                    top: 529 * scale,
                    width: 286 * scale,
                    height: 35 * scale,
                  },
                ]}
              >
                {/* 进度条背景 */}
                <Image
                  source={require('../../../assets/img/group_123_2x1.png')}
                  style={[
                    styles.progressBackground,
                    {
                      width: 286 * scale,
                      height: 18 * scale,
                    },
                  ]}
                  resizeMode="contain"
                />

                {/* 进度条填充 */}
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: 227 * scale,
                      height: 8 * scale,
                      left: 3 * scale,
                      top: 3 * scale,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(currentCoins / totalCoins) * 100}%`,
                        backgroundColor: '#FF5100',
                      },
                    ]}
                  />
                </View>

                {/* 金币图标 */}
                <Image
                  source={require('../../../assets/img/group_737.png')}
                  style={[
                    styles.coinIcon,
                    {
                      width: 33 * scale,
                      height: 35 * scale,
                      left: 213 * scale,
                      top: -8 * scale,
                    },
                  ]}
                  resizeMode="contain"
                />
              </View>

              {/* 进度文字 */}
              <View
                style={[
                  styles.progressTextContainer,
                  {
                    left: 130 * scale,
                    top: 551 * scale,
                  },
                ]}
              >
                <Text style={[styles.currentCoinsText, { fontSize: 12 * scale }]}>
                  {currentCoins} FCFA
                </Text>
                <Text style={[styles.totalCoinsText, { fontSize: 12 * scale }]}>
                  {' '}/{totalCoins} FCFA
                </Text>
              </View>

              {/* 关闭按钮 - 与图片中的X按钮位置重合 */}
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  {
                    top: 12 * scale,
                    right: 12 * scale,
                    width: 40 * scale,
                    height: 40 * scale,
                  },
                ]}
                onPress={onClose}
                activeOpacity={1}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {/* 透明的点击区域 */}
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  wheelBackground: {
    position: 'absolute',
  },
  wheelMain: {
    position: 'absolute',
  },
  wheelPointer: {
    position: 'absolute',
    zIndex: 10,
  },
  spinButton: {
    position: 'absolute',
    zIndex: 20,
  },
  progressSection: {
    position: 'absolute',
  },
  progressBackground: {
    position: 'absolute',
  },
  progressBar: {
    position: 'absolute',
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  coinIcon: {
    position: 'absolute',
  },
  progressTextContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentCoinsText: {
    color: '#FF5100',
    fontWeight: '600',
    fontFamily: 'SF Pro Display',
  },
  totalCoinsText: {
    color: '#000000',
    fontFamily: 'SF Pro Display',
  },
  closeButton: {
    position: 'absolute',
    zIndex: 100,
    // 透明背景，只保留点击区域
    backgroundColor: 'transparent',
  },
});