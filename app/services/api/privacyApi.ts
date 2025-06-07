import apiService from './apiClient';

// 隐私政策API响应类型
export interface PrivacyPolicyResponse {
  content?: string;
  data?: any;
  message?: string;
  [key: string]: any;
}

export const privacyApi = {
  // 获取隐私政策内容
  getPrivacyPolicy: async (): Promise<PrivacyPolicyResponse> => {
    try {
      const response = await apiService.get<PrivacyPolicyResponse>('/api/content/privacy-policy/');
      return response;
    } catch (error) {
      console.error('获取隐私政策失败:', error);
      throw error;
    }
  }
}; 