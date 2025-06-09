import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BrowseHistoryItem {
  product_id: string;
  product_name: string;
  product_image: string;
  price: number;
  currency: string;
  browse_time: number; // timestamp
  category_id?: number;
  seller_id?: string;
}

interface BrowseHistoryState {
  items: BrowseHistoryItem[];
  loading: boolean;
  addBrowseItem: (item: Omit<BrowseHistoryItem, 'browse_time'>) => Promise<void>;
  removeBrowseItem: (productId: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  loadHistory: () => Promise<void>;
  getHistoryByDate: (date: Date) => BrowseHistoryItem[];
}

const STORAGE_KEY = 'browse_history';
const MAX_HISTORY_COUNT = 100;

export const useBrowseHistoryStore = create<BrowseHistoryState>((set, get) => ({
  items: [],
  loading: false,

  addBrowseItem: async (item) => {
    try {
      const currentItems = get().items;
      const existingIndex = currentItems.findIndex(
        (existingItem) => existingItem.product_id === item.product_id
      );

      let newItems: BrowseHistoryItem[];
      const newItem: BrowseHistoryItem = {
        ...item,
        browse_time: Date.now(),
      };

      if (existingIndex !== -1) {
        // 如果商品已存在，更新浏览时间并移到最前面
        newItems = [newItem, ...currentItems.filter((_, index) => index !== existingIndex)];
      } else {
        // 新商品添加到最前面
        newItems = [newItem, ...currentItems];
      }

      // 限制最大记录数
      if (newItems.length > MAX_HISTORY_COUNT) {
        newItems = newItems.slice(0, MAX_HISTORY_COUNT);
      }

      set({ items: newItems });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (error) {
      console.error('Failed to add browse item:', error);
    }
  },

  removeBrowseItem: async (productId) => {
    try {
      const currentItems = get().items;
      const newItems = currentItems.filter(item => item.product_id !== productId);
      
      set({ items: newItems });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (error) {
      console.error('Failed to remove browse item:', error);
    }
  },

  clearHistory: async () => {
    try {
      set({ items: [] });
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  },

  loadHistory: async () => {
    try {
      set({ loading: true });
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (storedData) {
        const items: BrowseHistoryItem[] = JSON.parse(storedData);
        // 按浏览时间降序排序
        const sortedItems = items.sort((a, b) => b.browse_time - a.browse_time);
        set({ items: sortedItems });
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      set({ loading: false });
    }
  },

  getHistoryByDate: (date: Date) => {
    const items = get().items;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return items.filter(item => {
      const itemDate = new Date(item.browse_time);
      return itemDate >= startOfDay && itemDate <= endOfDay;
    });
  },
}));