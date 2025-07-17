import React, { useState, useEffect, useRef } from 'react';
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
  onRechargePress?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ balance, currency, onRechargePress }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const [displayedBalance, setDisplayedBalance] = useState(parseFloat(balance) || 0);
  const animationRef = useRef<any>(null);

  // 数字滚动动画函数
  const animateValue = (start: number, end: number, duration: number) => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
    
    const startTime = Date.now();
    const diff = end - start;
    
    animationRef.current = setInterval(() => {
      const currentTime = Date.now();
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // 使用缓动函数
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = start + (diff * easeProgress);
      
      setDisplayedBalance(currentValue);
      
      if (progress >= 1) {
        clearInterval(animationRef.current);
        setDisplayedBalance(end);
      }
    }, 16); // 约60fps
  };

  useEffect(() => {
    const newBalance = parseFloat(balance) || 0;
    if (newBalance !== displayedBalance) {
      animateValue(displayedBalance, newBalance, 1000);
    }
    
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [balance]);

  return (
    <View style={styles.balanceCard}>
      <View style={styles.balanceCardHeader}>
        <Ionicons name="wallet-outline" size={24} color="#FF5100" />
        <Text style={styles.balanceCardTitle}>{t('profile.balance.title')}</Text>
      </View>
      <View style={styles.balanceAmountContainer}>
        <Text style={styles.balanceAmount}>{Math.floor(displayedBalance).toLocaleString()}</Text>
        <Text style={styles.balanceCurrency}>{currency}</Text>
      </View>
      <View style={styles.balanceActions}>
        <TouchableOpacity 
          style={styles.balanceButton} 
          onPress={onRechargePress || (() => navigation.navigate('Recharge'))}
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