import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import VerificationLimiter from '../utils/verificationLimiter';
import fontSize from '../utils/fontsizeUtils';

interface VerificationLimitStatusProps {
  visible?: boolean;
  style?: any;
}

const VerificationLimitStatus: React.FC<VerificationLimitStatusProps> = ({ 
  visible = true, 
  style 
}) => {
  const [remainingAttempts, setRemainingAttempts] = useState({
    hourlyRemaining: 5,
    dailyRemaining: 10
  });

  useEffect(() => {
    if (visible) {
      loadRemainingAttempts();
    }
  }, [visible]);

  const loadRemainingAttempts = async () => {
    try {
      const attempts = await VerificationLimiter.getRemainingAttempts();
      setRemainingAttempts(attempts);
    } catch (error) {
      console.error('获取剩余次数失败:', error);
    }
  };

  if (!visible) {
    return null;
  }

  const showWarning = remainingAttempts.hourlyRemaining <= 1 || remainingAttempts.dailyRemaining <= 2;

  return (
    <View style={[styles.container, showWarning && styles.warningContainer, style]}>
      <Text style={[styles.text, showWarning && styles.warningText]}>
        今日剩余: {remainingAttempts.dailyRemaining}次 | 每小时剩余: {remainingAttempts.hourlyRemaining}次
      </Text>
      {showWarning && (
        <Text style={styles.warningSubtext}>
          验证码发送次数即将达到限制，请谨慎使用
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  warningContainer: {
    backgroundColor: '#FFF3CD',
    borderLeftColor: '#FF9500',
  },
  text: {
    fontSize: fontSize(12),
    color: '#666',
    textAlign: 'center',
  },
  warningText: {
    color: '#856404',
    fontWeight: '500',
  },
  warningSubtext: {
    fontSize: fontSize(11),
    color: '#856404',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default VerificationLimitStatus;