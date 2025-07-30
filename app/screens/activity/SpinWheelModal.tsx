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
import { LinearGradient } from 'expo-linear-gradient';
import { enterActivity, updateRewardAmount, getActivityStatus } from '../../services/api/activity';

interface SpinWheelModalProps {
  visible: boolean;
  onClose: () => void;
  onSpinPress: () => void;
  onWin?: (amount: number) => void;
  currentCoins?: number;
  totalCoins?: number;
  shouldInitActivity?: boolean; // 是否需要初始化活动（用于避免重复初始化）
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

// 创建一个全局的初始化锁
let isInitializing = false;

export const SpinWheelModal: React.FC<SpinWheelModalProps> = ({
  visible,
  onClose,
  onSpinPress,
  onWin,
  currentCoins = 0,
  totalCoins = 5000,
  shouldInitActivity = true, // 默认为 true，保持向后兼容
}) => {
  const rotateValue = useRef(new Animated.Value(0)).current;
  const [isSpinning, setIsSpinning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // 处理中奖结果期间也禁用按钮
  const [activityData, setActivityData] = useState<any>(null);
  const [currentTotalReward, setCurrentTotalReward] = useState(0);
  const [targetRewardAmount, setTargetRewardAmount] = useState(5000);

  // 当弹窗关闭时重置状态
  useEffect(() => {
    if (!visible) {
      setIsSpinning(false);
      setIsProcessing(false);
      // 重置活动数据，确保下次打开时重新获取
      setActivityData(null);
      setCurrentTotalReward(0);
      setTargetRewardAmount(5000);
    }
  }, [visible]);

  // 当弹窗打开时先检查活动状态（但不初始化）
  useEffect(() => {
    if (visible) {
      const checkActivityStatus = async () => {
        try {
          // 先尝试获取活动状态
          console.log('调用活动状态接口...');
          const statusData = await getActivityStatus();
          console.log('活动状态返回:', statusData);
          
          // 如果成功获取状态，说明用户已经参加过活动
          setActivityData(statusData);
          
          // 保存当前累积金额和目标金额
          const currentAmount = parseFloat(statusData.current_reward_amount) || 0;
          const targetAmount = parseFloat(statusData.target_reward_amount) || 5000;
          setCurrentTotalReward(currentAmount);
          setTargetRewardAmount(targetAmount);
          
          // 打印具体的返回数据
          console.log('用户已参加活动，活动数据:');
          console.log('用户ID:', statusData.user_id);
          console.log('当前奖励金额:', statusData.current_reward_amount);
          console.log('目标奖励金额:', statusData.target_reward_amount);
          console.log('金币面具数量:', statusData.gold_masks_count);
          console.log('目标金币面具数量:', statusData.target_gole_masks_count);
          console.log('总邀请数:', statusData.total_invite_count);
          console.log('有效邀请数:', statusData.effective_invite_count);
          console.log('推荐人ID:', statusData.referrer_id);
        } catch (error: any) {
          // 如果返回404，说明用户未参加活动，但暂时不初始化
          if (error?.response?.status === 404 || error?.status === 404) {
            console.log('用户未参加活动，将在点击转动按钮时初始化');
          } else {
            console.error('获取活动状态失败:', error);
          }
        }
      };
      
      checkActivityStatus();
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

  const handleSpin = async () => {
    if (isSpinning || isProcessing) return;
    console.log('开始旋转...');

    // 先检查是否已经初始化活动
    if (!activityData) {
      console.log('活动未初始化，先进行初始化...');
      setIsProcessing(true); // 设置处理中状态，防止重复点击
      
      try {
        // 再次尝试获取活动状态
        const statusData = await getActivityStatus();
        console.log('活动状态返回:', statusData);
        
        // 如果成功获取状态，说明用户已经参加过活动
        setActivityData(statusData);
        
        // 保存当前累积金额和目标金额
        const currentAmount = parseFloat(statusData.current_reward_amount) || 0;
        const targetAmount = parseFloat(statusData.target_reward_amount) || 5000;
        setCurrentTotalReward(currentAmount);
        setTargetRewardAmount(targetAmount);
      } catch (error: any) {
        // 如果返回404，说明用户未参加活动，需要初始化
        if (error?.response?.status === 404 || error?.status === 404) {
          if (shouldInitActivity) {
            // 检查是否正在初始化
            if (isInitializing) {
              console.log('活动正在初始化中，跳过重复初始化...');
              setIsProcessing(false);
              return;
            }
            
            isInitializing = true;
            console.log('用户未参加活动，调用初始化接口...');
            try {
              const data = await enterActivity(0);
              console.log('活动初始化成功:', data);
              setActivityData(data);
              
              // 保存当前累积金额和目标金额
              const currentAmount = parseFloat(data.current_reward_amount) || 0;
              const targetAmount = parseFloat(data.target_reward_amount) || 5000;
              setCurrentTotalReward(currentAmount);
              setTargetRewardAmount(targetAmount);
              
              // 打印具体的返回数据
              console.log('初始化后的活动数据:');
              console.log('用户ID:', data.user_id);
              console.log('当前奖励金额:', data.current_reward_amount);
              console.log('目标奖励金额:', data.target_reward_amount);
              console.log('金币面具数量:', data.gold_masks_count);
              console.log('目标金币面具数量:', data.target_gole_masks_count);
              console.log('总邀请数:', data.total_invite_count);
              console.log('有效邀请数:', data.effective_invite_count);
              console.log('推荐人ID:', data.referrer_id);
            } catch (enterError) {
              console.error('初始化活动失败:', enterError);
              setIsProcessing(false);
              isInitializing = false;
              return; // 初始化失败，不执行转盘
            } finally {
              isInitializing = false;
            }
          } else {
            console.log('用户未参加活动，但不进行初始化（由调用方处理）');
            setIsProcessing(false);
            return;
          }
        } else {
          console.error('获取活动状态失败:', error);
          setIsProcessing(false);
          return;
        }
      }
    }

    setIsSpinning(true);
    setIsProcessing(true); // 设置处理中状态
    
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
      // 注意：此时isProcessing仍然为true，按钮继续禁用
      
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
          
          // 更新本地累积金额和目标金额
          const updatedAmount = parseFloat(updatedData.current_reward_amount) || 0;
          const updatedTarget = parseFloat(updatedData.target_reward_amount) || 0;
          setCurrentTotalReward(updatedAmount);
          setTargetRewardAmount(updatedTarget);
          
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
        setIsProcessing(false); // 处理完成后才重置处理状态
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
                source={require('../../../assets/img/spin.png')}
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
                activeOpacity={1}
                disabled={isSpinning || isProcessing}
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
                    left: 42 * scale,
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
                      width: 280 * scale,
                      height: 10 * scale,
                      left: 3 * scale,
                      top: 3 * scale,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#FF5100', '#FFDD9E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.progressFill,
                      {
                        width: `${targetRewardAmount > 0 ? (currentTotalReward / targetRewardAmount) * 100 : 0}%`,
                      },
                    ]}
                  />
                </View>

                {/* 金币图标 - 根据进度动态调整位置 */}
                <Image
                  source={require('../../../assets/img/group_737.png')}
                  style={[
                    styles.coinIcon,
                    {
                      width: 33 * scale,
                      height: 35 * scale,
                      left: `${targetRewardAmount > 0 ? Math.max(0, Math.min(100, (currentTotalReward / targetRewardAmount) * 100)) : 0}%`,
                      top: -8 * scale,
                      marginLeft: -16.5 * scale, // 金币宽度的一半，使其居中对齐
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
                  {activityData ? currentTotalReward.toLocaleString() : '0'} FCFA
                </Text>
                <Text style={[styles.totalCoinsText, { fontSize: 12 * scale }]}>
                  {' '}/{targetRewardAmount.toLocaleString()} FCFA
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
    backgroundColor: '#000000B3',
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
    backgroundColor: '#000000B3',
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