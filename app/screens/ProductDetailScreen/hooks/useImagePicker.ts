import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const useImagePicker = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [galleryUsed, setGalleryUsed] = useState(false);

  const cleanupImagePickerCache = async () => {
    try {
      if (Platform.OS === "web") {
        console.log("Cache cleanup skipped on web platform");
        setGalleryUsed(false);
        return;
      }
      const cacheDir = `${FileSystem.cacheDirectory}ImagePicker`;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (dirInfo.exists && dirInfo.isDirectory) {
        await FileSystem.deleteAsync(cacheDir, { idempotent: true });
        console.log("已清理ImagePicker缓存:", cacheDir);
      } else {
        console.log("ImagePicker缓存目录不存在或不是目录，无需清理:", cacheDir);
      }
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
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.status !== "granted") {
          console.log("相册权限被拒绝");
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 1,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          navigation.navigate("ImageSearchResultScreen", {
            image: result.assets[0].uri,
            type: 1,
          });
        }
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
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.status !== "granted") {
          console.log("相机权限被拒绝");
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 1,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          navigation.navigate("ImageSearchResultScreen", {
            image: result.assets[0].uri,
            type: 1,
          });
        }
      } catch (error) {
        console.error("相机错误:", error);
        await cleanupImagePickerCache();
      }
    }, 500);
  }, [navigation]);

  const resetAppState = useCallback(() => {
    setGalleryUsed(false);
    cleanupImagePickerCache();
    Alert.alert("已重置", "现在您可以使用相机功能了");
  }, []);

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