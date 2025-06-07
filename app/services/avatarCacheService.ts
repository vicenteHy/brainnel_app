import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

interface CachedAvatar {
  localUri: string;
  serverUrl: string;
  timestamp: number;
  userId: string;
}

const AVATAR_CACHE_KEY = '@avatar_cache_';
const AVATAR_CACHE_DIRECTORY = `${FileSystem.documentDirectory}avatars/`;
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7天缓存时间

class AvatarCacheService {
  private static instance: AvatarCacheService;

  private constructor() {
    this.initializeDirectory();
  }

  public static getInstance(): AvatarCacheService {
    if (!AvatarCacheService.instance) {
      AvatarCacheService.instance = new AvatarCacheService();
    }
    return AvatarCacheService.instance;
  }

  // 初始化缓存目录
  private async initializeDirectory(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(AVATAR_CACHE_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(AVATAR_CACHE_DIRECTORY, { intermediates: true });
        console.log('[AvatarCache] 创建头像缓存目录');
      }
    } catch (error) {
      console.error('[AvatarCache] 创建缓存目录失败:', error);
    }
  }

  // 获取缓存的头像 URI
  public async getCachedAvatarUri(userId: string, serverUrl: string): Promise<string | null> {
    try {
      if (!serverUrl || !userId) {
        return null;
      }

      // 检查是否有缓存记录
      const cacheKey = AVATAR_CACHE_KEY + userId;
      const cachedDataString = await AsyncStorage.getItem(cacheKey);
      
      if (cachedDataString) {
        const cachedData: CachedAvatar = JSON.parse(cachedDataString);
        
        // 检查缓存是否过期
        const now = Date.now();
        if (now - cachedData.timestamp < CACHE_DURATION) {
          // 检查本地文件是否仍然存在
          const fileInfo = await FileSystem.getInfoAsync(cachedData.localUri);
          if (fileInfo.exists) {
            // 检查服务器URL是否相同
            if (cachedData.serverUrl === serverUrl) {
              console.log('[AvatarCache] 使用缓存的头像:', cachedData.localUri);
              return cachedData.localUri;
            } else {
              // 服务器URL已更改，需要下载新头像
              console.log('[AvatarCache] 服务器头像URL已更改，需要重新下载');
              await this.deleteCachedAvatar(userId);
            }
          } else {
            // 本地文件不存在，清除缓存记录
            await AsyncStorage.removeItem(cacheKey);
          }
        } else {
          // 缓存已过期
          console.log('[AvatarCache] 头像缓存已过期');
          await this.deleteCachedAvatar(userId);
        }
      }

      // 从服务器下载并缓存头像
      return await this.downloadAndCacheAvatar(userId, serverUrl);
    } catch (error) {
      console.error('[AvatarCache] 获取缓存头像失败:', error);
      return serverUrl; // 如果缓存失败，返回原始URL
    }
  }

  // 从服务器下载并缓存头像
  private async downloadAndCacheAvatar(userId: string, serverUrl: string): Promise<string> {
    try {
      console.log('[AvatarCache] 从服务器下载头像:', serverUrl);
      
      // 生成本地文件名
      const fileExtension = this.getFileExtension(serverUrl);
      const fileName = `avatar_${userId}_${Date.now()}${fileExtension}`;
      const localUri = AVATAR_CACHE_DIRECTORY + fileName;

      // 下载文件
      const downloadResult = await FileSystem.downloadAsync(serverUrl, localUri);
      
      if (downloadResult.status === 200) {
        // 保存缓存记录
        const cacheData: CachedAvatar = {
          localUri: downloadResult.uri,
          serverUrl,
          timestamp: Date.now(),
          userId
        };
        
        const cacheKey = AVATAR_CACHE_KEY + userId;
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
        
        console.log('[AvatarCache] 头像下载并缓存成功:', downloadResult.uri);
        return downloadResult.uri;
      } else {
        console.warn('[AvatarCache] 头像下载失败，状态码:', downloadResult.status);
        return serverUrl;
      }
    } catch (error) {
      console.error('[AvatarCache] 下载并缓存头像失败:', error);
      return serverUrl; // 如果下载失败，返回原始URL
    }
  }

  // 删除缓存的头像
  public async deleteCachedAvatar(userId: string): Promise<void> {
    try {
      const cacheKey = AVATAR_CACHE_KEY + userId;
      const cachedDataString = await AsyncStorage.getItem(cacheKey);
      
      if (cachedDataString) {
        const cachedData: CachedAvatar = JSON.parse(cachedDataString);
        
        // 删除本地文件
        const fileInfo = await FileSystem.getInfoAsync(cachedData.localUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(cachedData.localUri);
          console.log('[AvatarCache] 删除本地头像文件:', cachedData.localUri);
        }
        
        // 删除缓存记录
        await AsyncStorage.removeItem(cacheKey);
        console.log('[AvatarCache] 删除头像缓存记录');
      }
    } catch (error) {
      console.error('[AvatarCache] 删除缓存头像失败:', error);
    }
  }

  // 清除所有头像缓存
  public async clearAllCache(): Promise<void> {
    try {
      // 获取所有AsyncStorage键
      const allKeys = await AsyncStorage.getAllKeys();
      const avatarCacheKeys = allKeys.filter(key => key.startsWith(AVATAR_CACHE_KEY));
      
      // 删除所有头像文件和缓存记录
      for (const key of avatarCacheKeys) {
        const userId = key.replace(AVATAR_CACHE_KEY, '');
        await this.deleteCachedAvatar(userId);
      }
      
      // 删除整个缓存目录
      const dirInfo = await FileSystem.getInfoAsync(AVATAR_CACHE_DIRECTORY);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(AVATAR_CACHE_DIRECTORY);
        console.log('[AvatarCache] 清除所有头像缓存');
      }
    } catch (error) {
      console.error('[AvatarCache] 清除所有缓存失败:', error);
    }
  }

  // 获取文件扩展名
  private getFileExtension(url: string): string {
    try {
      const urlWithoutQuery = url.split('?')[0];
      const parts = urlWithoutQuery.split('.');
      if (parts.length > 1) {
        const extension = parts[parts.length - 1].toLowerCase();
        // 限制常见的图片格式
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
          return '.' + extension;
        }
      }
      return '.jpg'; // 默认使用jpg格式
    } catch {
      return '.jpg';
    }
  }

  // 获取缓存统计信息
  public async getCacheStats(): Promise<{ count: number; size: number }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const avatarCacheKeys = allKeys.filter(key => key.startsWith(AVATAR_CACHE_KEY));
      let totalSize = 0;

      for (const key of avatarCacheKeys) {
        const cachedDataString = await AsyncStorage.getItem(key);
        if (cachedDataString) {
          const cachedData: CachedAvatar = JSON.parse(cachedDataString);
          const fileInfo = await FileSystem.getInfoAsync(cachedData.localUri);
          if (fileInfo.exists && fileInfo.size) {
            totalSize += fileInfo.size;
          }
        }
      }

      return {
        count: avatarCacheKeys.length,
        size: totalSize
      };
    } catch (error) {
      console.error('[AvatarCache] 获取缓存统计失败:', error);
      return { count: 0, size: 0 };
    }
  }
}

export const avatarCacheService = AvatarCacheService.getInstance(); 