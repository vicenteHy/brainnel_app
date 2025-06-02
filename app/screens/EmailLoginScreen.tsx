import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
// 常见邮箱后缀列表
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
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // 处理邮箱输入变化，生成邮箱建议
  const handleEmailChange = (text: string) => {
    setEmail(text);
    
    // 检查是否包含@符号
    if (text.includes('@')) {
      const [username, domain] = text.split('@');
      
      if (domain) {
        // 如果已经输入了部分域名，过滤匹配的域名
        const filteredDomains = EMAIL_DOMAINS.filter(item => 
          item.toLowerCase().startsWith(domain.toLowerCase())
        );
        
        // 生成完整的邮箱建议列表
        const emailSuggestions = filteredDomains.map(d => `${username}@${d}`);
        setSuggestions(emailSuggestions);
        setShowSuggestions(emailSuggestions.length > 0);
      } else {
        // 如果只输入了@，显示所有域名建议
        const emailSuggestions = EMAIL_DOMAINS.map(d => `${username}@${d}`);
        setSuggestions(emailSuggestions);
        setShowSuggestions(true);
      }
    } else if (text.length > 0) {
      // 没有@符号但有输入内容，显示常见邮箱后缀建议
      const emailSuggestions = EMAIL_DOMAINS.map(d => `${text}@${d}`);
      setSuggestions(emailSuggestions);
      setShowSuggestions(true);
    } else {
      // 输入为空，不显示建议
      setShowSuggestions(false);
    }
  };

  // 选择一个邮箱建议
  const handleSelectSuggestion = (suggestion: string) => {
    setEmail(suggestion);
    setShowSuggestions(false);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleContinue = () => {
    // 验证邮箱格式
    if (isValidEmail(email)) {
      // 这里可以添加发送验证码或其他逻辑
      console.log('Continue with email:', email);
      // 导航到下一个页面
      // navigation.navigate('EmailVerification', { email });
    }
  };

  // 简单的邮箱格式验证
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 渲染单个邮箱建议项
  const renderSuggestionItem = ({ item }: { item: string }) => (
    <TouchableOpacity 
      style={styles.suggestionItem}
      onPress={() => handleSelectSuggestion(item)}
    >
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('logInOrSignUp')}</Text>
        </View>

        {/* 表单 */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.emailInput}
              placeholder={t('pleaseEnterEmail')}
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            {email.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => {
                  setEmail('');
                  setShowSuggestions(false);
                }}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 邮箱后缀建议列表 */}
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

          <TouchableOpacity 
            style={[
              styles.continueButton, 
              !isValidEmail(email) && styles.disabledButton
            ]}
            onPress={handleContinue}
            disabled={!isValidEmail(email)}
          >
            <Text style={styles.continueButtonText}>{t('continue')}</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingBottom: 15,
    borderBottomWidth: 0,
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
    marginRight: 40, // To center properly considering the back button
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 25,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emailInput: {
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
    flex: 1,
    paddingRight: 36, // 为清除按钮留出空间
  },
  clearButton: {
    padding: 8,
    marginRight: 8,
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -12 }], // 居中调整
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
  suggestionsContainer: {
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 10,
    marginTop: -10,
    marginBottom: 20,
    maxHeight: 200,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionsList: {
    padding: 8,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
  continueButton: {
    height: 50,
    backgroundColor: '#0039CB',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 