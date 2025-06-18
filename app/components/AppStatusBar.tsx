import React from 'react';
import { StatusBar, Platform } from 'react-native';

interface AppStatusBarProps {
  barStyle?: 'dark-content' | 'light-content' | 'default';
  backgroundColor?: string;
  translucent?: boolean;
}

export const AppStatusBar: React.FC<AppStatusBarProps> = ({ 
  barStyle = 'dark-content',
  backgroundColor = '#ffffff',
  translucent
}) => {
  // iOS保持原有行为，Android使用统一配置
  const isTranslucent = translucent !== undefined 
    ? translucent 
    : Platform.OS === 'ios' ? false : false; // 两个平台都默认不透明

  return (
    <StatusBar 
      barStyle={barStyle}
      backgroundColor={Platform.OS === 'android' ? backgroundColor : undefined}
      translucent={isTranslucent}
    />
  );
};

export default AppStatusBar;