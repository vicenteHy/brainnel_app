import apiService from "./apiClient";


export const sendBurialData = (data: any) => {
  return apiService.post("https://api.brainnel.com/aws/event", data);
};