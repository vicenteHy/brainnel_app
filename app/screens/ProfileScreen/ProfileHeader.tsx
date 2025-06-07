import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { styles } from './styles';
import SettingsIcon from '../../components/SettingsIcon';
import fontSize from '../../utils/fontsizeUtils';
import { LinearGradient } from 'expo-linear-gradient';
import { useAvatarCache } from '../../hooks/useAvatarCache';

interface ProfileHeaderProps {
  user: any;
  navigation: any;
  selectAvatar: () => void;
  uploadingAvatar: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  navigation,
  selectAvatar,
  uploadingAvatar,
}) => {
  const avatarText = user?.username?.charAt(0);
  const { avatarUri, isLoading: isLoadingAvatar } = useAvatarCache(user?.user_id, user?.avatar_url);

  return (
    <View style={styles.profileHeaderContainer}>
        <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={selectAvatar}
              disabled={uploadingAvatar}
              style={styles.avatarContainer}
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={[
                    styles.avatarImage,
                    (uploadingAvatar || isLoadingAvatar) && { opacity: 0.7 }
                  ]}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>{avatarText}</Text>
                </View>
              )}
              {(uploadingAvatar || isLoadingAvatar) && (
                <View style={styles.uploadingOverlay} />
              )}
            </TouchableOpacity>
            
            <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user?.username}
                </Text>
                <Text style={styles.userPhone}>
                  {user?.phone}
                </Text>
            </View>

            <View style={{ flex: 1 }} />

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