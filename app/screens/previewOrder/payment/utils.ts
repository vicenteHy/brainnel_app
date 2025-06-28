import { ConvertedAmount } from "./types";
import { payApi } from "../../../services/api/payApi";

/**
 * 判断是否是需要转换为USD的支付方式
 */
export const isUSDPayment = (paymentMethod: string): boolean => {
  return paymentMethod === "paypal" || paymentMethod === "bank_card";
};

/**
 * 判断是否是Wave支付
 */
export const isWavePayment = (paymentMethod: string): boolean => {
  return paymentMethod === "wave";
};

/**
 * 判断是否是Mobile Money支付
 */
export const isMobileMoneyPayment = (paymentMethod: string): boolean => {
  return (
    paymentMethod === "mobile_money" ||
    paymentMethod?.includes("mobile_money") ||
    paymentMethod?.includes("Brainnel Pay")
  );
};

/**
 * 判断是否是余额支付
 */
export const isBalancePayment = (paymentMethod: string): boolean => {
  return (
    paymentMethod === "balance" ||
    paymentMethod === "soldes" ||
    paymentMethod?.toLowerCase().includes("balance") ||
    paymentMethod?.toLowerCase().includes("soldes")
  );
};

/**
 * 判断是否需要货币转换的支付方式
 */
export const isConvertiblePayment = (paymentMethod: string): boolean => {
  return (
    isUSDPayment(paymentMethod) ||
    isWavePayment(paymentMethod) ||
    isMobileMoneyPayment(paymentMethod) ||
    isBalancePayment(paymentMethod)
  );
};

/**
 * 获取支付方式对应的目标货币
 */
export const getTargetCurrency = (
  paymentMethod: string,
  selectedCurrency: string,
  userLocalCurrency: string,
  userCurrency: string
): string => {
  if (isUSDPayment(paymentMethod)) {
    return selectedCurrency;
  }
  if (isWavePayment(paymentMethod)) {
    return userLocalCurrency;
  }
  if (isMobileMoneyPayment(paymentMethod) || isBalancePayment(paymentMethod)) {
    return userLocalCurrency || userCurrency;
  }
  return userCurrency;
};

/**
 * 从转换金额列表中获取指定key的转换金额
 */
export const getConvertedAmountByKey = (
  convertedAmount: ConvertedAmount[],
  key: string
): number => {
  return convertedAmount.find((item) => item.item_key === key)?.converted_amount || 0;
};

/**
 * 计算转换后的总金额（考虑COD情况）
 */
export const calculateConvertedTotal = (
  convertedAmount: ConvertedAmount[],
  isCOD: number
): number => {
  if (isCOD === 1) {
    // COD情况下不包含国际运费
    const totalConverted = convertedAmount.reduce((acc, item) => acc + item.converted_amount, 0);
    const shippingFeeConverted = getConvertedAmountByKey(convertedAmount, "shipping_fee");
    return totalConverted - shippingFeeConverted;
  }
  return convertedAmount.reduce((acc, item) => acc + item.converted_amount, 0);
};

/**
 * 统一的货币转换函数
 */
export const performCurrencyConversion = async (
  fromCurrency: string,
  toCurrency: string,
  amounts: {
    total_amount: number;
    domestic_shipping_fee: number;
    shipping_fee: number;
  }
): Promise<ConvertedAmount[]> => {
  try {
    const data = {
      from_currency: fromCurrency,
      to_currency: toCurrency,
      amounts: amounts,
    };

    const response = await payApi.convertCurrency(data);
    return response.converted_amounts_list;
  } catch (error) {
    throw error;
  }
};

/**
 * 判断是否需要显示转换后的金额
 */
export const shouldShowConvertedAmount = (
  paymentMethod: string,
  convertedAmount: ConvertedAmount[]
): boolean => {

  
  if (isUSDPayment(paymentMethod) || isWavePayment(paymentMethod)) {
    return true;
  }
  if ((isMobileMoneyPayment(paymentMethod) || isBalancePayment(paymentMethod)) && convertedAmount.length > 0) {
    return true;
  }
  return false;
};

/**
 * 获取显示金额（原始金额或转换后金额）
 */
export const getDisplayAmount = (
  paymentMethod: string,
  convertedAmount: ConvertedAmount[],
  originalAmount: number,
  amountKey?: string
): number => {
  if (shouldShowConvertedAmount(paymentMethod, convertedAmount)) {
    if (amountKey) {
      return getConvertedAmountByKey(convertedAmount, amountKey);
    }
    return calculateConvertedTotal(convertedAmount, 0);
  }
  return originalAmount;
};