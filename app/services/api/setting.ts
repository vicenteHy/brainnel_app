import apiService from './apiClient';
import {CountryList} from '../../constants/countries'

export interface Country {
  country: number;
  currency: string;
  language: string;
  name: number;
  name_en:string
  phoneCode: string;
  timezone:string,
  user_count:number
}

export interface FirstLogin {
    currency: string,
    language: string,
    country: number,
    theme: string,
    timezone: string,
    notifications_enabled: number,
    email_notifications: number,
    sms_notifications: number,
    setting_id: number,
    user_id: number,
    create_time: string,
    update_time: string
  }

  export interface MySetting {
    currency: string,
    language: string,
    country: number,
    theme: string,
    timezone: string,
    notifications_enabled: number,
    email_notifications: number,
    sms_notifications: number,
    setting_id: number,
    user_id: number,
    create_time: string,
    update_time: string
  }

  export interface ShippingFee {
    weight_kg: number | null;
    volume_m3: number | null;
    country_code: number;
  }
  
  export interface ShippingFeeResponse {
    currency: string;
    estimated_shipping_fee_air: number;
    estimated_shipping_fee_sea: number;
    message: string;
  }

  export interface VersionInfo {
    id: number;
    platform: 'android' | 'ios';
    latest_version: string;
    min_force_version: string;
    link_url: string;
    update_message: string;
    update_message_en: string;
    created_at: string;
    updated_at: string;
  }

export const settingApi = {
    // 获取国家
    getCountryList: () => apiService.get<CountryList[]>('/api/user_settings/countries/'),
    // 获取货币
    getCurrencyList: () => apiService.get<string[]>('/api/user_settings/currencies/'),
    // 获取特定国家的货币
    getCurrencyListByCountry: (countryCode: number) => apiService.get<string[]>(`/api/user_settings/currencies/?country_code=${countryCode}`),
    // 获取语言
    getLanguageList: () => apiService.get<string[]>('/api/user_settings/languages/'),
    // 我的设置
    getMySetting: () => apiService.get<MySetting>('/api/user_settings/me/'),
    // 首次登录
    postFirstLogin: (country: number) => apiService.post<FirstLogin>(`/api/user_settings/first_login/?country=${country}`),
    // 修改设置
    putSetting: (setting: object) => apiService.put<MySetting>('/api/user_settings/me/', setting),
    // 获取发送短信的国家列表
    getSendSmsCountryList: () => apiService.get<CountryList[]>('/api/user_settings/phone_config/'),
    // 获取运费信息
    getShippingFee: (data: ShippingFee) => apiService.post<ShippingFeeResponse>('/api/orders/calculate_manual_shipping_fee/', data),
    // 获取版本信息
    getVersionInfo: async (retryCount = 0, maxRetries = 2): Promise<VersionInfo[]> => {
      console.log('[版本API] 开始请求版本信息...');
      console.log('[版本API] 请求地址: https://api.brainnel.com/admin/api/v1/app-versions/');
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
        
        const res = await fetch('https://api.brainnel.com/admin/api/v1/app-versions/', {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        clearTimeout(timeoutId);
        
        // console.log(`[版本API] 接收到响应: ${res.status} ${res.statusText}`);
        // console.log(`[版本API] 响应头:`, Object.fromEntries(res.headers.entries()));
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        
        // console.log('[版本API] 版本信息解析成功:', data);
        // console.log(`[版本API] 返回 ${data.length} 个平台版本信息`);
        
        // 打印每个平台的详细信息
        data.forEach((versionInfo: any, index: number) => {
          // console.log(`[版本API] 平台 ${index + 1}: ${versionInfo.platform}`);
          // console.log(`[版本API] - 最新版本: ${versionInfo.latest_version}`);
          // console.log(`[版本API] - 最小强制版本: ${versionInfo.min_force_version}`);
          // console.log(`[版本API] - 下载链接: ${versionInfo.link_url}`);
        });
        
        return data;
      } catch (error) {
        console.error('[版本API] 版本检查接口调用失败:', error);
        console.error('[版本API] 错误详情:', {
          message: (error as Error).message,
          stack: (error as Error).stack,
          name: (error as Error).name
        });
        
        // 如果是网络错误且还有重试次数，则进行重试
        if (retryCount < maxRetries) {
          console.log(`[版本API] 准备重试 (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // 递增延迟
          return settingApi.getVersionInfo(retryCount + 1, maxRetries);
        }
        
        throw error;
      }
    },
}