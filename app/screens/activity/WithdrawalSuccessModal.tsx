import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  TouchableWithoutFeedback,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface WithdrawalSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  onViewBalance: () => void;
}

const WithdrawalSuccessModal: React.FC<WithdrawalSuccessModalProps> = ({
  visible,
  onClose,
  onViewBalance,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <StatusBar backgroundColor="#00000099" barStyle="light-content" />
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.container}>
          {/* 半透明遮罩 */}
          <View style={styles.overlay} />
          
          {/* 弹窗内容 */}
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <Image
                source={require('../../../assets/img/withdrawal/success/modalContentNew.png')}
                style={styles.modalContent}
                resizeMode="contain"
              />
              
              {/* 查看余额按钮 - 透明覆盖层 */}
              <TouchableOpacity
                style={styles.viewBalanceButton}
                onPress={onViewBalance}
                activeOpacity={0.8}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
    backgroundColor: '#00000099',
  },
  modalContainer: {
    width: 370,
    height: 467,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 370,
    height: 467,
  },
  viewBalanceButton: {
    position: 'absolute',
    bottom: 12,
    width: 208, // 260 * 0.8
    height: 40, // 50 * 0.8
    justifyContent: 'center',
    alignItems: 'center',
    // 完全透明
  },
});

export default WithdrawalSuccessModal;