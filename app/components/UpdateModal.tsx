import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
} from 'react-native';
import fontSize from '../utils/fontsizeUtils';
import { UpdateType } from '../utils/versionUtils';
import { t, getCurrentLanguage } from '../i18n';

interface UpdateModalProps {
  visible: boolean;
  updateType: UpdateType;
  message: string;
  messageEn: string;
  linkUrl: string;
  onClose?: () => void;
  onUpdate: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  updateType,
  message,
  messageEn,
  linkUrl,
  onClose,
  onUpdate,
}) => {
  const isForceUpdate = updateType === UpdateType.FORCE_UPDATE;
  const currentLanguage = getCurrentLanguage();
  
  // 根据当前语言选择显示的消息，没有语言时默认使用法语
  const displayMessage = currentLanguage === 'en' ? messageEn : message;
  
  const handleUpdate = () => {
    onUpdate();
    Linking.openURL(linkUrl).catch(err => {
      console.error('[UpdateModal] 打开链接失败:', err);
    });
  };

  const handleClose = () => {
    if (!isForceUpdate && onClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isForceUpdate ? undefined : handleClose}
    >
      <View style={[styles.overlay, isForceUpdate && styles.forceUpdateOverlay]}>
        <View style={styles.modalContainer}>
          <View style={styles.content}>
            <Text style={styles.title}>
              {isForceUpdate ? t('update.forceUpdateTitle') : t('update.optionalUpdateTitle')}
            </Text>
            <Text style={styles.message}>{displayMessage}</Text>
            
            <View style={styles.buttonContainer}>
              {!isForceUpdate && onClose && (
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelButtonText}>{t('update.remindLater')}</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.updateButton,
                  isForceUpdate && styles.forceUpdateButton
                ]}
                onPress={handleUpdate}
                activeOpacity={0.8}
              >
                <Text style={styles.updateButtonText}>
                  {isForceUpdate ? t('update.forceUpdateButton') : t('update.updateNow')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  forceUpdateOverlay: {
    backgroundColor: '#000000CC', // 更深的背景，强调强制性
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: screenWidth - 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: fontSize(18),
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: fontSize(14),
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    fontSize: fontSize(12),
    fontWeight: '500',
    color: '#666',
  },
  updateButton: {
    backgroundColor: '#FF5100',
    shadowColor: '#FF5100',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  forceUpdateButton: {
    flex: 1,
  },
  updateButtonText: {
    fontSize: fontSize(12),
    fontWeight: '600',
    color: '#fff',
  },
});