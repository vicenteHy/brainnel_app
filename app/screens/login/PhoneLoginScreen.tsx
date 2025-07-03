import React, { useState, useCallback, useEffect } from 'react';
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
  SafeAreaView,
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
import fontSize from '../../utils/fontsizeUtils';
import { handleLoginSettingsCheck } from '../../utils/userSettingsUtils';

// 国家代码到Country对象的映射
const countryCodeToCountry: { [key: number]: Country } = {
  225: { name: 'Ivory Coast', code: 'CI', flag: '🇨🇮', userCount: 1100000, phoneCode: '+225' },
  221: { name: 'Senegal', code: 'SN', flag: '🇸🇳', userCount: 400000, phoneCode: '+221' },
  33: { name: 'France', code: 'FR', flag: '🇫🇷', userCount: 50000, phoneCode: '+33' },
  229: { name: 'Benin', code: 'BJ', flag: '🇧🇯', userCount: 200000, phoneCode: '+229' },
  241: { name: 'Gabon', code: 'GA', flag: '🇬🇦', userCount: 500000, phoneCode: '+241' },
  243: { name: 'Democratic Republic of the Congo', code: 'CD', flag: '🇨🇩', userCount: 1000000, phoneCode: '+243' },
  237: { name: 'Cameroon', code: 'CM', flag: '🇨🇲', userCount: 150000, phoneCode: '+237' },
  242: { name: 'Republic of Congo', code: 'CG', flag: '🇨🇬', userCount: 300000, phoneCode: '+242' },
  224: { name: 'Guinea', code: 'GN', flag: '🇬🇳', userCount: 600000, phoneCode: '+224' },
  226: { name: 'Burkina Faso', code: 'BF', flag: '🇧🇫', userCount: 700000, phoneCode: '+226' },
  223: { name: 'Mali', code: 'ML', flag: '🇲🇱', userCount: 800000, phoneCode: '+223' },
  228: { name: 'Togo', code: 'TG', flag: '🇹🇬', userCount: 900000, phoneCode: '+228' },
};

