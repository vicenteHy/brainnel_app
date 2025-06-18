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
}