import AsyncStorage from "@react-native-async-storage/async-storage";
import { settingApi } from "../services/api/setting";
import useUserStore from "../store/user";

/**
 * 检查用户设置是否存在，不存在就创建
 * 这个函数可以在登录后或应用启动时调用
 */
export const checkAndCreateUserSettings = async (): Promise<boolean> => {
  try {
    console.log("🔍 开始检查用户设置是否存在...");
    
    // 尝试获取用户设置
    const settings = await settingApi.getMySetting();
    console.log("✅ 用户设置存在:", JSON.stringify(settings, null, 2));
    
    // 设置到store中
    const userStore = useUserStore.getState();
    userStore.setSettings(settings);
    
    return true;
  } catch (error: any) {
    console.log("❌ 获取用户设置失败:", error);
    
    // 如果是404错误或者设置不存在，则创建设置
    if (error?.status === 404 || error?.response?.status === 404) {
      console.log("📝 用户设置不存在，开始创建默认设置...");
      
      try {
        // 读取本地存储的国家设置
        const savedCountry = await AsyncStorage.getItem("@selected_country");
        let countryCode = 225; // 默认科特迪瓦
        
        if (savedCountry) {
          try {
            const parsedCountry = JSON.parse(savedCountry);
            countryCode = parsedCountry.country || 225;
            console.log("📍 使用本地保存的国家代码:", countryCode);
          } catch (e) {
            console.error("❌ 解析本地国家设置失败:", e);
          }
        }
        
        // 调用首次登录API创建用户设置
        console.log("🌍 调用首次登录API，国家代码:", countryCode);
        const firstLoginData = await settingApi.postFirstLogin(countryCode);
        console.log("✅ 用户设置创建成功:", JSON.stringify(firstLoginData, null, 2));
        
        // 设置到store中
        const userStore = useUserStore.getState();
        userStore.setSettings(firstLoginData);
        
        return true;
      } catch (createError) {
        console.error("❌ 创建用户设置失败:", createError);
        return false;
      }
    } else {
      console.error("❌ 获取用户设置时发生其他错误:", error);
      return false;
    }
  }
};

/**
 * 增强版的首次登录设置处理
 * 会处理首次登录的设置同步，也会检查非首次登录的设置存在性
 */
export const handleLoginSettingsCheck = async (loginResponse: any): Promise<void> => {
  try {
    // 检查是否是首次登录
    if (loginResponse.first_login) {
      console.log("✅ 检测到首次登录，开始同步本地设置");

      // 读取本地存储的国家设置
      const savedCountry = await AsyncStorage.getItem("@selected_country");
      let countryCode = 225; // 默认科特迪瓦

      if (savedCountry) {
        try {
          const parsedCountry = JSON.parse(savedCountry);
          countryCode = parsedCountry.country || 225;
          console.log("✅ 读取到本地国家设置:", countryCode);
        } catch (e) {
          console.error("❌ 解析本地国家设置失败:", e);
        }
      }

      // 调用首次登录API创建用户设置（包含国家对应的默认货币）
      console.log("📡 调用首次登录API，国家代码:", countryCode);
      const firstLoginData = await settingApi.postFirstLogin(countryCode);
      console.log("✅ 首次登录设置创建成功:", firstLoginData);

      // 设置到store中
      const userStore = useUserStore.getState();
      userStore.setSettings(firstLoginData);

      // 读取本地存储的语言设置
      const savedLanguage = await AsyncStorage.getItem("app_language");
      if (savedLanguage && savedLanguage !== firstLoginData.language) {
        console.log("🌐 同步本地语言设置:", savedLanguage);
        try {
          await settingApi.putSetting({ language: savedLanguage });
          console.log("✅ 语言设置同步成功");
        } catch (error) {
          console.error("❌ 语言设置同步失败:", error);
        }
      }
    } else {
      console.log("ℹ️ 非首次登录，检查用户设置是否存在...");
      // 非首次登录，但仍需检查设置是否存在
      await checkAndCreateUserSettings();
    }
  } catch (error) {
    console.error("❌ 处理登录设置检查失败:", error);
    // 不阻断登录流程，只记录错误
  }
};