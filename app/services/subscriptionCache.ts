/**
 * 全局订阅缓存管理器
 * 用于缓存用户的通知订阅状态，避免重复调用后端接口
 */
class SubscriptionCache {
  private static instance: SubscriptionCache;
  private cache: Set<string> = new Set();
  private lastFetchTime: number | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 缓存5分钟

  private constructor() {}

  static getInstance(): SubscriptionCache {
    if (!SubscriptionCache.instance) {
      SubscriptionCache.instance = new SubscriptionCache();
    }
    return SubscriptionCache.instance;
  }

  /**
   * 设置缓存数据
   */
  setCache(groups: string[]): void {
    this.cache.clear();
    groups.forEach(group => this.cache.add(group));
    this.lastFetchTime = Date.now();
    console.log('[SubscriptionCache] 缓存已更新:', Array.from(this.cache));
  }

  /**
   * 添加单个订阅到缓存
   */
  add(group: string): void {
    this.cache.add(group);
    console.log('[SubscriptionCache] 添加订阅到缓存:', group);
  }

  /**
   * 从缓存中移除订阅
   */
  remove(group: string): void {
    this.cache.delete(group);
    console.log('[SubscriptionCache] 从缓存中移除订阅:', group);
  }

  /**
   * 检查缓存中是否有某个订阅
   */
  has(group: string): boolean {
    return this.cache.has(group);
  }

  /**
   * 获取所有缓存的订阅
   */
  getAll(): string[] {
    return Array.from(this.cache);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.lastFetchTime = null;
    console.log('[SubscriptionCache] 缓存已清空');
  }

  /**
   * 检查缓存是否有效（未过期）
   */
  isValid(): boolean {
    if (!this.lastFetchTime) {
      return false;
    }
    return Date.now() - this.lastFetchTime < this.CACHE_DURATION;
  }

  /**
   * 获取缓存年龄（毫秒）
   */
  getAge(): number | null {
    if (!this.lastFetchTime) {
      return null;
    }
    return Date.now() - this.lastFetchTime;
  }
}

export default SubscriptionCache.getInstance();