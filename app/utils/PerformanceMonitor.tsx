import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import fontSize from './fontsizeUtils';

interface PerformanceMonitorProps {
  name: string;
  visible?: boolean;
}

const renderCounts = new Map<string, number>();
const renderTimestamps = new Map<string, number[]>();

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  name, 
  visible = __DEV__ 
}) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  
  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;
    
    // 更新全局计数
    renderCounts.set(name, renderCount.current);
    
    // 记录渲染时间戳
    const timestamps = renderTimestamps.get(name) || [];
    timestamps.push(now);
    // 只保留最近10次的时间戳
    if (timestamps.length > 10) {
      timestamps.shift();
    }
    renderTimestamps.set(name, timestamps);
    
    // 计算最近1秒内的渲染次数
    const oneSecondAgo = now - 1000;
    const recentRenders = timestamps.filter(t => t > oneSecondAgo).length;
    
    // 如果1秒内渲染超过5次，可能有性能问题
    if (recentRenders > 5) {
      console.warn(`[PerformanceMonitor] ⚠️ ${name} 渲染过于频繁!`, {
        totalRenders: renderCount.current,
        recentRenders,
        timeSinceLastRender,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`[PerformanceMonitor] 📊 ${name} 渲染`, {
      renderCount: renderCount.current,
      timeSinceLastRender,
      recentRenders,
      timestamp: new Date().toISOString()
    });
  });
  
  if (!visible || !__DEV__) return null;
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{name}: {renderCount.current}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff0000cc',
    padding: 5,
    zIndex: 9999,
  },
  text: {
    color: 'white',
    fontSize: fontSize(10),
    fontWeight: 'bold',
  },
});

// 导出一个函数来获取所有组件的渲染统计
export const getPerformanceStats = () => {
  const stats: Record<string, any> = {};
  renderCounts.forEach((count, name) => {
    const timestamps = renderTimestamps.get(name) || [];
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    const recentRenders = timestamps.filter(t => t > oneSecondAgo).length;
    
    stats[name] = {
      totalRenders: count,
      recentRenders,
      hasPerformanceIssue: recentRenders > 5
    };
  });
  return stats;
};