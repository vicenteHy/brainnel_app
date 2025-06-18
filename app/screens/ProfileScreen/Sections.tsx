import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './styles';
import LeftArrowIcon from '../../components/DownArrowIcon';
import fontSize from '../../utils/fontsizeUtils';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SectionProps {
  t: (key: string) => string;
  navigation: any;
}

interface OrderStatusCounts {
  pending_payment: number;
  pending_shipment: number;
  in_transit: number;
  completed: number;
}

const orderItems = [
  { nameKey: 'profile.orders.status.to_pay', iconName: 'wallet-outline', status: 0, apiKey: 'pending_payment' },
  { nameKey: 'profile.orders.status.to_ship', iconName: 'archive-outline', status: 1, apiKey: 'pending_shipment' },
  { nameKey: 'profile.orders.status.to_receive', iconName: 'rocket-outline', status: 2, apiKey: 'in_transit' },
  { nameKey: 'profile.orders.status.after_sales', iconName: 'shield-checkmark-outline', status: 3, apiKey: null },
];

const serviceItems = [
  { nameKey: 'profile.services.item.collection', iconName: 'heart-outline', screen: 'Collection' },
  { nameKey: 'profile.services.item.history', iconName: 'time-outline', screen: 'BrowseHistoryScreen' },
  { nameKey: 'profile.services.item.address', iconName: 'location-outline', screen: 'AddressList' },
];

const SectionCard: React.FC<{title: string, onAllPress?: () => void, children: React.ReactNode, allText?: string}> = ({ title, onAllPress, allText, children }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onAllPress && (
        <TouchableOpacity style={styles.sectionAllButton} onPress={onAllPress}>
          <Text style={styles.sectionAllButtonText}>{allText}</Text>
          <LeftArrowIcon size={fontSize(14)} color="#8f8684" />
        </TouchableOpacity>
      )}
    </View>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

const SectionItem: React.FC<{item: any, onPress: () => void, hasBadge?: boolean, badgeCount?: number, t: (key: string) => string}> = ({ item, onPress, hasBadge, badgeCount, t }) => (
  <TouchableOpacity style={styles.sectionItem} onPress={onPress}>
    {hasBadge && badgeCount !== undefined && badgeCount > 0 && (
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
      </View>
    )}
    <Ionicons name={item.iconName as any} style={styles.sectionItemIcon} />
    <Text style={styles.sectionItemText}>{t(item.nameKey)}</Text>
  </TouchableOpacity>
);

export const OrderSection: React.FC<SectionProps> = ({ t, navigation }) => {
  const [statusCounts, setStatusCounts] = useState<OrderStatusCounts>({
    pending_payment: 0,
    pending_shipment: 0,
    in_transit: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchOrderStatusCounts();
  }, []);

  const fetchOrderStatusCounts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Token:', token ? 'exists' : 'not found');
      
      if (!token) {
        console.log('No token found, skipping API call');
        return;
      }

      console.log('Calling API: /api/orders/status-counts/');
      const response = await fetch('https://api.brainnel.com/backend/api/orders/status-counts/', {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
      });

      console.log('API Response status:', response.status);
      
      if (response.ok) {
        const data: OrderStatusCounts = await response.json();
        console.log('API Response data:', data);
        setStatusCounts(data);
      } else {
        console.error('API call failed with status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('获取订单状态数量失败:', error);
    }
  };

  const getStatusCount = (apiKey: string | null): number => {
    if (!apiKey) return 0;
    const count = statusCounts[apiKey as keyof OrderStatusCounts] || 0;
    console.log(`Status count for ${apiKey}:`, count);
    return count;
  };

  return (
    <SectionCard 
      title={t("profile.orders.title")} 
      allText={t("profile.orders.view_all")}
      onAllPress={() => navigation.navigate("Status", { status: null })}
    >
      {orderItems.map((item, index) => (
        <SectionItem
          key={index}
          item={item}
          t={t}
          hasBadge={item.status !== 3}
          badgeCount={getStatusCount(item.apiKey)}
          onPress={() => {
            if (item.status === 3) {
              navigation.navigate("Chat");
            } else {
              navigation.navigate("Status", { status: item.status });
            }
          }}
        />
      ))}
    </SectionCard>
  );
};

export const ToolSection: React.FC<SectionProps> = ({ t, navigation }) => (
  <SectionCard title={t("profile.services.title")}>
    {serviceItems.map((item, index) => (
      <SectionItem
        key={index}
        item={item}
        t={t}
        onPress={() => navigation.navigate(item.screen)}
      />
    ))}
  </SectionCard>
); 