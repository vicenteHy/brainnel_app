import { Platform } from 'react-native';

export enum UpdateType {
  NO_UPDATE = 'no_update',
  OPTIONAL_UPDATE = 'optional_update',
  FORCE_UPDATE = 'force_update'
}

/**
 * 比较版本号
 * @param version1 版本号1
 * @param version2 版本号2
 * @returns 1: version1 > version2, 0: version1 = version2, -1: version1 < version2
 */
export function compareVersion(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  const maxLength = Math.max(v1Parts.length, v2Parts.length);
  
  for (let i = 0; i < maxLength; i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    
    if (v1Part > v2Part) {
      return 1;
    }
    if (v1Part < v2Part) {
      return -1;
    }
  }
  
  return 0;
}

/**
 * 检查更新类型
 * @param currentVersion 当前版本
 * @param minForceVersion 最小强制更新版本
 * @param latestVersion 最新版本
 * @returns 更新类型
 */
export function checkUpdateType(
  currentVersion: string,
  minForceVersion: string,
  latestVersion: string
): UpdateType {
  const compareWithMinForce = compareVersion(currentVersion, minForceVersion);
  const compareWithLatest = compareVersion(currentVersion, latestVersion);
  
  // 当前版本小于最小强制版本，需要强制更新
  if (compareWithMinForce < 0) {
    return UpdateType.FORCE_UPDATE;
  }
  
  // 当前版本小于最新版本且大于等于最小强制版本，提示更新
  if (compareWithLatest < 0 && compareWithMinForce >= 0) {
    return UpdateType.OPTIONAL_UPDATE;
  }
  
  // 当前版本已是最新版本，无需更新
  return UpdateType.NO_UPDATE;
}

/**
 * 获取当前平台
 */
export function getCurrentPlatform(): 'android' | 'ios' {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

/**
 * 打开应用商店
 * @param linkUrl 应用商店链接
 */
export function openAppStore(linkUrl: string): void {
  // 这里可以使用 Linking 来打开链接
  // 为了保持简单，先暂时留空，在组件中实现
}