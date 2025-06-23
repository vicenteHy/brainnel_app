import { PaymentType } from './hooks/usePaymentPolling';

export interface PaymentConfig {
  translationPrefix: string;
  idFieldName: string;
  successRoute: string;
  errorRoute: string;
}

export const paymentConfigs: Record<PaymentType, PaymentConfig> = {
  order: {
    translationPrefix: 'payment.status',
    idFieldName: 'order_id',
    successRoute: 'PaymentSuccessScreen',
    errorRoute: 'PayError'
  },
  recharge: {
    translationPrefix: 'recharge.status',
    idFieldName: 'recharge_id',
    successRoute: 'PaymentSuccessScreen',
    errorRoute: 'PayError'
  }
};

export const getPaymentConfig = (type: PaymentType): PaymentConfig => {
  return paymentConfigs[type];
};