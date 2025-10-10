/**
 * 深链接工具函数
 * 用于解析和处理应用内的深链接路由
 */

interface DeepLinkRoute {
  screen: string;
  params?: Record<string, any>;
}

/**
 * 解析深链接URL并返回对应的路由信息
 * @param url - 深链接URL
 * @returns 路由信息对象，如果无法解析则返回null
 */
export function resolveDeepLinkRoute(url: string): DeepLinkRoute | null {
  try {
    // 处理 LocalProductList 深链接
    // 示例: myapp://local/products?categoryId=123
    if (url.includes('/local/products') || url.includes('LocalProductList')) {
      // 解析URL参数
      const urlObj = new URL(url.replace('myapp://', 'https://'));
      const categoryId = urlObj.searchParams.get('categoryId');
      
      return {
        screen: 'LocalProductList',
        params: categoryId ? { categoryId } : undefined
      };
    }

    // 可以在这里添加更多深链接路由处理
    // 例如：
    // - 商品详情页
    // - 订单详情页
    // - 用户资料页
    // 等等...

    return null;
  } catch (error) {
    console.error('解析深链接失败:', error);
    return null;
  }
}
