import React from 'react';
import { KeyboardAvoidingView, Platform, StatusBar, ViewStyle } from 'react-native';

interface CustomKeyboardAvoidingViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  keyboardVerticalOffset?: number;
}

export const CustomKeyboardAvoidingView: React.FC<CustomKeyboardAvoidingViewProps> = ({ 
  children, 
  style,
  keyboardVerticalOffset
}) => {
  // 为Android计算正确的offset
  const getKeyboardOffset = () => {
    if (keyboardVerticalOffset !== undefined) {
      return keyboardVerticalOffset;
    }
    
    // iOS保持原有逻辑
    if (Platform.OS === 'ios') {
      return 0;
    }
    
    // Android也使用0作为offset
    return 0;
  };

  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={getKeyboardOffset()}
    >
      {children}
    </KeyboardAvoidingView>
  );
};

export default CustomKeyboardAvoidingView;