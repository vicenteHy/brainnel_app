import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { getScreenWidth, isTablet } from '../utils/dimensions';
import { spacing } from '../constants/styles';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  maxWidth?: number;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  style,
  maxWidth = 1200,
  padding = 'md',
}) => {
  const screenWidth = getScreenWidth();
  const isTabletDevice = isTablet();
  
  // 计算容器宽度
  const containerWidth = Math.min(screenWidth, maxWidth);
  
  // 计算水平内边距
  const horizontalPadding = padding === 'none' 
    ? 0 
    : padding === 'sm' 
      ? spacing.sm 
      : padding === 'lg' 
        ? spacing.lg 
        : spacing.md;

  return (
    <View style={[styles.container, style]}>
      <View style={[
        styles.content,
        {
          width: containerWidth,
          paddingHorizontal: horizontalPadding,
        },
      ]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
}); 