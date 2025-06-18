import React from 'react';
import { SafeAreaView, Platform, StatusBar, StyleSheet, ViewStyle } from 'react-native';

interface CustomSafeAreaViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
}

export const CustomSafeAreaView: React.FC<CustomSafeAreaViewProps> = ({ 
  children, 
  style,
  edges = ['top', 'bottom']
}) => {
  return (
    <SafeAreaView 
      style={[
        styles.container,
        style
      ]}
      edges={edges}
    >
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#ffffff"
        translucent={false}
      />
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

export default CustomSafeAreaView;