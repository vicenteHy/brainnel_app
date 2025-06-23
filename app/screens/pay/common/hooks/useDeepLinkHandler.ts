import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { payApi } from '../../../../services/api/payApi';
import { PaymentType, PaymentMethod } from './usePaymentPolling';

interface UseDeepLinkHandlerProps {
  paymentType: PaymentType;
  paymentId: string;
  method: PaymentMethod;
  onSuccess: (response: any) => void;
  onError: (error: any) => void;
  onCancel: () => void;
  stopPolling: () => void;
  setPaymentStatus: (status: 'pending' | 'checking' | 'completed' | 'failed') => void;
}

export const useDeepLinkHandler = ({
  paymentType,
  paymentId,
  method,
  onSuccess,
  onError,
  onCancel,
  stopPolling,
  setPaymentStatus
}: UseDeepLinkHandlerProps) => {
  useEffect(() => {
    const handleDeepLink = async ({ url }: { url: string }) => {
      console.log("收到深度链接:", url);

      // 处理 payment-polling 深度链接
      if (
        url.includes("com.brainnel.app://payment-polling") ||
        url.includes("myapp://payment-polling")
      ) {
        console.log("检测到支付轮询深度链接，保持在当前页面");
        // 不做任何跳转，保持在当前支付页面
        return;
      }

      if (
        url.includes("com.brainnel.app://payment-success") ||
        url.includes("myapp://payment-success")
      ) {
        console.log("检测到支付成功深度链接");
        stopPolling();
        setPaymentStatus('checking');

        const parsed = Linking.parse(url);
        const params = parsed.queryParams || {};

        // 检查是否有PayPal或Bank Card回调参数
        if (params.paymentId && params.PayerID && (method === "paypal" || method === "bank_card")) {
          console.log(`调用${method === "paypal" ? "PayPal" : "Bank Card"}${paymentType === 'order' ? '支付' : '充值'}回调验证...`);

          try {
            const res = await payApi.paySuccessCallback(
              params.paymentId as string,
              params.PayerID as string
            );

            console.log(`${method === "paypal" ? "PayPal" : "Bank Card"}回调验证结果:`, res);
            if (res.status === 1) {
              setPaymentStatus('completed');
              const successData = paymentType === 'recharge' 
                ? { ...res, isRecharge: true }
                : res;
              onSuccess(successData);
            } else {
              setPaymentStatus('failed');
              onError({
                msg: res.msg || `${paymentType}.status.verification_failed`,
                [`${paymentType}_id`]: paymentId,
                ...(paymentType === 'recharge' && { isRecharge: true })
              });
            }
          } catch (error) {
            console.error(`${method === "paypal" ? "PayPal" : "Bank Card"}回调验证错误:`, error);
            setPaymentStatus('failed');
            onError({
              msg: `${paymentType}.status.verification_failed_contact_support`,
              [`${paymentType}_id`]: paymentId,
              ...(paymentType === 'recharge' && { isRecharge: true })
            });
          }
        } else if (method === "wave" || method === "mobile_money") {
          // Wave/Mobile Money支付重定向回调处理
          console.log(`检测到${method}${paymentType === 'order' ? '支付' : '充值'}成功深度链接`);
          console.log(`${method}回调参数:`, params);

          try {
            // 使用新的统一 API 验证支付状态
            const res = await payApi.getPaymentStatus(paymentType, paymentId);

            console.log(`${method}${paymentType === 'order' ? '支付' : '充值'}状态验证结果:`, res);
            if (res.status === 1) {
              setPaymentStatus('completed');
              const successData = paymentType === 'recharge' 
                ? { ...res, isRecharge: true }
                : res;
              onSuccess(successData);
            } else {
              setPaymentStatus('failed');
              onError({
                msg: `${paymentType}.status.wave_verification_failed`,
                [`${paymentType}_id`]: paymentId,
                ...(paymentType === 'recharge' && { isRecharge: true })
              });
            }
          } catch (error) {
            console.error(`${method}${paymentType === 'order' ? '支付' : '充值'}状态验证错误:`, error);
            setPaymentStatus('failed');
            onError({
              msg: `${paymentType}.status.wave_verification_failed`,
              [`${paymentType}_id`]: paymentId,
              ...(paymentType === 'recharge' && { isRecharge: true })
            });
          }
        } else {
          // 其他支付方式或缺少参数，直接跳转成功页面
          setPaymentStatus('completed');
          const successData = paymentType === 'recharge' 
            ? { ...params, isRecharge: true }
            : params;
          onSuccess(successData);
        }
      } else if (
        url.includes("com.brainnel.app://payment-cancel") ||
        url.includes("myapp://payment-cancel")
      ) {
        console.log("检测到支付取消深度链接");
        stopPolling();
        setPaymentStatus('failed');
        onCancel();
      }
    };

    // 添加深度链接事件监听器
    const subscription = Linking.addEventListener("url", handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [paymentType, paymentId, method, onSuccess, onError, onCancel, stopPolling, setPaymentStatus]);
};