export const PhoneLoginScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setUser, setSettings } = useUserStore();
  const analyticsStore = useAnalyticsStore();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isPasswordMode, setIsPasswordMode] = useState(true); // 默认为密码模式
  const [showVerificationInput, setShowVerificationInput] = useState(false); // 是否显示验证码输入
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0); // 重新发送倒计时
  const [canResend, setCanResend] = useState(true); // 是否可以重新发送
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    name: 'Ivory Coast',
    code: 'CI',
    flag: '🇨🇮',
    userCount: 1100000,
    phoneCode: '+225'
  });
  const [showCountryModal, setShowCountryModal] = useState(false);

  // 组件初始化时加载保存的国家设置
  useEffect(() => {
    const loadSavedCountry = async () => {
      try {
        const savedCountry = await AsyncStorage.getItem('@selected_country');
        if (savedCountry) {
          const parsedCountry = JSON.parse(savedCountry);
          const countryInfo = countryCodeToCountry[parsedCountry.country];
          
          if (countryInfo) {
            setSelectedCountry(countryInfo);
            console.log('已加载保存的国家设置:', countryInfo);
          } else {
            console.log('未找到国家代码映射:', parsedCountry.country);
          }
        }
      } catch (error) {
        console.error('加载保存的国家设置失败:', error);
      }
    };

    loadSavedCountry();
  }, []);

  // 倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
    } else if (resendCountdown === 0 && !canResend) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown, canResend]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleContinue = async () => {
    if (isPasswordMode) {
      await handlePasswordLogin();
    } else if (showVerificationInput) {
      await handleVerifyCode();
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
      const fullPhoneNumber = `${selectedCountry?.phoneCode || '+225'}${phoneNumber}`;
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
        
        // 无论是否首次登录都进行设置检查
        await handleLoginSettingsCheck(res, 'phone');
        
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
      const fullPhoneNumber = `${selectedCountry?.phoneCode || '+225'}${phoneNumber}`;
      console.log('[PhoneLogin] 完整手机号:', fullPhoneNumber);
      console.log('[PhoneLogin] 开始调用发送验证码API');
      
      const response = await userApi.sendOtp(fullPhoneNumber);
      console.log('[PhoneLogin] 发送验证码API响应:', response);
      
      setLoading(false);
      setShowVerificationInput(true);
      setResendCountdown(60);
      setCanResend(false);
      Alert.alert(t('success'), t('phoneLogin.verificationCode.codeSent'));
      
    } catch (error) {
      console.error('[PhoneLogin] 发送验证码失败:', error);
      Alert.alert(t('error'), '发送验证码失败，请重试');
      setLoading(false);
    }
  };

  // 验证OTP验证码
  const handleVerifyCode = async () => {
    console.log('[PhoneLogin] 准备验证OTP');
    console.log('[PhoneLogin] 验证码:', verificationCode);
    
    if (!verificationCode.trim()) {
      Alert.alert(t('error'), t('phoneLogin.verificationCode.codeRequired'));
      return;
    }

    if (verificationCode.length !== 4) {
      Alert.alert(t('error'), t('phoneLogin.verificationCode.codeLength'));
      return;
    }

    if (!/^\d{4}$/.test(verificationCode)) {
      Alert.alert(t('error'), t('phoneLogin.verificationCode.codeFormat'));
      return;
    }

    try {
      setLoading(true);
      const fullPhoneNumber = `${selectedCountry?.phoneCode || '+225'}${phoneNumber}`;
      console.log('[PhoneLogin] 验证OTP完整手机号:', fullPhoneNumber);
      console.log('[PhoneLogin] 开始调用验证OTP API');

      const res = await userApi.verifyOtp(fullPhoneNumber, verificationCode);
      console.log('[PhoneLogin] 验证OTP API响应:', res);

      if (res.access_token) {
        console.log('[PhoneLogin] OTP验证成功');
        const token = res.token_type + " " + res.access_token;
        await AsyncStorage.setItem("token", token);
        
        // 无论是否首次登录都进行设置检查
        await handleLoginSettingsCheck(res, 'phone_otp');
        
        const user = await userApi.getProfile();
        if (user.language) {
          await changeLanguage(user.language);
        }

        setUser(user);
        setLoading(false);
        
        analyticsStore.logLogin(true, "phone_otp");
        navigation.replace("MainTabs");
      }
    } catch (error) {
      console.error('[PhoneLogin] OTP验证失败:', error);
      Alert.alert(t('error'), t('phoneLogin.verificationCode.codeIncorrect'));
      setLoading(false);
      analyticsStore.logLogin(false, "phone_otp");
    }
  };

  const handleCountrySelect = useCallback((country: Country) => {
    setSelectedCountry(country);
    setShowCountryModal(false);
  }, []);

  // 获取按钮禁用状态
  const getButtonDisabled = () => {
    if (isPasswordMode) {
      return !phoneNumber.trim() || !password.trim();
    } else if (showVerificationInput) {
      return !verificationCode.trim() || verificationCode.length !== 4;
    } else {
      return !phoneNumber.trim();
    }
  };

  // 获取按钮文本
  const getButtonText = () => {
    if (isPasswordMode) {
      return t('loginButton');
    } else if (showVerificationInput) {
      return t('phoneLogin.verificationCode.verify');
    } else {
      return t('continue');
    }
  };

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
      <SafeAreaView style={styles.container}>
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
            placeholderTextColor="#666666"
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
              placeholderTextColor="#666666"
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
        {!isPasswordMode && !showVerificationInput && (
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

        {/* 验证码输入框 - 仅在显示验证码输入时显示 */}
        {showVerificationInput && (
          <View style={styles.verificationInputContainer}>
            <Text style={styles.verificationTitle}>{t('phoneLogin.verificationCode.title')}</Text>
            <Text style={styles.verificationSubtitle}>
              {t('phoneLogin.verificationCode.subtitle', { 
                phoneNumber: `${selectedCountry?.phoneCode} ${phoneNumber}` 
              })}
            </Text>
            <View style={styles.codeInputWrapper}>
              <TextInput
                style={styles.verificationInput}
                placeholder={t('phoneLogin.verificationCode.placeholder')}
                placeholderTextColor="#999"
                value={verificationCode}
                onChangeText={(text) => {
                  // 只允许输入数字，最多4位
                  const numericText = text.replace(/[^0-9]/g, '').slice(0, 4);
                  setVerificationCode(numericText);
                }}
                keyboardType="numeric"
                returnKeyType="done"
                autoFocus
                maxLength={4}
                textAlign="center"
              />
            </View>
            <TouchableOpacity 
              style={styles.resendContainer}
              onPress={async () => {
                if (canResend) {
                  await handleSendOtp();
                }
              }}
              disabled={!canResend}
            >
              <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
                {canResend ? t('phoneLogin.verificationCode.resendCode') : `${resendCountdown}s`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          style={[
            styles.continueButton, 
            (getButtonDisabled() || loading) && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={loading || getButtonDisabled()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.continueButtonText}>
              {getButtonText()}
            </Text>
          )}
        </TouchableOpacity>

        {/* 在验证码页面显示切换密码登录选项 */}
        {showVerificationInput && (
          <View style={styles.switchToPasswordContainer}>
            <TouchableOpacity 
              onPress={() => {
                setIsPasswordMode(true);
                setShowVerificationInput(false);
                setVerificationCode('');
                setResendCountdown(0);
                setCanResend(true);
              }}
            >
              <Text style={styles.switchToPasswordText}>{t('phoneLogin.passwordLogin')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 国家选择下拉框 */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
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
              contentContainerStyle={styles.countryListContent}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </SafeAreaView>
      </Modal>
      </SafeAreaView>
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
    paddingTop: 20,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: fontSize(24),
    color: '#000',
  },
  title: {
    fontSize: fontSize(18),
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
    fontSize: fontSize(18),
    marginRight: 4,
  },
  countryCode: {
    fontSize: fontSize(12),
    color: '#333',
    marginRight: 4,
  },
  downArrow: {
    fontSize: fontSize(8),
    color: '#666',
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: fontSize(16),
    paddingRight: 36, // 为清除按钮留出空间
    color: "#000",
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
    fontSize: fontSize(16),
    color: '#999',
    fontWeight: '500',
    textAlign: 'center',
  },
  infoText: {
    fontSize: fontSize(14),
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
    fontSize: fontSize(16),
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
    fontSize: fontSize(16),
    color: "#000",
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
    fontSize: fontSize(14),
    color: '#FF5100',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  // 下拉框样式
  modalContainer: {
    flex: 1,
    backgroundColor: '#00000080',
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
    fontSize: fontSize(18),
    color: '#999',
  },
  modalTitle: {
    flex: 1,
    fontSize: fontSize(18),
    fontWeight: '600',
    textAlign: 'center',
    marginRight: 24, // Balance with close button
  },
  countryList: {
    padding: 8,
  },
  countryListContent: {
    paddingBottom: 60,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  countryItemFlag: {
    fontSize: fontSize(24),
    marginRight: 16,
  },
  countryItemContent: {
    flex: 1,
  },
  countryItemName: {
    fontSize: fontSize(16),
    color: '#333',
  },
  countryItemCode: {
    fontSize: fontSize(14),
    color: '#666',
    marginTop: 4,
  },
  // 验证码输入相关样式
  verificationInputContainer: {
    marginTop: 30,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  verificationTitle: {
    fontSize: fontSize(20),
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  verificationSubtitle: {
    fontSize: fontSize(15),
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  codeInputWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  verificationInput: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 20,
    fontSize: fontSize(18),
    fontWeight: '600',
    letterSpacing: 8,
    textAlign: 'center',
    backgroundColor: '#ffffff',
    color: "#000",
    minHeight: 64,
  },
  resendContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 24,
  },
  resendText: {
    fontSize: fontSize(16),
    color: '#FF6B35',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  resendTextDisabled: {
    color: '#999',
    textDecorationLine: 'none',
  },
  switchToPasswordContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  switchToPasswordText: {
    fontSize: fontSize(14),
    color: '#FF5100',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
}); 