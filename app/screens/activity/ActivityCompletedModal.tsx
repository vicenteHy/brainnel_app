import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import fontSize from '../../utils/fontsizeUtils';

interface ActivityCompletedModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const ActivityCompletedModal: React.FC<ActivityCompletedModalProps> = ({
  visible,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <Text style={styles.title}>Activité terminée</Text>
            <Text style={styles.message}>
              Vous avez déjà terminé cette activité avec succès et ne pouvez plus y participer～
            </Text>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>J'ai compris</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.8,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize(20),
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  message: {
    fontSize: fontSize(16),
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  confirmButton: {
    backgroundColor: '#FF5100',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 25,
    minWidth: 160,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: fontSize(16),
    color: '#fff',
    fontWeight: '600',
  },
});