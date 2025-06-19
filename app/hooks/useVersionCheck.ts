import { useState, useEffect } from 'react';
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

  const checkVersion = async () => {
    console.log('[VersionCheck] 开始版本检查...');
    console.log('[VersionCheck] 当前版本:', currentVersion);
    
    setState(prev => ({ ...prev, isChecking: true, error: null }));
    
    try {
      console.log('[VersionCheck] 调用版本检查API...');
      const versionInfoList = await settingApi.getVersionInfo();
      console.log('[VersionCheck] API返回数据:', JSON.stringify(versionInfoList, null, 2));
      
      const currentPlatform = getCurrentPlatform();
      console.log('[VersionCheck] 当前平台:', currentPlatform);
      
      // 找到当前平台的版本信息
      const platformVersionInfo = versionInfoList.find(
        info => info.platform === currentPlatform
      );
      
      if (!platformVersionInfo) {
        console.error('[VersionCheck] 未找到当前平台的版本信息');
        console.log('[VersionCheck] 可用平台:', versionInfoList.map(v => v.platform));
        setState(prev => ({
          ...prev,
          isChecking: false,
          error: '未找到当前平台的版本信息',
        }));
        return;
      }

      console.log('[VersionCheck] 找到平台版本信息:', JSON.stringify(platformVersionInfo, null, 2));

      // 检查更新类型
      const updateType = checkUpdateType(
        currentVersion,
        platformVersionInfo.min_force_version,
        platformVersionInfo.latest_version
      );

      console.log('[VersionCheck] 版本比较结果:');
      console.log('  - 当前版本:', currentVersion);
      console.log('  - 最小强制版本:', platformVersionInfo.min_force_version);
      console.log('  - 最新版本:', platformVersionInfo.latest_version);
      console.log('  - 更新类型:', updateType);

      setState(prev => ({
        ...prev,
        updateType,
        versionInfo: platformVersionInfo,
        isChecking: false,
      }));

      console.log('[VersionCheck] 版本检查完成');

    } catch (error) {
      console.error('[VersionCheck] 版本检查失败:', error);
      if (error instanceof Error) {
        console.error('[VersionCheck] 错误详情:', error.message);
        console.error('[VersionCheck] 错误堆栈:', error.stack);
      }
      setState(prev => ({
        ...prev,
        isChecking: false,
        error: '版本检查失败',
      }));
    }
  };

  useEffect(() => {
    if (checkOnMount) {
      checkVersion();
    }
  }, [checkOnMount]);

  return {
    ...state,
    checkVersion,
  };
}