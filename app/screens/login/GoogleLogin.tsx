import React, { useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  Image,
  Alert,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';

import { RootStackParamList } from '../../types/navigation';
import { loginApi, userApi } from '../../services/api';
import useUserStore from '../../store/user';
import { changeLanguage } from '../../i18n';
import fontSize from '../../utils/fontsizeUtils';
import { auth } from '../../services/firebase/config';

const WEB_CLIENT_ID = "449517618313-av37nffa7rqkefu0ajh5auou3pb0mt51.apps.googleusercontent.com";

interface GoogleLoginButtonProps {
  handleFirstLoginSettings?: (response: any) => Promise<void>;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  handleFirstLoginSettings,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setUser } = useUserStore();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo.data?.idToken) {
        const credential = GoogleAuthProvider.credential(userInfo.data.idToken);
        const firebaseUserCredential = await signInWithCredential(auth, credential);
        const firebaseIdToken = await firebaseUserCredential.user.getIdToken();
        
        const backendResponse = await loginApi.google({ idToken: firebaseIdToken });

        if (backendResponse.access_token) {
          const token = `${backendResponse.token_type} ${backendResponse.access_token}`;
          await AsyncStorage.setItem("token", token);
        }

        if (handleFirstLoginSettings) {
          await handleFirstLoginSettings(backendResponse);
        }

        const user = await userApi.getProfile();
        setUser(user);

        if (user.language) {
          await changeLanguage(user.language);
        }
        
        navigation.navigate("MainTabs", { screen: "Home" });
      }
    } catch (error: any) {
      console.error("Google Sign-In Error: ", error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // 用户取消登录
        return;
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert("Sign-In in Progress", "Please wait for the current sign-in to complete.");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Play Services Not Available", "Google Play Services is not available or outdated.");
      } else {
        Alert.alert("Login Failed", "An error occurred during Google sign-in.");
      }
    }
  };

  return (
    <TouchableOpacity
      style={styles.loginButton}
      onPress={signInWithGoogle}
    >
      <Image
        source={require("../../../assets/login/google.png")}
        style={styles.loginIcon}
      />
      <Text style={styles.loginButtonText}>Continue with Google</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loginIcon: {
    width: 24,
    height: 24,
  },
  loginButtonText: {
    flex: 1,
    color: "#374151",
    fontSize: fontSize(16),
    fontWeight: "500",
    textAlign: "center",
    marginLeft: -24,
  },
}); 