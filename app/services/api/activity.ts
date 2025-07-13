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