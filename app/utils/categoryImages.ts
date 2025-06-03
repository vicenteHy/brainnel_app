/**
 * 二级分类图片映射配置
 * 
 * 使用方式：
 * 1. 把分类图片放在 assets/categories/ 目录下
 * 2. 在这里配置分类ID或名称与图片的映射关系
 * 3. 支持按categoryId映射，也支持按imageName映射
 */

// 导入所有分类图片（示例）
// 你需要根据实际的图片文件来调整这些 require 路径
const categoryImages = {
  // 按分类ID映射（推荐方式）
  byId: {
    // 示例映射，请根据你的实际分类ID和图片文件名来配置
    1: require('../../assets/img/logo2.png'), // 临时使用现有图片
    2: require('../../assets/img/logo2.png'),
    3: require('../../assets/img/logo2.png'),
    // 添加更多分类ID映射...
  },
  
  // 按图片名称映射（备选方式）
  byName: {
    'beauty': require('../../assets/img/logo2.png'),
    'clothing': require('../../assets/img/logo2.png'),
    'electronics': require('../../assets/img/logo2.png'),
    'food': require('../../assets/img/logo2.png'),
    'sports': require('../../assets/img/logo2.png'),
    // 添加更多名称映射...
  },
  
  // 默认图片
  default: require('../../assets/img/logo2.png'),
};

/**
 * 根据分类信息获取本地图片资源
 * @param categoryId 分类ID
 * @param imageName 图片名称（可选）
 * @returns 图片资源或null
 */
export const getCategoryImage = (categoryId: number, imageName?: string) => {
  // 优先根据imageName查找
  if (imageName && categoryImages.byName[imageName]) {
    return categoryImages.byName[imageName];
  }
  
  // 其次根据categoryId查找
  if (categoryImages.byId[categoryId]) {
    return categoryImages.byId[categoryId];
  }
  
  // 返回默认图片
  return categoryImages.default;
};

/**
 * 检查是否有对应的本地图片
 * @param categoryId 分类ID
 * @param imageName 图片名称（可选）
 * @returns boolean
 */
export const hasCategoryImage = (categoryId: number, imageName?: string): boolean => {
  if (imageName && categoryImages.byName[imageName]) {
    return true;
  }
  
  if (categoryImages.byId[categoryId]) {
    return true;
  }
  
  return false;
};

export default categoryImages;