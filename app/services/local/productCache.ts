import { LocalProduct } from './productList';

// 商品缓存管理
class ProductCacheManager {
  private cache: Map<number, LocalProduct> = new Map();

  // 设置商品缓存
  setProduct(productId: number, product: LocalProduct) {
    this.cache.set(productId, product);
  }

  // 获取商品缓存
  getProduct(productId: number): LocalProduct | undefined {
    return this.cache.get(productId);
  }

  // 批量设置商品缓存
  setProducts(products: LocalProduct[]) {
    products.forEach(product => {
      this.cache.set(product.product_id, product);
    });
  }

  // 清除缓存
  clear() {
    this.cache.clear();
  }

  // 检查是否有缓存
  hasProduct(productId: number): boolean {
    return this.cache.has(productId);
  }
}

// 导出单例实例
export const productCacheManager = new ProductCacheManager();