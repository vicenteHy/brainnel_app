# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

这是一个使用 React Native + Expo 开发的跨境电商应用，主要面向西非市场。

## 常用命令

### 开发环境
```bash
# 启动开发服务器
npm start

# 在 iOS 模拟器运行
npm run ios

# 在 Android 模拟器运行
npm run android
```

### 构建发布
```bash
# Android APK 预览版
npm run build:android:preview

# Android 生产版本
npm run build:android:production

# iOS 构建
npm run build:ios

# 所有平台构建
npm run build:all
```

## 架构概览

### 技术栈
- **框架**: React Native 0.79.3 + Expo 53.0.11
- **语言**: TypeScript 5.3.3
- **状态管理**: Zustand 5.0.4
- **导航**: React Navigation v6
- **国际化**: i18next (支持英语和法语)
- **UI**: react-native-paper + 自定义组件

### 目录结构
```
/app
  /components    # 可复用组件
  /screens       # 页面组件
  /navigation    # 导航配置
  /services      # API 服务和业务逻辑
  /store         # Zustand 状态管理
  /utils         # 工具函数
  /hooks         # 自定义 Hooks
  /constants     # 常量定义
  /locales       # 国际化资源文件
```

### 关键架构决策

1. **设计适配**: 使用 `babel-plugin-react-native-pxtodp` 插件，设计稿基准为 430x932，自动将 px 转换为 dp

2. **API 服务**: 所有 API 调用集中在 `/app/services` 目录，包括：
   - auth.js - 认证相关
   - product.js - 商品相关
   - order.js - 订单相关
   - payment.js - 支付相关

3. **状态管理**: 使用 Zustand，主要 store 包括：
   - authStore - 用户认证状态
   - cartStore - 购物车状态
   - userStore - 用户信息

4. **导航架构**: 基于 React Navigation 的嵌套导航结构
   - RootNavigator - 根导航器
   - TabNavigator - 底部标签导航
   - 各功能模块的 Stack Navigator

5. **支付集成**: 
   - PayPal SDK 集成
   - 支持深度链接回调
   - Scheme: `com.brainnel.app`, `myapp`

## 开发规范

1. **代码风格**
   - 每次修改完代码不必帮我运行测试，我会自行测试
   - 每次都要 think hard，step by step 确保一次修改对代码

2. **项目特定规则** (来自 .cursor/rules)
   - 始终使用中文交流
   - 不要编写 MD 文件（除了必要的项目文档）
   - 未经允许不要编写测试代码
   - 编辑翻译文本时考虑"电商和西非风格"
   - 遇到困惑时不要询问更多细节，直接实现

3. **组件开发**
   - 优先使用现有组件库
   - 新组件放在 `/app/components` 目录
   - 组件命名使用 PascalCase
   - 样式使用 StyleSheet.create()

4. **API 调用**
   - 使用 services 目录下的封装函数
   - 错误处理要考虑网络不稳定情况
   - 支持离线缓存策略

## 重要配置

- **Bundle ID (iOS)**: uni.UNIC87CC93
- **Package Name (Android)**: com.brainnel.app
- **EAS Project ID**: 4b8bd660-e8b5-48ad-ac8a-a05607f96eb6
- **设计稿尺寸**: 430x932
- **支持的登录方式**: Google、Apple、邮箱、WhatsApp