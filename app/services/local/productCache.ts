import type { LocalProduct } from './productList';

// 商品缓存管理
class ProductCacheManager {
  private cache: Map<number, LocalProduct> = new Map();
  private lastProductId?: number;

  // 设置商品缓存
  setProduct(productId: number, product: LocalProduct) {
    this.cache.set(productId, product);
    this.lastProductId = productId;
  }

  // 获取商品缓存
  getProduct(productId: number): LocalProduct | undefined {
    return this.cache.get(productId);
  }

  // 批量设置商品缓存
  setProducts(products: LocalProduct[]) {
    products.forEach(product => {
      this.cache.set(product.product_id, product);
      this.lastProductId = product.product_id;
    });
  }

  // 清除缓存
  clear() {
    this.cache.clear();
    this.lastProductId = undefined;
  }

  // 检查是否有缓存
  hasProduct(productId: number): boolean {
    return this.cache.has(productId);
  }

  // 获取最近一次设置的商品
  getLastProduct(): LocalProduct | undefined {
    if (this.lastProductId !== undefined) {
      return this.cache.get(this.lastProductId);
    }
    const iterator = this.cache.values();
    const first = iterator.next();
    return first.done ? undefined : first.value;
  }

  // 获取所有缓存商品
  getAllProducts(): LocalProduct[] {
    return Array.from(this.cache.values());
  }
}

// 导出单例实例
export const productCacheManager = new ProductCacheManager();