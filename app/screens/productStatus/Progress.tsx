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
  
  const statusMap: Record<number, string> = {
    4: t('order.status.expired'),
    5: t('order.status.cancelled'),
    6: t('order.status.refunded'),
  };

  if (statusMap[statuses]) {
    return (
      <View style={styles.mainContainer}>
        <Text style={styles.specialStatus}>{statusMap[statuses]}</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.progressContainer}>
        {labels.map((label, index) => (
          <React.Fragment key={index}>
            <View style={styles.stepContainer}>
              <View 
                style={[
                  styles.node,
                  index < statuses + 1 && styles.completedNode
                ]} 
              />
              <Text style={styles.label}>{label}</Text>
            </View>
            {index < labels.length - 1 && (
              <View 
                style={[
                  styles.line,
                  index < statuses && styles.completedLine
                ]} 
              />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 10,
  },
  stepContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  node: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
  },
  completedNode: {
    backgroundColor: '#4CAF50',
  },
  line: {
    height: 2,
    width: 40,
    backgroundColor: '#E0E0E0',
    marginTop: 10,
  },
  completedLine: {
    backgroundColor: '#4CAF50',
  },
  label: {
    fontSize: fontSize(12),
    color: '#666',
    textAlign: 'center',
    width: 60,
  },
  specialStatus: {
    fontSize: fontSize(16),
    color: '#FF5722',
    fontWeight: 'bold',
    marginVertical: 20,
  },
});

export default Progress;
