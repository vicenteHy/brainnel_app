import apiService from './apiClient';

// 隐私政策API响应类型
export interface PrivacyPolicyResponse {
  remark: string;
  info_en: string; // 英文内容
  info_fr?: string; // 法文内容
  sort: number;
  status: number;
  pid: number;
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