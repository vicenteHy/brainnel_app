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

interface FriendsWithdrawalSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const FriendsWithdrawalSuccessModal: React.FC<FriendsWithdrawalSuccessModalProps> = ({
  visible,
  onClose,
  onConfirm,
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
          
          {/* 弹窗内容 - 无背景 */}
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* 成功图片 */}
              <Image
                source={require('../../../assets/img/friends_success.png')}
                style={styles.successImage}
                resizeMode="contain"
              />
              
              {/* 文字内容 */}
              <View style={styles.contentContainer}>
                <Text style={styles.titleText}>C'est ton tour !</Text>
                <Text style={styles.messageText}>
                  Ton ami 150150151 vient d'encaisser 5000 FCFA ! Ne lâche rien, le prochain c'est toi !
                </Text>
              </View>
              
              {/* 确认按钮 */}
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={onConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>OK</Text>
              </TouchableOpacity>
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
    backgroundColor: '#00000080',
  },
  modalContainer: {
    width: 335,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  successImage: {
    width: screenWidth * 0.75,
    height: screenWidth * 0.75,
    marginBottom: -20,
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textShadowColor: '#00000080',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  messageText: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    textShadowColor: '#00000080',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  confirmButton: {
    width: '70%',
    height: 48,
    backgroundColor: '#FF6B35',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default FriendsWithdrawalSuccessModal;