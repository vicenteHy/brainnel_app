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
    // 异步初始化，不阻塞构造函数
    this.initializeDirectory().catch(error => {
    });
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
      }
    } catch (error) {
    }
  }

  // 获取缓存的头像 URI
  public async getCachedAvatarUri(userId: string, serverUrl: string): Promise<string | null> {
    try {
      if (!serverUrl || !userId) {
        return null;
      }

      // 确保目录存在
      const directoryReady = await this.ensureDirectoryExists();
      if (!directoryReady) {
        return serverUrl;
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
              return cachedData.localUri;
            } else {
              // 服务器URL已更改，需要下载新头像
              await this.deleteCachedAvatar(userId);
            }
          } else {
            // 本地文件不存在，清除缓存记录
            await AsyncStorage.removeItem(cacheKey);
          }
        } else {
          // 缓存已过期
          await this.deleteCachedAvatar(userId);
        }
      }

      // 从服务器下载并缓存头像
      const cachedUri = await this.downloadAndCacheAvatar(userId, serverUrl);
      return cachedUri || serverUrl;
    } catch (error) {
      return serverUrl; // 如果缓存失败，返回原始URL
    }
  }

  // 从服务器下载并缓存头像
  private async downloadAndCacheAvatar(userId: string, serverUrl: string): Promise<string> {
    try {
      
      // 验证URL格式
      if (!this.isValidUrl(serverUrl)) {
        return serverUrl;
      }
      
      // 多次尝试确保缓存目录存在
      let directoryReady = false;
      for (let i = 0; i < 3; i++) {
        directoryReady = await this.ensureDirectoryExists();
        if (directoryReady) break;
        
        // 如果失败，等待100ms后重试
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (!directoryReady) {
        return serverUrl;
      }
      
      // 生成本地文件名
      const fileExtension = this.getFileExtension(serverUrl);
      const fileName = `avatar_${userId}_${Date.now()}${fileExtension}`;
      const localUri = AVATAR_CACHE_DIRECTORY + fileName;

      // 再次确认目录存在（防止下载过程中目录被删除）
      const finalCheck = await FileSystem.getInfoAsync(AVATAR_CACHE_DIRECTORY);
      if (!finalCheck.exists) {
        return serverUrl;
      }

      // 下载文件（设置10秒超时）
      const downloadPromise = FileSystem.downloadAsync(serverUrl, localUri);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Download timeout')), 10000);
      });
      
      const downloadResult = await Promise.race([downloadPromise, timeoutPromise]);
      
      if (downloadResult.status === 200) {
        // 验证下载的文件是否真的存在
        const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
        if (!fileInfo.exists) {
          return serverUrl;
        }
        
        // 保存缓存记录
        const cacheData: CachedAvatar = {
          localUri: downloadResult.uri,
          serverUrl,
          timestamp: Date.now(),
          userId
        };
        
        const cacheKey = AVATAR_CACHE_KEY + userId;
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
        
        return downloadResult.uri;
      } else {
        return serverUrl;
      }
    } catch (error) {
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
        }
        
        // 删除缓存记录
        await AsyncStorage.removeItem(cacheKey);
      }
    } catch (error) {
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
      }
    } catch (error) {
    }
  }

  // 确保目录存在
  private async ensureDirectoryExists(): Promise<boolean> {
    try {
      // 检查文档目录是否存在
      const docDirInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory!);
      if (!docDirInfo.exists) {
        return false;
      }
      
      // 检查头像缓存目录
      const dirInfo = await FileSystem.getInfoAsync(AVATAR_CACHE_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(AVATAR_CACHE_DIRECTORY, { intermediates: true });
        
        // 验证目录是否真的创建成功
        const verifyInfo = await FileSystem.getInfoAsync(AVATAR_CACHE_DIRECTORY);
        if (!verifyInfo.exists) {
          return false;
        }
        
      }
      
      return true;
    } catch (error) {
      
      // 尝试清理可能存在的损坏文件
      try {
        const dirInfo = await FileSystem.getInfoAsync(AVATAR_CACHE_DIRECTORY);
        if (dirInfo.exists && !dirInfo.isDirectory) {
          await FileSystem.deleteAsync(AVATAR_CACHE_DIRECTORY);
          await FileSystem.makeDirectoryAsync(AVATAR_CACHE_DIRECTORY, { intermediates: true });
          return true;
        }
      } catch (cleanupError) {
      }
      
      return false;
    }
  }

  // 验证URL格式
  private isValidUrl(url: string): boolean {
    try {
      if (!url || typeof url !== 'string') {
        return false;
      }
      
      // 检查是否是有效的HTTP/HTTPS URL
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
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
      return { count: 0, size: 0 };
    }
  }
}

export const avatarCacheService = AvatarCacheService.getInstance(); 