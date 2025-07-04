// API配置
const DEV_API_URL = 'https://api.brainnel.com/test';
const PROD_API_URL = 'https://api.brainnel.com/backend';

export const API_BASE_URL = DEV_API_URL

// 环境变量配置
export const ENV = {
  PRODUCTION: process.env.NODE_ENV === 'production',
  DEVELOPMENT: process.env.NODE_ENV !== 'production',
};

// API超时配置(ms)
export const API_TIMEOUT = 150000;

// 本地存储键名
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  LANGUAGE: 'app_language',
  CURRENCY: 'app_currency',
};

// 默认请求头
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}; 