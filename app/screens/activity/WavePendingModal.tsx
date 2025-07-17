import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface WavePendingModalProps {
  visible: boolean;
  onClose: () => void;
  amount: string;
  transactionFee: string;
  phoneNumber: string;
}

const WavePendingModal: React.FC<WavePendingModalProps> = ({
  visible,
  onClose,
  amount,
  transactionFee,
  phoneNumber,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ImageBackground
          source={require('../../../assets/withdrawal/wave_pending_dialog_bg.png')}
          style={styles.modalContent}
          resizeMode="contain"
        >
          {/* 关闭按钮 - 完全透明 */}
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
          />

          {/* 内容区域 - 调整位置以适配背景图 */}
          <View style={styles.contentArea}>
            {/* 详情部分 */}
            <View style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>Détails du retrait:</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Montant final:</Text>
                <Text style={styles.detailValue}>{amount}</Text>
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

            {/* OK 按钮 */}
            <TouchableOpacity 
              style={styles.okButton} 
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 370,
    height: 480, // 增加弹窗高度
  },
  closeButton: {
    position: 'absolute',
    right: 8,
    top: 30,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#000',
    fontWeight: '300',
  },
  contentArea: {
    flex: 1,
    paddingTop: 200, // 增加顶部间距，避免覆盖背景文字
    paddingHorizontal: 16,
    paddingBottom: 40, // 增加底部间距
  },
  detailsContainer: {
    backgroundColor: '#FFFFFFE6',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
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
    color: '#FF5100',
    fontWeight: '600',
  },
  okButton: {
    backgroundColor: '#FF5100',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  okButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default WavePendingModal;