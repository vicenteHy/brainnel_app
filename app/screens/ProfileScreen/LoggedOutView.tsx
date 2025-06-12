import React from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { styles } from './styles';
import SettingsIcon from '../../components/SettingsIcon';
import fontSize from '../../utils/fontsizeUtils';

interface LoggedOutViewProps {
  t: (key: string) => string;
  navigation: any;
  handleLogin: () => void;
}

export const LoggedOutView: React.FC<LoggedOutViewProps> = ({ t, navigation, handleLogin }) => {
  return (
    <View style={styles.loggedOutContainer}>
      <View style={styles.loggedOutHeader}>
        <View style={styles.loggedOutHeaderSpacer} />
        <TouchableOpacity
          onPress={() => navigation.navigate("SettingList")}
          style={styles.settingsButton}
        >
          <SettingsIcon size={fontSize(24)} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.loggedOutContent}>
        <TouchableOpacity 
          onPress={() => {
            Alert.alert(
              t('common.login_required'),
              t('profile.login_required_for_avatar'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('login.now'), onPress: handleLogin }
              ]
            );
          }}
          style={styles.avatarTouchable}
        >
          <View style={styles.loggedOutAvatarContainer}>
            <Image
              source={require("../../../assets/img/brainnel-0000.jpg")}
              style={styles.loggedOutAvatar}
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
        >
          <Text style={styles.loginButtonText}>{t("login.now")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}; 