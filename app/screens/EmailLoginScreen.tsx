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
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { loginApi } from '../services/api/login';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // Save email address to local storage for verification use
      await AsyncStorage.setItem('email_for_signin', email);
      
      // Send email verification code
      await loginApi.sendEmailOtp({ 
        email: email, 
        language: 'en' 
      });
      
      // Navigate to verification page
      navigation.navigate('EmailOtp' as any, { email });
    } catch (error: any) {
      console.error('Failed to send verification code:', error);
      Alert.alert('Send Failed', error.response?.data?.message || 'Failed to send verification code, please check email address and try again');
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
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.emailInput}
              placeholder={t('pleaseEnterEmail')}
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
                }}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

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

          <TouchableOpacity 
            style={[
              styles.continueButton, 
              (!isValidEmail(email) || isLoading) && styles.disabledButton
            ]}
            onPress={handleContinue}
            disabled={!isValidEmail(email) || isLoading}
          >
            <Text style={styles.continueButtonText}>
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </Text>
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
    paddingRight: 36, // Leave space for clear button
  },
  clearButton: {
    padding: 8,
    marginRight: 8,
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -12 }], // Center adjustment
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