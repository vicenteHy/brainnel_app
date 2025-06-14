import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { getPerformanceStats } from './PerformanceMonitor';

interface DebugConsoleProps {
  visible?: boolean;
}

// 存储最近的日志
const recentLogs: Array<{time: string, type: string, message: string}> = [];
const MAX_LOGS = 50;

// 拦截console.log
if (__DEV__) {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.log = (...args) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    if (message.includes('🔄') || message.includes('📄') || message.includes('🚀')) {
      recentLogs.unshift({
        time: new Date().toISOString().split('T')[1].slice(0, 12),
        type: 'log',
        message: message.substring(0, 200)
      });
      if (recentLogs.length > MAX_LOGS) recentLogs.pop();
    }
    originalLog.apply(console, args);
  };
  
  console.warn = (...args) => {
    const message = args.join(' ');
    if (message.includes('PerformanceMonitor')) {
      recentLogs.unshift({
        time: new Date().toISOString().split('T')[1].slice(0, 12),
        type: 'warn',
        message: message.substring(0, 200)
      });
      if (recentLogs.length > MAX_LOGS) recentLogs.pop();
    }
    originalWarn.apply(console, args);
  };
}

export const DebugConsole: React.FC<DebugConsoleProps> = ({ visible = __DEV__ }) => {
  const [logs, setLogs] = useState<typeof recentLogs>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [stats, setStats] = useState<Record<string, any>>({});
  
  useEffect(() => {
    if (!visible) return;
    
    const interval = setInterval(() => {
      setLogs([...recentLogs]);
      setStats(getPerformanceStats());
    }, 500);
    
    return () => clearInterval(interval);
  }, [visible]);
  
  if (!visible) return null;
  
  return (
    <>
      <TouchableOpacity 
        style={styles.toggleButton}
        onPress={() => setShowConsole(!showConsole)}
      >
        <Text style={styles.toggleText}>
          {showConsole ? '隐藏' : '调试'}
        </Text>
      </TouchableOpacity>
      
      {showConsole && (
        <View style={styles.container}>
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>性能统计:</Text>
            {Object.entries(stats).map(([name, stat]) => (
              <Text key={name} style={[
                styles.statText,
                stat.hasPerformanceIssue && styles.warningText
              ]}>
                {name}: {stat.totalRenders}次 (最近1秒: {stat.recentRenders}次)
              </Text>
            ))}
          </View>
          
          <ScrollView style={styles.logContainer}>
            {logs.map((log, index) => (
              <View key={index} style={styles.logItem}>
                <Text style={[
                  styles.logText,
                  log.type === 'warn' && styles.warnText,
                  log.type === 'error' && styles.errorText
                ]}>
                  [{log.time}] {log.message}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 5,
    zIndex: 10000,
  },
  toggleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  container: {
    position: 'absolute',
    top: 140,
    left: 10,
    right: 10,
    height: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 5,
    padding: 10,
    zIndex: 9999,
  },
  statsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 10,
    marginBottom: 10,
  },
  statsTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statText: {
    color: '#0f0',
    fontSize: 10,
  },
  warningText: {
    color: '#f00',
    fontWeight: 'bold',
  },
  logContainer: {
    flex: 1,
  },
  logItem: {
    marginBottom: 5,
  },
  logText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  warnText: {
    color: 'yellow',
  },
  errorText: {
    color: 'red',
  },
});