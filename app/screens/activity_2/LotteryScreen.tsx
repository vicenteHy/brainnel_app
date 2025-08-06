import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ImageBackground, StatusBar, Text, TouchableOpacity, Image, ScrollView, Animated } from 'react-native';
import { size } from '../../utils/size';
import WinningModal from './WinningModal';

const LotteryScreen = () => {
  const [selectedIndex, setSelectedIndex] = useState(3); // 默认选中iPhone位置
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWinningModal, setShowWinningModal] = useState(false);
  const [prizeType, setPrizeType] = useState<'free' | 'halfPrice' | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 创建9个动画值用于每个奖品的缩放
  const scaleAnims = useRef(
    Array.from({ length: 9 }, () => new Animated.Value(1))
  ).current;
  
  // 九宫格位置映射（顺时针，暂时只包含0和7用于测试）
  const positions = [0, 1, 2, 5, 7, 6];
  const winningPositions = [0, 7]; // 只会中奖的位置
  
  // 当选中项改变时触发缩放动画
  useEffect(() => {
    if (isSpinning && selectedIndex !== -1) {
      // 重置所有动画值
      scaleAnims.forEach((anim, index) => {
        if (index !== selectedIndex) {
          anim.setValue(1);
        }
      });
      
      // 对选中项执行缩放动画
      Animated.sequence([
        Animated.timing(scaleAnims[selectedIndex], {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnims[selectedIndex], {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selectedIndex, isSpinning]);
  
  const startLottery = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    let currentPosition = 0;
    let speed = 100; // 初始速度
    let rounds = 0; // 转动圈数
    const targetRounds = 3 + Math.floor(Math.random() * 2); // 3-4圈
    
    // 随机选择一个中奖位置（只选择索引0或7）
    const randomWinningIndex = winningPositions[Math.floor(Math.random() * winningPositions.length)];
    // 找到该索引在positions数组中的位置
    const finalPosition = positions.indexOf(randomWinningIndex);
    
    const spin = () => {
      currentPosition = (currentPosition + 1) % 6;  // 改为6个位置
      setSelectedIndex(positions[currentPosition]);
      
      // 计算已转圈数
      if (currentPosition === 0) {
        rounds++;
      }
      
      // 减速逻辑
      if (rounds >= targetRounds - 1) {
        speed += 50; // 逐渐减速
        
        // 到达目标位置停止
        if (rounds >= targetRounds && currentPosition === finalPosition) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsSpinning(false);
          
          // 中奖逻辑：检查最终停留的位置
          const finalIndex = positions[finalPosition];
          if (finalIndex === 0) {
            // 免费商品
            setPrizeType('free');
            setShowWinningModal(true);
          } else if (finalIndex === 7) {
            // 半价商品
            setPrizeType('halfPrice');
            setShowWinningModal(true);
          }
          
          return;
        }
      }
      
      // 更新定时器速度
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(spin, speed);
    };
    
    intervalRef.current = setInterval(spin, speed);
  };
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />
      <ImageBackground
        source={require('../../../assets/activity_2/game_console_bg.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.content}>
          {/* 蒙版层 - 仅在转动时显示 */}
          {isSpinning && <View style={styles.overlay} />}
          
          <View style={[styles.prizeGrid, isSpinning && styles.prizeGridActive]}>
            {/* 第一行 */}
            <View style={styles.prizeRow}>
              <Animated.View style={[styles.prizeItem, { transform: [{ scale: scaleAnims[0] }] }]}>
                {selectedIndex === 0 && <Image source={require('../../../assets/activity_2/selected.png')} style={styles.selectedBackground} />}
                <Image source={require('../../../assets/activity_2/free_product.png')} style={styles.prizeImage} />
              </Animated.View>
              <Animated.View style={[styles.prizeItem, { transform: [{ scale: scaleAnims[1] }] }]}>
                {selectedIndex === 1 && <Image source={require('../../../assets/activity_2/selected.png')} style={styles.selectedBackground} />}
                <Image source={require('../../../assets/activity_2/1000fcfa.png')} style={styles.prizeImage} />
              </Animated.View>
              <Animated.View style={[styles.prizeItem, { transform: [{ scale: scaleAnims[2] }] }]}>
                {selectedIndex === 2 && <Image source={require('../../../assets/activity_2/selected.png')} style={styles.selectedBackground} />}
                <Image source={require('../../../assets/activity_2/thank_you.png')} style={styles.prizeImage} />
              </Animated.View>
            </View>

            {/* 第二行 */}
            <View style={styles.prizeRow}>
              <Animated.View style={[styles.prizeItem, { transform: [{ scale: scaleAnims[3] }] }]}>
                {selectedIndex === 3 && <Image source={require('../../../assets/activity_2/selected.png')} style={styles.selectedBackground} />}
                <Image source={require('../../../assets/activity_2/iphone.png')} style={styles.prizeImage} />
              </Animated.View>
              <TouchableOpacity style={styles.startButton} onPress={startLottery} disabled={isSpinning}>
                <Image 
                  source={require('../../../assets/activity_2/start_lottery.png')} 
                  style={[styles.startButtonImage, isSpinning && styles.startButtonDisabled]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Animated.View style={[styles.prizeItem, { transform: [{ scale: scaleAnims[5] }] }]}>
                {selectedIndex === 5 && <Image source={require('../../../assets/activity_2/selected.png')} style={styles.selectedBackground} />}
                <Image source={require('../../../assets/activity_2/50000fcfa.png')} style={styles.prizeImage} />
              </Animated.View>
            </View>

            {/* 第三行 */}
            <View style={styles.prizeRow}>
              <Animated.View style={[styles.prizeItem, { transform: [{ scale: scaleAnims[6] }] }]}>
                {selectedIndex === 6 && <Image source={require('../../../assets/activity_2/selected.png')} style={styles.selectedBackground} />}
                <Image source={require('../../../assets/activity_2/20000fcfa.png')} style={styles.prizeImage} />
              </Animated.View>
              <Animated.View style={[styles.prizeItem, { transform: [{ scale: scaleAnims[7] }] }]}>
                {selectedIndex === 7 && <Image source={require('../../../assets/activity_2/selected.png')} style={styles.selectedBackground} />}
                <Image source={require('../../../assets/activity_2/half_price_product.png')} style={styles.prizeImage} />
              </Animated.View>
              <Animated.View style={[styles.prizeItem, { transform: [{ scale: scaleAnims[8] }] }]}>
                {selectedIndex === 8 && <Image source={require('../../../assets/activity_2/selected.png')} style={styles.selectedBackground} />}
                <Image source={require('../../../assets/activity_2/computer.png')} style={styles.prizeImage} />
              </Animated.View>
            </View>
          </View>

          {/* 底部机会显示 */}
          <View style={styles.chanceWrapper}>
            <View style={styles.chanceItemLeft}>
              <Text style={styles.chanceText}>CHANCES GRATUITE: 1</Text>
            </View>
            <View style={styles.chanceItemRight}>
              <Text style={styles.chanceText}>CHANCES D'AIDE: 1</Text>
            </View>
          </View>

          {/* 底部按钮 */}
          <View style={styles.buttonWrapper}>
            <TouchableOpacity style={styles.buttonItemLeft}>
              <Image 
                source={require('../../../assets/activity_2/whatsapp.png')} 
                style={styles.buttonImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonItemRight}>
              <Image 
                source={require('../../../assets/activity_2/copy_link.png')} 
                style={styles.buttonImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* 奖池按钮 */}
          <View style={styles.poolButtonWrapper}>
            <TouchableOpacity>
              <Image 
                source={require('../../../assets/activity_2/free_product_pool.png')} 
                style={styles.poolButtonImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <Image 
                source={require('../../../assets/activity_2/half_price_pool.png')} 
                style={styles.poolButtonImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
      
      {/* 中奖弹窗 */}
      <WinningModal 
        visible={showWinningModal}
        prizeType={prizeType}
        onClose={() => {
          setShowWinningModal(false);
          setPrizeType(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    width: size.screenWidth,
    height: size.screenHeight,
  },
  backgroundImage: {
    flex: 1,
    width: size.screenWidth,
    height: size.screenHeight,
  },
  content: {
    flex: 1,
    paddingHorizontal: size.w(20),
    paddingTop: size.h(160), // 调整到游戏机屏幕位置
    paddingBottom: size.h(40),
    alignItems: 'center',
  },
  prizeGrid: {
    marginTop: size.h(88),
    width: size.w(345),
    height: size.h(345),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: size.r(15),
    padding: size.w(3),
    borderWidth: 3,
    borderColor: 'transparent',
  },
  prizeRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginVertical: size.h(1),
  },
  prizeItem: {
    width: size.w(108),
    height: size.h(108),
    backgroundColor: 'white',
    borderRadius: size.r(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'black',
    margin: size.w(1),
    position: 'relative',
  },
  prizeImage: {
    width: size.w(98),
    height: size.h(98),
    resizeMode: 'contain',
  },
  selectedBackground: {
    position: 'absolute',
    width: size.w(108),
    height: size.h(108),
    resizeMode: 'contain',
    zIndex: 1,
  },
  startButton: {
    width: size.w(108),
    height: size.h(108),
    alignItems: 'center',
    justifyContent: 'center',
    margin: size.w(1),
  },
  startButtonImage: {
    width: size.w(108),
    height: size.h(108),
    resizeMode: 'contain',
  },
  startButtonDisabled: {
    opacity: 0.7,
  },
  chanceWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: size.w(370),
    marginTop: size.h(6),
  },
  chanceItemLeft: {
    width: size.w(170),
    height: size.h(45),
    backgroundColor: 'transparent',
    borderTopLeftRadius: size.r(12),
    borderTopRightRadius: size.r(12),
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: size.w(5),
  },
  chanceItemRight: {
    width: size.w(170),
    height: size.h(45),
    backgroundColor: 'transparent',
    borderTopLeftRadius: size.r(12),
    borderTopRightRadius: size.r(12),
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: size.w(5),
  },
  chanceText: {
    color: 'white',
    fontSize: size.f(12),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: size.w(370),
    marginTop: size.h(10),
  },
  buttonItemLeft: {
    width: size.w(170),
    height: size.h(45),
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: size.w(5),
  },
  buttonItemRight: {
    width: size.w(170),
    height: size.h(45),
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: size.w(5),
  },
  buttonImage: {
    width: size.w(210),
    height: size.h(70),
  },
  poolButtonWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: size.w(340),
    marginTop: size.h(90),
  },
  poolButtonImage: {
    width: size.w(160),
    height: size.h(120),
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
  },
  prizeGridActive: {
    backgroundColor: 'black',
    position: 'relative',
    zIndex: 20,
    // shadowColor: '#FFD700',
    // shadowOffset: {
    //   width: 0,
    //   height: 0,
    // },
    // shadowOpacity: 1,
    // shadowRadius: 30,
    // elevation: 30,
  },
});

export default LotteryScreen;