// 图片优化配置
export const imageConfig = {
  // 产品列表图片配置
  productList: {
    width: 200,
    height: 200,
    quality: 0.8,
    format: 'webp',
  },
  
  // 分类图标配置
  categoryIcon: {
    width: 80,
    height: 80,
    quality: 0.9,
    format: 'png',
  },
  
  // 轮播图配置
  banner: {
    width: 750,
    height: 300,
    quality: 0.85,
    format: 'webp',
  },
};

// 构建优化的图片URL
export const getOptimizedImageUrl = (
  originalUrl: string,
  config: { width: number; height: number; quality?: number; format?: string }
): string => {
  if (!originalUrl || !originalUrl.startsWith('http')) {
    return originalUrl;
  }
  
  // 如果是阿里云OSS，添加图片处理参数
  if (originalUrl.includes('aliyuncs.com')) {
    const { width, height, quality = 0.8, format = 'webp' } = config;
    const params = `?x-oss-process=image/resize,m_fill,w_${width},h_${height}/quality,q_${quality * 100}/format,${format}`;
    return originalUrl.split('?')[0] + params;
  }
  
  // 其他CDN可以在这里添加相应的处理逻辑
  
  return originalUrl;
};