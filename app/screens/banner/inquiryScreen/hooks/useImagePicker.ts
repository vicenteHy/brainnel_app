import { useState } from 'react';
import { Alert } from 'react-native';
import { launchImageLibrary, launchCamera, MediaType, ImagePickerResponse, ImageLibraryOptions, CameraOptions } from 'react-native-image-picker';
import { useTranslation } from 'react-i18next';

export const useImagePicker = () => {
  const { t } = useTranslation();
  const [searchImg, setSearchImg] = useState("");
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [galleryUsed, setGalleryUsed] = useState(false);

  const cleanupImagePickerCache = async () => {
    try {
      console.log("react-native-image-picker 自动管理缓存");
      setGalleryUsed(false);
    } catch (error) {
      console.log("清理缓存错误", error);
    }
  };

  const handleChooseFromGallery = async () => {
    console.log("handleChooseFromGallery");
    setShowImagePickerModal(false);

    setTimeout(async () => {
      try {
        const options: ImageLibraryOptions = {
          mediaType: 'photo' as MediaType,
          includeBase64: true,
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
            console.error("相册错误:", response.errorMessage);
            Alert.alert(t("common.error"), t("banner.inquiry.gallery_error"));
            return;
          }
          
          if (response.assets && response.assets.length > 0) {
            console.log("相册选择成功:", response.assets[0].uri);
            const selectedAsset = response.assets[0];
            if (selectedAsset.uri) {
              setSearchImg(selectedAsset.uri);
              if (selectedAsset.base64) {
                setBase64Data(selectedAsset.base64);
              }
            }
          }
        });
      } catch (error: any) {
        console.error("相册错误:", error);
        Alert.alert(t("common.error"), t("banner.inquiry.gallery_error"));
      } finally {
        await cleanupImagePickerCache();
      }
    }, 500);
  };

  const handleTakePhoto = async () => {
    console.log("handleTakePhoto");
    setShowImagePickerModal(false);

    setTimeout(async () => {
      try {
        const options: CameraOptions = {
          mediaType: 'photo' as MediaType,
          includeBase64: true,
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
            console.error("相机错误:", response.errorMessage);
            Alert.alert(t("common.error"), t("banner.inquiry.camera_error"));
            return;
          }
          
          if (response.assets && response.assets.length > 0) {
            console.log("拍照成功:", response.assets[0].uri);
            const selectedAsset = response.assets[0];
            if (selectedAsset.uri) {
              setSearchImg(selectedAsset.uri);
              if (selectedAsset.base64) {
                setBase64Data(selectedAsset.base64);
              }
            }
          }
        });
      } catch (error: any) {
        console.error("相机错误:", error);
        Alert.alert(t("common.error"), t("banner.inquiry.camera_error"));
      } finally {
        await cleanupImagePickerCache();
      }
    }, 500);
  };

  const resetAppState = () => {
    setGalleryUsed(false);
    cleanupImagePickerCache();
    Alert.alert(t('banner.inquiry.camera_reset'), t('banner.inquiry.camera_reset_message'));
  };

  const openImagePicker = () => {
    setShowImagePickerModal(true);
  };

  const clearImage = () => {
    setSearchImg("");
    setBase64Data(null);
  };

  return {
    searchImg,
    base64Data,
    showImagePickerModal,
    galleryUsed,
    setShowImagePickerModal,
    handleChooseFromGallery,
    handleTakePhoto,
    resetAppState,
    openImagePicker,
    clearImage,
  };
};