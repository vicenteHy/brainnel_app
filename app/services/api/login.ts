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
};


