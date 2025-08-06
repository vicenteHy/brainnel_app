import React from 'react';
import { 
  View, 
  StyleSheet, 
  Modal, 
  ImageBackground, 
  TouchableOpacity,
  TouchableWithoutFeedback,
  StatusBar
} from 'react-native';
import { size } from '../../utils/size';

interface WinningModalProps {
  visible: boolean;
  prizeType: 'free' | 'halfPrice' | null;
  onClose: () => void;
}

const WinningModal: React.FC<WinningModalProps> = ({ visible, prizeType, onClose }) => {
  if (!prizeType) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.7)" translucent barStyle="light-content" />
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <ImageBackground
                source={require('../../../assets/activity_2/winning_popup.png')}
                style={styles.backgroundImage}
                resizeMode="contain"
              >
                {/* 关闭按钮区域 - 点击背景图片任意位置关闭 */}
                <TouchableOpacity 
                  style={styles.closeArea} 
                  onPress={onClose}
                  activeOpacity={1}
                />
                
                {/* 奖品图片展示区域 */}
                <View style={styles.prizeContainer}>
                  <ImageBackground
                    source={
                      prizeType === 'free' 
                        ? require('../../../assets/activity_2/free_product_with_frame.png')
                        : require('../../../assets/activity_2/half_price_with_frame.png')
                    }
                    style={styles.prizeImage}
                    resizeMode="contain"
                  />
                </View>
                
                {/* 领取按钮区域 */}
                <TouchableOpacity 
                  style={styles.claimButton}
                  onPress={() => {
                    // 这里可以添加领取奖品的逻辑
                    console.log('领取奖品:', prizeType);
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <ImageBackground
                    source={require('../../../assets/activity_2/long_button.png')}
                    style={styles.buttonImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </ImageBackground>
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
    width: size.w(380),
    height: size.h(500),
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    width: size.w(380),
    height: size.h(500),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  prizeContainer: {
    position: 'absolute',
    top: size.h(130),
    width: size.w(200),
    height: size.h(200),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  prizeImage: {
    width: size.w(180),
    height: size.h(180),
  },
  claimButton: {
    position: 'absolute',
    bottom: size.h(80),
    width: size.w(200),
    height: size.h(60),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  buttonImage: {
    width: size.w(200),
    height: size.h(60),
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WinningModal;