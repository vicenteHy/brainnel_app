import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import fontSize from '../../../../utils/fontsizeUtils';

interface ImagePickerModalProps {
  visible: boolean;
  galleryUsed: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onChooseFromGallery: () => void;
  onResetCamera: () => void;
}

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  visible,
  galleryUsed,
  onClose,
  onTakePhoto,
  onChooseFromGallery,
  onResetCamera
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.content}>
          {!galleryUsed ? (
            <TouchableOpacity
              style={styles.option}
              onPress={onTakePhoto}
            >
              <Text style={styles.optionText}>{t('banner.inquiry.take_photo')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.option}
              onPress={onResetCamera}
            >
              <Text style={styles.optionText}>{t('banner.inquiry.reset_camera')}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.option}
            onPress={onChooseFromGallery}
          >
            <Text style={styles.optionText}>{t('banner.inquiry.choose_from_gallery')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>{t('banner.inquiry.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionText: {
    fontSize: fontSize(16),
    marginLeft: 12,
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 20,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  cancelText: {
    fontSize: fontSize(16),
    color: "#999",
  },
});