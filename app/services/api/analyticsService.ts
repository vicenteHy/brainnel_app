import apiService from "./apiClient";


export const sendAnalyticsData = (data: any) => {
  return apiService.post("https://mlj1sm5a3a.execute-api.ap-southeast-1.amazonaws.com/event", data);
};