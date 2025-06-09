import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, StatusBar, ActivityIndicator } from "react-native";
import BackIcon from "../../components/BackIcon";
import fontSize from "../../utils/fontsizeUtils";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { useState, useEffect } from "react";
import { settingApi } from "../../services/api/setting";
import { FlatList } from "react-native";
import flagMap from "../../utils/flagMap";
import CheckIcon from "../../components/CheckIcon";
import { eventBus } from "../../utils/eventBus";
import { changeLanguage } from "../../i18n";
import { useTranslation } from "react-i18next";
import { useGlobalStore } from "../../store/useGlobalStore";
import { userApi } from "../../services/api/userApi";
import useUserStore from "../../store/user";
import { saveCurrency, saveLanguage } from "../../utils/storage";
import Toast from "react-native-toast-message";

type CountryList = {
  country: number;
  currency: string;
  language: string;
  name: string;
  name_en: string;
  timezone: string;
  user_count: number;
  valid_digits: number[];
};

type CountrySettingProps = {
  hideHeader?: boolean;
  onSuccess?: () => void;
};

export const CountrySetting = ({ hideHeader = false, onSuccess }: CountrySettingProps) => {
  const { t } = useTranslation();
  const { setGlobalCountry, setGlobalCurrency, setGlobalLanguage } = useGlobalStore();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "CountrySetting">>();
  const [changeType, setChangeType] = useState<string>("language");
  const [countryList, setCountryList] = useState<CountryList[]>([]);
  const [currencyList, setCurrencyList] = useState<string[]>([]);
  const [languageList, setLanguageList] = useState<string[]>([]);
  const [country, setCountry] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const { user, setUser } = useUserStore();
  const [loading, setLoading] = useState(false);

  // Function to get language display name
  const getLanguageDisplayName = (languageCode: string): string => {
    return t(`settings.languages.${languageCode}`, { defaultValue: languageCode });
  };

  const getCountry = async () => {
    const res = await settingApi.getCountryList();
    setCountryList(res);    
    setCountry(route.params?.mySetting?.country || 0);
  };

  const getCurrency = async () => {
    const res = await settingApi.getCurrencyList();
    setCurrencyList(res);
    setCurrency(route.params?.mySetting?.currency || "");
  };

  const getLanguage = async () => {
    const res = await settingApi.getLanguageList();
    setLanguageList(res);
    setLanguage(route.params?.mySetting?.language || "");
  };

  useEffect(() => {
    getCountry();
    getCurrency();
    getLanguage();
  }, []);

  useEffect(() => {
    // 根据用户登录状态设置初始选项卡
    if (user?.user_id && changeType === "language") {
      setChangeType("country");
    } else if (!user?.user_id) {
      setChangeType("language");
    }
  }, [user?.user_id]);

  // 新增：处理国家选择的函数
  const handleCountrySelect = async (selectedCountry: number) => {
    setCountry(selectedCountry);
    setLoading(true);
    const data = { country: selectedCountry };
    setGlobalCountry({ country: selectedCountry.toString() });
    
    try {
      if (user?.user_id) {
        try {
          await settingApi.putSetting(data);
        } catch (error) {
          // 如果更新失败且是404错误，尝试创建首次登录设置
          if (error.status === 404) {
            console.log('用户设置不存在，创建首次登录设置');
            await settingApi.postFirstLogin(selectedCountry);
          } else {
            throw error;
          }
        }
        eventBus.emit("refreshSetting");
        const userData = await userApi.getProfile();
        setUser(userData);
      }
      if (onSuccess) onSuccess();
      Toast.show({
        type: 'success',
        text1: t('settings.success'),
      });
    } catch (error) {
      console.error('保存设置到服务器失败:', error);
      Toast.show({
        type: 'error',
        text1: t('error'),
      });
    }
    setLoading(false);
  };

  // 新增：处理货币选择的函数
  const handleCurrencySelect = async (selectedCurrency: string) => {
    setCurrency(selectedCurrency);
    setLoading(true);
    const data = { currency: selectedCurrency };
    setGlobalCurrency({ currency: selectedCurrency });
    await saveCurrency(selectedCurrency);
    
    try {
      eventBus.emit("settingsChanged");
      if (user?.user_id) {
        try {
          await settingApi.putSetting(data);
        } catch (error) {
          // 如果更新失败且是404错误，尝试创建首次登录设置
          if (error.status === 404) {
            console.log('用户设置不存在，使用默认国家创建首次登录设置');
            const defaultCountry = country || 1; // 使用当前选中的国家或默认国家
            await settingApi.postFirstLogin(defaultCountry);
            // 重新尝试更新货币设置
            await settingApi.putSetting(data);
          } else {
            throw error;
          }
        }
        eventBus.emit("refreshSetting");
        const userData = await userApi.getProfile();
        setUser(userData);
      }
      if (onSuccess) onSuccess();
      Toast.show({
        type: 'success',
        text1: t('settings.success'),
      });
    } catch (error) {
      console.error('保存设置到服务器失败:', error);
      Toast.show({
        type: 'error',
        text1: t('error'),
      });
    }
    setLoading(false);
  };

  // 新增：处理语言选择的函数
  const handleLanguageSelect = async (selectedLanguage: string) => {
    setLanguage(selectedLanguage);
    setLoading(true);
    const data = { language: selectedLanguage };
    setGlobalLanguage({ language: selectedLanguage });
    await saveLanguage(selectedLanguage);
    
    try {
      eventBus.emit("settingsChanged");
      if (user?.user_id) {
        await settingApi.putSetting(data);
        await changeLanguage(selectedLanguage);
        eventBus.emit("refreshSetting");
        const userData = await userApi.getProfile();
        setUser(userData);
      } else {
        await changeLanguage(selectedLanguage);
        eventBus.emit("refreshSetting");
      }
      if (onSuccess) onSuccess();
      Toast.show({
        type: 'success',
        text1: t('settings.success'),
      });
    } catch (error) {
      console.error('保存设置到服务器失败:', error);
      Toast.show({
        type: 'error',
        text1: t('error'),
      });
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        {!hideHeader && (
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <BackIcon size={fontSize(24)} />
            </TouchableOpacity>
            <Text style={styles.title}>{t('settings.title')}</Text>
            <View style={styles.placeholder} />
          </View>
        )}
        <View style={styles.changeType}>
          {user?.user_id && (
            <TouchableOpacity
              style={[
                styles.changeTypeText,
                changeType === "country" && styles.changeTypeTextActive,
                user?.user_id ? styles.changeTypeTextLoggedIn : {},
              ]}
              onPress={() => setChangeType("country")}
            >
              <Text style={styles.changeTypeTextTitle}>{t('settings.country')}</Text>
            </TouchableOpacity>
          )}
          {user?.user_id && (
            <TouchableOpacity
              style={[
                styles.changeTypeText,
                changeType === "currency" && styles.changeTypeTextActive,
                user?.user_id ? styles.changeTypeTextLoggedIn : {},
              ]}
              onPress={() => setChangeType("currency")}
            >
              <Text style={styles.changeTypeTextTitle}>{t('settings.currency')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.changeTypeText,
              changeType === "language" && styles.changeTypeTextActive,
              !user?.user_id ? styles.changeTypeTextFullWidth : {},
            ]}
            onPress={() => setChangeType("language")}
          >
            <Text style={styles.changeTypeTextTitle}>{t('settings.language')}</Text>
          </TouchableOpacity>
        </View>
        {changeType === "country" && (
          <View style={styles.countryList}>
            <FlatList
              keyExtractor={(item) => String(item.name)}
              data={countryList}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  key={item.country}
                  style={[styles.countryItem, loading && styles.countryItemDisabled]}
                  onPress={() => {
                    if (!loading) {
                      handleCountrySelect(item.country);
                    }
                  }}
                  disabled={loading}
                >
                  <View style={styles.countryItemContent}>
                    <Image
                      source={flagMap.get(item.name_en)}
                      style={styles.countryFlag}
                    />
                    <Text style={loading ? styles.disabledText : {}}>{item.name_en}</Text>
                  </View>
                  <View>
                    {country === item.country && !loading && (
                      <CheckIcon size={fontSize(24)} color="#FF6F30" />
                    )}
                    {country === item.country && loading && (
                      <ActivityIndicator size="small" color="#FF6F30" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
        {changeType === "currency" && (
          <View style={styles.countryList}>
            <FlatList
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              data={currencyList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.countryItem, loading && styles.countryItemDisabled]}
                  onPress={() => {
                    if (!loading) {
                      handleCurrencySelect(item);
                    }
                  }}
                  disabled={loading}
                >
                  <View style={styles.countryItemContent}>
                    <View>
                      <Text style={loading ? styles.disabledText : {}}>{item}</Text>
                    </View>
                  </View>
                  <View>
                    {currency === item && !loading && (
                      <CheckIcon size={fontSize(24)} color="#FF6F30" />
                    )}
                    {currency === item && loading && (
                      <ActivityIndicator size="small" color="#FF6F30" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
        {changeType === "language" && (
          <View style={styles.countryList}>
            <FlatList
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              data={languageList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.countryItem, loading && styles.countryItemDisabled]}
                  onPress={() => {
                    if (!loading) {
                      handleLanguageSelect(item);
                    }
                  }}
                  disabled={loading}
                >
                  <View style={styles.countryItemContent}>
                    <Text style={loading ? styles.disabledText : {}}>{getLanguageDisplayName(item)}</Text>
                  </View>
                  <View>
                    {language === item && !loading && (
                      <CheckIcon size={fontSize(24)} color="#FF6F30" />
                    )}
                    {language === item && loading && (
                      <ActivityIndicator size="small" color="#FF6F30" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
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
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingInline: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    width: "100%",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: fontSize(24),
  },
  title: {
    fontSize: fontSize(20),
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: fontSize(24),
  },
  changeType: {
    backgroundColor: "white",
    width: "100%",
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  changeTypeText: {
    width: "33%",
    paddingVertical: 15,
  },
  changeTypeTextTitle: {
    fontSize: fontSize(16),
    color: "#343a40",
    fontFamily: "PingFangSC-Medium",
    textAlign: "center",
    fontWeight: "600",
  },
  changeTypeTextActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#FF6F30",
    color: "#FF6F30",
  },
  changeTypeTextLoggedIn: {
    width: "33%",
  },
  changeTypeTextFullWidth: {
    width: "100%",
  },
  countryList: {
    backgroundColor: "white",
    borderRadius: 10,
    marginHorizontal: 20,
  },
  countryItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingHorizontal: 10,
    borderBottomColor: "#e9ecef",
    fontSize: fontSize(16),
    fontFamily: "PingFangSC-Medium",
    fontWeight: "600",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countryFlag: {
    width: 24,
    height: 24,
    marginRight: 10,
    borderRadius: 12,
  },
  countryItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  countryItemDisabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: "#ccc",
  },
});
