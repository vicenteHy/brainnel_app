import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Platform,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Country, countries } from '../../constants/countries';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userApi } from '../../services/api/userApi';
import { settingApi } from '../../services/api/setting';
import useUserStore from '../../store/user';
import useAnalyticsStore from '../../store/analytics';
import { changeLanguage } from '../../i18n';

export const PhoneLoginScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setUser, setSettings } = useUserStore();
  const analyticsStore = useAnalyticsStore();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordMode, setIsPasswordMode] = useState(true); // 默认为密码模式
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    name: 'Ivory Coast',
    code: 'CI',
    flag: '🇨🇮',
    userCount: 1100000,
    phoneCode: '+225'
  });
  const [showCountryModal, setShowCountryModal] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleContinue = async () => {
    if (isPasswordMode) {
      await handlePasswordLogin();
    } else {
      await handleSendOtp();
    }
  };

  // 密码登录
  const handlePasswordLogin = async () => {
    console.log('[PhoneLogin] 准备密码登录');
    console.log('[PhoneLogin] 手机号:', phoneNumber);
    console.log('[PhoneLogin] 密码长度:', password?.length);

    if (!phoneNumber.trim()) {
      Alert.alert(t('error'), t('phoneNumber') + ' ' + t('login.required'));
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert(t('error'), t('passwordLabel') + ' 至少6位');
      return;
    }

    try {
      setLoading(true);
      const fullPhoneNumber = `${selectedCountry?.phoneCode?.replace('+', '') || '225'}${phoneNumber}`;
      console.log('[PhoneLogin] 密码登录完整手机号:', fullPhoneNumber);

      const params = {
        grant_type: "password",
        username: fullPhoneNumber,
        password: password,
        client_id: "2",
        client_secret: "",
        scope: "",
      };
      console.log('[PhoneLogin] 密码登录请求参数:', params);

      const res = await userApi.login(params);
      console.log('[PhoneLogin] 密码登录API响应:', res);

      if (res.access_token) {
        console.log('[PhoneLogin] 密码登录成功');
        const token = res.token_type + " " + res.access_token;
        await AsyncStorage.setItem("token", token);
        
        if (res.first_login) {
          const countryCode = parseInt(selectedCountry?.phoneCode?.replace('+', '') || '225');
          const data = await settingApi.postFirstLogin(countryCode);
          setSettings(data);
        }
        
        const user = await userApi.getProfile();
        if (user.language) {
          await changeLanguage(user.language);
        }

        setUser(user);
        setLoading(false);
        
        analyticsStore.logLogin(true, "phone");
        navigation.replace("MainTabs");
      }
    } catch (error) {
      console.error('[PhoneLogin] 密码登录失败:', error);
      Alert.alert(t('error'), t('login.error'));
      setLoading(false);
      analyticsStore.logLogin(false, "phone");
    }
  };

  // 发送验证码
  const handleSendOtp = async () => {
    console.log('[PhoneLogin] 准备发送验证码');
    console.log('[PhoneLogin] 当前手机号:', phoneNumber);
    console.log('[PhoneLogin] 选择的国家:', selectedCountry);
    
    if (!phoneNumber.trim()) {
      Alert.alert(t('error'), t('phoneNumber') + ' ' + t('login.required'));
      return;
    }

    try {
      setLoading(true);
      const fullPhoneNumber = `${selectedCountry?.phoneCode?.replace('+', '') || '225'}${phoneNumber}`;
      console.log('[PhoneLogin] 完整手机号:', fullPhoneNumber);
      console.log('[PhoneLogin] 开始调用发送验证码API');
      
      const response = await userApi.sendOtp(fullPhoneNumber);
      console.log('[PhoneLogin] 发送验证码API响应:', response);
      
      setLoading(false);
      Alert.alert(t('success'), t('verificationCodeInfo'));
      // TODO: 跳转到验证码输入页面或在当前页面显示验证码输入框
      
    } catch (error) {
      console.error('[PhoneLogin] 发送验证码失败:', error);
      Alert.alert(t('error'), '发送验证码失败，请重试');
      setLoading(false);
    }
  };

  const handleCountrySelect = useCallback((country: Country) => {
    setSelectedCountry(country);
    setShowCountryModal(false);
  }, []);

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity 
      style={styles.countryItem}
      onPress={() => handleCountrySelect(item)}
    >
      <Text style={styles.countryItemFlag}>{item.flag}</Text>
      <View style={styles.countryItemContent}>
        <Text style={styles.countryItemName}>{item.name}</Text>
        <Text style={styles.countryItemCode}>{item.phoneCode}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('logInOrSignUp')}</Text>
      </View>

      {/* 表单 */}
      <View style={styles.formContainer}>
        <View style={styles.phoneInputContainer}>
          <TouchableOpacity 
            style={styles.countrySelector}
            onPress={() => setShowCountryModal(true)}
          >
            <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
            <Text style={styles.countryCode}>{selectedCountry.phoneCode}</Text>
            <Text style={styles.downArrow}>▼</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.phoneInput}
            placeholder={t('phoneNumber')}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="numeric"
            returnKeyType="done"
            autoFocus
          />
          {phoneNumber.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setPhoneNumber('');
              }}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 密码输入框 - 仅在密码模式下显示 */}
        {isPasswordMode && (
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
            />
          </View>
        )}

        {/* SMS验证切换 - 密码模式下显示 */}
        {isPasswordMode && (
          <View style={styles.toggleRow}>
            <View style={styles.toggleSpacer} />
            <TouchableOpacity 
              style={styles.toggleContainer}
              onPress={() => setIsPasswordMode(false)}
            >
              <Text style={styles.toggleText}>{t('phoneLogin.smsVerificationLogin')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 验证码模式的提示文本和切换按钮 */}
        {!isPasswordMode && (
          <View style={styles.verificationContainer}>
            <Text style={styles.infoText}>
              {t('verificationCodeInfo')}
            </Text>
            <View style={styles.toggleRow}>
              <View style={styles.toggleSpacer} />
              <TouchableOpacity 
                style={styles.toggleContainer}
                onPress={() => setIsPasswordMode(true)}
              >
                <Text style={styles.toggleText}>{t('phoneLogin.passwordLogin')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[
            styles.continueButton, 
            ((isPasswordMode ? 
              (!phoneNumber.trim() || !password.trim()) : 
              !phoneNumber.trim()
            ) || loading) && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={loading || (isPasswordMode ? 
            (!phoneNumber.trim() || !password.trim()) : 
            !phoneNumber.trim())
          }
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.continueButtonText}>
              {isPasswordMode ? t('loginButton') : t('continue')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 国家选择下拉框 */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowCountryModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t('selectCountry')}</Text>
            </View>
            <FlatList
              data={countries}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.code}
              style={styles.countryList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#000',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // To center properly considering the back button
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 25,
    overflow: 'hidden',
    height: 50,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: '#E1E1E1',
    backgroundColor: '#F7F7F7',
    height: '100%',
    minWidth: 90,
    width: 90,
    justifyContent: 'center',
  },
  countryFlag: {
    fontSize: 18,
    marginRight: 4,
  },
  countryCode: {
    fontSize: 12,
    color: '#333',
    marginRight: 4,
  },
  downArrow: {
    fontSize: 8,
    color: '#666',
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
    paddingRight: 36, // 为清除按钮留出空间
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -12 }], // 居中调整，根据按钮高度的一半调整
    height: 24,
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
    lineHeight: 20,
  },
  continueButton: {
    height: 50,
    backgroundColor: '#FF5100',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordInputContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  passwordInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 25,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  verificationContainer: {
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 12,
  },
  toggleSpacer: {
    flex: 1,
  },
  toggleContainer: {
    alignSelf: 'flex-end',
  },
  toggleText: {
    fontSize: 14,
    color: '#FF5100',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  // 下拉框样式
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseButtonText: {
    fontSize: 18,
    color: '#999',
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginRight: 24, // Balance with close button
  },
  countryList: {
    padding: 8,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  countryItemFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  countryItemContent: {
    flex: 1,
  },
  countryItemName: {
    fontSize: 16,
    color: '#333',
  },
  countryItemCode: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
}); 