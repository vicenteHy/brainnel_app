import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BackIcon from '../../components/BackIcon';
import fontSize from '../../utils/fontsizeUtils';
import useOrderStore from '../../store/order';
import widthUtils from '../../utils/widthUtils';
import { ordersApi } from '../../services/api/orders';
import { Order } from '../../services/api/orders';
import { useTranslation } from 'react-i18next';

interface OrderStore {
  order: any;
  payment_operator?: string;
  shipping?: {
    method: string;
    estimated_arrival: string;
  };
}

export function ConfirmOrder() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const orderInfo = useOrderStore() as unknown as OrderStore;
  const [order, setOrder] = useState<Order>();
  const { t } = useTranslation();

  const getOrder = async () => {
    const data = orderInfo.order;
    try {
      const response = await ordersApi.createOrder(data);
      console.log(response);
      setOrder(response);
    } catch (error) {
      navigation.goBack();
      console.error('创建订单失败:', error);
      Alert.alert(t('common.error'), t('order.create_failed'));
    }
  };

  useEffect(() => {
    getOrder();
  }, []);

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <BackIcon size={20} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('confirmOrder.title')}</Text>
        </View>

        {/* Order Number */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📋</Text>
            <Text style={styles.sectionTitle}>{t('confirmOrder.orderNumber')}</Text>
          </View>
          <Text style={styles.orderNumber}>{order?.order_no}</Text>
        </View>
        <View style={styles.border}></View>

        {/* Payment Method */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>💳</Text>
            <Text style={styles.sectionTitle}>{t('confirmOrder.paymentMethod')}</Text>
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentMethod}>{order?.payment_method}</Text>
            <Text style={styles.paymentOperator}>{orderInfo?.payment_operator}</Text>
          </View>
        </View>
        <View style={styles.border}></View>

        {/* Shipping Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🚢</Text>
            <Text style={styles.sectionTitle}>{t('confirmOrder.shippingInfo')}</Text>
          </View>
          <View style={styles.shippingInfo}>
            <View style={styles.shippingRow}>
              <Text style={styles.shippingLabel}>{t('confirmOrder.shippingMethod')}</Text>
              <Text style={styles.shippingValue}>
                {orderInfo?.shipping?.method === 'sea' ? t('confirmOrder.seaShipping') : t('confirmOrder.airShipping')}
              </Text>
            </View>
            <View style={styles.shippingRow}>
              <Text style={styles.shippingLabel}>{t('confirmOrder.estimatedArrival')}</Text>
              <Text style={styles.shippingValue}>{orderInfo?.shipping?.estimated_arrival}</Text>
            </View>
          </View>
        </View>
        <View style={styles.border}></View>

        {/* Recipient Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>👤</Text>
            <Text style={styles.sectionTitle}>{t('confirmOrder.recipientInfo')}</Text>
          </View>
          <View style={styles.recipientInfo}>
            <Text style={styles.recipientName}>{order?.receiver_name}</Text>
            <Text style={styles.recipientPhone}>{order?.receiver_phone}</Text>
            <Text style={styles.recipientAddress}>{order?.receiver_address}</Text>
          </View>
        </View>
        <View style={styles.border}></View>

        {/* Order Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📦</Text>
            <Text style={styles.sectionTitle}>{t('confirmOrder.orderItems')}</Text>
          </View>
          <View style={styles.orderItems}>
            {order?.items?.map((item) => (
              <View key={item.sku_id} style={styles.orderItem}>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.product_name}
                  </Text>
                  {item.sku_attributes.map((attr) => (
                    <Text key={attr.attribute_name} style={styles.itemAttribute}>
                      {attr.attribute_name}: {attr.value}
                    </Text>
                  ))}
                  <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                </View>
                <View style={styles.itemPrice}>
                  <Text style={styles.priceText}>${item.total_price}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.border}></View>

        {/* Price Summary */}
        <View style={styles.section}>
          <View style={styles.priceSummary}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t('confirmOrder.totalPrice')}</Text>
              <Text style={styles.priceValue}>${order?.total_amount}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t('confirmOrder.domesticShipping')}</Text>
              <Text style={styles.priceValue}>${order?.discount_amount}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t('confirmOrder.internationalShipping')}</Text>
              <Text style={styles.priceValue}>${order?.shipping_fee}</Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>{t('confirmOrder.actualAmount')}</Text>
              <Text style={styles.totalAmount}>${order?.actual_amount}</Text>
            </View>
          </View>
        </View>

        {/* Bottom Button */}
        <TouchableOpacity 
          style={styles.bottomButton} 
          onPress={() => navigation.navigate('Pay', { order_id: order?.order_id })}
        >
          <View style={styles.bottomButtonContent}>
            <Text style={styles.bottomButtonText}>{t('confirmOrder.payNow')}</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 3,
  },
  title: {
    fontSize: fontSize(18),
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: fontSize(18),
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: fontSize(16),
    fontWeight: '500',
  },
  border: {
    height: widthUtils(6,6).height,
    backgroundColor: '#f5f5f5',
  },
  orderNumber: {
    fontSize: fontSize(16),
    color: '#666',
  },
  paymentInfo: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
  },
  paymentMethod: {
    fontSize: fontSize(16),
    fontWeight: '500',
    marginBottom: 4,
  },
  paymentOperator: {
    fontSize: fontSize(14),
    color: '#666',
  },
  shippingInfo: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
  },
  shippingRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  shippingLabel: {
    fontSize: fontSize(14),
    color: '#666',
    width: widthUtils(80,80).width,
  },
  shippingValue: {
    fontSize: fontSize(14),
    flex: 1,
  },
  recipientInfo: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
  },
  recipientName: {
    fontSize: fontSize(16),
    fontWeight: '500',
    marginBottom: 4,
  },
  recipientPhone: {
    fontSize: fontSize(14),
    color: '#666',
    marginBottom: 4,
  },
  recipientAddress: {
    fontSize: fontSize(14),
    color: '#666',
  },
  orderItems: {
    gap: 12,
  },
  orderItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSize(14),
    marginBottom: 4,
  },
  itemAttribute: {
    fontSize: fontSize(12),
    color: '#666',
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: fontSize(12),
    color: '#999',
    marginTop: 4,
  },
  itemPrice: {
    justifyContent: 'center',
  },
  priceText: {
    fontSize: fontSize(16),
    fontWeight: '500',
    color: '#ff6000',
  },
  priceSummary: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: fontSize(14),
    color: '#666',
  },
  priceValue: {
    fontSize: fontSize(14),
    color: '#333',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: fontSize(16),
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: fontSize(18),
    fontWeight: '600',
    color: '#ff6000',
  },
  bottomButton: {
    width: '100%',
    padding: 16,
    backgroundColor: '#fff',
  },
  bottomButtonContent: {
    backgroundColor: '#ff6000',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  bottomButtonText: {
    color: '#fff',
    fontSize: fontSize(16),
    fontWeight: '500',
  },
}); 