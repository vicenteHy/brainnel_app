import { productApi, Product } from './api/productApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PreloadedData {
  products: Product[];
  timestamp: number;
  expiry: number; // 缓存过期时间 (ms)
  userId?: string; // 记录获取数据时的用户ID
}

const PRELOAD_CACHE_KEY = '@app_preload_recommendations';
const CACHE_DURATION = 10 * 60 * 1000; // 10分钟缓存，适应不同的开屏时长

class PreloadService {
  private static instance: PreloadService;
  private preloadPromise: Promise<Product[]> | null = null;
  private cachedData: PreloadedData | null = null;

  private constructor() {}

  public static getInstance(): PreloadService {
    if (!PreloadService.instance) {
      PreloadService.instance = new PreloadService();
    }
    return PreloadService.instance;
  }

  /**
   * 在应用启动时开始预加载推荐产品
   */
  public async startPreloading(userId?: string): Promise<void> {
    
    // 检查是否已有缓存且用户ID匹配
    const cachedData = await this.getCachedData();
    if (cachedData && Date.now() < cachedData.expiry && cachedData.userId === userId) {
      this.cachedData = cachedData;
      return;
    } else if (cachedData && cachedData.userId !== userId) {
      await this.clearCache();
    }

    // 如果已经在预加载中，不重复启动
    if (this.preloadPromise) {
      return;
    }

    this.preloadPromise = this.fetchRecommendations(userId);
    
    try {
      const products = await this.preloadPromise;
      
      // 缓存数据
      const preloadedData: PreloadedData = {
        products,
        timestamp: Date.now(),
        expiry: Date.now() + CACHE_DURATION,
        userId
      };
      
      this.cachedData = preloadedData;
      await this.setCachedData(preloadedData);
      
    } catch (error) {
    } finally {
      this.preloadPromise = null;
    }
  }

  /**
   * 获取预加载的推荐产品
   */
  public async getPreloadedRecommendations(userId?: string): Promise<Product[]> {
    
    // 如果有缓存且未过期，检查用户ID是否匹配
    if (this.cachedData && Date.now() < this.cachedData.expiry) {
      // 检查缓存的用户ID是否与请求的用户ID匹配
      if (this.cachedData.userId === userId) {
        return this.cachedData.products;
      } else {
        // 用户ID不匹配，清除缓存，重新加载
        await this.clearCache();
      }
    }

    // 如果正在预加载中，等待完成
    if (this.preloadPromise) {
      try {
        await this.preloadPromise;
        return this.cachedData?.products || [];
      } catch (error) {
        return [];
      }
    }

    // 如果没有缓存也没有正在预加载，立即开始加载
    try {
      const products = await this.fetchRecommendations(userId);
      
      // 更新缓存
      const preloadedData: PreloadedData = {
        products,
        timestamp: Date.now(),
        expiry: Date.now() + CACHE_DURATION,
        userId
      };
      
      this.cachedData = preloadedData;
      await this.setCachedData(preloadedData);
      
      return products;
    } catch (error) {
      return [];
    }
  }

  /**
   * 清除预加载缓存
   */
  public async clearCache(): Promise<void> {
    this.cachedData = null;
    this.preloadPromise = null;
    await AsyncStorage.removeItem(PRELOAD_CACHE_KEY);
  }

  /**
   * 检查是否有可用的预加载数据
   */
  public hasPreloadedData(): boolean {
    return this.cachedData !== null && Date.now() < this.cachedData.expiry;
  }

  /**
   * 获取预加载数据的状态信息
   */
  public getPreloadStatus() {
    return {
      hasCache: this.cachedData !== null,
      isExpired: this.cachedData ? Date.now() >= this.cachedData.expiry : true,
      isLoading: this.preloadPromise !== null,
      cacheCount: this.cachedData?.products.length || 0,
      cacheAge: this.cachedData ? Date.now() - this.cachedData.timestamp : 0
    };
  }

  private async fetchRecommendations(userId?: string): Promise<Product[]> {
    
    const response = await productApi.getPersonalRecommendations({
      count: 20, // 预加载更多产品
      ...(userId ? { user_id: parseInt(userId) } : {})
    });

    return response;
  }

  private async getCachedData(): Promise<PreloadedData | null> {
    try {
      const cached = await AsyncStorage.getItem(PRELOAD_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached) as PreloadedData;
        if (Date.now() < data.expiry) {
          return data;
        }
      }
    } catch (error) {
    }
    return null;
  }

  private async setCachedData(data: PreloadedData): Promise<void> {
    try {
      await AsyncStorage.setItem(PRELOAD_CACHE_KEY, JSON.stringify(data));
    } catch (error) {
    }
  }
}

export const preloadService = PreloadService.getInstance(); 