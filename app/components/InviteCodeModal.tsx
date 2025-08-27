import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import userApi from '../services/api/userApi';
import fontSize from '../utils/fontsizeUtils';

interface InviteCodeModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function InviteCodeModal({ visible, onClose }: InviteCodeModalProps) {
  const [referrerCode, setReferrerCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBound, setIsBound] = useState(false);
  const [checkingBound, setCheckingBound] = useState(true);

  useEffect(() => {
    if (visible) {
      checkBoundCode();
    }
  }, [visible]);

  const checkBoundCode = async () => {
    setCheckingBound(true);
    try {
      // 获取用户信息来检查是否已绑定邀请码
      const userInfo = await userApi.getUserProfile();
      if (userInfo && userInfo.is_bind_referrer_code === 1) {
        setIsBound(true);
      } else {
        setIsBound(false);
      }
    } catch (error) {
      console.error('检查邀请码绑定状态失败:', error);
      setIsBound(false);
    } finally {
      setCheckingBound(false);
    }
  };

  const handleSubmit = async () => {
    if (!referrerCode.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un code d\'invitation');
      return;
    }

    setLoading(true);
    try {
      const response = await userApi.bindReferrerCode(referrerCode.trim());
      if (response.success) {
        Alert.alert('Succès', 'Code d\'invitation lié avec succès');
        setReferrerCode('');
        setIsBound(true);
        onClose();
      } else {
        Alert.alert('Erreur', response.message || 'Échec de la liaison du code d\'invitation');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Une erreur s\'est produite';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Code d'invitation</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {checkingBound ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF5100" />
                <Text style={styles.loadingText}>Chargement...</Text>
              </View>
            ) : isBound ? (
              <View style={styles.boundContainer}>
                <Ionicons name="checkmark-circle" size={48} color="#4CAF50" style={styles.successIcon} />
                <Text style={styles.boundTitle}>Code d'invitation déjà lié</Text>
                <Text style={styles.boundDescription}>
                  Vous avez déjà lié un code d'invitation avec succès
                </Text>
                <TouchableOpacity 
                  style={styles.closeButtonBottom}
                  onPress={onClose}
                >
                  <Text style={styles.closeButtonText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.modalDescription}>
                  Entrez le code d'invitation de votre parrain
                </Text>
                
                <TextInput
                  style={styles.input}
                  placeholder="Code d'invitation"
                  placeholderTextColor="#999"
                  value={referrerCode}
                  onChangeText={setReferrerCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />

                <TouchableOpacity 
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Confirmer</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: fontSize(18),
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
  },
  modalDescription: {
    fontSize: fontSize(14),
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: fontSize(16),
    color: '#333',
    backgroundColor: '#F8F8F8',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#FF5100',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: fontSize(16),
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: fontSize(14),
    color: '#666',
  },
  boundContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    marginBottom: 16,
  },
  boundTitle: {
    fontSize: fontSize(18),
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  boundDescription: {
    fontSize: fontSize(14),
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  closeButtonBottom: {
    backgroundColor: '#FF5100',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: fontSize(16),
    fontWeight: '600',
  },
});