import React, { useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  Image,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { getAuth, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';

import { RootStackParamList } from '../../types/navigation';
import { loginApi, userApi } from '../../services/api';
import useUserStore from '../../store/user';
import { changeLanguage } from '../../i18n';
import fontSize from '../../utils/fontsizeUtils';
import { firebaseApp } from '../../services/firebase/config'; // 假设Firebase app实例在此导出

// 确保Web浏览器会话在完成后可以关闭
WebBrowser.maybeCompleteAuthSession();

const IOS_CLIENT_ID = "449517618313-o672a77oeaol21n1mk2qm77qvp3r3hec.apps.googleusercontent.com";
const ANDROID_CLIENT_ID = "449517618313-s1bmot9r3ic4s0g84ff13b5uasn2l0nv.apps.googleusercontent.com";
// 注意：Web Client ID通常与iOS或Android不同，这里暂时使用您之前代码中的Web ID
const WEB_CLIENT_ID = "449517618313-av37nffa7rqkefu0ajh5auou3pb0mt51.apps.googleusercontent.com";

interface GoogleLoginButtonProps {
  handleFirstLoginSettings?: (response: any) => Promise<void>;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  handleFirstLoginSettings,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setUser } = useUserStore();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    const handleSignIn = async () => {
      if (response?.type === 'success') {
        const { id_token } = response.params;
        const auth = getAuth(firebaseApp);
        const credential = GoogleAuthProvider.credential(id_token);
        
        try {
          // 使用凭据登录Firebase
          const firebaseUserCredential = await signInWithCredential(auth, credential);
          
          // 从Firebase获取最新的idToken，发送到您的后端
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

        } catch (error: any) {
          console.error("Firebase/Backend Sign-In Error: ", error);
          Alert.alert("Login Failed", "An error occurred during login verification.");
        }
      } else if (response?.type === 'error') {
        Alert.alert("Login Failed", response.params.error_description || "An unknown error occurred.");
      }
    };

    handleSignIn();
  }, [response]);

  return (
    <TouchableOpacity
      style={styles.loginButton}
      onPress={() => promptAsync()}
      disabled={!request}
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