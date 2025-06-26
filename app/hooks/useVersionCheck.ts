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
      console.log(`[版本检查Hook] 跳过检查 - 正在进行中`);
      return;
    }

    // 清除之前的防抖定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    console.log(`[版本检查Hook] ===== 开始版本检查流程 =====`);
    console.log(`[版本检查Hook] 当前版本: ${currentVersion}`);
    
    setState(prev => ({ ...prev, isChecking: true, error: null }));
    
    try {
      console.log(`[版本检查Hook] 开始获取版本信息...`);
      const versionInfoList = await settingApi.getVersionInfo();
      console.log(`[版本检查Hook] 获取到版本信息列表:`, versionInfoList);
      
      const currentPlatform = getCurrentPlatform();
      console.log(`[版本检查Hook] 当前平台: ${currentPlatform}`);
      
      // 找到当前平台的版本信息
      const platformVersionInfo = versionInfoList.find(
        info => info.platform === currentPlatform
      );
      
      if (!platformVersionInfo) {
        console.log(`[版本检查Hook] 错误: 未找到平台 ${currentPlatform} 的版本信息`);
        setState(prev => ({
          ...prev,
          isChecking: false,
          error: '未找到当前平台的版本信息',
        }));
        return;
      }

      console.log(`[版本检查Hook] 找到平台版本信息:`, platformVersionInfo);

      // 检查更新类型
      const updateType = checkUpdateType(
        currentVersion,
        platformVersionInfo.min_force_version,
        platformVersionInfo.latest_version
      );

      console.log(`[版本检查Hook] 最终更新类型: ${updateType}`);

      setState(prev => ({
        ...prev,
        updateType,
        versionInfo: platformVersionInfo,
        isChecking: false,
      }));

      console.log(`[版本检查Hook] ===== 版本检查完成 =====`);

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