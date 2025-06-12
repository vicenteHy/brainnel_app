import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { launchImageLibrary, launchCamera, MediaType, ImagePickerResponse, ImageLibraryOptions, CameraOptions } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

export const useImagePicker = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [galleryUsed, setGalleryUsed] = useState(false);

  const { t } = useTranslation();

  const cleanupImagePickerCache = async () => {
    try {
      console.log("react-native-image-picker 自动管理缓存");
      setGalleryUsed(false);
    } catch (error) {
      console.log("清理缓存错误", error);
      setGalleryUsed(false);
    }
  };

  const handleChooseFromGallery = useCallback(async () => {
    setShowImagePickerModal(false);
    setTimeout(async () => {
      try {
        const options: ImageLibraryOptions = {
          mediaType: 'photo' as MediaType,
          includeBase64: false,
          maxHeight: 2000,
          maxWidth: 2000,
          quality: 1,
        };
        
        launchImageLibrary(options, (response: ImagePickerResponse) => {
          if (response.didCancel) {
            console.log('用户取消了图片选择');
            return;
          }
          
          if (response.errorMessage) {
            console.log('相册错误:', response.errorMessage);
            return;
          }
          
          if (response.assets && response.assets.length > 0) {
            const asset = response.assets[0];
            if (asset.uri) {
              navigation.navigate("ImageSearchResultScreen", {
                image: asset.uri,
                type: 1,
              });
            }
          }
        });
      } catch (error) {
        console.error("相册错误:", error);
        await cleanupImagePickerCache();
      }
    }, 500);
  }, [navigation]);

  const handleTakePhoto = useCallback(async () => {
    setShowImagePickerModal(false);
    setTimeout(async () => {
      try {
        const options: CameraOptions = {
          mediaType: 'photo' as MediaType,
          includeBase64: false,
          maxHeight: 2000,
          maxWidth: 2000,
          quality: 1,
        };
        
        launchCamera(options, (response: ImagePickerResponse) => {
          if (response.didCancel) {
            console.log('用户取消了拍照');
            return;
          }
          
          if (response.errorMessage) {
            console.log('相机错误:', response.errorMessage);
            return;
          }
          
          if (response.assets && response.assets.length > 0) {
            const asset = response.assets[0];
            if (asset.uri) {
              navigation.navigate("ImageSearchResultScreen", {
                image: asset.uri,
                type: 1,
              });
            }
          }
        });
      } catch (error) {
        console.error("相机错误:", error);
        await cleanupImagePickerCache();
      }
    }, 500);
  }, [navigation]);

  const resetAppState = useCallback(() => {
    setGalleryUsed(false);
    cleanupImagePickerCache();
    Alert.alert(t('banner.inquiry.camera_reset'), t('banner.inquiry.camera_reset_message'));
  }, [t]);

  const handleCameraPress = useCallback(() => {
    setShowImagePickerModal(true);
  }, []);

  return {
    showImagePickerModal,
    setShowImagePickerModal,
    galleryUsed,
    handleChooseFromGallery,
    handleTakePhoto,
    resetAppState,
    handleCameraPress,
  };
};