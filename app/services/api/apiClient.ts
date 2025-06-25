import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from 'react-native';

import {
  API_BASE_URL,
  API_TIMEOUT,
  DEFAULT_HEADERS,
  STORAGE_KEYS,
} from "../../constants/config";
import i18n from "../../i18n";
import { isMultipleDeviceLoginError } from "../../utils/authUtils";
import { handleMultipleDeviceLogin } from "../../utils/navigationUtils";
// import { Platform } from "react-native";

// 定义响应类型接口
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
}

// 定义错误类型接口
export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

// 扩展 AxiosRequestConfig 类型
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  retry?: number;
  retryDelay?: (retryCount: number) => number;
}

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: DEFAULT_HEADERS,
  httpsAgent: undefined
});

// 请求拦截器
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    
    const baseUrl = config.baseURL || '';
    let fullUrl = baseUrl + config.url;
    if (config.params) {
      const params = new URLSearchParams(config.params);
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + params.toString();
    }

    // 统一使用小写方法
    if (config.method) {
      config.method = config.method.toLowerCase();
    }

    // 为询盘请求添加详细日志
    if (config.url?.includes('/api/inquiries/')) {
    }

    // 从AsyncStorage获取token
    const token = await AsyncStorage.getItem("token");
    // 如果token存在，添加到请求头
    if (token && config.headers) {
      config.headers.Authorization = `${token}`;
    }
    
    // 添加当前语言到请求头
    if (config.headers) {
      const currentLanguage = i18n.language;
      config.headers['Accept-Language'] = currentLanguage;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 成功响应处理
    // console.log("响应成功:", {
    //   status: response.status,
    //   statusText: response.statusText,
    //   headers: response.headers,
    //   data: response.data,
    // });
    return response;
  },
  async (error: AxiosError<any>) => {
    // 错误响应处理
    const { response, config } = error;
    // 为询盘请求错误添加更详细的日志
    if (config?.url?.includes('/api/inquiries/') || config?.url?.includes('/api/cart/') || config?.url?.includes('/api/orders/')) {
    }
    

    // 处理网络错误
    if (!response) {
      
      // 如果是网络错误，尝试重试
      const customConfig = config as CustomAxiosRequestConfig;
      if (customConfig && customConfig.retry) {
        customConfig.retry -= 1;
        if (customConfig.retry > 0) {
          const delay = customConfig.retryDelay ? customConfig.retryDelay(customConfig.retry) : 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return apiClient(customConfig);
        }
      }
    }

    // 处理401错误 (未授权)
    if (response && response.status === 401) {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      
      // 检查是否为多设备登录冲突
      if (isMultipleDeviceLoginError(error)) {
        // 延迟显示弹窗，确保当前操作完成
        setTimeout(() => {
          handleMultipleDeviceLogin();
        }, 100);
      }
    }

    // 构建标准化的错误对象
    const apiError: ApiError = {
      message: error.message || "网络请求失败",
      status: response?.status,
      data: response?.data,
    };

    return Promise.reject(apiError);
  }
);

// API方法封装
export const apiService = {
  // GET请求
  async get<T>(url: string, params?: any, config?: any): Promise<T> {
    try {
      const customConfig: CustomAxiosRequestConfig = {
        ...config,
        retry: 3,
        retryDelay: (retryCount) => retryCount * 1000,
      };
      const response = await apiClient.get<T>(url, { params, ...customConfig });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // POST请求
  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const customConfig: CustomAxiosRequestConfig = {
        ...config,
        retry: 3,
        retryDelay: (retryCount) => retryCount * 1000,
      };
      const response = await apiClient.post<T>(url, data, customConfig);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // PUT请求
  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const customConfig: CustomAxiosRequestConfig = {
        ...config,
        retry: 3,
        retryDelay: (retryCount) => retryCount * 1000,
      };
      const response = await apiClient.put<T>(url, data, customConfig);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // PATCH请求
  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const customConfig: CustomAxiosRequestConfig = {
        ...config,
        retry: 3,
        retryDelay: (retryCount) => retryCount * 1000,
      };
      const response = await apiClient.patch<T>(url, data, customConfig);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // DELETE请求
  async delete<T>(url: string, config?: any): Promise<T> {
    try {
      const customConfig: CustomAxiosRequestConfig = {
        ...config,
        retry: 3,
        retryDelay: (retryCount) => retryCount * 1000,
      };
      const response = await apiClient.delete<T>(url, customConfig);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 上传文件
  async upload<T>(url: string, formData: FormData, config?: any): Promise<T> {
    try {
      const uploadConfig = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        ...config,
      };

      const response = await apiClient.post<T>(url, formData, uploadConfig);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 并发请求
  async all<T>(requests: Promise<any>[]): Promise<T[]> {
    try {
      return await Promise.all(requests);
    } catch (error) {
      throw error;
    }
  },
};

export default apiService;
