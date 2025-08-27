import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { payApi } from '../../../../services/api/payApi';
import { PaymentType, PaymentMethod } from './usePaymentPolling';
import { PAYMENT_SUCCESS_EVENT, PAYMENT_FAILURE_EVENT } from '../../../../constants/events';

interface UseDeepLinkHandlerProps {
  paymentType: PaymentType;
  paymentId: string;
  method: PaymentMethod;
  is_local?: number;
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
  is_local,
  onSuccess,
  onError,
  onCancel,
  stopPolling,
  setPaymentStatus
}: UseDeepLinkHandlerProps) => {
  useEffect(() => {
    // 监听全局支付成功事件
    const handlePaymentSuccessEvent = async (data: any) => {
      console.log('[useDeepLinkHandler] 收到支付成功事件:', data);
      
      // 检查是否有PayPal回调参数
      if (data.paymentId && data.PayerID && method === "paypal") {
        console.log('[useDeepLinkHandler] 处理PayPal支付回调');
        stopPolling();
        setPaymentStatus('checking');
        
        try {
          const res = await payApi.paySuccessCallback(
            data.paymentId as string,
            data.PayerID as string
          );
          
          console.log('PayPal回调验证结果:', res);
          
          // 检查响应是否是HTML（错误响应）
          if (typeof res === 'string' || !res || !res.hasOwnProperty('status')) {
            console.log('PayPal回调返回非JSON响应，尝试查询支付状态...');
            // 如果回调验证失败，尝试直接查询支付状态
            try {
              const statusRes = await payApi.getPaymentStatus(paymentType, paymentId);
              console.log('支付状态查询结果:', statusRes);
              if (statusRes.status === 1) {
                setPaymentStatus('completed');
                // 如果是本地订单，不在深度链接中处理跳转，让轮询处理
                if (is_local === 1 && paymentType === 'order') {
                  console.log('[useDeepLinkHandler] 本地订单支付成功，不处理跳转，由轮询处理');
                  return;
                }
                const successData = paymentType === 'recharge' 
                  ? { ...statusRes, isRecharge: true }
                  : { ...statusRes, is_local: is_local !== undefined ? is_local : statusRes.is_local };
                onSuccess(successData);
              } else {
                setPaymentStatus('failed');
                onError({
                  msg: `${paymentType}.status.payment_not_completed`,
                  [`${paymentType}_id`]: paymentId,
                  is_local: is_local || 0,
                  ...(paymentType === 'recharge' && { isRecharge: true })
                });
              }
            } catch (statusError) {
              console.error('支付状态查询失败:', statusError);
              setPaymentStatus('failed');
              onError({
                msg: `${paymentType}.status.verification_failed`,
                [`${paymentType}_id`]: paymentId,
                is_local: is_local || 0,
                ...(paymentType === 'recharge' && { isRecharge: true })
              });
            }
          } else if (res.status === 1) {
            setPaymentStatus('completed');
            // 如果是本地订单，不在深度链接中处理跳转，让轮询处理
            if (is_local === 1 && paymentType === 'order') {
              console.log('[useDeepLinkHandler] 本地订单PayPal支付成功，不处理跳转，由轮询处理');
              return;
            }
            const successData = paymentType === 'recharge' 
              ? { ...res, isRecharge: true }
              : { ...res, is_local: is_local !== undefined ? is_local : res.is_local };
            onSuccess(successData);
          } else {
            setPaymentStatus('failed');
            onError({
              msg: res.msg || `${paymentType}.status.verification_failed`,
              [`${paymentType}_id`]: paymentId,
              is_local: is_local || 0,
              ...(paymentType === 'recharge' && { isRecharge: true })
            });
          }
        } catch (error) {
          console.error('PayPal回调验证错误:', error);
          setPaymentStatus('failed');
          onError({
            msg: `${paymentType}.status.verification_failed_contact_support`,
            [`${paymentType}_id`]: paymentId,
            is_local: is_local || 0,
            ...(paymentType === 'recharge' && { isRecharge: true })
          });
        }
      }
    };
    
    // 监听支付失败事件
    const handlePaymentFailureEvent = (data: any) => {
      console.log('[useDeepLinkHandler] 收到支付失败事件:', data);
      stopPolling();
      setPaymentStatus('failed');
      onCancel();
    };
    
    // 注册全局事件监听器
    
    if ((global as any).EventEmitter) {
      console.log('[useDeepLinkHandler] 注册全局事件监听器');
      console.log('[useDeepLinkHandler] PAYMENT_SUCCESS_EVENT:', PAYMENT_SUCCESS_EVENT);
      console.log('[useDeepLinkHandler] PAYMENT_FAILURE_EVENT:', PAYMENT_FAILURE_EVENT);
      (global as any).EventEmitter.on(PAYMENT_SUCCESS_EVENT, handlePaymentSuccessEvent);
      (global as any).EventEmitter.on(PAYMENT_FAILURE_EVENT, handlePaymentFailureEvent);
    } else {
      console.warn('[useDeepLinkHandler] 全局 EventEmitter 不存在！');
    }
    
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

      // 处理 Wave 支付回调 URL
      if (url.includes("/api/payment/wave/callback/success") || url.includes("/api/payment/wave/callback/failed")) {
        console.log("检测到Wave支付回调深度链接");
        stopPolling();
        
        // 解析URL获取参数
        const urlObj = new URL(url);
        const orderId = urlObj.searchParams.get('order_id') || urlObj.searchParams.get('recharge_id');
        const isSuccess = url.includes('/success');
        
        if (isSuccess) {
          setPaymentStatus('checking');
          console.log(`Wave${paymentType === 'order' ? '支付' : '充值'}成功回调，ID: ${orderId}`);
          
          try {
            // 验证支付状态
            const res = await payApi.getPaymentStatus(paymentType, paymentId);
            console.log(`Wave${paymentType === 'order' ? '支付' : '充值'}状态验证结果:`, res);
            
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
            console.error(`Wave${paymentType === 'order' ? '支付' : '充值'}状态验证错误:`, error);
            setPaymentStatus('failed');
            onError({
              msg: `${paymentType}.status.wave_verification_failed`,
              [`${paymentType}_id`]: paymentId,
              ...(paymentType === 'recharge' && { isRecharge: true })
            });
          }
        } else {
          // Wave支付失败
          console.log("Wave支付失败回调");
          setPaymentStatus('failed');
          onError({
            msg: `${paymentType}.status.wave_payment_failed`,
            [`${paymentType}_id`]: paymentId,
            ...(paymentType === 'recharge' && { isRecharge: true })
          });
        }
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
            
            // 检查响应是否是HTML（错误响应）
            if (typeof res === 'string' || !res || !res.hasOwnProperty('status')) {
              console.log(`${method === "paypal" ? "PayPal" : "Bank Card"}回调返回非JSON响应，尝试查询支付状态...`);
              // 如果回调验证失败，尝试直接查询支付状态
              try {
                const statusRes = await payApi.getPaymentStatus(paymentType, paymentId);
                console.log('支付状态查询结果:', statusRes);
                if (statusRes.status === 1) {
                  setPaymentStatus('completed');
                  // 如果是本地订单，不在深度链接中处理跳转，让轮询处理
                  if (is_local === 1 && paymentType === 'order') {
                    console.log('[useDeepLinkHandler] 本地订单支付成功，不处理跳转，由轮询处理');
                    return;
                  }
                  const successData = paymentType === 'recharge' 
                    ? { ...statusRes, isRecharge: true }
                    : { ...statusRes, is_local: is_local !== undefined ? is_local : statusRes.is_local };
                  onSuccess(successData);
                } else {
                  setPaymentStatus('failed');
                  onError({
                    msg: `${paymentType}.status.payment_not_completed`,
                    [`${paymentType}_id`]: paymentId,
                    is_local: is_local || 0,
                    ...(paymentType === 'recharge' && { isRecharge: true })
                  });
                }
              } catch (statusError) {
                console.error('支付状态查询失败:', statusError);
                setPaymentStatus('failed');
                onError({
                  msg: `${paymentType}.status.verification_failed`,
                  [`${paymentType}_id`]: paymentId,
                  is_local: is_local || 0,
                  ...(paymentType === 'recharge' && { isRecharge: true })
                });
              }
            } else if (res.status === 1) {
              setPaymentStatus('completed');
              // 如果是本地订单，不在深度链接中处理跳转，让轮询处理
              if (is_local === 1 && paymentType === 'order') {
                console.log('[useDeepLinkHandler] 本地订单支付成功，不处理跳转，由轮询处理');
                return;
              }
              const successData = paymentType === 'recharge' 
                ? { ...res, isRecharge: true }
                : { ...res, is_local: is_local !== undefined ? is_local : res.is_local }; // 优先使用路由传入的is_local
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
      // 清理全局事件监听器
      if ((global as any).EventEmitter) {
        (global as any).EventEmitter.off(PAYMENT_SUCCESS_EVENT, handlePaymentSuccessEvent);
        (global as any).EventEmitter.off(PAYMENT_FAILURE_EVENT, handlePaymentFailureEvent);
      }
    };
  }, [paymentType, paymentId, method, is_local, onSuccess, onError, onCancel, stopPolling, setPaymentStatus]);
};