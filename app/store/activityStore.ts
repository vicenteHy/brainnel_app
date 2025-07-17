import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTasks, TaskItem, updateTaskStatus } from '../services/api/activity';

interface ActivityStore {
  tasks: TaskItem[];
  lastFetchTime: number | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setTasks: (tasks: TaskItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchTasks: () => Promise<void>;
  getTaskStatus: (taskId: number) => number;
  updateTaskStatusLocal: (taskId: number, status: number) => void;
  reportTaskComplete: (taskId: number) => Promise<TaskItem | null>;
  reportTaskClaimed: (taskId: number) => Promise<void>;
  clearTasks: () => void;
}

const useActivityStore = create<ActivityStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      lastFetchTime: null,
      loading: false,
      error: null,

      setTasks: (tasks) => {
        set({ 
          tasks, 
          lastFetchTime: Date.now(),
          error: null 
        });
      },

      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),

      fetchTasks: async () => {
        const { loading } = get();
        if (loading) return;

        set({ loading: true, error: null });
        
        try {
          console.log('[ActivityStore] 获取任务列表...');
          const response = await getTasks();
          console.log('[ActivityStore] 任务列表获取成功:', response.tasks);
          
          set({ 
            tasks: response.tasks,
            lastFetchTime: Date.now(),
            loading: false,
            error: null
          });
        } catch (error) {
          console.error('[ActivityStore] 获取任务列表失败:', error);
          set({ 
            loading: false, 
            error: '获取任务失败' 
          });
        }
      },

      getTaskStatus: (taskId) => {
        const { tasks } = get();
        const task = tasks.find(t => t.task_id === taskId);
        return task?.status || 0;
      },

      updateTaskStatusLocal: (taskId, status) => {
        const { tasks } = get();
        const updatedTasks = tasks.map(task => 
          task.task_id === taskId ? { ...task, status } : task
        );
        set({ tasks: updatedTasks });
      },

      reportTaskComplete: async (taskId) => {
        const { getTaskStatus, updateTaskStatusLocal } = get();
        const currentStatus = getTaskStatus(taskId);
        
        // 只有状态为0（待完成）的任务才能报告完成
        if (currentStatus !== 0) {
          console.log(`[ActivityStore] 任务 ${taskId} 状态为 ${currentStatus}，无需上报完成`);
          return null;
        }

        try {
          console.log(`[ActivityStore] 上报任务完成并自动领取 - taskId: ${taskId}`);
          // 直接将状态更新为2（已完成已领取）
          const taskData = await updateTaskStatus({ task_id: taskId, status: 2 });
          
          console.log(`[ActivityStore] API返回的任务数据:`, taskData);
          
          // 更新本地状态为已完成已领取
          updateTaskStatusLocal(taskId, 2);
          
          // 可选：重新获取任务列表以确保数据同步
          await get().fetchTasks();
          
          // 返回任务数据，用于显示弹窗
          return taskData;
        } catch (error) {
          console.error(`[ActivityStore] 上报任务完成失败 - taskId: ${taskId}`, error);
          return null;
        }
      },

      reportTaskClaimed: async (taskId) => {
        const { getTaskStatus, updateTaskStatusLocal } = get();
        const currentStatus = getTaskStatus(taskId);
        
        // 可以从状态0或1领取奖励
        if (currentStatus === 2) {
          console.log(`[ActivityStore] 任务 ${taskId} 已经领取过奖励`);
          return;
        }

        try {
          console.log(`[ActivityStore] 上报任务已领取 - taskId: ${taskId}, 当前状态: ${currentStatus}`);
          await updateTaskStatus({ task_id: taskId, status: 2 });
          
          // 更新本地状态为已领取
          updateTaskStatusLocal(taskId, 2);
          
          // 可选：重新获取任务列表以确保数据同步
          await get().fetchTasks();
        } catch (error) {
          console.error(`[ActivityStore] 上报任务已领取失败 - taskId: ${taskId}`, error);
        }
      },

      clearTasks: () => {
        set({ 
          tasks: [], 
          lastFetchTime: null,
          error: null 
        });
      },
    }),
    {
      name: 'activity-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tasks: state.tasks,
        lastFetchTime: state.lastFetchTime,
      }),
    }
  )
);

export default useActivityStore;