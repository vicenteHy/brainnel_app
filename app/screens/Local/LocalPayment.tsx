import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  StatusBar as RNStatusBar,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import fontSize from '../../utils/fontsizeUtils';

const { width: screenWidth } = Dimensions.get('window');

interface PaymentMethod {
  id: string;
  name: string;
  icons: string[];
  discount?: string;
  selected?: boolean;
}

const LocalPayment = ({ navigation }: any) => {
  const [selectedPayment, setSelectedPayment] = useState<string>('wave');

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'brainnel_pay',
      name: 'Brainnel Pay',
      icons: ['brainnel', 'orange', 'mtn', 'airtel'],
      discount: '-10%',
    },
    {
      id: 'wave',
      name: 'Wave',
      icons: ['wave'],
      discount: '-10%',
      selected: true,
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icons: ['paypal'],
      discount: '-10%',
    },
    {
      id: 'cards',
      name: 'Cards',
      icons: ['mastercard', 'visa', 'amex'],
      discount: '-10%',
    },
    {
      id: 'account_balance',
      name: 'solde du compte',
      icons: [],
      discount: '-10%',
      balance: '22678FCFA',
    },
    {
      id: 'cash_on_delivery',
      name: 'Paiement à la livraison',
      icons: [],
      description: 'Paiement en espèces à la réception',
    },
  ];

  const orderSummary = {
    productName: 'Une sélection de hauts de sport sport Form Flex butter',
    productDetails: 'Marine | hauUne sélection de hauts...',
    quantity: 2,
    originalPrice: 3889,
    discountedPrice: 2960,
    totalItems: 2,
    productTotal: 2960,
    discount: -296,
    finalTotal: 2664,
  };

  const renderPaymentOption = (method: PaymentMethod) => {
    const isSelected = selectedPayment === method.id;

    return (
      <TouchableOpacity
        key={method.id}
        style={styles.paymentOption}
        onPress={() => setSelectedPayment(method.id)}
      >
        <View style={styles.paymentContent}>
          <View style={styles.paymentLeft}>
            {method.id === 'brainnel_pay' && (
              <View style={styles.multiIconContainer}>
                <View style={[styles.iconWrapper, { backgroundColor: '#FF6B35' }]}>
                  <Text style={[styles.iconText, { fontSize: fontSize(10), fontWeight: 'bold' }]}>B</Text>
                </View>
                <View style={[styles.iconWrapper, { backgroundColor: '#FF8C00' }]}>
                  <Text style={[styles.iconText, { fontSize: fontSize(10), fontWeight: 'bold' }]}>O</Text>
                </View>
                <View style={[styles.iconWrapper, { backgroundColor: '#FFD700' }]}>
                  <Text style={[styles.iconText, { fontSize: fontSize(10), fontWeight: 'bold' }]}>M</Text>
                </View>
                <View style={[styles.iconWrapper, { backgroundColor: '#FF6B35' }]}>
                  <Text style={[styles.iconText, { fontSize: fontSize(8) }]}>MTN</Text>
                </View>
              </View>
            )}
            
            {method.id === 'wave' && (
              <View style={[styles.iconWrapper, { backgroundColor: '#0066CC', width: 45 }]}>
                <Text style={[styles.iconText, { fontSize: fontSize(10), fontWeight: 'bold' }]}>wave</Text>
              </View>
            )}
            
            {method.id === 'paypal' && (
              <View style={[styles.iconWrapper, { backgroundColor: '#003087', width: 50 }]}>
                <Text style={[styles.iconText, { fontSize: fontSize(10), fontWeight: 'bold' }]}>PayPal</Text>
              </View>
            )}
            
            {method.id === 'cards' && (
              <View style={styles.multiIconContainer}>
                <View style={[styles.iconWrapper, { backgroundColor: '#EB001B', width: 40 }]}>
                  <Text style={[styles.iconText, { fontSize: fontSize(9), fontWeight: 'bold' }]}>MC</Text>
                </View>
                <View style={[styles.iconWrapper, { backgroundColor: '#1A1F71', width: 45 }]}>
                  <Text style={[styles.iconText, { fontSize: fontSize(9), fontWeight: 'bold' }]}>VISA</Text>
                </View>
                <View style={[styles.iconWrapper, { backgroundColor: '#006FCF', width: 50 }]}>
                  <Text style={[styles.iconText, { fontSize: fontSize(9), fontWeight: 'bold' }]}>AMEX</Text>
                </View>
              </View>
            )}
            
            {method.id === 'account_balance' && (
              <View style={[styles.iconWrapper, { backgroundColor: '#FF6B35', width: 35 }]}>
                <Ionicons name="wallet-outline" size={18} color="white" />
              </View>
            )}
            
            {method.id === 'cash_on_delivery' && (
              <View style={[styles.iconWrapper, { backgroundColor: '#4CAF50', width: 35 }]}>
                <Ionicons name="cash-outline" size={18} color="white" />
              </View>
            )}

            <View style={styles.paymentInfo}>
              <Text style={styles.paymentName}>{method.name}</Text>
              {method.balance && (
                <Text style={styles.balanceText}>Votre solde est de {method.balance}</Text>
              )}
              {method.description && (
                <Text style={styles.descriptionText}>{method.description}</Text>
              )}
            </View>
          </View>

          <View style={styles.paymentRight}>
            {method.discount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{method.discount}</Text>
              </View>
            )}
            <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
              {isSelected && <View style={styles.radioButtonInner} />}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.headerTitle}>Please select payment method</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Payment Methods */}
        <View style={styles.paymentSection}>
          {paymentMethods.map(renderPaymentOption)}
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
              source={{ uri: 'https://via.placeholder.com/80x80' }}
              style={styles.productImage}
            />
            <View style={styles.productDetails}>
              <Text style={styles.productName}>{orderSummary.productName}</Text>
              <Text style={styles.productVariant}>{orderSummary.productDetails}</Text>
              <Text style={styles.productQuantity}>Quantité: {orderSummary.quantity}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.currentPrice}>{orderSummary.discountedPrice}FCFA</Text>
                <Text style={styles.originalPrice}>{orderSummary.originalPrice}FCFA</Text>
              </View>
            </View>
          </View>

          {/* Price Breakdown */}
          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Total <Text style={styles.itemCount}>({orderSummary.totalItems} items)</Text></Text>
              <Text style={[styles.priceValue, styles.totalPrice]}>{orderSummary.finalTotal}FCFA</Text>
            </View>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Product Total</Text>
              <Text style={styles.priceValue}>{orderSummary.productTotal}FCFA</Text>
            </View>
            
            <View style={styles.priceRow}>
              <View style={styles.discountRow}>
                <Text style={styles.priceLabel}>Discount</Text>
                <View style={styles.discountBadgeSmall}>
                  <Text style={styles.discountTextSmall}>-10%</Text>
                </View>
              </View>
              <Text style={[styles.priceValue, styles.discountValue]}>{orderSummary.discount}FCFA</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={() => {
            // Handle payment submission
            console.log('Payment method selected:', selectedPayment);
          }}
        >
          <Text style={styles.submitButtonText}>
            Submit Order({orderSummary.finalTotal}FCFA)
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : (RNStatusBar.currentHeight || 0) + 10,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: fontSize(17),
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  paymentSection: {
  },
  paymentOption: {
    marginBottom: 0,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e8e8e8',
    overflow: 'hidden',
  },
  paymentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    justifyContent: 'space-between',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  multiIconContainer: {
    flexDirection: 'row',
    marginRight: 12,
    gap: 4,
  },
  iconWrapper: {
    width: 30,
    height: 20,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: 'white',
    fontSize: fontSize(8),
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: fontSize(15),
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  balanceText: {
    fontSize: fontSize(13),
    color: '#FF6B35',
  },
  descriptionText: {
    fontSize: fontSize(13),
    color: '#666',
  },
  paymentRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  discountBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
  },
  discountText: {
    color: 'white',
    fontSize: fontSize(13),
    fontWeight: '600',
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d0d0d0',
    justifyContent: 'center',
    alignItems: 'center',
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
  promotionBanner: {
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 12,
    backgroundColor: '#FFF5E6',
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
  },
  productImage: {
    width: 75,
    height: 75,
    borderRadius: 6,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: fontSize(14),
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
    lineHeight: 18,
  },
  productVariant: {
    fontSize: fontSize(12),
    color: '#666',
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: fontSize(12),
    color: '#666',
    marginBottom: 6,
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
  submitButtonText: {
    color: 'white',
    fontSize: fontSize(16),
    fontWeight: '600',
  },
});

export default LocalPayment;