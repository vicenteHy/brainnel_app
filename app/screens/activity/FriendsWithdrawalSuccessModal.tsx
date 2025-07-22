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
          
          {/* 弹窗内容 */}
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
                <Text style={styles.titleText}>Félicitations !</Text>
                <Text style={styles.messageText}>
                  Le retrait de vos amis a été traité avec succès
                </Text>
              </View>
              
              {/* 确认按钮 */}
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={onConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>Continuer</Text>
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
    backgroundColor: '#00000099',
  },
  modalContainer: {
    width: 370,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  successImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF5100',
    marginBottom: 12,
  },
  messageText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 24,
  },
  confirmButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#FF5100',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF5100',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default FriendsWithdrawalSuccessModal;