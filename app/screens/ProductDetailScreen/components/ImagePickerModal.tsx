import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import IconComponent from '../../../components/IconComponent';
import { styles } from '../styles';

interface ImagePickerModalProps {
  showImagePickerModal: boolean;
  setShowImagePickerModal: (show: boolean) => void;
  galleryUsed: boolean;
  handleTakePhoto: () => void;
  handleChooseFromGallery: () => void;
  resetAppState: () => void;
}

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  showImagePickerModal,
  setShowImagePickerModal,
  galleryUsed,
  handleTakePhoto,
  handleChooseFromGallery,
  resetAppState,
}) => {
  const { t } = useTranslation();

  if (!showImagePickerModal) return null;

  return (
    <>
      {/* 遮罩层 */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#00000080',
          zIndex: 999,
        }}
        activeOpacity={1}
        onPress={() => setShowImagePickerModal(false)}
      />
      {/* 底部弹窗内容 */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#fff',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingTop: 12,
          paddingHorizontal: 20,
          paddingBottom: 2,
          zIndex: 1000,
        }}
      >
        {!galleryUsed ? (
          <TouchableOpacity
            style={styles.imagePickerOption}
            onPress={handleTakePhoto}
            activeOpacity={1}
          >
            <IconComponent name="camera-outline" size={24} color="#333" />
            <Text style={styles.imagePickerText}>{t('takePhoto')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.imagePickerOption}
            onPress={resetAppState}
            activeOpacity={1}
          >
            <IconComponent name="refresh-outline" size={24} color="#333" />
            <Text style={styles.imagePickerText}>{t('resetCamera')}</Text>
          </TouchableOpacity>
        )}
        <View style={styles.imagePickerDivider} />
        <TouchableOpacity
          style={styles.imagePickerOption}
          onPress={handleChooseFromGallery}
          activeOpacity={1}
        >
          <IconComponent name="images-outline" size={24} color="#333" />
          <Text style={styles.imagePickerText}>{t('chooseFromGallery')}</Text>
        </TouchableOpacity>
        <View style={styles.imagePickerDivider} />
        <TouchableOpacity
          style={styles.imagePickerCancelButton}
          onPress={() => setShowImagePickerModal(false)}
          activeOpacity={1}
        >
          <Text style={styles.imagePickerCancelText}>{t('cancel')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};