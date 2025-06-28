import { useState, useEffect, useCallback, useRef } from 'react';
import { settingApi, VersionInfo } from '../services/api/setting';
import { 
  UpdateType, 
  checkUpdateType, 
  getCurrentPlatform 
} from '../utils/versionUtils';

interface VersionCheckState {
  updateType: UpdateType;
  versionInfo: VersionInfo | null;
  isChecking: boolean;
  error: string | null;
}

interface UseVersionCheckProps {
  currentVersion: string;
  checkOnMount?: boolean;
}

export function useVersionCheck({ 
  currentVersion, 
  checkOnMount = true 
}: UseVersionCheckProps) {
  const [state, setState] = useState<VersionCheckState>({
    updateType: UpdateType.NO_UPDATE,
    versionInfo: null,
    isChecking: false,
    error: null,
  });

  const hasCheckedRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkVersion = useCallback(async () => {
    // 防止重复检查
    if (state.isChecking) {
      return;
    }

    // 清除之前的防抖定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    
    setState(prev => ({ ...prev, isChecking: true, error: null }));
    
    try {
      const versionInfoList = await settingApi.getVersionInfo();
      
      const currentPlatform = getCurrentPlatform();
      
      // 找到当前平台的版本信息
      const platformVersionInfo = versionInfoList.find(
        (info: VersionInfo) => info.platform === currentPlatform
      );
      
      if (!platformVersionInfo) {
        setState(prev => ({
          ...prev,
          isChecking: false,
          error: '未找到当前平台的版本信息',
        }));
        return;
      }


      // 检查更新类型
      const updateType = checkUpdateType(
        currentVersion,
        platformVersionInfo.min_force_version,
        platformVersionInfo.latest_version
      );


      setState(prev => ({
        ...prev,
        updateType,
        versionInfo: platformVersionInfo,
        isChecking: false,
      }));


    } catch (error) {
      console.error(`[版本检查Hook] 版本检查失败:`, error);
      setState(prev => ({
        ...prev,
        isChecking: false,
        error: '版本检查失败',
      }));
    }
  }, [currentVersion, state.isChecking]);

  useEffect(() => {
    if (checkOnMount && !hasCheckedRef.current) {
      hasCheckedRef.current = true;
      checkVersion();
    }
  }, [checkOnMount, checkVersion]);

  return {
    ...state,
    checkVersion,
  };
}