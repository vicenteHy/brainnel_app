import apiService from './apiClient';

// 活动数据接口返回类型
export interface ActivityData {
  user_id: number;
  current_reward_amount: string;
  target_reward_amount: string;
  gold_masks_count: number;
  target_gole_masks_count: number;
  total_invite_count: number;
  effective_invite_count: number;
  referrer_id: number;
  available_game_attempts?: number; // 可用游戏次数
}

// 游戏结果接口返回类型
export interface GamePlayResult {
  reward_amount: string;
  reward_type: number; // 0: 现金, 1: 面具
  message: string;
}

// 签到项接口返回类型
export interface SignInItem {
  sign_in_date: string;
  is_check_in: boolean;
}

// 签到状态接口返回类型
export interface SignInStatus {
  sign_ins: SignInItem[];
  today: string;
}

// 任务项接口返回类型
export interface TaskItem {
  task_id: number;
  task_name: string;
  task_description: string;
  reward_type: number;
  reward_value: string;
  status: number; // 0: 待完成, 1: 已完成待领取, 2: 已完成已领取
}

// 任务列表接口返回类型
export interface TasksResponse {
  tasks: TaskItem[];
}

// 进入活动接口
export const enterActivity = async (referrerId: number = 0): Promise<ActivityData> => {
  try {
    const data = await apiService.post<ActivityData>('/api/activity/enter', {
      referrer_id: referrerId
    });
    return data;
  } catch (error) {
    console.error('进入活动失败:', error);
    throw error;
  }
};

// 更新用户累积奖励金额接口
export const updateRewardAmount = async (amount: number): Promise<ActivityData> => {
  try {
    const data = await apiService.post<ActivityData>('/api/activity/reward/update', {
      current_reward_amount: amount
    });
    return data;
  } catch (error) {
    console.error('更新奖励金额失败:', error);
    throw error;
  }
};

// 玩游戏获取奖励接口
export const playGame = async (): Promise<GamePlayResult> => {
  try {
    const data = await apiService.post<GamePlayResult>('/api/activity/game/play', {});
    return data;
  } catch (error) {
    console.error('游戏失败:', error);
    throw error;
  }
};

// 签到接口
export const signIn = async (): Promise<any> => {
  try {
    const data = await apiService.post('/api/activity/sign-in', {});
    return data;
  } catch (error) {
    console.error('签到失败:', error);
    throw error;
  }
};

// 获取签到状态接口
export const getSignInStatus = async (): Promise<SignInStatus> => {
  try {
    const data = await apiService.get<SignInStatus>('/api/activity/sign-in/status');
    return data;
  } catch (error) {
    console.error('获取签到状态失败:', error);
    throw error;
  }
};

// 获取任务列表接口
export const getTasks = async (): Promise<TasksResponse> => {
  try {
    const data = await apiService.get<TasksResponse>('/api/activity/tasks');
    return data;
  } catch (error) {
    console.error('获取任务列表失败:', error);
    throw error;
  }
};

// 更新任务状态接口
export interface UpdateTaskStatusRequest {
  task_id: number;
  status: number;
}

export const updateTaskStatus = async (request: UpdateTaskStatusRequest): Promise<TaskItem> => {
  try {
    const data = await apiService.post<TaskItem>('/api/activity/tasks/update-status', request);
    console.log(`[Activity] 任务状态更新成功 - task_id: ${request.task_id}, status: ${request.status}`);
    return data;
  } catch (error) {
    console.error('更新任务状态失败:', error);
    throw error;
  }
};

// 获取用户邀请链接
export interface InvitationLinkResponse {
  invitation_link: string;
}

export const getInvitationLink = async (): Promise<InvitationLinkResponse> => {
  try {
    const data = await apiService.get<InvitationLinkResponse>('/api/activity/invitation-link');
    console.log('[Activity] 获取邀请链接成功:', data.invitation_link);
    return data;
  } catch (error) {
    console.error('获取邀请链接失败:', error);
    throw error;
  }
};

// 助力接口
export interface AssistResponse {
  success: boolean;
  message: string;
}

export const assist = async (referrerId: number): Promise<AssistResponse> => {
  try {
    const data = await apiService.post<AssistResponse>('/api/activity/assist', {
      referrer_id: referrerId
    });
    console.log('[Activity] 助力成功:', data);
    return data;
  } catch (error) {
    console.error('助力失败:', error);
    throw error;
  }
};

// 获取活动状态接口
export const getActivityStatus = async (): Promise<ActivityData> => {
  try {
    const data = await apiService.get<ActivityData>('/api/activity/status');
    return data;
  } catch (error) {
    console.error('获取活动状态失败:', error);
    throw error;
  }
};

// 发起提现请求接口
export interface WithdrawalRequest {
  amount: number;
  withdrawal_method: 'balance' | 'wave';
  withdrawal_account: string;
}

export interface WithdrawalResponse {
  withdrawal_id: number;
  user_id: number;
  amount: string;
  request_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  completion_date: string;
  withdrawal_method: 'balance' | 'wave';
  withdrawal_account: string;
}

export const initiateWithdrawal = async (request: WithdrawalRequest): Promise<WithdrawalResponse> => {
  try {
    const data = await apiService.post<WithdrawalResponse>('/api/activity/withdrawals/initiate', request);
    console.log('[Activity] 发起提现成功:', data);
    return data;
  } catch (error) {
    console.error('发起提现失败:', error);
    throw error;
  }
};