import apiService from "./apiClient";


export const sendAnalyticsData = (data: any) => {
  return apiService.post("https://api.brainnel.com/aws/event", data);
};