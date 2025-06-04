import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import fontSize from '../../../utils/fontsizeUtils';
import { styles } from '../styles';

interface BottomActionBarProps {
  onStorePress: () => void;
  onChatNowPress: () => void;
  onAddToCartPress: () => void;
}

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  onStorePress,
  onChatNowPress,
  onAddToCartPress,
}) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.fixedBottomBar, {
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 8,
    }]}>
      <TouchableOpacity style={styles.storeIconButton} onPress={onStorePress} activeOpacity={1}>
        <Ionicons name="storefront" size={24} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.chatNowButton} onPress={onChatNowPress} activeOpacity={1}>
        <Text style={styles.chatNowText}>{t('chatNow')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.addToCartButton} onPress={onAddToCartPress} activeOpacity={1}>
        <Text style={styles.addToCartText}>{t('addToCart')}</Text>
      </TouchableOpacity>
    </View>
  );
};