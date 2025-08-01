# 如何关闭 React Native 调试工具栏

## 问题描述
React Native 在开发模式下会显示一个底部调试工具栏，显示 "Nothing is inspected"、"Inspect"、"Perf"、"Network"、"Touchables" 等选项。

## 解决方案

### 方法 1：手动关闭（临时）
1. **iOS 模拟器**：按 `Cmd + D` 打开开发者菜单
2. **Android 模拟器**：按 `Cmd + M` (Mac) 或 `Ctrl + M` (Windows/Linux)
3. **真机**：摇动设备
4. 在菜单中选择 "Hide Inspector" 或 "Toggle Element Inspector"

### 方法 2：通过代码配置（推荐）

已经在项目中实现了自动禁用功能，通过修改配置文件即可控制：

1. 编辑 `/app/config/devToolsConfig.ts` 文件：

```typescript
export const devToolsConfig = {
  // 是否禁用 React Native Inspector（底部调试工具栏）
  disableInspector: true,  // 设为 true 禁用底部工具栏
  
  // 是否禁用摇动手势显示开发者菜单
  disableShakeGesture: true,  // 设为 true 禁用摇动手势
  
  // 是否显示自定义的调试覆盖层（GlobalDebugOverlay）
  showCustomDebugOverlay: false,  // 设为 false 隐藏自定义调试层
  
  // 是否禁用热重载
  disableHotReload: false,
  
  // 是否禁用实时重载
  disableLiveReload: false,
  
  // 是否在启动时自动隐藏 Inspector
  autoHideInspectorOnStart: true,  // 设为 true 自动隐藏
};
```

2. 重启应用后配置会自动生效

### 方法 3：完全禁用开发者菜单

如果需要完全禁用所有开发工具，包括摇动手势，可以将以下配置都设为 true：

```typescript
export const devToolsConfig = {
  disableInspector: true,
  disableShakeGesture: true,
  showCustomDebugOverlay: false,
  disableHotReload: true,
  disableLiveReload: true,
  autoHideInspectorOnStart: true,
};
```

## 注意事项

1. 这些设置只在开发模式（`__DEV__`）下生效
2. 生产环境构建时，所有调试工具会自动被移除
3. 如果需要临时启用调试工具，可以修改配置文件并重启应用
4. 部分功能可能需要重新构建应用才能完全生效

## 相关文件

- `/app/config/devToolsConfig.ts` - 调试工具配置
- `/app/utils/disableDevTools.ts` - 禁用调试工具的实现
- `/App.tsx` - 应用启动时调用禁用函数