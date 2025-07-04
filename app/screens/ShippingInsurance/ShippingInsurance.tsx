import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { InsuranceExplain } from './InsuranceExplain';

interface ShippingInsuranceProps {
  isSelected: boolean;
  onToggle: (selected: boolean) => void;
  fee: number;
  currency: string;
}

export const ShippingInsurance: React.FC<ShippingInsuranceProps> = ({
  isSelected,
  onToggle,
  fee,
  currency
}) => {
  const { t } = useTranslation();
  const [showExplainModal, setShowExplainModal] = useState(false);

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onToggle(!isSelected)}
      activeOpacity={0.7}
    >
      <View style={styles.checkboxContainer}>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t('shipping_insurance.title')}</Text>
          <Text style={styles.fee}>
            {t('shipping_insurance.fee_prefix')}{fee.toFixed(2)} {t('shipping_insurance.fee_suffix')}
          </Text>
        </View>
        
        <Text style={styles.description}>
          {t('shipping_insurance.description')}
        </Text>
        
        <TouchableOpacity 
          style={styles.learnMoreButton}
          onPress={() => setShowExplainModal(true)}
        >
          <Text style={styles.learnMoreText}>{t('shipping_insurance.learn_more')}</Text>
        </TouchableOpacity>
      </View>
      
      <InsuranceExplain
        visible={showExplainModal}
        onClose={() => setShowExplainModal(false)}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFF4F0',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#FF8A50',
    alignItems: 'flex-start',
  },
  checkboxContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#FF5100',
    borderColor: '#FF5100',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  fee: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5100',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  learnMoreButton: {
    alignSelf: 'flex-start',
  },
  learnMoreText: {
    fontSize: 14,
    color: '#FF5100',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});