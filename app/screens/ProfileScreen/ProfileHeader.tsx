import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { styles } from './styles';
import SettingsIcon from '../../components/SettingsIcon';
import fontSize from '../../utils/fontsizeUtils';
import { LinearGradient } from 'expo-linear-gradient';
import { useAvatarCache } from '../../hooks/useAvatarCache';
import { flagMap } from '../../utils/flagMap';

interface ProfileHeaderProps {
  user: any;
  navigation: any;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  navigation,
}) => {
  const avatarText = user?.username?.charAt(0);
  const { avatarUri, isLoading: isLoadingAvatar } = useAvatarCache(user?.user_id, user?.avatar_url);

  // 获取当前用户国家的国旗
  const getCurrentCountryFlag = () => {
    if (user?.country_en) {
      return flagMap.get(user.country_en);
    }
    return null;
  };

  const handleCountryPress = () => {
    navigation.navigate("CountrySetting", { mySetting: user });
  };

  return (
    <View style={styles.profileHeaderContainer}>
        <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              {avatarUri && avatarUri !== 'string' && avatarUri.startsWith('http') ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={[
                    styles.avatarImage,
                    isLoadingAvatar && { opacity: 0.7 }
                  ]}
                />
              ) : (
                <Image
                  source={require('../../../assets/logo/logo.png')}
                  style={styles.avatarImage}
                />
              )}
              {isLoadingAvatar && (
                <View style={styles.uploadingOverlay} />
              )}
            </View>
            
            <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user?.username}
                </Text>
                <Text style={styles.userId}>
                  ID: {user?.user_id}
                </Text>
            </View>

            <View style={{ flex: 1 }} />

            {/* 国家选择按钮 */}
            {user?.country_en && getCurrentCountryFlag() && (
              <TouchableOpacity
                style={styles.countryButton}
                onPress={handleCountryPress}
              >
                <Image
                  source={getCurrentCountryFlag()}
                  style={styles.countryFlag}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => navigation.navigate("SettingList")}
            >
                <SettingsIcon size={fontSize(22)} color="white" />
            </TouchableOpacity>
        </View>
    </View>
  );
}; 