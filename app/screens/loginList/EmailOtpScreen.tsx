import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Alert,
  Platform,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { userApi } from '../../services/api/userApi';
import { settingApi } from '../../services/api/setting';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useUserStore from '../../store/user';
import useAnalyticsStore from '../../store/analytics';
import { changeLanguage } from '../../i18n';
import fontSize from '../../utils/fontsizeUtils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface RouteParams {
  email: string;
}

export const EmailOtpScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { email } = route.params as RouteParams;
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setSettings, setUser } = useUserStore();
  const analyticsStore = useAnalyticsStore();

  useEffect(() => {
    // 启动倒计时
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 4) {
      setError(t('emailLogin.code_error'));
      return;
    }

    setIsVerifying(true);
    setError(null);
    try {
      const response = await userApi.verifyEmailOtp(email, otp);

      if (response.access_token) {
        // 保存token
        const token = response.token_type + " " + response.access_token;
        await AsyncStorage.setItem("token", token);
        
        if (response.first_login) {
          const data = await settingApi.postFirstLogin(221);
          setSettings(data);
        }
        
        const user = await userApi.getProfile();
        if (user.language) {
          await changeLanguage(user.language);
        }
        setUser(user);
        analyticsStore.logLogin(true, "email");
        
        // 导航到主页面
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' as any }],
        });
      }
    } catch (error: any) {
      console.error('邮箱验证失败:', error);
      setError(t('emailLogin.code_error'));
      analyticsStore.logLogin(false, "email");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setError(null);
    try {
      await userApi.sendEmailOtp(email, i18n.language || 'en');
      Alert.alert(
        t('success'),
        t('emailLogin.verification_code_sent') || '验证码已发送到您的邮箱',
        [{ text: t('ok') || 'OK' }]
      );
      // 重置倒计时
      setCountdown(60);
      setCanResend(false);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      console.error('重发验证码失败:', error);
      setError(t('emailLogin.login_failed'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('emailLogin.verificationCode.title') || '验证邮箱'}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>✉️</Text>
          </View>

          <Text style={styles.subtitle}>
            {t('emailLogin.verificationCode.title') || '输入验证码'}
          </Text>
          <Text style={styles.description}>
            {t('emailLogin.code_sent_info', { email }) || `我们已向 ${email} 发送了4位数验证码`}
          </Text>

          <TextInput
            style={[styles.input, error && styles.inputError]}
            placeholder={t('emailLogin.verificationCode.placeholder') || '请输入4位验证码'}
            value={otp}
            onChangeText={(text) => {
              const numericText = text.replace(/\D/g, '').slice(0, 4);
              setOtp(numericText);
              setError(null);
            }}
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={4}
            autoFocus
          />

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <TouchableOpacity
            style={[styles.verifyButton, (!otp || otp.length !== 4 || isVerifying) && styles.disabledButton]}
            onPress={handleVerifyOtp}
            disabled={!otp || otp.length !== 4 || isVerifying}
          >
            {isVerifying ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>{t('emailLogin.verify_and_login') || '验证'}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              {t('whatsapp.resend_text') || '没有收到验证码？'}
            </Text>
            {canResend ? (
              <TouchableOpacity onPress={handleResendOtp} disabled={isResending}>
                <Text style={styles.resendLink}>
                  {isResending ? t('loading') : t('emailLogin.resend_code') || '重新发送'}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.countdownText}>
                {t('emailLogin.resend_code') || '重新发送'} ({countdown}s)
              </Text>
            )}
          </View>

          <Text style={styles.tipText}>
            {t('login.verification.expiration') || '验证码将在5分钟后过期'}
          </Text>
        </View>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: fontSize(20),
    color: '#000',
  },
  title: {
    flex: 1,
    fontSize: fontSize(18),
    fontWeight: '600',
    textAlign: 'center',
    marginRight: 36,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: fontSize(60),
  },
  subtitle: {
    fontSize: fontSize(20),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: fontSize(14),
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 25,
    height: 50,
    paddingHorizontal: 20,
    fontSize: fontSize(12),
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 10,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: fontSize(14),
    textAlign: 'center',
    marginBottom: 16,
  },
  verifyButton: {
    backgroundColor: '#FF5100',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: fontSize(16),
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    fontSize: fontSize(14),
    color: '#666',
  },
  resendLink: {
    fontSize: fontSize(14),
    color: '#0066FF',
    marginLeft: 4,
  },
  countdownText: {
    fontSize: fontSize(14),
    color: '#999',
    marginLeft: 4,
  },
  tipText: {
    fontSize: fontSize(12),
    color: '#999',
    textAlign: 'center',
  },
});