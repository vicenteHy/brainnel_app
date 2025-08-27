import { useRef, useCallback } from 'react';
import { payApi } from '../../../../services/api/payApi';

export type PaymentType = 'order' | 'recharge';
export type PaymentMethod = 'wave' | 'mobile_money' | 'paypal' | 'bank_card';
export type PaymentStatus = 'pending' | 'checking' | 'completed' | 'failed';

interface UsePaymentPollingProps {
  paymentType: PaymentType;
  paymentId: string;
  method: PaymentMethod;
  onSuccess: (response: any) => void;
  onTimeout: () => void;
}

export const usePaymentPolling = ({
  paymentType,
  paymentId,
  method,
  onSuccess,
  onTimeout
}: UsePaymentPollingProps) => {
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 根据支付类型选择正确的API方法
  const getPaymentStatus = useCallback(async () => {
    console.log(`=== 轮询${paymentType === 'order' ? '支付' : '充值'}状态开始 ===`);
    console.log("支付方式:", method);
    console.log(`${paymentType === 'order' ? '订单' : '充值'}ID:`, paymentId);

    try {
      // 使用新的统一 API
      const response = await payApi.getPaymentStatus(paymentType, paymentId);

      console.log(`=== ${method}${paymentType === 'order' ? '支付' : '充值'}API响应 ===`);
      console.log("完整响应:", JSON.stringify(response, null, 2));
      console.log("支付状态 res.status:", response.status);
      console.log("========================");

      if (response.status === 1) {
        console.log(`✅ ${method}${paymentType === 'order' ? '支付' : '充值'}成功！`);
        console.log(`is_local 字段值: ${response.is_local}`);
        onSuccess(response);
        stopPolling();
      } else {
        console.log(`⏳ ${method}${paymentType === 'order' ? '支付' : '充值'}尚未完成，继续轮询...`);
      }
    } catch (error) {
      console.error(`❌ ${method}${paymentType === 'order' ? '支付' : '充值'}轮询API调用失败:`, error);
    }
  }, [paymentType, paymentId, method, onSuccess]);

  // 开始轮询
  const startPolling = useCallback(() => {
    console.log(`🚀 开始轮询${paymentType === 'order' ? '支付' : '充值'}状态`);
    console.log("支付方式:", method);
    console.log(`${paymentType === 'order' ? '订单' : '充值'}ID:`, paymentId);

    // 立即执行一次
    console.log("立即执行第一次轮询...");
    getPaymentStatus();

    // 设置轮询，每3秒执行一次
    if (!pollIntervalRef.current) {
      console.log("设置轮询定时器：每3秒执行一次");
      pollIntervalRef.current = setInterval(getPaymentStatus, 3000);
    }

    // 设置超时时间：所有支付方式都是 10秒
    const timeoutDuration = 10000;
    if (!timeoutRef.current) {
      console.log(`设置超时定时器：${timeoutDuration/1000}秒后停止轮询`);
      timeoutRef.current = setTimeout(() => {
        console.log("⏰ 支付轮询超时！");
        stopPolling();
        onTimeout();
      }, timeoutDuration);
    }
  }, [paymentType, paymentId, method, getPaymentStatus, onTimeout]);

  // 停止轮询
  const stopPolling = useCallback(() => {
    console.log(`🛑 停止${paymentType === 'order' ? '支付' : '充值'}状态轮询`);

    if (pollIntervalRef.current) {
      console.log("清除轮询定时器");
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (timeoutRef.current) {
      console.log("清除超时定时器");
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    console.log("轮询停止完成");
  }, [paymentType]);

  return {
    startPolling,
    stopPolling,
    checkPaymentStatus: getPaymentStatus
  };
};