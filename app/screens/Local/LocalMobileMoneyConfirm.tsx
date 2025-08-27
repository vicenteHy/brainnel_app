import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Constants from 'expo-constants';
import BackIcon from '../../components/BackIcon';
import fontSize from '../../utils/fontsizeUtils';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { productCacheManager } from '../../services/local/productCache';
import type { LocalProduct } from '../../services/local/productList';
import { orderApi } from '../../services/local/orderApi';

type LocalMobileMoneyConfirmNav = NativeStackNavigationProp<RootStackParamList, 'LocalMobileMoneyConfirm'>;

const DIAL_CODE = '+225';

const isValidE164PhoneNumber = (phoneNumber: string): boolean => {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
};

const LocalMobileMoneyConfirm = () => {
  const navigation = useNavigation<LocalMobileMoneyConfirmNav>();
  const route = useRoute<RouteProp<RootStackParamList, 'LocalMobileMoneyConfirm'>>();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneNumberError, setPhoneNumberError] = useState(false);
  const [orderProduct, setOrderProduct] = useState<LocalProduct | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 从路由参数获取订单信息
  const { orderId, orderNo, amount, currency } = route.params || {};

  // 保持与 previewOrder 一致的导航体验（无需额外设置）

  useEffect(() => {
    const cached = productCacheManager.getLastProduct();
    if (cached) setOrderProduct(cached);
  }, []);

  const validatePhoneNumber = (phoneNum: string) => {
    if (!phoneNum) return true;
    const digits = phoneNum.replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 15;
  };

  const handlePhoneNumberChange = (text: string) => {
    setPhoneNumber(text);
    if (text.length > 0) {
      const isValid = validatePhoneNumber(text);
      setPhoneNumberError(!isValid);
    } else {
      setPhoneNumberError(false);
    }
  };

  const getDisplayCountryCode = () => DIAL_CODE;

  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return phone;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (cleanPhone.startsWith('+')) return cleanPhone;
    return `${DIAL_CODE}${cleanPhone}`;
  };

  const DISCOUNT_RATE = 0.1;
  const baseUnitPrice = useMemo(() => (orderProduct ? orderProduct.price : 0), [orderProduct]);
  const discountAmount = useMemo(() => Math.round(baseUnitPrice * DISCOUNT_RATE), [baseUnitPrice]);
  const finalUnitPrice = useMemo(() => baseUnitPrice - discountAmount, [baseUnitPrice, discountAmount]);

  const onSubmit = async () => {
    if (!phoneNumber) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
      return;
    }
    if (!validatePhoneNumber(phoneNumber)) {
      setPhoneNumberError(true);
      Alert.alert('Erreur', 'Numéro de téléphone invalide');
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!isValidE164PhoneNumber(formattedPhone)) {
      setPhoneNumberError(true);
      Alert.alert('Erreur', 'Le numéro de téléphone doit être au format E.164');
      return;
    }

    if (!orderId) {
      Alert.alert('Erreur', 'Informations de commande manquantes');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        order_id: orderId,
        amount: amount || finalUnitPrice,
        method: 'mobile_money',
        currency: currency || 'FCFA',
        extra: {
          phone_number: formattedPhone  // 传递格式化的电话号码
        }
      };
      
      console.log('[LocalMobileMoneyConfirm] Initiating payment:', {
        phone: formattedPhone,
        orderId: orderId,
        orderIdType: typeof orderId,
        amount: amount || finalUnitPrice,
        currency: currency || 'FCFA',
        requestData: requestData
      });
      
      // 调用支付接口，传递电话号码
      const paymentResponse = await orderApi.initiatePayment(requestData);

      console.log('[LocalMobileMoneyConfirm] Payment response:', paymentResponse);

      // 始终跳转到支付轮询页面，即使没有payment_url也要轮询状态
      // 参考PreviewOrder的处理方式，mobile money需要轮询支付状态
      navigation.navigate('Pay' as never, {
        order_id: String(orderId),
        payUrl: paymentResponse?.payment_url || '',  // 即使为空也传递空字符串
        method: 'mobile_money',
        is_local: 1  // 标识本地订单
      } as never);
      
      console.log('[LocalMobileMoneyConfirm] Navigated to Pay page for polling with:', {
        order_id: String(orderId),
        payUrl: paymentResponse?.payment_url || '(empty)',
        method: 'mobile_money',
        is_local: 1
      });
    } catch (error) {
      console.error('[LocalMobileMoneyConfirm] Payment initiation failed:', error);
      Alert.alert('Erreur', 'Échec de l\'initialisation du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        <View style={styles.container}>
          <View style={styles.titleContainer}>
            <View style={styles.backIconContainer}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <BackIcon size={fontSize(20)} />
              </TouchableOpacity>
            </View>
            <Text style={styles.titleHeading}>Payer maintenant</Text>
          </View>

          <ScrollView style={styles.scrollContainer}>
            <View style={styles.mainContent}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mode de paiement</Text>
                <View style={styles.paymentMethodContainer}>
                  <Text style={styles.paymentMethodText}>Mobile Money</Text>
                </View>

                {/* 支持的支付方式 Icons */}
                <View style={styles.supportedMethodsContainer}>
                  <Text style={styles.supportedTitle}>Moyens de paiement pris en charge</Text>
                  <View style={styles.supportedIconsRow}>
                    <Image source={require('../../../assets/local/mobilepay.png')} style={styles.supportedIconLarge} />
                  </View>
                </View>

                <View style={styles.phoneInputContainer}>
                  <Text style={styles.phoneInputLabel}>Veuillez saisir votre numéro de téléphone</Text>
                  <View style={styles.phoneInputRow}>
                    <View style={styles.countryCodeSelector}>
                      <Text style={styles.countryCodeText}>{getDisplayCountryCode()}</Text>
                    </View>
                    <View style={styles.phoneSeparator} />
                    <TextInput
                      style={styles.phoneInput}
                      value={phoneNumber}
                      onChangeText={handlePhoneNumberChange}
                      placeholder="Numéro de téléphone"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                    />
                  </View>
                  {phoneNumberError && (
                    <Text style={styles.phoneNumberErrorText}>
                      Format du numéro de téléphone incorrect
                    </Text>
                  )}
                </View>
              </View>

              {/* 仅金额卡片 */}
              <View style={styles.section}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{finalUnitPrice} FCFA</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.submitButtonContainer}>
            <TouchableOpacity
              style={[
                styles.primaryButtonStyle,
                (!phoneNumber || phoneNumberError)
                  ? styles.disabledButtonStyle
                  : {},
              ]}
              onPress={onSubmit}
              disabled={!phoneNumber || phoneNumberError || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Confirmer le paiement</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 国家列表与弹窗已移除，固定国家代码为 +225 */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeAreaContent: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContent: {
    padding: 20,
    paddingBottom: 20,
  },
  submitButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  primaryButtonStyle: {
    width: '100%',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF5100',
    borderWidth: 0,
    borderRadius: 16,
    shadowColor: '#FF5100',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 0,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: fontSize(16),
    lineHeight: 22,
    fontFamily: 'System',
    letterSpacing: 0.3,
  },
  disabledButtonStyle: {
    backgroundColor: '#cccccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  titleContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backIconContainer: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleHeading: {
    fontWeight: '600',
    fontSize: fontSize(20),
    lineHeight: 28,
    fontFamily: 'System',
    color: '#1a1a1a',
    letterSpacing: 0.3,
  },
  section: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 0,
  },
  sectionTitle: {
    fontSize: fontSize(16),
    fontWeight: '600',
    marginBottom: 16,
    color: '#1a1a1a',
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
  paymentMethodContainer: {
    backgroundColor: '#fff4f0',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF5100',
  },
  paymentMethodText: {
    fontSize: fontSize(16),
    color: '#FF5100',
    fontWeight: '600',
    fontFamily: 'System',
  },
  supportedMethodsContainer: {
    marginTop: 12,
  },
  supportedTitle: {
    fontSize: fontSize(12),
    color: '#666666',
    marginBottom: 8,
  },
  supportedIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  supportedIcon: {
    height: 28,
    width: 56,
    resizeMode: 'contain',
  },
  supportedIconLarge: {
    height: 30,
    width: 120,
    resizeMode: 'contain',
  },
  supportedIconWide: {
    height: 28,
    width: 90,
    resizeMode: 'contain',
  },
  supportedIconSquare: {
    height: 28,
    width: 28,
    resizeMode: 'contain',
  },
  phoneInputContainer: {
    marginTop: 16,
  },
  phoneInputLabel: {
    fontSize: fontSize(14),
    marginBottom: 8,
    color: '#666666',
    fontWeight: '500',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  countryCodeSelector: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 80,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e8e8e8',
  },
  countryCodeText: {
    fontSize: fontSize(16),
    color: '#333333',
    fontWeight: '500',
    marginRight: 5,
    fontFamily: 'System',
  },
  countryCodeArrow: {
    fontSize: fontSize(12),
    color: '#666666',
  },
  phoneSeparator: {
    width: 1,
    height: 30,
    backgroundColor: '#e8e8e8',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff4f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF5100',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: fontSize(16),
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: 'System',
  },
  totalValue: {
    fontSize: fontSize(20),
    fontWeight: '700',
    color: '#FF5100',
    fontFamily: 'System',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: fontSize(14),
    color: '#333333',
  },
  phoneNumberErrorText: {
    color: '#ff4444',
    fontSize: fontSize(12),
    marginTop: 6,
    fontFamily: 'System',
    fontWeight: '400',
  },
  // 国家选择相关样式已不再使用
});

export default LocalMobileMoneyConfirm;

          