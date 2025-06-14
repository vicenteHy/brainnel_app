import apiService from "./apiClient";
// 这些值应该从环境变量中获取，不应该在代码中硬编码
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI || 'https://api.brainnel.com/backend/api/users/auth/callback/google';

export const loginApi = {
    google: (userInfo: any) => {
        return apiService.post<{
            access_token: string;
            token_type: string;
            user?: any;
            first_login?: boolean;
        }>('/api/users/auth/callback/google', userInfo);
    },
    appleLogin: (appleUserData: {
        user: string;
        email: string | null;
        fullName: any;
        identityToken: string | null;
        authorizationCode: string | null;
        state: string | null;
    }) => {
        return apiService.post<{
            access_token: string;
            token_type: string;
            user?: any;
            first_login?: boolean;
        }>('/api/users/auth/callback/apple', appleUserData);
    },
    sendWhatsappOtp: (data: { phone_number: string; language: string }) => {
        return apiService.post('/api/users/whatsapp/send-otp', data);
    },
    verifyWhatsappOtp: (data: { phone_number: string; code: string }) => {
        return apiService.post<{
            access_token: string;
            token_type: string;
            first_login?: boolean;
        }>('/api/users/whatsapp/verify-otp', data);
    }
};