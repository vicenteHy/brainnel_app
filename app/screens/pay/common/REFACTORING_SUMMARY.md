# 支付功能重构总结

## 重构概述
成功将原本高度重复的 `Pay.tsx` 和 `RechargePay.tsx` 两个组件重构为使用统一的 `PaymentFlow` 组件。

## 重构成果

### 1. 代码减少
- 原始代码：每个文件约 900 行，总计约 1800 行
- 重构后：通用组件约 650 行 + 两个包装组件各 24 行 = 约 700 行
- **代码减少：约 61%**

### 2. 新增文件结构
```
app/screens/pay/common/
├── PaymentFlow.tsx          # 通用支付流程组件
├── paymentConfig.ts         # 支付配置文件
└── hooks/
    ├── index.ts            # 导出文件
    ├── usePaymentPolling.ts # 轮询逻辑Hook
    └── useDeepLinkHandler.ts # 深度链接处理Hook
```

### 3. 主要改进
- **代码复用**：所有支付逻辑集中在一处
- **易于维护**：修改一处即可影响所有支付流程
- **类型安全**：使用 TypeScript 类型确保代码安全
- **配置驱动**：通过配置处理订单和充值的差异
- **关注点分离**：业务逻辑分离到独立的 hooks

## 使用方式

### 订单支付 (Pay.tsx)
```typescript
<PaymentFlow
  paymentType="order"
  paymentId={order_id}
  payUrl={payUrl}
  method={method}
/>
```

### 充值支付 (RechargePay.tsx)
```typescript
<PaymentFlow
  paymentType="recharge"
  paymentId={recharge_id}
  payUrl={payUrl}
  method={method}
/>
```

## 注意事项

1. **翻译键**：确保 i18n 翻译文件中包含所有必要的键
   - 订单支付：`payment.status.*`
   - 充值支付：`recharge.status.*`

2. **API 兼容性**：保持了原有的 API 调用逻辑
   - 订单：使用 `payApi.wavePay()`
   - 充值：使用 `payApi.rechargePaymentStatus()`

3. **向后兼容**：所有导航参数和路由名称保持不变

4. **备份文件**：
   - `Pay.tsx.original`
   - `RechargePay.tsx.original`

## 后续优化建议

1. 考虑将 PaymentFlow 组件进一步拆分为更小的子组件
2. 添加单元测试覆盖新的 hooks
3. 考虑使用状态管理库（如 Redux）管理支付状态
4. 添加错误边界处理异常情况