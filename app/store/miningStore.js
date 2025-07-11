import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useMiningStore = create(
  persist(
    (set, get) => ({
      // 游戏状态
      balance: 4000,
      currentDepth: 0,
      digCount: 2,
      lastDigTime: null,
      totalDigs: 0,
      
      // 游戏配置
      requiredAmount: 1000,
      targetAmount: 5000,
      maxDigsPerDay: 10,
      digRechargeTime: 3600000, // 1小时

      // 邀请相关
      invitedFriends: [],
      referralCode: null,
      bonusDigsFromReferrals: 0,

      // 动作
      dig: () => {
        const state = get();
        if (state.digCount <= 0) return false;

        const layers = [
          { minDepth: 0, maxDepth: 1, reward: 10 },
          { minDepth: 1, maxDepth: 2, reward: 25 },
          { minDepth: 2, maxDepth: 3, reward: 50 },
          { minDepth: 3, maxDepth: 4, reward: 100 },
        ];

        const currentLayer = layers.find(layer => 
          state.currentDepth >= layer.minDepth && state.currentDepth < layer.maxDepth
        ) || layers[layers.length - 1];

        const reward = currentLayer.reward + Math.floor(Math.random() * 10);
        
        set({
          balance: state.balance + reward,
          currentDepth: Math.min(state.currentDepth + 0.2, 4),
          digCount: state.digCount - 1,
          lastDigTime: Date.now(),
          totalDigs: state.totalDigs + 1,
        });

        return reward;
      },

      // 重置每日挖矿次数
      rechargeDigs: () => {
        const state = get();
        const now = Date.now();
        const timeSinceLastDig = now - state.lastDigTime;
        
        if (timeSinceLastDig >= state.digRechargeTime) {
          const rechargeCount = Math.floor(timeSinceLastDig / state.digRechargeTime);
          set({
            digCount: Math.min(state.digCount + rechargeCount, state.maxDigsPerDay),
          });
        }
      },

      // 提现
      withdraw: (amount) => {
        const state = get();
        if (state.balance >= amount) {
          set({ balance: state.balance - amount });
          return true;
        }
        return false;
      },

      // 添加邀请的朋友
      addInvitedFriend: (friendId) => {
        const state = get();
        if (!state.invitedFriends.includes(friendId)) {
          set({
            invitedFriends: [...state.invitedFriends, friendId],
            bonusDigsFromReferrals: state.bonusDigsFromReferrals + 1,
            digCount: state.digCount + 1,
          });
          return true;
        }
        return false;
      },

      // 设置推荐码
      setReferralCode: (code) => set({ referralCode: code }),

      // 获取游戏进度百分比
      getProgress: () => {
        const state = get();
        return Math.min((state.balance / state.targetAmount) * 100, 100);
      },

      // 重置游戏
      resetGame: () => set({
        balance: 0,
        currentDepth: 0,
        digCount: 2,
        lastDigTime: null,
        totalDigs: 0,
      }),
    }),
    {
      name: 'mining-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useMiningStore;