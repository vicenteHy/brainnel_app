# 二级分类图片配置指南

## 目录结构
```
assets/
  categories/          # 建议创建此目录存放分类图片
    category1.png
    category2.png
    beauty.png
    clothing.png
    electronics.png
    ...
```

## 配置步骤

### 1. 添加图片文件
将分类图片放在 `assets/categories/` 目录下（或其他你喜欢的位置）

### 2. 更新图片映射
编辑 `app/utils/categoryImages.ts` 文件：

```typescript
const categoryImages = {
  // 按分类ID映射（推荐方式）
  byId: {
    1: require('../../assets/categories/beauty.png'),
    2: require('../../assets/categories/clothing.png'),
    3: require('../../assets/categories/electronics.png'),
    66: require('../../assets/categories/beauty.png'), // 根据你的实际分类ID
    // ... 添加更多分类
  },
  
  // 按图片名称映射（备选方式）
  byName: {
    'beauty': require('../../assets/categories/beauty.png'),
    'clothing': require('../../assets/categories/clothing.png'),
    'electronics': require('../../assets/categories/electronics.png'),
    // ... 添加更多名称映射
  },
  
  // 默认图片（必须设置）
  default: require('../../assets/categories/default.png'),
};
```

### 3. 图片要求
- **格式**: PNG、JPG均可，推荐PNG
- **尺寸**: 建议至少 80x80px（因为显示时是40x40，高分辨率屏幕需要2x图片）
- **形状**: 最好是正方形，会被裁剪为圆形显示
- **命名**: 建议使用有意义的名称，如 `beauty.png`、`electronics.png` 等

### 4. 映射优先级
系统会按以下优先级查找图片：
1. 按 `image_name` 在 `byName` 中查找
2. 按 `category_id` 在 `byId` 中查找  
3. 使用 `default` 默认图片
4. 如果都没有，显示默认图标

## 示例配置

假设你的二级分类数据是这样的：
```json
{
  "category_id": 66,
  "name": "美容护肤",
  "image_name": "beauty"
}
```

你可以选择以下任一方式配置：

**方式1：按ID映射**
```typescript
byId: {
  66: require('../../assets/categories/beauty.png'),
}
```

**方式2：按名称映射**
```typescript
byName: {
  'beauty': require('../../assets/categories/beauty.png'),
}
```

## 性能优势

使用本地打包图片的优势：
- ✅ **同步加载**：无需等待网络请求
- ✅ **离线可用**：不依赖网络连接
- ✅ **性能最佳**：加载速度最快
- ✅ **体验稳定**：不会出现加载失败的情况
- ✅ **缓存优化**：系统自动优化图片缓存

## 更新图片

当需要更新分类图片时：
1. 替换 `assets/categories/` 目录下的图片文件
2. 重新构建应用（`npm run build` 或重启开发服务器）
3. 新图片会自动生效

注意：如果只是修改 `categoryImages.ts` 的映射关系，热重载即可生效。