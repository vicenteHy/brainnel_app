import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { getScreenWidth, isTablet } from '../utils/dimensions';
import { spacing } from '../constants/styles';

interface ResponsiveGridProps {
  children: React.ReactNode;
  style?: ViewStyle;
  columns?: number;
  gap?: 'none' | 'sm' | 'md' | 'lg';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  style,
  columns = 2,
  gap = 'md',
  padding = 'md',
}) => {
  const screenWidth = getScreenWidth();
  const isTabletDevice = isTablet();
  
  // 根据设备类型调整列数
  const adjustedColumns = isTabletDevice ? Math.min(columns * 1.5, 4) : columns;
  
  // 计算间距
  const gapSize = gap === 'none' 
    ? 0 
    : gap === 'sm' 
      ? spacing.sm 
      : gap === 'lg' 
        ? spacing.lg 
        : spacing.md;
        
  // 计算内边距
  const paddingSize = padding === 'none' 
    ? 0 
    : padding === 'sm' 
      ? spacing.sm 
      : padding === 'lg' 
        ? spacing.lg 
        : spacing.md;

  // 计算每个项目的宽度
  const itemWidth = (screenWidth - (paddingSize * 2) - (gapSize * (adjustedColumns - 1))) / adjustedColumns;

  // 将子元素转换为数组
  const childrenArray = React.Children.toArray(children);

  return (
    <View style={[styles.container, { padding: paddingSize }, style]}>
      <View style={[styles.grid, { gap: gapSize }]}>
        {childrenArray.map((child, index) => (
          <View key={index} style={{ width: itemWidth }}>
            {child}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
}); 