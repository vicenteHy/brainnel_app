import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './styles';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

type RootStackParamList = {
  Recharge: undefined;
  Balance: undefined;
};

interface BalanceCardProps {
  balance: string;
  currency: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ balance, currency }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();

  return (
    <View style={styles.balanceCard}>
      <View style={styles.balanceCardHeader}>
        <Ionicons name="wallet-outline" size={24} color="#FF6F30" />
        <Text style={styles.balanceCardTitle}>{t('profile.balance.title')}</Text>
      </View>
      <View style={styles.balanceAmountContainer}>
        <Text style={styles.balanceAmount}>{balance}</Text>
        <Text style={styles.balanceCurrency}>{currency}</Text>
      </View>
      <View style={styles.balanceActions}>
        <TouchableOpacity 
          style={styles.balanceButton} 
          onPress={() => navigation.navigate('Recharge')}
          activeOpacity={0.8}
        >
          <View style={styles.balanceButtonContent}>
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.balanceButtonText} numberOfLines={1}>{t('profile.balance.recharge')}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.balanceButton} 
          onPress={() => navigation.navigate('Balance')}
          activeOpacity={0.8}
        >
          <View style={styles.balanceButtonContent}>
            <Ionicons name="list-outline" size={18} color="#fff" />
            <Text style={styles.balanceButtonText} numberOfLines={1}>{t('profile.balance.details')}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}; 