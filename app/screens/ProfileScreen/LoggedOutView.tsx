import React from 'react';
import { View, Text, Image, ImageBackground, TouchableOpacity, Alert } from 'react-native';
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
    <ImageBackground
      source={require("../../../assets/img/image_b64646d0.png")}
      style={styles.timecardWidget}
      resizeMode="stretch"
    >
      <View style={styles.flexRowWithContent}>
        <View style={styles.financialInfoContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate("SettingList")}
          >
            <View style={styles.svgContainer1}>
              <SettingsIcon size={fontSize(24)} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.notLoggedInContainer}>
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
          <View style={styles.profileImageCircle}>
            <Image
              source={require("../../../assets/img/brainnel-0000.jpg")}
              style={styles.profileImage}
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
    </ImageBackground>
  );
}; 