import AsyncStorage from "@react-native-async-storage/async-storage";
import { settingApi } from "../services/api/setting";
import useUserStore from "../store/user";
import { logCompleteRegistrationEvent } from "../services/facebook-events";

/**
 * 检查用户设置是否存在，不存在就创建
 * 这个函数可以在登录后或应用启动时调用
 */
export const checkAndCreateUserSettings = async (): Promise<boolean> => {
  try {
    
    // 尝试获取用户设置
    const settings = await settingApi.getMySetting();
    
    // 设置到store中
    const userStore = useUserStore.getState();
    userStore.setSettings(settings);
    
    return true;
  } catch (error: any) {
    
    // 如果是404错误或者设置不存在，则创建设置
    if (error?.status === 404 || error?.response?.status === 404) {
      
      try {
        // 读取本地存储的国家设置
        const savedCountry = await AsyncStorage.getItem("@selected_country");
        let countryCode = 225; // 默认科特迪瓦
        
        if (savedCountry) {
          try {
            const parsedCountry = JSON.parse(savedCountry);
            countryCode = parsedCountry.country || 225;
          } catch (e) {
          }
        }
        
        // 调用首次登录API创建用户设置
        const firstLoginData = await settingApi.postFirstLogin(countryCode);
        
        // 设置到store中
        const userStore = useUserStore.getState();
        userStore.setSettings(firstLoginData);
        
        return true;
      } catch (createError) {
        return false;
      }
    } else {
      return false;
    }
  }
};

/**
 * 增强版的首次登录设置处理
 * 会处理首次登录的设置同步，也会检查非首次登录的设置存在性
 */
export const handleLoginSettingsCheck = async (loginResponse: any, registrationMethod: string = 'unknown'): Promise<void> => {
  try {
    // 检查是否是首次登录
    if (loginResponse.first_login) {

      // 读取本地存储的国家设置
      const savedCountry = await AsyncStorage.getItem("@selected_country");
      let countryCode = 225; // 默认科特迪瓦

      if (savedCountry) {
        try {
          const parsedCountry = JSON.parse(savedCountry);
          countryCode = parsedCountry.country || 225;
        } catch (e) {
        }
      }

      // 调用首次登录API创建用户设置（包含国家对应的默认货币）
      const firstLoginData = await settingApi.postFirstLogin(countryCode);

      // 设置到store中
      const userStore = useUserStore.getState();
      userStore.setSettings(firstLoginData);

      // 读取本地存储的语言设置
      const savedLanguage = await AsyncStorage.getItem("app_language");
      if (savedLanguage && savedLanguage !== firstLoginData.language) {
        try {
          await settingApi.putSetting({ language: savedLanguage });
        } catch (error) {
        }
      }

      // 🎯 记录Facebook完成注册事件
      try {
        const userInfo = loginResponse.user || {};
        logCompleteRegistrationEvent(userInfo, registrationMethod);
      } catch (fbError) {
        // 不阻断登录流程，只记录错误
      }
    } else {
      // 非首次登录，但仍需检查设置是否存在
      await checkAndCreateUserSettings();
    }
  } catch (error) {
    // 不阻断登录流程，只记录错误
  }
};