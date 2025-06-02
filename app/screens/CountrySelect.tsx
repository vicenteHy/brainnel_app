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
import { settingApi } from '../services/api/setting';
import flagMap from '../utils/flagMap';
import { getCountryTransLanguage } from '../utils/languageUtils';

const SELECTED_COUNTRY_KEY = '@selected_country';

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
      }else{
        const res = await settingApi.getCountryList();
        setCountryList(res);
        
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
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  list: {
    flex: 1,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedItem: {
    backgroundColor: '#f8f8f8',
  },
  flag: {
    width: 24,
    height: 24,
    marginRight: 16,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  countryCode: {
    fontSize: 16,
    color: '#333',
    marginRight: 16,
    width: 40,
    textAlign: 'center',
  },
  selectedText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 20,
    color: '#007AFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 