# HomeScreen 性能优化总结

## 主要问题
1. **Key重复问题**：使用随机关键词导致相同商品在不同页面出现，造成FlatList key重复
2. **频繁重新渲染**：每次数据更新都会触发整个列表重新渲染
3. **数据合并性能问题**：直接使用扩展运算符合并大量数据

## 优化方案

### 1. 解决Key重复问题
- **添加唯一ID生成器**：为每个产品添加 `_uniqueId` 属性
- **产品去重机制**：使用 `Set` 存储已见过的产品ID，避免重复
- **优化keyExtractor**：使用唯一ID作为key，确保不重复

```typescript
// 产品去重和唯一ID生成
const seenProductIds = useRef(new Set<string>());
const productUniqueId = useRef(0);

const processProductData = useCallback((newProducts: Product[]) => {
  const uniqueProducts: Product[] = [];
  
  newProducts.forEach(product => {
    const productKey = `${product.offer_id}-${product.min_price}`;
    if (!seenProductIds.current.has(productKey)) {
      seenProductIds.current.add(productKey);
      const processedProduct = {
        ...product,
        _uniqueId: ++productUniqueId.current
      };
      uniqueProducts.push(processedProduct);
    }
  });
  
  return uniqueProducts;
}, []);
```

### 2. 减少重新渲染
- **React.memo优化ProductItem**：使用自定义比较函数，只在关键属性变化时重新渲染
- **useCallback优化函数**：缓存所有回调函数，避免不必要的重新创建
- **useMemo优化数据源**：缓存FlatList的data属性

```typescript
// ProductItem组件优化
const ProductItem = React.memo(
  ({ item, onPress, userStore, t }) => (
    // 组件内容
  ),
  (prevProps, nextProps) => {
    return (
      prevProps.item._uniqueId === nextProps.item._uniqueId &&
      prevProps.item.offer_id === nextProps.item.offer_id &&
      prevProps.item.min_price === nextProps.item.min_price &&
      prevProps.userStore.user?.user_id === nextProps.userStore.user?.user_id
    );
  }
);
```

### 3. 优化数据加载
- **防抖机制**：避免频繁触发加载更多请求
- **请求队列管理**：确保同时只有一个请求在进行
- **函数式状态更新**：避免闭包问题

```typescript
// 防抖和请求队列
const handleLoadMore = useCallback(() => {
  const now = Date.now();
  
  // 防抖：如果距离上次加载时间小于1秒，则忽略
  if (now - lastLoadMoreTime.current < 1000) {
    return;
  }
  
  if (!hasMore || loadingMore || hotTerms.length === 0 || isRequestInProgress.current) return;
  
  // 延迟执行加载
  loadMoreTimeoutRef.current = setTimeout(() => {
    addToRequestQueue(loadMoreRequest);
  }, 300);
}, [dependencies]);
```

### 4. FlatList性能优化
- **优化渲染参数**：设置合适的 `initialNumToRender`、`maxToRenderPerBatch`、`windowSize`
- **启用视图回收**：使用 `removeClippedSubviews`
- **批量更新**：设置 `updateCellsBatchingPeriod`

```typescript
<FlatList
  initialNumToRender={6}
  maxToRenderPerBatch={8}
  windowSize={10}
  removeClippedSubviews={Platform.OS !== "web"}
  updateCellsBatchingPeriod={50}
  extraData={products.length}
/>
```

### 5. 内存管理
- **状态重置函数**：清理旧数据和重置状态
- **定时器清理**：组件卸载时清理所有定时器
- **引用清理**：重置时清理所有ref

```typescript
const resetProductState = useCallback(() => {
  setProducts([]);
  setCurrentPage(1);
  setHasMore(true);
  seenProductIds.current.clear();
  productUniqueId.current = 0;
}, []);
```

### 6. 性能监控
- **渲染次数统计**：监控组件重新渲染频率
- **渲染时间间隔**：测量渲染性能

```typescript
useEffect(() => {
  renderCount.current++;
  const now = Date.now();
  const timeSinceLastRender = now - lastRenderTime.current;
  lastRenderTime.current = now;
  
  if (__DEV__) {
    console.log(`HomeScreen render #${renderCount.current}, time since last: ${timeSinceLastRender}ms`);
  }
});
```

## 预期效果
1. **消除key重复警告**：每个列表项都有唯一的key
2. **减少重新渲染**：只有必要时才重新渲染组件
3. **提升滚动性能**：优化的FlatList配置提供更流畅的滚动体验
4. **避免重复请求**：防抖和队列机制确保请求的合理性
5. **更好的用户体验**：加载状态更清晰，响应更及时

## 注意事项
1. 在开发环境下会有性能监控日志，生产环境会自动关闭
2. 防抖时间设置为300ms，可根据实际需要调整
3. 产品去重基于 `offer_id` 和 `min_price` 的组合
4. 建议定期清理缓存，避免内存泄漏 