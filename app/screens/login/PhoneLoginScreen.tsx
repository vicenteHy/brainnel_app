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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Country, countries } from '../../constants/countries';

export const PhoneLoginScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    name: 'Republic of Congo',
    code: 'CG',
    flag: '🇨🇬',
    userCount: 300000,
    phoneCode: '+242'
  });
  const [showCountryModal, setShowCountryModal] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleContinue = () => {
    console.log(123);
    
    // 处理继续操作，发送验证码
    if (phoneNumber.trim()) {
      // 这里可以添加发送验证码的逻辑
      console.log('Sending verification code to:', phoneNumber);
      // 导航到验证码界面
      // navigation.navigate('PhoneVerification', { phoneNumber, countryCode: selectedCountry.code });
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
            keyboardType="phone-pad"
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

        <Text style={styles.infoText}>
          {t('verificationCodeInfo')}
        </Text>

        <TouchableOpacity 
          style={[
            styles.continueButton, 
            !phoneNumber.trim() && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={!phoneNumber.trim()}
        >
          <Text style={styles.continueButtonText}>{t('continue')}</Text>
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
    backgroundColor: '#0039CB',
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