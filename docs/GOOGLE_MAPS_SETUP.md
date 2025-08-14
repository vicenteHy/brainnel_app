# Google Maps API 配置指南

## 环境变量配置

### 1. 复制环境变量示例文件
```bash
cp .env.example .env.local
```

### 2. 编辑 `.env.local` 文件
```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=你的API密钥
```

## Google Cloud Console 安全设置

### 1. 创建或选择 API 密钥
访问：https://console.cloud.google.com/apis/credentials

### 2. 设置 API 限制
- 点击你的 API 密钥
- 在 "API 限制" 部分，选择 "限制密钥"
- 只勾选：**Maps JavaScript API**
- 保存

### 3. 设置应用限制

#### Android 应用
- 选择 "Android 应用"
- 添加包名：`com.brainnel.app`
- 添加 SHA-1 证书指纹（从你的签名证书获取）

#### iOS 应用
- 选择 "iOS 应用"
- 添加 Bundle ID：`uni.UNIC87CC93`

### 4. 设置配额限制
- 访问：https://console.cloud.google.com/apis/api/maps-javascript-backend.googleapis.com/quotas
- 设置每日请求限制
- 启用配额监控告警

## 不同环境的配置

### 开发环境
```bash
# .env.local (不提交到 Git)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=开发环境密钥
```

### 生产环境
```bash
# 在 CI/CD 中设置环境变量
# 或在 EAS Build 中配置 secrets
eas secret:create --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value 生产环境密钥
```

## 安全最佳实践

1. **不同环境使用不同密钥**
   - 开发密钥：限制为开发者 IP
   - 生产密钥：限制为应用包名/Bundle ID

2. **定期轮换密钥**
   - 每 3-6 个月更换一次
   - 监控异常使用

3. **监控和告警**
   - 设置配额告警
   - 定期检查 API 使用报告

## 故障排除

### 地图显示"配置错误"
- 检查 `.env.local` 文件是否存在
- 确认环境变量名称正确：`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- 重启开发服务器：`npm start --clear`

### API 密钥无效
- 检查 Google Cloud Console 中密钥是否启用
- 确认 Maps JavaScript API 已启用
- 检查应用限制设置是否正确

### 超出配额
- 检查 Google Cloud Console 配额使用情况
- 考虑升级计费方案或优化使用