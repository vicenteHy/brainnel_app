import apiService from "./apiClient";


export const getAgreement =  (act: string) => {
  return apiService.get(`https://app.brainnel.com/app/Login/lbl?act=${act}`);
};