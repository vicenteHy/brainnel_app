import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Platform,
  FlatList,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { userApi } from '../../services/api/userApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VerificationLimiter from '../../utils/verificationLimiter';
import fontSize from '../../utils/fontsizeUtils';
// Common email domain list
const EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'mail.com',
  'protonmail.com',
  'qq.com',
  '163.com',
  '126.com',
];

export const EmailLoginScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailInputRef = useRef<TextInput>(null);

  // Handle email input changes and generate email suggestions
  const handleEmailChange = (text: string) => {
    setEmail(text);
    
    // Check if contains @ symbol
    if (text.includes('@')) {
      const [username, domain] = text.split('@');
      
      if (domain) {
        // If partial domain is entered, filter matching domains
        const filteredDomains = EMAIL_DOMAINS.filter(item => 
          item.toLowerCase().startsWith(domain.toLowerCase())
        );
        
        // Generate complete email suggestion list
        const emailSuggestions = filteredDomains.map(d => `${username}@${d}`);
        setSuggestions(emailSuggestions);
        setShowSuggestions(emailSuggestions.length > 0);
      } else {
        // If only @ is entered, show all domain suggestions
        const emailSuggestions = EMAIL_DOMAINS.map(d => `${username}@${d}`);
        setSuggestions(emailSuggestions);
        setShowSuggestions(true);
      }
    } else if (text.length > 0) {
      // No @ symbol but has input content, show common email suffix suggestions
      const emailSuggestions = EMAIL_DOMAINS.map(d => `${text}@${d}`);
      setSuggestions(emailSuggestions);
      setShowSuggestions(true);
    } else {
      // Input is empty, don't show suggestions
      setShowSuggestions(false);
    }
  };

  // Select an email suggestion
  const handleSelectSuggestion = (suggestion: string) => {
    setEmail(suggestion);
    setShowSuggestions(false);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleContinue = async () => {
    if (!isValidEmail(email)) {
      setError(t('pleaseEnterEmail'));
      return;
    }

    // 检查发送限制
    const limitCheck = await VerificationLimiter.canSendVerification(email);
    if (!limitCheck.allowed) {
      setError(limitCheck.reason || t('error'));
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // 发送邮箱验证码
      await userApi.sendEmailOtp(email, i18n.language || 'en');
      await VerificationLimiter.recordAttempt(email);
      
      // 成功提示
      Alert.alert(
        t('success'),
        t('emailLogin.verification_code_sent') || '验证码已发送到您的邮箱',
        [{ text: t('ok') || 'OK' }]
      );
      
      // 导航到验证页面
      navigation.navigate('EmailOtp' as any, { email });
    } catch (error: any) {
      await VerificationLimiter.recordAttempt(email);
      console.error('Failed to send verification code:', error);
      setError(t('emailLogin.login_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Simple email format validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Render single email suggestion item
  const renderSuggestionItem = ({ item }: { item: string }) => (
    <TouchableOpacity 
      style={styles.suggestionItem}
      onPress={() => handleSelectSuggestion(item)}
    >
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.safeAreaContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('logInOrSignUp')}</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Email Label */}
          <Text style={styles.inputLabel}>{t('emailLabel')}</Text>
          
          <TouchableOpacity 
            style={[styles.inputContainer, error && styles.inputContainerError]}
            activeOpacity={1}
            onPress={() => {
              // 确保输入框获得焦点
              if (emailInputRef.current) {
                emailInputRef.current.focus();
              }
            }}
          >
            <TextInput
              ref={emailInputRef}
              style={styles.emailInput}
              placeholder={t('emailPlaceholder')}
              placeholderTextColor="#999"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              autoFocus
            />
            {email.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => {
                  setEmail('');
                  setShowSuggestions(false);
                  setError(null);
                  // 清除后重新聚焦
                  if (emailInputRef.current) {
                    emailInputRef.current.focus();
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.clearButtonText}>×</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Email domain suggestion list */}
          {showSuggestions && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={suggestions}
                renderItem={renderSuggestionItem}
                keyExtractor={(item) => item}
                style={styles.suggestionsList}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          )}

          {/* 错误提示 */}
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {/* 提示文本 */}
          <Text style={styles.infoText}>{t('emailLogin.info_text')}</Text>

          <TouchableOpacity 
            style={[
              styles.continueButton, 
              (!isValidEmail(email) || isLoading) && styles.disabledButton
            ]}
            onPress={handleContinue}
            disabled={!isValidEmail(email) || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.continueButtonText}>
                {t('emailLogin.send_code')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeAreaContent: {
    flex: 1,
    paddingTop: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 15,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: fontSize(20),
    color: '#333',
    fontWeight: '400',
  },
  title: {
    fontSize: fontSize(20),
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'center',
    marginRight: 48,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  inputLabel: {
    fontSize: fontSize(14),
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },

  inputContainerError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF8F8',
  },
  emailInput: {
    height: '100%',
    paddingHorizontal: 16,
    fontSize: fontSize(15),
    flex: 1,
    paddingRight: 44,
    color: '#333',
    letterSpacing: 0.3,
  },

  clearButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -16 }],
    height: 32,
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E5E5',
    borderRadius: 16,
  },
  clearButtonText: {
    fontSize: fontSize(18),
    color: '#666',
    fontWeight: '400',
    lineHeight: 20,
  },
  suggestionsContainer: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    marginTop: -12,
    marginBottom: 20,
    maxHeight: 220,
    backgroundColor: '#fff',

  },
  suggestionsList: {
    padding: 8,
  },
  suggestionItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    fontSize: fontSize(15),
    color: '#333',
  },
  continueButton: {
    height: 56,
    backgroundColor: '#FF5100',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,

  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: fontSize(16),
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: fontSize(14),
    marginBottom: 16,
    textAlign: 'left',
    marginLeft: 4,
    fontWeight: '500',
  },
  infoText: {
    color: '#666',
    fontSize: fontSize(14),
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 