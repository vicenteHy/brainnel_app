/**
 * 类目图片工具
 * 管理本地类目图片的映射和加载
 */

import { 
  CATEGORY_IMAGE_MAP, 
  DEFAULT_CATEGORY_CONFIG,
  isCategoryConfigured 
} from './categoryImageConfig';

/**
 * 获取类目本地图片
 * @param categoryId 类目ID
 * @param categoryName 类目名称（可选，用于fallback）
 * @returns 本地图片资源或null
 */
export const getCategoryLocalImage = (categoryId: number, categoryName?: string) => {
  // 从静态映射表获取图片
  if (CATEGORY_IMAGE_MAP[categoryId]) {
    return CATEGORY_IMAGE_MAP[categoryId];
  }

  // 如果映射表中没有找到，显示日志（如果启用）
  if (DEFAULT_CATEGORY_CONFIG.showWarningLogs) {
    console.log(`未找到类目图片: categoryId=${categoryId}, name=${categoryName || 'unknown'}`);
  }

  return null;
};

/**
 * 检查是否有本地类目图片
 * @param categoryId 类目ID
 * @returns boolean
 */
export const hasCategoryLocalImage = (categoryId: number): boolean => {
  return getCategoryLocalImage(categoryId) !== null;
};

/**
 * 获取类目图片源（本地优先，网络作为备用）
 * @param categoryId 类目ID
 * @param networkImageUrl 网络图片URL
 * @param categoryName 类目名称（可选）
 * @returns 图片源对象
 */
export const getCategoryImageSource = (
  categoryId: number, 
  networkImageUrl?: string, 
  categoryName?: string
) => {
  // 优先使用本地图片
  const localImage = getCategoryLocalImage(categoryId, categoryName);
  if (localImage) {
    return localImage;
  }

  // 如果没有本地图片，根据配置决定是否使用网络图片
  if (DEFAULT_CATEGORY_CONFIG.fallbackToNetworkImage && networkImageUrl) {
    return { uri: networkImageUrl };
  }

  // 都没有则返回null
  return null;
}; 