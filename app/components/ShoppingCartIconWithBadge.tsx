import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ShoppingCartIcon from './ShoppingCartIcon';
import useCartStore from '../store/cartStore';

interface ShoppingCartIconWithBadgeProps {
  color?: string;
  size?: number;
}

const ShoppingCartIconWithBadge: React.FC<ShoppingCartIconWithBadgeProps> = ({ 
  color = "#373737", 
  size = 24 
}) => {
  const { cartItemCount } = useCartStore();

  return (
    <View style={styles.container}>
      <ShoppingCartIcon color={color} size={size} />
      {cartItemCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {cartItemCount > 99 ? '99+' : cartItemCount.toString()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6F30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ShoppingCartIconWithBadge; 