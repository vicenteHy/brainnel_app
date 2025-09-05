// API配置
const DEV_API_URL = 'https://api.brainnel.com/test';
const PROD_API_URL = 'https://api.brainnel.com/backend';

// 使用环境变量或手动切换
const IS_PRODUCTION = true; // 修改此值来切换环境 - 当前使用生产服务器
export const API_BASE_URL = IS_PRODUCTION ? PROD_API_URL : DEV_API_URL;

// WebSocket配置 - 自动将 https 转换为 wss
const DEV_WS_URL = DEV_API_URL.replace('https://', 'wss://') + '/ws';
const PROD_WS_URL = PROD_API_URL.replace('https://', 'wss://') + '/ws';

export const WS_BASE_URL = IS_PRODUCTION ? PROD_WS_URL : DEV_WS_URL;

// 环境变量配置
export const ENV = {
  PRODUCTION: process.env.NODE_ENV === 'production',
  DEVELOPMENT: process.env.NODE_ENV !== 'production',
};

// API超时配置(ms)
export const API_TIMEOUT = 150000;

// 本地存储键名
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  USER_INFO: 'user_info',
  LANGUAGE: 'app_language',
  CURRENCY: 'app_currency',
};

// 默认请求头
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}; 