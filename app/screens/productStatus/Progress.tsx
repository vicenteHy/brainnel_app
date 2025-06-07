import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import fontSize from '../../utils/fontsizeUtils';

interface ProgressProps {
  statuses: number;
  labels?: string[];
}

const Progress: React.FC<ProgressProps> = ({ statuses, labels = [] }) => {
  const { t } = useTranslation();
  
  const statusMap: Record<number, { text: string; color: string; bgColor: string }> = {
    4: { 
      text: t('order.status.expired'), 
      color: '#ff6b6b', 
      bgColor: '#fff5f5' 
    },
    5: { 
      text: t('order.status.cancelled'), 
      color: '#ff6b6b', 
      bgColor: '#fff5f5' 
    },
    6: { 
      text: t('order.status.refunded'), 
      color: '#74b9ff', 
      bgColor: '#f0f8ff' 
    },
  };

  if (statusMap[statuses]) {
    const status = statusMap[statuses];
    return (
      <View style={styles.mainContainer}>
        <View style={[styles.specialStatusContainer, { backgroundColor: status.bgColor }]}>
          <Text style={[styles.specialStatus, { color: status.color }]}>
            {status.text}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.progressContainer}>
        {/* 节点和标签 */}
        {labels.map((label, index) => (
          <View style={styles.stepContainer} key={index}>
            <View 
              style={[
                styles.node,
                index < statuses + 1 ? styles.completedNode : styles.pendingNode
              ]} 
            >
              {index < statuses + 1 && (
                <Text style={styles.checkmarkText}>✓</Text>
              )}
            </View>
            <Text 
              style={[
                styles.label,
                index < statuses + 1 ? styles.completedLabel : styles.pendingLabel
              ]}
              numberOfLines={2}
            >
              {label}
            </Text>
          </View>
        ))}
        
        {/* 背景连接线 */}
        <View style={styles.backgroundLine} />
        
        {/* 进度连接线 */}
        <View 
          style={[
            styles.progressLine,
            { width: `${(statuses / (labels.length - 1)) * 100}%` }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    width: '100%',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 320,
    position: 'relative',
  },
  stepContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
    zIndex: 2,
  },
  node: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  completedNode: {
    backgroundColor: '#f77f3a',
    borderWidth: 2,
    borderColor: '#fff',
  },
  pendingNode: {
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: fontSize(12),
    fontWeight: '700',
  },
  backgroundLine: {
    position: 'absolute',
    top: 14,
    left: '12.5%',
    right: '12.5%',
    height: 2,
    backgroundColor: '#e8e8e8',
    zIndex: 1,
  },
  progressLine: {
    position: 'absolute',
    top: 14,
    left: '12.5%',
    height: 2,
    backgroundColor: '#f77f3a',
    zIndex: 1,
    borderRadius: 1,
  },
  label: {
    fontSize: fontSize(9),
    textAlign: 'center',
    lineHeight: fontSize(12),
    fontWeight: '500',
    width: '100%',
    paddingHorizontal: 1,
    marginTop: 4,
  },
  completedLabel: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  pendingLabel: {
    color: '#999',
    fontWeight: '500',
  },
  specialStatusContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  specialStatus: {
    fontSize: fontSize(15),
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});

export default Progress;
