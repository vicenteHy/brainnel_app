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
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface WaveWithdrawalSubmitModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: string;
  phoneNumber: string;
  transactionFee?: string;
}

const WaveWithdrawalSubmitModal: React.FC<WaveWithdrawalSubmitModalProps> = ({
  visible,
  onClose,
  onConfirm,
  amount = '5,000 FCFA',
  phoneNumber,
  transactionFee = '2000 FCFA',
}) => {
  // 计算最终金额（示例计算，实际应该从后端获取）
  const finalAmount = '3000 FCFA';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.6)" barStyle="light-content" />
      
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.container}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <Image
                source={require('../../../assets/img/withdrawal/wave/submitBg.png')}
                style={styles.modalBackground}
                resizeMode="cover"
              />
              
              {/* 关闭按钮 */}
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
              
              {/* 内容区域 */}
              <View style={styles.content}>
                {/* 标题和图标已经在背景图片中 */}
                
                {/* 详情卡片 */}
                <View style={styles.detailsCard}>
                  <Text style={styles.detailsTitle}>Détails du retrait:</Text>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Montant final:</Text>
                    <Text style={styles.detailValue}>{finalAmount}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Frais de transaction:</Text>
                    <Text style={styles.detailValue}>{transactionFee}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Numéro Wave:</Text>
                    <Text style={styles.detailValue}>{phoneNumber}</Text>
                  </View>
                </View>
                
                {/* OK按钮 */}
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={onConfirm}
                >
                  <Text style={styles.confirmButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    width: 370,
    height: 436,
    borderRadius: 20,
  },
  modalBackground: {
    position: 'absolute',
    width: 370,
    height: 436,
    borderRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 120, // 为标题留出空间
  },
  detailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  detailsTitle: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: '#550C21',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5100',
  },
  confirmButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF5100',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default WaveWithdrawalSubmitModal;