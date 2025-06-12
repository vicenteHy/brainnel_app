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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { loginApi } from '../services/api/login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface RouteParams {
  email: string;
}

export const EmailOtpScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { email } = route.params as RouteParams;
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const { login } = useAuth();

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
    if (!otp || otp.length < 4) {
      Alert.alert('错误', '请输入完整的验证码');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await loginApi.verifyEmailOtp({
        email: email,
        code: otp
      });

      if (response.data && response.data.access_token) {
        // 保存token
        await AsyncStorage.setItem('auth_token', response.data.access_token);
        await AsyncStorage.setItem('refresh_token', response.data.refresh_token || '');
        
        // 登录成功
        await login();
        
        Alert.alert('成功', '邮箱验证成功，已自动登录', [
          {
            text: '确定',
            onPress: () => {
              // 导航到主页面
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' as any }],
              });
            }
          }
        ]);
      }
    } catch (error: any) {
      console.error('邮箱验证失败:', error);
      Alert.alert('验证失败', error.response?.data?.message || '验证码无效或已过期，请重新发送');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    try {
      await loginApi.sendEmailOtp({
        email: email,
        language: 'zh'
      });
      
      Alert.alert('成功', '验证码已重新发送到您的邮箱');
      
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
      Alert.alert('发送失败', error.response?.data?.message || '发送验证码失败，请稍后重试');
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>验证邮箱</Text>
        </View>

        {/* 内容 */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.emailIcon}>📧</Text>
          </View>
          
          <Text style={styles.mainText}>输入验证码</Text>
          <Text style={styles.subText}>
            我们已向 {email} 发送了6位数验证码
          </Text>
          
          <TextInput
            style={styles.otpInput}
            placeholder="请输入6位验证码"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />

          <TouchableOpacity 
            style={[
              styles.verifyButton,
              (!otp || otp.length < 4 || isVerifying) && styles.disabledButton
            ]}
            onPress={handleVerifyOtp}
            disabled={!otp || otp.length < 4 || isVerifying}
          >
            <Text style={styles.verifyButtonText}>
              {isVerifying ? '验证中...' : '验证'}
            </Text>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>没有收到验证码？</Text>
            <TouchableOpacity
              style={[
                styles.resendButton,
                (!canResend || isResending) && styles.disabledButton
              ]}
              onPress={handleResendOtp}
              disabled={!canResend || isResending}
            >
              <Text style={[
                styles.resendButtonText,
                (!canResend || isResending) && styles.disabledButtonText
              ]}>
                {isResending ? '发送中...' : canResend ? '重新发送' : `重新发送 (${countdown}s)`}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.tipText}>
            提示：验证码将在5分钟后过期
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 15,
    paddingHorizontal: 16,
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  emailIcon: {
    fontSize: 64,
  },
  mainText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 25,
    height: 50,
    paddingHorizontal: 20,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 24,
    width: '100%',
  },
  verifyButton: {
    backgroundColor: '#0039CB',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  resendButton: {
    padding: 8,
  },
  resendButtonText: {
    fontSize: 14,
    color: '#0039CB',
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: '#999',
  },
  tipText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});