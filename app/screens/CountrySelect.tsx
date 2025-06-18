// 国家选择
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Country, CountryList } from '../constants/countries';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import flagMap from '../utils/flagMap';
import { getCountryTransLanguage } from '../utils/languageUtils';

const SELECTED_COUNTRY_KEY = '@selected_country';

// 静态国家数据
const staticCountryList: CountryList[] = [
  {
    name: "Côte d'Ivoire",
    name_en: "Ivory Coast",
    country: 225,
    currency: "FCFA",
    timezone: "UTC+0",
    language: "fr",
    user_count: 13,
    valid_digits: []
  },
  {
    name: "Sénégal",
    name_en: "Senegal",
    country: 221,
    currency: "FCFA",
    timezone: "UTC+0",
    language: "fr",
    user_count: 6,
    valid_digits: []
  },
  {
    name: "France",
    name_en: "France",
    country: 33,
    currency: "EUR",
    timezone: "UTC+1",
    language: "fr",
    user_count: 1,
    valid_digits: []
  },
  {
    name: "Bénin",
    name_en: "Benin",
    country: 229,
    currency: "FCFA",
    timezone: "UTC+1",
    language: "fr",
    user_count: 1,
    valid_digits: []
  },
  {
    name: "Gabon",
    name_en: "Gabon",
    country: 241,
    currency: "CFA",
    timezone: "UTC+1",
    language: "fr",
    user_count: 1,
    valid_digits: []
  },
  {
    name: "République démocratique du Congo",
    name_en: "Democratic Republic of the Congo",
    country: 243,
    currency: "FCFA",
    timezone: "UTC+1",
    language: "fr",
    user_count: 1,
    valid_digits: []
  },
  {
    name: "Cameroun",
    name_en: "Cameroon",
    country: 237,
    currency: "CFA",
    timezone: "UTC+1",
    language: "fr",
    user_count: 0,
    valid_digits: []
  },
  {
    name: "République du Congo",
    name_en: "Republic of Congo",
    country: 242,
    currency: "CFA",
    timezone: "UTC+1",
    language: "fr",
    user_count: 0,
    valid_digits: []
  },
  {
    name: "Guinée",
    name_en: "Guinea",
    country: 224,
    currency: "FCFA",
    timezone: "UTC+0",
    language: "fr",
    user_count: 0,
    valid_digits: []
  },
  {
    name: "Burkina Faso",
    name_en: "Burkina Faso",
    country: 226,
    currency: "FCFA",
    timezone: "UTC+0",
    language: "fr",
    user_count: 0,
    valid_digits: []
  },
  {
    name: "Mali",
    name_en: "Mali",
    country: 223,
    currency: "FCFA",
    timezone: "UTC+0",
    language: "fr",
    user_count: 0,
    valid_digits: []
  },
  {
    name: "Togo",
    name_en: "Togo",
    country: 228,
    currency: "FCFA",
    timezone: "UTC+0",
    language: "fr",
    user_count: 0,
    valid_digits: []
  }
];

export const CountrySelect = () => {
  const { t } = useTranslation();
  const [selectedCountry, setSelectedCountry] = useState<number>();
  const [countryList, setCountryList] = useState<CountryList[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    checkSelectedCountry();
  }, []);

  const checkSelectedCountry = async () => {
    setLoading(true);
    try {
      const savedCountry = await AsyncStorage.getItem(SELECTED_COUNTRY_KEY);
      if (savedCountry) {
        // 如果已经选择过国家，直接导航到主页面
        // 只有在非清除语言选择的情况下才导航
        const isCleared = await AsyncStorage.getItem('languageCleared');
        if (!isCleared) {
          navigation.replace('MainTabs');
        }
      } else {
        // 使用静态数据而不是API调用
        setCountryList(staticCountryList);
      }
    } catch (error) {
      console.error('Error checking selected country:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCountrySelect = async (country: CountryList) => {
    try {
      await AsyncStorage.setItem(SELECTED_COUNTRY_KEY, JSON.stringify(country));
      // 清除清除标记
      await AsyncStorage.removeItem('languageCleared');
      // 选择国家后导航到主页面
      setSelectedCountry(country.country);
      navigation.replace('MainTabs');
    } catch (error) {
      console.error('Error saving selected country:', error);
    }
  };

  const renderCountryItem = ({ item }: { item: CountryList }) => (
    <TouchableOpacity 
      style={[
        styles.countryItem,
        selectedCountry === item.country && styles.selectedItem
      ]}
      onPress={() => handleCountrySelect(item)}
    >
      <Text style={styles.countryCode}>+{item.country}</Text>

      <Image source={flagMap.get(item.name_en)} style={styles.flag} />

      <Text style={[
        styles.countryName,
        selectedCountry === item.country && styles.selectedText
      ]}>{getCountryTransLanguage(item)}</Text>

      {selectedCountry === item.country && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar 
        backgroundColor="#fff"
        barStyle="dark-content"
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('selectCountry')}</Text>
          <Text style={styles.subtitle}>{t('subtitle')}</Text>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <FlatList
            data={countryList}
            renderItem={renderCountryItem}
            keyExtractor={(item) => item.country.toString()}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Constants.statusBarHeight,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    color: '#000000',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  list: {
    flex: 1,
    paddingHorizontal: 4,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e8e8e8',
  },
  selectedItem: {
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  flag: {
    width: 28,
    height: 28,
    marginRight: 16,
    borderRadius: 4,
  },
  countryName: {
    flex: 1,
    fontSize: 17,
    color: '#000000',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  countryCode: {
    fontSize: 16,
    color: '#333333',
    marginRight: 16,
    minWidth: 48,
    textAlign: 'center',
    fontWeight: '600',
  },
  selectedText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 22,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 