# 用户设置检查功能说明

## 功能概述
添加了统一的用户设置检查逻辑，确保用户登录后拥有正确的设置信息。

## 修改的文件

### 1. 新增工具文件
- `app/utils/userSettingsUtils.ts` - 包含统一的用户设置检查和创建逻辑

### 2. 修改的登录相关文件
- `App.tsx` - 应用启动时检查用户设置
- `app/screens/loginList/index.tsx` - WhatsApp登录
- `app/screens/login/GoogleLogin.tsx` - Google登录  
- `app/screens/login/PhoneLoginScreen.tsx` - 手机登录
- `app/screens/loginList/EmailOtpScreen.tsx` - 邮箱登录验证

## 功能说明

### checkAndCreateUserSettings()
- 检查用户设置是否存在
- 如果不存在（404错误），会自动创建默认设置
- 使用本地保存的国家代码或默认科特迪瓦(225)
- 设置会自动保存到 Zustand store 中

### handleLoginSettingsCheck()
- 处理登录后的设置检查
- 对于首次登录：创建设置并同步本地语言
- 对于非首次登录：检查设置是否存在，不存在则创建

## 日志输出
所有功能都有详细的控制台日志输出，便于调试：
- 🔍 开始检查
- ✅ 成功操作  
- ❌ 失败操作
- 📝 创建设置
- 📍 国家信息
- 🌍 API调用

## 测试方法
1. 用任意方式登录应用
2. 查看控制台日志，应该看到设置检查的相关输出
3. 检查用户是否拥有正确的货币设置（应该是FCFA而不是CNY）

## 解决的问题
- 用户登录后可能缺少设置导致货币显示错误
- 确保所有登录方式都有统一的设置检查逻辑
- 应用启动时也会检查登录用户的设置完整性