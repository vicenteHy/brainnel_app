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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Country, countries } from '../../constants/countries';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginApi } from '../../services/api/login';
import { userApi } from '../../services/api/userApi';
import { settingApi } from '../../services/api/setting';
import useUserStore from '../../store/user';
import useAnalyticsStore from '../../store/analytics';
import { changeLanguage } from '../../i18n';

export const WhatsAppLoginScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setUser, setSettings } = useUserStore();
  const analyticsStore = useAnalyticsStore();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
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

  // 发送WhatsApp验证码
  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert(t('error'), t('phoneNumber') + ' ' + t('login.required'));
      return;
    }

    try {
      setLoading(true);
      const countryCode = selectedCountry?.phoneCode || '+225';
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      
      console.log("[WhatsApp] 发送验证码 - 完整号码:", fullPhoneNumber);
      
      await loginApi.sendWhatsappOtp({
        phone_number: fullPhoneNumber,
        language: 'en' // 可以根据当前语言设置
      });
      
      setShowVerificationInput(true);
      setCountdown(60);
      setLoading(false);
      
      Alert.alert(t('success'), t('whatsapp.verification_code_sent'));
      
      // 开始倒计时
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('[WhatsApp] 发送验证码失败:', error);
      Alert.alert(t('error'), '发送验证码失败，请重试');
      setLoading(false);
    }
  };

  // 验证WhatsApp验证码并登录
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 4) {
      Alert.alert(t('error'), '请输入4位验证码');
      return;
    }

    try {
      setLoading(true);
      const countryCode = selectedCountry?.phoneCode || '+225';
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      
      console.log("[WhatsApp] 验证验证码 - 完整号码:", fullPhoneNumber);
      
      const res = await loginApi.verifyWhatsappOtp({
        phone_number: fullPhoneNumber,
        code: verificationCode
      });

      if (res.access_token) {
        const token = res.token_type + " " + res.access_token;
        await AsyncStorage.setItem("token", token);
        
        if (res.first_login) {
          const countryCodeStr = selectedCountry?.phoneCode?.replace('+', '') || '225';
          const countryCode = parseInt(countryCodeStr);
          const data = await settingApi.postFirstLogin(countryCode);
          setSettings(data);
        }
        
        const user = await userApi.getProfile();
        if (user.language) {
          await changeLanguage(user.language);
        }

        setUser(user);
        setLoading(false);
        
        analyticsStore.logLogin(true, "whatsapp");
        navigation.replace("MainTabs");
      }
    } catch (error) {
      console.error('[WhatsApp] 验证码验证失败:', error);
      Alert.alert(t('error'), t('whatsapp.code_error'));
      setLoading(false);
      analyticsStore.logLogin(false, "whatsapp");
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
        <Text style={styles.title}>{t('whatsapp.title')}</Text>
      </View>

      {/* 表单 */}
      <View style={styles.formContainer}>
        {!showVerificationInput ? (
          <>
            {/* 手机号输入 */}
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
                placeholder={t('whatsapp.phone_placeholder')}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoFocus
              />
              {phoneNumber.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={() => setPhoneNumber('')}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.infoText}>
              {t('whatsapp.info_text')}
            </Text>

            <TouchableOpacity 
              style={[
                styles.continueButton, 
                (!phoneNumber.trim() || loading) && styles.disabledButton
              ]}
              onPress={handleSendCode}
              disabled={loading || !phoneNumber.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.continueButtonText}>
                  {t('whatsapp.send_code')}
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* 验证码输入 */}
            <Text style={styles.verificationTitle}>{t('whatsapp.verification_title')}</Text>
            <Text style={styles.verificationDescription}>
              {t('whatsapp.code_sent_info', { 
                countryCode: selectedCountry.phoneCode, 
                phoneNumber: phoneNumber 
              })}
            </Text>

            <TextInput
              style={styles.codeInput}
              placeholder={t('whatsapp.code_placeholder')}
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              maxLength={4}
              autoFocus
            />

            <TouchableOpacity 
              style={[
                styles.continueButton, 
                (!verificationCode || verificationCode.length !== 4 || loading) && styles.disabledButton
              ]}
              onPress={handleVerifyCode}
              disabled={loading || !verificationCode || verificationCode.length !== 4}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.continueButtonText}>
                  {t('whatsapp.connect')}
                </Text>
              )}
            </TouchableOpacity>

            {/* 重发验证码 */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                {t('whatsapp.resend_text')}
              </Text>
              <TouchableOpacity 
                onPress={handleSendCode}
                disabled={countdown > 0 || loading}
                style={styles.resendButton}
              >
                <Text style={[styles.resendLink, (countdown > 0 || loading) && styles.disabledText]}>
                  {countdown > 0 ? `${countdown}s` : t('whatsapp.resend_link')}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
    marginRight: 40,
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
    paddingRight: 36,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -12 }],
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
  verificationTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  verificationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  codeInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 25,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 4,
  },
  continueButton: {
    height: 50,
    backgroundColor: '#25D366',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendButton: {
    marginLeft: 4,
  },
  resendLink: {
    fontSize: 14,
    color: '#25D366',
    fontWeight: '500',
  },
  disabledText: {
    color: '#CCCCCC',
  },
  // Modal样式
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
    marginRight: 24,
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