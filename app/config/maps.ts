/**
 * Google Maps 配置
 * 
 * 注意：请不要在此文件中硬编码 API 密钥
 * API 密钥应该通过环境变量配置
 */

interface MapConfig {
  apiKey: string | undefined;
  isConfigured: boolean;
}

/**
 * 获取 Google Maps 配置
 */
export const getMapConfig = (): MapConfig => {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  return {
    apiKey,
    isConfigured: !!apiKey
  };
};

/**
 * Google Maps API 限制建议：
 * 
 * 在 Google Cloud Console 中设置以下限制：
 * 
 * 1. API 限制：
 *    - 只启用 Maps JavaScript API
 *    - 禁用其他所有 API
 * 
 * 2. 应用限制：
 *    - Android: 包名 com.brainnel.app
 *    - iOS: Bundle ID uni.UNIC87CC93
 * 
 * 3. 配额限制：
 *    - 设置每日请求上限
 *    - 监控异常使用
 * 
 * 详细设置：https://console.cloud.google.com/apis/credentials
 */