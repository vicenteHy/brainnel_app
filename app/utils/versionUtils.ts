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
  console.log(`[VersionUtils] 比较版本: ${version1} vs ${version2}`);
  
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  console.log(`[VersionUtils] 版本1解析: ${JSON.stringify(v1Parts)}`);
  console.log(`[VersionUtils] 版本2解析: ${JSON.stringify(v2Parts)}`);
  
  const maxLength = Math.max(v1Parts.length, v2Parts.length);
  
  for (let i = 0; i < maxLength; i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    
    console.log(`[VersionUtils] 比较第${i}位: ${v1Part} vs ${v2Part}`);
    
    if (v1Part > v2Part) {
      console.log(`[VersionUtils] 结果: ${version1} > ${version2} (返回1)`);
      return 1;
    }
    if (v1Part < v2Part) {
      console.log(`[VersionUtils] 结果: ${version1} < ${version2} (返回-1)`);
      return -1;
    }
  }
  
  console.log(`[VersionUtils] 结果: ${version1} = ${version2} (返回0)`);
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
  console.log('[VersionUtils] 检查更新类型:');
  console.log(`  - 当前版本: ${currentVersion}`);
  console.log(`  - 最小强制版本: ${minForceVersion}`);
  console.log(`  - 最新版本: ${latestVersion}`);
  
  const compareWithMinForce = compareVersion(currentVersion, minForceVersion);
  const compareWithLatest = compareVersion(currentVersion, latestVersion);
  
  console.log(`[VersionUtils] 与最小强制版本比较结果: ${compareWithMinForce}`);
  console.log(`[VersionUtils] 与最新版本比较结果: ${compareWithLatest}`);
  
  // 当前版本小于最小强制版本，需要强制更新
  if (compareWithMinForce < 0) {
    console.log('[VersionUtils] 返回: FORCE_UPDATE (强制更新)');
    return UpdateType.FORCE_UPDATE;
  }
  
  // 当前版本小于最新版本且大于等于最小强制版本，提示更新
  if (compareWithLatest < 0 && compareWithMinForce >= 0) {
    console.log('[VersionUtils] 返回: OPTIONAL_UPDATE (可选更新)');
    return UpdateType.OPTIONAL_UPDATE;
  }
  
  // 当前版本已是最新版本，无需更新
  console.log('[VersionUtils] 返回: NO_UPDATE (无需更新)');
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