import apiService from "./apiClient";

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  first_login: boolean;
  scope: string;
}
export const loginApi = {
  // 谷歌登录
  googleLogin: (data: any) =>
    apiService.post<LoginResponse>("/api/users/auth/callback/google", data),
  // 苹果登录
  appleLogin: (data: any) =>
    apiService.post("/api/users/auth/callback/apple", data),
  // 脸书登录
  facebookLogin: (data: any) =>
    apiService.post<LoginResponse>("/api/users/auth/callback/facebook", data),
  // WhatsApp发送OTP
  sendWhatsappOtp: (data: { phone_number: string; language: string }) =>
    apiService.post("/api/users/send-whatsapp-otp/", data),
  // WhatsApp验证OTP
  verifyWhatsappOtp: (data: { phone_number: string; code: string }) =>
    apiService.post<LoginResponse>("/api/users/verify-whatsapp-otp/", data),
  // 邮箱发送OTP
  sendEmailOtp: (data: { email: string; language: string }) => {
    console.log('[LoginAPI] 发送邮箱OTP 请求数据:', data);
    return apiService.post("/api/users/send-email-otp/", data).then((res) => {
      console.log('[LoginAPI] 发送邮箱OTP 响应:', res);
      return res;
    }).catch((err) => {
      console.error('[LoginAPI] 发送邮箱OTP 失败:', err);
      throw err;
    });
  },
  // 邮箱验证OTP
  verifyEmailOtp: (data: { email: string; code: string }) => {
    console.log('[LoginAPI] 验证邮箱OTP 请求数据:', data);
    return apiService.post<LoginResponse>("/api/users/verify-email-otp/", data).then((res)=>{
      console.log('[LoginAPI] 验证邮箱OTP 响应:', res);
      return res;
    }).catch((err)=>{
      console.error('[LoginAPI] 验证邮箱OTP 失败:', err);
      throw err;
    });
  },
};


