import React, { useState } from "react";
import {
  ScrollView,
  StatusBar,
  SafeAreaView,
  Alert,
  StyleSheet,
  View,
  Modal,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import useUserStore from "../../store/user";
import Toast from "react-native-toast-message";
import { userApi } from "../../services/api/userApi";
import * as ImagePicker from 'expo-image-picker';
import { MediaType } from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { LoggedOutView } from "./LoggedOutView";
import { OrderSection, ToolSection } from "./Sections";
import { ProfileHeader } from "./ProfileHeader";
import { VipCard } from "./VipCard";
import { BalanceCard } from "./BalanceCard";
import { avatarCacheService } from "../../services/avatarCacheService";
import RechargeScreen from "../BalanceScreen/RechargeScreen";

type RootStackParamList = {
  SettingList: undefined;
  Home: undefined;
  MyAccount: undefined;
  Login: undefined;
  Status: { status: number | null };
  BrowseHistoryScreen: undefined;
  AddressList: undefined;
  Collection: undefined;
  Balance: undefined;
  MemberIntroduction: undefined;
};

export const ProfileScreen = () => {
  const { user, setUser } = useUserStore();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);

  const handleLogin = () => {
    navigation.navigate("Login");
  };

  const selectAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('permissions.required'), t('permissions.photo_library_required'), [{ text: t('common.ok') }]);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('选择头像失败:', error);
      Alert.alert(t('common.error'), t('common.something_went_wrong'));
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    try {
      setUploadingAvatar(true);
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const base64String = base64data.split(',')[1];
      const filename = imageUri.split('/').pop() || 'avatar.jpg';

      const updatedProfile = await userApi.updateAvatar({
        image_base64: base64String,
        image_filename: filename,
      });
      
      // 清理旧的头像缓存
      if (user.user_id) {
        await avatarCacheService.deleteCachedAvatar(user.user_id.toString());
        console.log('[ProfileScreen] 已清理旧的头像缓存');
      }
      
      setUser(updatedProfile);
      Toast.show({
        text1: t('profile.avatar_updated_successfully'),
        type: 'success',
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error('处理头像失败:', error);
      Alert.alert(t('common.error'), t('profile.avatar_upload_failed'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRechargePress = () => {
    setShowRechargeModal(true);
  };

  const handleCloseRecharge = () => {
    setShowRechargeModal(false);
  };
  
  return (
          <LinearGradient
        colors={['#FF6F30', '#f5f5f5']}
          locations={[0.3,0.5]}
        style={componentStyles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
      <SafeAreaView style={componentStyles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
        <ScrollView style={componentStyles.container} scrollEnabled={false}>
          <View style={componentStyles.headerSection}>
            {user.user_id ? (
              <>
                <ProfileHeader 
                  user={user}
                  navigation={navigation}
                  selectAvatar={selectAvatar}
                  uploadingAvatar={uploadingAvatar}
                />
                <VipCard user={user} />
                <BalanceCard 
                  balance={String(user.balance)} 
                  currency={user.currency} 
                  onRechargePress={handleRechargePress}
                />
              </>
            ) : (
              <LoggedOutView t={t} navigation={navigation} handleLogin={handleLogin} />
            )}
          </View>
          <View style={componentStyles.contentSection}>
            <OrderSection t={t} navigation={navigation} />
            <ToolSection t={t} navigation={navigation} />
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Recharge Modal */}
      <Modal
        visible={showRechargeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseRecharge}
      >
        <RechargeScreen onClose={handleCloseRecharge} />
      </Modal>
    </LinearGradient>
  );
};

const componentStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: 'transparent',
  },
  contentSection: {
    backgroundColor: '#f5f5f5',
  },
});
