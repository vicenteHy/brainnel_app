import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changeLanguage, getCurrentLanguage } from '../i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import fontSize from '../utils/fontsizeUtils';

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

interface LanguageSelectionScreenProps {
  onLanguageSelected: () => void;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷'
  }
];

const LANGUAGE_SELECTED_KEY = '@language_selected';

export default function LanguageSelectionScreen({ onLanguageSelected }: LanguageSelectionScreenProps) {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentDisplayTexts, setCurrentDisplayTexts] = useState({
    title: 'Choose Your Language',
    subtitle: 'Select your preferred language to continue',
    footer: 'You can change this later in settings'
  });

  const updateDisplayTexts = (languageCode: string) => {
    // 临时切换语言来获取翻译文本
    i18n.changeLanguage(languageCode);
    setCurrentDisplayTexts({
      title: i18n.t('languageSelection.title'),
      subtitle: i18n.t('languageSelection.subtitle'),
      footer: i18n.t('languageSelection.footer')
    });
  };

  const handleLanguageSelect = async (languageCode: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // 立即更新显示文本
      updateDisplayTexts(languageCode);
      
      // 保存语言选择
      await changeLanguage(languageCode);
      
      // 标记用户已经选择过语言
      await AsyncStorage.setItem(LANGUAGE_SELECTED_KEY, 'true');
      
      setSelectedLanguage(languageCode);
      
      // 延迟一下再切换，让用户看到选择效果
      setTimeout(() => {
        onLanguageSelected();
      }, 800);
    } catch (error) {
      console.error('Error selecting language:', error);
      // 显示错误消息
      const errorMessage = i18n.t('languageSelection.error');
      Alert.alert(i18n.t('common.error'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderLanguageOption = (language: LanguageOption) => {
    const isSelected = selectedLanguage === language.code;
    
    return (
      <TouchableOpacity
        key={language.code}
        style={[
          styles.languageOption,
          isSelected && styles.selectedOption
        ]}
        onPress={() => handleLanguageSelect(language.code)}
        disabled={isLoading}
      >
        <View style={styles.languageContent}>
          <Text style={styles.flag}>{language.flag}</Text>
          <View style={styles.languageTexts}>
            <Text style={[styles.languageName, isSelected && styles.selectedText]}>
              {language.name}
            </Text>
            <Text style={[styles.nativeName, isSelected && styles.selectedSubText]}>
              {language.nativeName}
            </Text>
          </View>
          {isSelected && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <LinearGradient
        colors={['#0066FF', '#004CCF']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{currentDisplayTexts.title}</Text>
            <Text style={styles.subtitle}>
              {currentDisplayTexts.subtitle}
            </Text>
          </View>

          <View style={styles.languageList}>
            {LANGUAGES.map(renderLanguageOption)}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {currentDisplayTexts.footer}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0066FF',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: fontSize(28),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: fontSize(16),
    color: '#E6F0FF',
    textAlign: 'center',
    lineHeight: 22,
  },
  languageList: {
    flex: 1,
    justifyContent: 'center',
  },
  languageOption: {
    backgroundColor: '#ffffff26',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#ffffff40',
    borderColor: '#FFFFFF',
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  flag: {
    fontSize: fontSize(32),
    marginRight: 16,
  },
  languageTexts: {
    flex: 1,
  },
  languageName: {
    fontSize: fontSize(18),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  nativeName: {
    fontSize: fontSize(14),
    color: '#E6F0FF',
  },
  selectedSubText: {
    color: '#F0F8FF',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#0066FF',
    fontSize: fontSize(14),
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  footerText: {
    fontSize: fontSize(14),
    color: '#B3D9FF',
    textAlign: 'center',
  },
});

// 导出检查语言是否已选择的函数
export const checkLanguageSelected = async (): Promise<boolean> => {
  try {
    const languageSelected = await AsyncStorage.getItem(LANGUAGE_SELECTED_KEY);
    return languageSelected === 'true';
  } catch (error) {
    console.error('Error checking language selection:', error);
    return false;
  }
};

// 导出重置语言选择状态的函数（用于测试）
export const resetLanguageSelection = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LANGUAGE_SELECTED_KEY);
    console.log('Language selection state reset');
  } catch (error) {
    console.error('Error resetting language selection:', error);
  }
}; 