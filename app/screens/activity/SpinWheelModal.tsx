import React, { useRef, useState, useEffect } from 'react';
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
import { enterActivity, updateRewardAmount } from '../../services/api/activity';

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
  const [activityData, setActivityData] = useState<any>(null);
  const [currentTotalReward, setCurrentTotalReward] = useState(0);

  // 当弹窗打开时调用进入活动接口
  useEffect(() => {
    if (visible) {
      const initActivity = async () => {
        try {
          console.log('调用进入活动接口...');
          const data = await enterActivity(0);
          console.log('活动数据返回:', data);
          setActivityData(data);
          
          // 保存当前累积金额
          const currentAmount = parseFloat(data.current_reward_amount) || 0;
          setCurrentTotalReward(currentAmount);
          
          // 打印具体的返回数据
          console.log('用户ID:', data.user_id);
          console.log('当前奖励金额:', data.current_reward_amount);
          console.log('目标奖励金额:', data.target_reward_amount);
          console.log('金币面具数量:', data.gold_masks_count);
          console.log('目标金币面具数量:', data.target_gole_masks_count);
          console.log('总邀请数:', data.total_invite_count);
          console.log('有效邀请数:', data.effective_invite_count);
          console.log('推荐人ID:', data.referrer_id);
        } catch (error) {
          console.error('进入活动接口失败:', error);
        }
      };
      
      initActivity();
    }
  }, [visible]);

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
    
    // 固定选择 4000 FCFA（索引为 0）
    const targetIndex = 0; // 4000 FCFA 的位置
    const targetAngle = wheelSections[targetIndex].angle;
    const prize = wheelSections[targetIndex].value;
    
    // 计算总旋转角度：多转几圈 + 最终角度 + 额外20度
    const mainRotation = 360 * 5 + (360 - targetAngle); // 5圈 + 最终位置
    const finalRotation = mainRotation + 20; // 再加20度
    
    // 执行旋转动画
    Animated.sequence([
      // 第一阶段：快速旋转到接近目标位置
      Animated.timing(rotateValue, {
        toValue: mainRotation,
        duration: 3500, // 3.5秒
        easing: Easing.out(Easing.cubic), // 缓出效果
        useNativeDriver: true,
      }),
      // 第二阶段：缓慢转20度
      Animated.timing(rotateValue, {
        toValue: finalRotation,
        duration: 500, // 0.5秒
        easing: Easing.linear, // 线性匀速
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 动画结束后
      console.log('动画结束，中奖金额:', prize);
      setIsSpinning(false);
      
      // 显示中奖结果
      setTimeout(async () => {
        console.log('通知父组件中奖金额:', prize);
        
        // 调用更新奖励金额接口（累加当前金额）
        try {
          const newTotalAmount = currentTotalReward + prize;
          console.log('当前累积金额:', currentTotalReward);
          console.log('本次中奖金额:', prize);
          console.log('调用更新奖励金额接口，新的总金额:', newTotalAmount);
          
          const updatedData = await updateRewardAmount(newTotalAmount);
          console.log('更新奖励金额接口返回:', updatedData);
          
          // 更新本地累积金额
          const updatedAmount = parseFloat(updatedData.current_reward_amount) || 0;
          setCurrentTotalReward(updatedAmount);
          
          // 打印详细的返回数据
          console.log('=== 更新后的活动数据 ===');
          console.log('用户ID:', updatedData.user_id);
          console.log('当前奖励金额:', updatedData.current_reward_amount);
          console.log('目标奖励金额:', updatedData.target_reward_amount);
          console.log('金币面具数量:', updatedData.gold_masks_count);
          console.log('目标金币面具数量:', updatedData.target_gole_masks_count);
          console.log('总邀请数:', updatedData.total_invite_count);
          console.log('有效邀请数:', updatedData.effective_invite_count);
          console.log('推荐人ID:', updatedData.referrer_id);
          console.log('========================');
          
          // 更新本地状态
          setActivityData(updatedData);
        } catch (error) {
          console.error('更新奖励金额失败:', error);
        }
        
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