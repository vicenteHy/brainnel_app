import { apiClient } from './apiClient';
import { API_BASE_URL } from '../../constants/config';

export interface InsuranceRateResponse {
  success: boolean;
  data: {
    rate: number; // 费率，例如 0.87 表示 87%
    currency: string; // 货币代码
    description?: string; // 费率描述
  };
  message?: string;
}

export const insuranceApi = {
  /**
   * 获取运费险费率
   * @param currency 货币代码，如 'USD', 'EUR', 'FCFA' 等
   * @returns Promise<InsuranceRateResponse>
   */
  async getInsuranceRate(currency: string = 'USD'): Promise<InsuranceRateResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/insurance/rate/`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          rate: data.rate || 0.01, // API返回的费率，默认1%
          currency: currency, // 使用传入的货币
          description: data.description || '运费险费率'
        }
      };
    } catch (error) {
      console.error('获取运费险费率失败:', error);
      
      return {
        success: false,
        data: {
          rate: 0.01, // 默认费率 1%
          currency: currency,
          description: '默认运费险费率'
        },
        message: '获取费率失败，使用默认费率'
      };
    }
  }
};