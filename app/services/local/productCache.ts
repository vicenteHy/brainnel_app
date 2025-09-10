import type { LocalProduct, LocalProductSku } from './productList';

// 订单数据类型
export interface OrderData {
  product: LocalProduct;
  selectedSku?: LocalProductSku;
  quantity: number;
  selectedAttributes: { [key: string]: number };
  totalPrice: number;
}

// 商品缓存管理
class ProductCacheManager {
  private cache: Map<number, LocalProduct> = new Map();
  private lastProductId?: number;
  private orderData?: OrderData;

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

  // 设置订单数据
  setOrderData(data: OrderData) {
    this.orderData = data;
  }

  // 获取订单数据
  getOrderData(): OrderData | undefined {
    return this.orderData;
  }

  // 清除订单数据
  clearOrderData() {
    this.orderData = undefined;
  }
}

// 导出单例实例
export const productCacheManager = new ProductCacheManager();