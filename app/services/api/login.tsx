import apiService from "./apiClient";
// 这些值应该从环境变量中获取，不应该在代码中硬编码
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI || 'https://api.brainnel.com/backend/api/users/auth/callback/google';

export const loginApi = {
    google:() => {
        return apiService.get<{url:string}>(`/api/users/auth/google`)
    }
};