import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { performCurrencyConversion, getConvertedAmountByKey } from '../previewOrder/payment/utils';
import fontSize from '../../utils/fontsizeUtils';
import userApi from '../../services/api/userApi';
import type { User } from '../../services/api/userApi';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { productCacheManager, type OrderData } from '../../services/local/productCache';
import type { LocalProduct } from '../../services/local/productList';
import { getFirstProductImage } from '../../services/local/productList';
import { orderApi, type CreateLocalOrderRequest } from '../../services/local/orderApi';
import { useAddressStore } from '../../store/address';
import type { RootStackParamList } from '../../navigation/types';

const { width: screenWidth } = Dimensions.get('window');

type LocalPaymentNav = NativeStackNavigationProp<Record<string, object | undefined>>;

const LocalPayment = ({ navigation }: { navigation: LocalPaymentNav }) => {
  const route = useRoute<RouteProp<RootStackParamList, 'LocalPayment'>>();
  
  // 自定义送货数据
  const customPickupData = route.params ? {
    district_id: route.params.district_id,
    full_name: route.params.full_name,
    phone: route.params.phone,
    whatsapp: route.params.whatsapp,
    receiver_address: route.params.address_description,
    latitude: route.params.latitude,
    longitude: route.params.longitude,
  } : null;
  const { defaultAddress, addresses, fetchDefaultAddress, fetchAddresses } = useAddressStore();
  const [selectedPayment, setSelectedPayment] = useState<string>('mobile_money');
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [userBalanceCurrency, setUserBalanceCurrency] = useState<string>('FCFA');
  const [orderProduct, setOrderProduct] = useState<LocalProduct | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  // 货币选择（分别为 paypal 与 bank_card 独立保存）
  const [paypalCurrency, setPaypalCurrency] = useState<'USD' | 'EUR'>('USD');
  const [bankCardCurrency, setBankCardCurrency] = useState<'USD' | 'EUR'>('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 参考 PaymentMethod.tsx 的汇率（FCFA -> 外币）
  const EXCHANGE_RATES = { USD: 580, EUR: 655.96 } as const; // 1 外币 = X FCFA

  const convertFcfa = (amountFcfa: number, target: 'USD' | 'EUR'): number => {
    const rate = EXCHANGE_RATES[target];
    if (!rate || amountFcfa <= 0) return 0;
    return Number((amountFcfa / rate).toFixed(2));
  };
  // 转换结果（使用系统已有转换工具）
  const [convertedAmounts, setConvertedAmounts] = useState<any[]>([]);
  const [, setIsConverting] = useState(false);

  const orderSummary = {
    productName: 'Une sélection de hauts de sport sport Form Flex butter s...',
    productDetails: 'Marine | hauUne sélection de hauts...',
    quantity: 2,
    originalPrice: 3889,
    discountedPrice: 2960,
    totalItems: 2,
    productTotal: 2960,
    discount: -296,
    finalTotal: 2664,
  };

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const resp = await userApi.getProfile();
        const data = (resp as unknown as User) as User;
        if (!isMounted) return;
        setUserBalance(typeof data.balance === 'number' ? data.balance : 0);
        setUserBalanceCurrency(data.balance_currency || data.currency || 'FCFA');
      } catch {
        if (!isMounted) return;
        setUserBalance(0);
        setUserBalanceCurrency('FCFA');
      }
    };
    fetchProfile();
    // 确保地址数据已加载
    (async () => {
      try {
        if (!defaultAddress) {
          await fetchDefaultAddress();
        }
        if (!addresses || addresses.length === 0) {
          await fetchAddresses();
        }
      } catch {}
    })();
    // 读取缓存的商品信息和订单数据
    const cached = productCacheManager.getLastProduct();
    const cachedOrderData = productCacheManager.getOrderData();
    if (cached) {
      setOrderProduct(cached);
    }
    if (cachedOrderData) {
      setOrderData(cachedOrderData);
    }
    return () => {
      isMounted = false;
    };
  }, [defaultAddress, addresses, fetchDefaultAddress, fetchAddresses]);

  // 价格计算（前5种方式均为10%折扣）
  const DISCOUNT_RATE = 0.1;
  // 仅前几种在线支付享受折扣，货到付款（cod）不打折
  const discountablePayments = new Set(['mobile_money', 'wave', 'paypal', 'bank_card', 'balance']);
  const isDiscountPayment = discountablePayments.has(selectedPayment);
  
  // 使用订单数据中的数量，如果没有则默认为1
  const orderQuantity = orderData?.quantity ?? 1;
  const baseUnitPrice = orderData?.product?.price ?? orderProduct?.price ?? orderSummary.productTotal;
  const discountAmount = isDiscountPayment ? Math.round(baseUnitPrice * DISCOUNT_RATE) : 0;
  const finalUnitPrice = baseUnitPrice - discountAmount;
  const isCardOrPaypal = selectedPayment === 'paypal' || selectedPayment === 'bank_card';
  const activeCurrency: 'USD' | 'EUR' = selectedPayment === 'paypal' ? paypalCurrency : bankCardCurrency;
  const displayCurrency = isCardOrPaypal ? activeCurrency : 'FCFA';
  // 优先使用接口换算结果，否则退回静态速率
  const finalUnitPriceDisplay = isCardOrPaypal
    ? ((Array.isArray(convertedAmounts) && getConvertedAmountByKey(convertedAmounts, 'total_amount')) || convertFcfa(finalUnitPrice, activeCurrency))
    : finalUnitPrice;
  const baseUnitPriceDisplay = isCardOrPaypal
    ? ((Array.isArray(convertedAmounts) && getConvertedAmountByKey(convertedAmounts, 'product_total')) || convertFcfa(baseUnitPrice, activeCurrency))
    : baseUnitPrice;
  const discountAmountDisplay = isCardOrPaypal
    ? ((Array.isArray(convertedAmounts) && getConvertedAmountByKey(convertedAmounts, 'discount_amount')) || convertFcfa(discountAmount, activeCurrency))
    : discountAmount;

  // 当选择 paypal/bank_card 或金额/货币变化时，调用换算工具
  useEffect(() => {
    if (!isCardOrPaypal) {
      setConvertedAmounts([]);
      return;
    }
    setIsConverting(true);
    performCurrencyConversion(
      'FCFA',
      activeCurrency,
      {
        total_amount: finalUnitPrice,
        product_total: baseUnitPrice,
        discount_amount: discountAmount,
      }
    ).then((res) => {
      setConvertedAmounts((Array.isArray(res) ? res : []) as any);
      setIsConverting(false);
    }).catch(() => {
      setIsConverting(false);
    });
  }, [isCardOrPaypal, activeCurrency, finalUnitPrice, baseUnitPrice, discountAmount]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mode de paiement</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 6行容器 */}
        <View style={styles.rowsContainer}>
          <View style={styles.separator} />
          <TouchableWithoutFeedback onPress={() => setSelectedPayment('mobile_money')}>
            <View style={styles.row}>
              <Image source={require('../../../assets/local/mobilepay.png')} style={styles.mobilePayIcon} />
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-10%</Text>
              </View>
              <View style={styles.spacer} />
              <View style={[styles.radioButton, selectedPayment === 'mobile_money' && styles.radioButtonSelected]}>
                {selectedPayment === 'mobile_money' && <View style={styles.radioButtonInner} />}
              </View>
            </View>
          </TouchableWithoutFeedback>
          <View style={styles.separator} />
          <TouchableWithoutFeedback onPress={() => setSelectedPayment('wave')}>
            <View style={styles.row}>
              <Image source={require('../../../assets/local/wavepay.png')} style={styles.waveIcon} />
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-10%</Text>
              </View>
              <View style={styles.spacer} />
              <View style={[styles.radioButton, selectedPayment === 'wave' && styles.radioButtonSelected]}>
                {selectedPayment === 'wave' && <View style={styles.radioButtonInner} />}
              </View>
            </View>
          </TouchableWithoutFeedback>
          <View style={styles.separator} />
          <TouchableWithoutFeedback onPress={() => setSelectedPayment('paypal')}>
            <View style={styles.row}>
              <Image source={require('../../../assets/local/paypalpay.png')} style={styles.paypalIcon} />
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-10%</Text>
              </View>
              <View style={styles.spacer} />
              <View style={[styles.radioButton, selectedPayment === 'paypal' && styles.radioButtonSelected]}>
                {selectedPayment === 'paypal' && <View style={styles.radioButtonInner} />}
              </View>
            </View>
          </TouchableWithoutFeedback>
          {/* PayPal 的币种选择（独立状态） */}
          {selectedPayment === 'paypal' && (
            <View style={styles.currencyRow}>
              <Text style={styles.currencyLabel}>Devise:</Text>
              <View style={styles.currencyOptions}>
                <TouchableOpacity
                  style={[styles.currencyChip, paypalCurrency === 'USD' && styles.currencyChipActive]}
                  onPress={() => setPaypalCurrency('USD')}
                >
                  <Text style={[styles.currencyChipText, paypalCurrency === 'USD' && styles.currencyChipTextActive]}>USD</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.currencyChip, paypalCurrency === 'EUR' && styles.currencyChipActive]}
                  onPress={() => setPaypalCurrency('EUR')}
                >
                  <Text style={[styles.currencyChipText, paypalCurrency === 'EUR' && styles.currencyChipTextActive]}>EUR</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View style={styles.separator} />
          <TouchableWithoutFeedback onPress={() => setSelectedPayment('bank_card')}>
            <View style={styles.row}>
              <Image source={require('../../../assets/local/cardpay.png')} style={styles.cardIcon} />
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-10%</Text>
              </View>
              <View style={styles.spacer} />
              <View style={[styles.radioButton, selectedPayment === 'bank_card' && styles.radioButtonSelected]}>
                {selectedPayment === 'bank_card' && <View style={styles.radioButtonInner} />}
              </View>
            </View>
          </TouchableWithoutFeedback>
          {/* Bank Card 的币种选择（独立状态） */}
          {selectedPayment === 'bank_card' && (
            <View style={styles.currencyRow}>
              <Text style={styles.currencyLabel}>Devise:</Text>
              <View style={styles.currencyOptions}>
                <TouchableOpacity
                  style={[styles.currencyChip, bankCardCurrency === 'USD' && styles.currencyChipActive]}
                  onPress={() => setBankCardCurrency('USD')}
                >
                  <Text style={[styles.currencyChipText, bankCardCurrency === 'USD' && styles.currencyChipTextActive]}>USD</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.currencyChip, bankCardCurrency === 'EUR' && styles.currencyChipActive]}
                  onPress={() => setBankCardCurrency('EUR')}
                >
                  <Text style={[styles.currencyChipText, bankCardCurrency === 'EUR' && styles.currencyChipTextActive]}>EUR</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View style={styles.separator} />
          <TouchableWithoutFeedback onPress={() => setSelectedPayment('balance')}>
            <View style={styles.row}>
              <Image source={require('../../../assets/local/balancepay.png')} style={styles.balanceIcon} />
              <View style={styles.balanceTextContainer}>
                <Text style={styles.balanceTitle}>solde du compte</Text>
                <Text style={styles.balanceAmount}>
                  Solde : 
                  <Text style={styles.balanceAmountValue}>
                    {userBalance !== null ? `${userBalance}${userBalanceCurrency}` : '—'}
                  </Text>
                </Text>
              </View>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-10%</Text>
              </View>
              <View style={styles.spacer} />
              <View style={[styles.radioButton, selectedPayment === 'balance' && styles.radioButtonSelected]}>
                {selectedPayment === 'balance' && <View style={styles.radioButtonInner} />}
              </View>
            </View>
          </TouchableWithoutFeedback>
          <View style={styles.separator} />
          <TouchableWithoutFeedback onPress={() => setSelectedPayment('cod')}>
            <View style={styles.row}>
              <Image source={require('../../../assets/local/COD.png')} style={styles.codIcon} />
              <View style={styles.codTextContainer}>
                <Text style={styles.codTitle}>Paiement à la livraison</Text>
                <Text style={styles.codDescription}>Paiement en espèces à la réception</Text>
              </View>
              <View style={styles.spacer} />
              <View style={[styles.radioButton, selectedPayment === 'cod' && styles.radioButtonSelected]}>
                {selectedPayment === 'cod' && <View style={styles.radioButtonInner} />}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>

        {/* Promotion Banner */}
        <View style={styles.promotionBanner}>
          <Text style={styles.promotionText}>10 % remboursé pour la première commande.</Text>
        </View>

        {/* Order Summary */}
        <View style={styles.orderSummarySection}>
          <Text style={styles.sectionTitle}>Résumé de la commande</Text>
          
          <View style={styles.productItem}>
            <Image 
              source={{ uri: orderProduct ? (getFirstProductImage(orderProduct) || 'https://via.placeholder.com/80x80') : 'https://via.placeholder.com/80x80' }}
              style={styles.productImage}
            />
            <View style={styles.productDetails}>
              <View style={styles.productTexts}>
                <Text style={styles.productName} numberOfLines={2}>
                  {orderProduct ? (orderProduct.name_fr || orderProduct.name_cn) : orderSummary.productName}
                </Text>
                {!!orderProduct?.content_fr && (
                  <Text style={styles.productVariant} numberOfLines={1}>{orderProduct.content_fr}</Text>
                )}
                <Text style={styles.productQuantity} numberOfLines={1}>Quantité: {orderQuantity}</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.currentPrice}>
                  {isCardOrPaypal ? (finalUnitPriceDisplay * orderQuantity).toFixed(2) : (finalUnitPrice * orderQuantity)}
                  <Text style={styles.currencyCode}>{displayCurrency}</Text>
                </Text>
                <Text style={styles.originalPrice}>
                  {isCardOrPaypal ? (baseUnitPriceDisplay * orderQuantity).toFixed(2) : (baseUnitPrice * orderQuantity)}{displayCurrency}
                </Text>
              </View>
            </View>
          </View>

          {/* Price Breakdown */}
          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Total</Text>
              <Text style={[styles.priceValue, styles.totalPrice]}>
                {isCardOrPaypal ? (finalUnitPriceDisplay * orderQuantity).toFixed(2) : (finalUnitPrice * orderQuantity)}{isCardOrPaypal ? displayCurrency : 'FCFA'}
              </Text>
            </View>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Total produit ({orderQuantity} x)</Text>
              <Text style={styles.priceValue}>
                {isCardOrPaypal ? (baseUnitPriceDisplay * orderQuantity).toFixed(2) : (baseUnitPrice * orderQuantity)}{isCardOrPaypal ? displayCurrency : 'FCFA'}
              </Text>
            </View>
            
            <View style={styles.priceRow}>
              <View style={styles.discountRow}>
                <Text style={styles.priceLabel}>Remise</Text>
                {selectedPayment !== 'cod' && (
                  <View style={styles.discountBadgeSmall}>
                    <Text style={styles.discountTextSmall}>-10%</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.priceValue, styles.discountValue]}>
                -{isCardOrPaypal ? (discountAmountDisplay * orderQuantity).toFixed(2) : (discountAmount * orderQuantity)}{isCardOrPaypal ? displayCurrency : 'FCFA'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          disabled={isSubmitting}
          onPress={async () => {
            if (isSubmitting) return;
            setIsSubmitting(true);
            try {
              console.log('[LocalPayment] Create order - start', {
                time: new Date().toISOString(),
                selectedPayment,
              });
              
              
              const product = orderProduct || productCacheManager.getLastProduct();
              if (!product) {
                Alert.alert('Erreur', "Aucun produit n'est sélectionné");
                return;
              }

              const quantity = orderQuantity;
              const skuId = product.skus?.[0]?.sku_id ?? '';

              // 处理地址与自提点
              // 检查是否有自定义取货点数据
              const hasCustomPickup = customPickupData && customPickupData.district_id;
              
              let addressId: number | undefined;
              let pickupId: number | undefined;
              
              if (!hasCustomPickup) {
                // 使用旧的地址系统
                addressId = defaultAddress?.address_id ?? (addresses && addresses.length > 0 ? addresses[0].address_id : undefined);
                if (!addressId) {
                  Alert.alert('Adresse requise', "Veuillez ajouter une adresse de réception.", [
                    { text: 'OK', onPress: () => navigation.navigate('LocalAddressForm' as never) }
                  ]);
                  return;
                }
                pickupId = pickupLocationIdFromRoute ?? 0;
                if (!pickupId) {
                  Alert.alert('Point de retrait', 'Veuillez choisir un point de retrait.', [
                    { text: 'OK', onPress: () => navigation.navigate('PickUp' as never) }
                  ]);
                  return;
                }
              }

              // 如果选择余额支付，先检查余额是否充足
              if (selectedPayment === 'balance') {
                const totalAmount = finalUnitPrice * quantity;
                if (userBalance === null || userBalance < totalAmount) {
                  console.log('[LocalPayment] Insufficient balance:', {
                    userBalance,
                    totalAmount,
                    currency: userBalanceCurrency
                  });
                  Alert.alert(
                    'Solde insuffisant', 
                    `Votre solde actuel (${userBalance || 0} ${userBalanceCurrency}) est insuffisant pour cette commande (${totalAmount} ${userBalanceCurrency}). Veuillez recharger votre compte.`
                  );
                  return;
                }
              }

              console.log('[LocalPayment] Create order - inputs', {
                product_id: product.product_id,
                skuId,
                quantity,
                addressId,
                pickupId,
                baseUnitPrice,
                discountAmount,
                finalUnitPrice,
                userBalanceCurrency,
              });

              // 根据支付方式决定订单货币
              let orderCurrency = 'FCFA';  // 默认使用 FCFA
              let orderAmount = finalUnitPrice;
              let orderTotalAmount = baseUnitPrice;
              let orderDiscountAmount = discountAmount;
              
              // Mobile Money、Wave、Balance 和 COD 都必须使用 FCFA
              if (selectedPayment === 'mobile_money' || selectedPayment === 'wave' || 
                  selectedPayment === 'balance' || selectedPayment === 'cod') {
                orderCurrency = 'FCFA';  // 强制使用 FCFA
              } else if (selectedPayment === 'paypal') {
                orderCurrency = paypalCurrency;  // USD 或 EUR
                // 如果是 PayPal，需要转换金额
                const convertedAmount = (Array.isArray(convertedAmounts) && getConvertedAmountByKey(convertedAmounts, 'total_amount')) || convertFcfa(finalUnitPrice, paypalCurrency);
                orderAmount = convertedAmount;
                orderTotalAmount = convertedAmount * 1.111;  // 按比例计算原价（10%折扣）
                orderDiscountAmount = orderTotalAmount - orderAmount;
              } else if (selectedPayment === 'bank_card') {
                orderCurrency = bankCardCurrency;  // USD 或 EUR
                // 如果是 Bank Card，需要转换金额
                const convertedAmount = (Array.isArray(convertedAmounts) && getConvertedAmountByKey(convertedAmounts, 'total_amount')) || convertFcfa(finalUnitPrice, bankCardCurrency);
                orderAmount = convertedAmount;
                orderTotalAmount = convertedAmount * 1.111;  // 按比例计算原价（10%折扣）
                orderDiscountAmount = orderTotalAmount - orderAmount;
              }
              
              const requestBody: CreateLocalOrderRequest = {
                items: [
                  {
                    product_id: String(product.product_id ?? ''),
                    sku_id: String(skuId),
                    quantity,
                    unit_price: orderAmount,
                    total_price: orderAmount * quantity,
                  },
                ],
                address_id: addressId,
                pickup_location_id: pickupId,
                payment_method: selectedPayment,
                buyer_message: '',
                total_amount: orderTotalAmount * quantity,
                actual_amount: orderAmount * quantity,
                discount_amount: orderDiscountAmount * quantity,
                currency: orderCurrency,
                // 自定义取货点数据
                ...(hasCustomPickup && customPickupData ? {
                  district_id: customPickupData.district_id,
                  full_name: customPickupData.full_name,
                  phone: customPickupData.phone,
                  whatsapp: customPickupData.whatsapp,
                  receiver_address: customPickupData.receiver_address,
                  latitude: customPickupData.latitude,
                  longitude: customPickupData.longitude,
                } : {}),
              };

              // 货到付款直接创建订单，不再检查身份验证

              console.log('[LocalPayment] Create order - request body', requestBody);
              const res = await orderApi.createOrder(requestBody);
              console.log('[LocalPayment] Create order - success response', res);

              if (selectedPayment === 'cod') {
                console.log('[LocalPayment] Navigating to OrderSuccess (COD)');
                navigation.navigate('OrderSuccess', { orderId: res.order_id });
              } else {
                // 发起支付
                
                // Mobile Money 需要电话号码，先跳转到确认页面收集电话
                if (selectedPayment === 'mobile_money') {
                  console.log('[LocalPayment] Navigating to LocalMobileMoneyConfirm (skip first payment init)');
                  const currencyForPayment = res.currency || userBalanceCurrency || 'FCFA';
                  navigation.navigate('LocalMobileMoneyConfirm', {
                    orderId: res.order_id,
                    orderNo: res.order_no,
                    amount: res.actual_amount,
                    currency: currencyForPayment,
                  } as never);
                  return;
                }

                // 其他支付方式正常处理
                try {
                  // 直接使用订单中的金额和货币，因为创建订单时已经转换好了
                  const amountForPayment = res.actual_amount;  // 使用 actual_amount（折扣后价格）
                  const currencyForPayment = res.currency;

                  const payRes = await orderApi.initiatePayment({
                    order_id: res.order_id,
                    amount: amountForPayment,
                    method: selectedPayment as any,
                    currency: currencyForPayment,
                    extra: {},
                  });
                  console.log('[LocalPayment] initiatePayment response', payRes);

                  // wave / paypal / bank_card 直接走统一 PaymentFlow
                  if (selectedPayment === 'wave' || selectedPayment === 'paypal' || selectedPayment === 'bank_card') {
                    const paymentId = String(res.order_id);
                    const payUrl = String(payRes?.payment_url || '');
                    console.log('[LocalPayment] Go PaymentFlow with', { paymentId, payUrl, method: selectedPayment, is_local: 1 });
                    // 复用订单支付入口 Pay.tsx 所使用的路由
                    // 约定：Pay.tsx 从 route.params 读取 { order_id, payUrl, method }
                    // 添加 is_local: 1 标识本地订单
                    (navigation as any).navigate('Pay', { order_id: paymentId, payUrl, method: selectedPayment, is_local: 1 });
                    return;
                  } else if (selectedPayment === 'balance') {
                    // 余额支付，如果走到这里说明余额充足且支付成功
                    console.log('[LocalPayment] Navigating to OrderSuccess (Balance)');
                    navigation.navigate('OrderSuccess', {
                      orderId: res.order_id
                    });
                  } else if (payRes?.payment_url) {
                    console.log('[LocalPayment] payment_url:', payRes.payment_url);
                    Alert.alert('Paiement', 'Veuillez suivre les instructions de paiement.');
                  } else {
                    Alert.alert('Paiement', 'Demande de paiement envoyée.');
                  }
                } catch (err) {
                  console.error('[LocalPayment] initiatePayment error:', err);
                  Alert.alert('Paiement', "Échec de l'initialisation du paiement");
                }
              }
            } catch (e: unknown) {
              console.error('[LocalPayment] Create order error raw:', e);
              const msg = (typeof e === 'object' && e !== null && 'message' in e && typeof (e as { message?: unknown }).message === 'string')
                ? (e as { message: string }).message
                : 'Échec de la création de la commande';
              Alert.alert('Erreur', msg);
              try {
                const anyErr = e as any;
                if (anyErr?.response) {
                  console.error('[LocalPayment] error.response.status', anyErr.response.status);
                  console.error('[LocalPayment] error.response.data', anyErr.response.data);
                }
              } catch {}
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Traitement en cours...' : 'Valider la commande'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 44 : Constants.statusBarHeight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    zIndex: 5,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: fontSize(20),
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    flex: 1,
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
  },
  rowsContainer: {
    backgroundColor: '#fff',
  },
  row: {
    width: screenWidth,
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  separator: {
    width: screenWidth,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e8e8e8',
  },
  mobilePayIcon: {
    height: 40,
    width: 200,
    resizeMode: 'contain',
  },
  waveIcon: {
    height: 40,
    width: 80,
    resizeMode: 'contain',
  },
  paypalIcon: {
    height: 40,
    width: 120,
    resizeMode: 'contain',
  },
  cardIcon: {
    height:40,
    width:140,
    resizeMode: 'contain',
  },
  balanceIcon: {
    height:40,
    width:40,
    resizeMode: 'contain',
  },
  codIcon: {
    height:40,
    width:40,
    resizeMode: 'contain',
  },
  discountBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  discountText: {
    color: 'white',
    fontSize: fontSize(12),
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d0d0d0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  radioButtonSelected: {
    borderColor: '#FF6B35',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B35',
  },
  balanceTextContainer: {
    marginLeft: 12,
    flexDirection: 'column',
  },
  balanceTitle: {
    fontSize: fontSize(15),
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: fontSize(13),
    color: '#FF6B35',
  },
  balanceAmountValue: {
    fontSize: fontSize(13),
    color: '#FF6B35',
    fontWeight: '700',
  },
  codTextContainer: {
    marginLeft: 12,
    flexDirection: 'column',
  },
  codTitle: {
    fontSize: fontSize(15),
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  codDescription: {
    fontSize: fontSize(13),
    color: '#666',
  },

  promotionBanner: {
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 12,
    backgroundColor: '#FFFADE',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  promotionText: {
    fontSize: fontSize(14),
    color: '#FF6B35',
    textAlign: 'center',
    fontWeight: '500',
  },
  orderSummarySection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: fontSize(17),
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  productItem: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
  },
  productImage: {
    width: 75,
    height: 75,
    borderRadius: 6,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
    height: 75,
    justifyContent: 'space-between',
  },
  productTexts: {
    maxHeight: 46,
    overflow: 'hidden',
  },
  productName: {
    fontSize: fontSize(13),
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
    lineHeight: 16,
  },
  productVariant: {
    fontSize: fontSize(11),
    color: '#666',
    marginBottom: 2,
  },
  productQuantity: {
    fontSize: fontSize(11),
    color: '#666',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currentPrice: {
    fontSize: fontSize(17),
    fontWeight: '700',
    color: '#FF6B35',
  },
  currencyCode: {
    fontSize: fontSize(12),
    color: '#FF6B35',
    marginLeft: 4,
  },
  originalPrice: {
    fontSize: fontSize(13),
    color: '#999',
    textDecorationLine: 'line-through',
  },
  priceBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: fontSize(15),
    color: '#000',
  },
  priceValue: {
    fontSize: fontSize(15),
    fontWeight: '500',
    color: '#000',
  },
  itemCount: {
    fontSize: fontSize(13),
    color: '#666',
    fontWeight: 'normal',
  },
  totalPrice: {
    fontSize: fontSize(18),
    fontWeight: '700',
    color: '#FF6B35',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discountValue: {
    color: '#FF6B35',
  },
  discountBadgeSmall: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  discountTextSmall: {
    color: 'white',
    fontSize: fontSize(11),
    fontWeight: '600',
  },
  submitContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e8e8e8',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#FFB59C',
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: fontSize(16),
    fontWeight: '600',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  currencyLabel: {
    fontSize: fontSize(13),
    color: '#333',
    marginRight: 10,
  },
  currencyOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  currencyChipActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF3EC',
  },
  currencyChipText: {
    fontSize: fontSize(12),
    color: '#333',
  },
  currencyChipTextActive: {
    color: '#FF6B35',
    fontWeight: '600',
  },
});

export default LocalPayment;