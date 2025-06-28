import apiService from "./apiClient";


export const sendAnalyticsData = async (data: any) => {
  try {
    return await apiService.post("https://mlj1sm5a3a.execute-api.ap-southeast-1.amazonaws.com/event", data);
  } catch (error: any) {
    // 开发环境下记录详细错误，但不阻断应用
    if (__DEV__) {
      console.warn('Analytics数据发送失败:', error.message || error);
      console.warn('发送的数据:', JSON.stringify(data, null, 2));
    }
    
    // 重新抛出错误，让重试机制处理
    throw error;
  }
};

