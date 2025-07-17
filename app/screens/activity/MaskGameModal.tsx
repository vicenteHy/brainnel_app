import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MaskGameModalProps {
  visible: boolean;
  onClose: () => void;
  onStart: () => void;
}

const MaskGameModal: React.FC<MaskGameModalProps> = ({ visible, onClose, onStart }) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* 背景图片 */}
          <Image 
            source={require('../../../assets/img/Mask_game.png')}
            style={styles.modalImage}
            resizeMode="contain"
          />
          
          {/* 右上角关闭按钮 - 透明 */}
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            activeOpacity={0.7}
          />
          
          {/* 开始收集按钮 - 透明 */}
          <TouchableOpacity 
            style={styles.startButton} 
            onPress={onStart}
            activeOpacity={0.7}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000B3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: screenWidth * 0.85,
    height: screenWidth * 1.2,
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 45,
    height: 45,
    // backgroundColor: 'rgba(255, 0, 0, 0.3)', // 调试时可以打开看位置
  },
  startButton: {
    position: 'absolute',
    bottom: screenWidth * 0.12,
    left: '20%',
    right: '20%',
    height: 60,
    borderRadius: 30,
    // backgroundColor: 'rgba(255, 0, 0, 0.3)', // 调试时可以打开看位置
  },
});

export default MaskGameModal;