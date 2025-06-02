import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';

// 保存货币设置到本地存储
export const saveCurrency = async (currency: string) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENCY, currency);
  } catch (error) {
    console.error('保存货币设置失败:', error);
  }
};

// 从本地存储加载货币设置
export const loadCurrency = async (): Promise<string | null> => {
  try {
    const savedCurrency = await AsyncStorage.getItem(STORAGE_KEYS.CURRENCY);
    return savedCurrency;
  } catch (error) {
    console.error('加载货币设置失败:', error);
    return null;
  }
};

// 保存语言设置到本地存储
export const saveLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
  } catch (error) {
    console.error('保存语言设置失败:', error);
  }
};

// 从本地存储加载语言设置
export const loadLanguage = async (): Promise<string | null> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return savedLanguage;
  } catch (error) {
    console.error('加载语言设置失败:', error);
    return null;
  }
}; 