# Payment API 迁移指南

## 概述
我们已经统一了订单支付和充值支付的 API 接口，使用一个通用的 `getPaymentStatus` 方法替代了之前分散的方法。

## API 变更

### 新的统一接口
```typescript
// 新的统一接口
payApi.getPaymentStatus(paymentType: 'order' | 'recharge', paymentId: string)
```

### 废弃的接口
以下接口已被标记为废弃（deprecated），但仍保持向后兼容：

1. `payApi.wavePay(orderId)` → `payApi.getPaymentStatus('order', orderId)`
2. `payApi.rechargePaymentStatus(rechargeId)` → `payApi.getPaymentStatus('recharge', rechargeId)`
3. `payApi.checkPaymentStatus(orderId)` → `payApi.getPaymentStatus('order', orderId)`

## 响应格式

### 新的统一响应格式
```typescript
interface PaymentStatusResponse {
  success: boolean;
  id: string | number;          // 统一的 ID 字段
  status: number;               // 0: unpaid, 1: paid, 2: processing, 3: failed
  msg?: string;                 // 错误信息
  payment_type?: 'order' | 'recharge';  // 支付类型
  
  // 向后兼容字段
  order_id?: number;            // 仅在订单支付时存在
  recharge_id?: string;         // 仅在充值支付时存在
}
```

### 状态码说明
- `0`: 未支付 (unpaid)
- `1`: 已支付 (paid)
- `2`: 处理中 (processing) - 新增状态
- `3`: 失败 (failed) - 新增状态

## 迁移步骤

### 1. 更新 API 调用
```typescript
// 旧代码 - 订单支付
const response = await payApi.wavePay(orderId);

// 新代码
const response = await payApi.getPaymentStatus('order', orderId);
```

```typescript
// 旧代码 - 充值支付
const response = await payApi.rechargePaymentStatus(rechargeId);

// 新代码
const response = await payApi.getPaymentStatus('recharge', rechargeId);
```

### 2. 处理响应
新的响应格式使用统一的 `id` 字段，但也保留了原有的 `order_id` 和 `recharge_id` 字段以保持向后兼容。

```typescript
// 处理统一响应
const handlePaymentResponse = (response: PaymentStatusResponse) => {
  const paymentId = response.id;  // 使用统一的 id 字段
  const paymentType = response.payment_type;
  
  if (response.status === 1) {
    console.log(`${paymentType} 支付成功，ID: ${paymentId}`);
  }
};
```

## 优势

1. **统一接口**：减少代码重复，提高可维护性
2. **类型安全**：使用 TypeScript 枚举确保类型正确
3. **向后兼容**：旧接口仍然可用，便于渐进式迁移
4. **扩展性**：轻松添加新的支付类型（如：预付款、分期付款等）
5. **更清晰的命名**：`getPaymentStatus` 比 `wavePay` 更能表达实际功能

## 注意事项

1. 废弃的方法会在控制台输出警告信息
2. 建议尽快迁移到新接口，旧接口可能在未来版本中移除
3. 新接口的错误处理保持不变，仍然会抛出相同的异常
4. **重要**：当前后端的充值支付状态查询也使用 `/api/orders/{id}/payment-status/` 端点，而不是 `/api/recharge/{id}/payment-status/`。我们的统一接口已经适配了这个情况，待后端统一后再更新

## 后续计划

1. 在下一个主版本中移除废弃的接口
2. 添加更多支付状态（如：部分支付、退款中等）
3. 支持批量查询支付状态
4. 添加 WebSocket 实时支付状态推送