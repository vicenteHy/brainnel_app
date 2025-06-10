import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './styles';
import LeftArrowIcon from '../../components/DownArrowIcon';
import fontSize from '../../utils/fontsizeUtils';
import Ionicons from '@expo/vector-icons/Ionicons';

interface SectionProps {
  t: (key: string) => string;
  navigation: any;
}

const orderItems = [
  { nameKey: 'profile.orders.status.to_pay', iconName: 'wallet-outline', status: 0 },
  { nameKey: 'profile.orders.status.to_ship', iconName: 'archive-outline', status: 1 },
  { nameKey: 'profile.orders.status.to_receive', iconName: 'rocket-outline', status: 2 },
  { nameKey: 'profile.orders.status.to_review', iconName: 'star-outline', status: 3 },
  { nameKey: 'profile.orders.status.after_sales', iconName: 'shield-checkmark-outline', status: 'chat' },
];

const serviceItems = [
  { nameKey: 'profile.services.item.collection', iconName: 'heart-outline', screen: 'Collection' },
  { nameKey: 'profile.services.item.history', iconName: 'time-outline', screen: 'BrowseHistoryScreen' },
  { nameKey: 'profile.services.item.address', iconName: 'location-outline', screen: 'AddressList' },
  { nameKey: 'profile.services.item.share', iconName: 'share-social-outline', screen: 'Share' },
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

const SectionItem: React.FC<{item: any, onPress: () => void, hasBadge?: boolean, t: (key: string) => string}> = ({ item, onPress, hasBadge, t }) => (
  <TouchableOpacity style={styles.sectionItem} onPress={onPress}>
    {hasBadge && item.badge > 0 && (
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>{item.badge}</Text>
      </View>
    )}
    <Ionicons name={item.iconName as any} style={styles.sectionItemIcon} />
    <Text style={styles.sectionItemText}>{t(item.nameKey)}</Text>
  </TouchableOpacity>
);

export const OrderSection: React.FC<SectionProps> = ({ t, navigation }) => (
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
        onPress={() => {
          if (item.status === 'chat') {
            navigation.navigate("Chat");
          } else {
            navigation.navigate("Status", { status: item.status });
          }
        }}
      />
    ))}
  </SectionCard>
);

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