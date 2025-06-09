import { useState, useEffect } from 'react';
import { avatarCacheService } from '../services/avatarCacheService';

export const useAvatarCache = (userId: string | number | undefined, serverUrl: string | undefined) => {
  const [cachedAvatarUri, setCachedAvatarUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadCachedAvatar = async () => {
      if (!serverUrl || !userId) {
        setCachedAvatarUri(null);
        return;
      }

      // 如果不是有效的URL，直接使用原始URL
      if (typeof serverUrl === 'string' && (!serverUrl.startsWith('http://') && !serverUrl.startsWith('https://'))) {
        setCachedAvatarUri(serverUrl);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const cachedUri = await avatarCacheService.getCachedAvatarUri(
          userId.toString(),
          serverUrl
        );
        setCachedAvatarUri(cachedUri);
      } catch (err) {
        console.warn('[useAvatarCache] 加载缓存头像失败，使用原始URL:', err);
        setError(err as Error);
        setCachedAvatarUri(serverUrl); // 使用原始URL作为备用
      } finally {
        setIsLoading(false);
      }
    };

    loadCachedAvatar();
  }, [userId, serverUrl]);

  // 返回缓存的URI或原始URL
  const avatarUri = cachedAvatarUri || serverUrl;

  return {
    avatarUri,
    isLoading,
    error,
    clearCache: async () => {
      if (userId) {
        await avatarCacheService.deleteCachedAvatar(userId.toString());
        setCachedAvatarUri(null);
      }
    }
  };
}; 