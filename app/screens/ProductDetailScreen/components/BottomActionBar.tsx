import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import WhiteCircleIcon from '../../../components/WhiteCircleIconIcon';
import ShoppingCartIcon from '../../../components/ShoppingCartIcon';
import fontSize from '../../../utils/fontsizeUtils';
import { styles } from '../styles';

interface BottomActionBarProps {
  onChatNowPress: () => void;
  onAddToCartPress: () => void;
}

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
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
      <TouchableOpacity style={styles.chatNowButton} onPress={onChatNowPress}>
        <WhiteCircleIcon color="#fff" size={fontSize(20)} />
        <Text style={styles.chatNowText}>{t('chatNow')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.addToCartButton} onPress={onAddToCartPress}>
        <ShoppingCartIcon color="#fff" size={fontSize(20)} />
        <Text style={styles.addToCartText}>{t('addToCart')}</Text>
      </TouchableOpacity>
    </View>
  );
};