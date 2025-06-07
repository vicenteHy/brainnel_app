import apiService from './apiClient';

// 使用条款API响应类型
export interface TermsOfUseResponse {
  remark: string;
  info_en: string; // 英文内容
  info_fr?: string; // 法文内容
  sort: number;
  status: number;
  pid: number;
}

export const termsApi = {
  // 获取使用条款内容
  getTermsOfUse: async (): Promise<TermsOfUseResponse> => {
    try {
      const response = await apiService.get<TermsOfUseResponse>('/api/content/terms-of-use/');
      return response;
    } catch (error) {
      console.error('获取使用条款失败:', error);
      throw error;
    }
  }
};