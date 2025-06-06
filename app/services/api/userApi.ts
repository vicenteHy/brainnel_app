import apiService from './apiClient';

// 用户接口定义
export interface User {
  "username": string,
  "email": string,
  "phone": string,
  "avatar_url": string,
  "status": number,
  "user_id": number,
  "last_login": string,
  "create_time": string,
  "update_time": string,
  country_code:number,
  vip_discount:number,
  balance:number,
  currency:string,
  country:string,
  balance_currency:string,
  country_en:string,
  language:string,
  vip_level:number,
  points:number,
  next_level_points_threshold:number
}

export interface UserSettings {
  country: number;
  create_time: string; // 或使用 Date 类型，如果需要进行日期操作
  currency: string;
  email_notifications: number; // 或用 boolean 如果值只能是 0 或 1
  language: string;
  notifications_enabled: number; // 或用 boolean
  setting_id: number;
  sms_notifications: number; // 或用 boolean
  theme: string; // 或用联合类型，如 'light' | 'dark'
  timezone: string;
  update_time: string; // 或使用 Date 类型
  user_id: number;
}

// 登录参数
export interface LoginParams {
  grant_type: string;
  username: string;
  password: string;
  client_id: string;
  client_secret: string;
  scope: string;
}

// 注册参数
export interface RegisterParams {
  username: string;
  email: string;
  password: string;
}

// 登录响应
export interface AuthResponse {
  "access_token": string,
  "token_type": string,
  "first_login": boolean,
  "user": {
    "user_id": number,
    "username": string,
    "email": string,
    "phone": string,
    "avatar_url": string,
    "status": number,
    "last_login": string,
    "create_time": string,
    "update_time": string
  }
}

// 用户API服务
export const userApi = {
  // 登录
  login: (params: LoginParams) => {
    return apiService.post<AuthResponse>('/api/users/login', params,{
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },
  
  // 注册
  register: (params: RegisterParams) => {
    return apiService.post<AuthResponse>('/auth/register', params);
  },
  
  // 获取用户信息
  getProfile: () => {
    return apiService.get<User>('/api/users/me/');
  },
  
  // 更新用户信息
  updateProfile: (data: Partial<User>) => {
    return apiService.put<User>('/api/users/me/', data);
  },
  
  // 更新用户头像
  updateAvatar: (data: { image_base64: string; image_filename: string }) => {
    return apiService.put<User>('/api/users/me/avatar/', data);
  },
  
  // 退出登录
  logout: () => {
    return apiService.post('/api/users/logout/');
  },

  // 检查邮箱是否可用
  checkEmailAvailability: (email: string) => {
    return apiService.get<{available: boolean}>('/auth/check-email/', { email });
  },

  // 修改密码
  changePassword: (data: {current_password: string, new_password: string}) => {
    return apiService.post('/api/users/me/change-password/', data);
  },

  // 删除账号
  deleteAccount: () => {
    return apiService.delete('/api/users/me/');
  }

};

export default userApi; 