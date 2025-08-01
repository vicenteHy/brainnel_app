import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Clipboard,
  Alert,
} from 'react-native';
import log from '../utils/logger';
import { EventEmitter } from 'events';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function GlobalDebugOverlay() {
  const [logs, setLogs] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // 加载日志
  const loadLogs = () => {
    try {
      if ((log as any).isInitialized && typeof (log as any).getLogs === 'function') {
        const logContent = (log as any).getLogs();
        if (logContent && logContent.trim()) {
          setLogs(logContent);
        } else {
          setLogs('暂无日志');
        }
      } else {
        setLogs('日志系统未初始化');
      }
    } catch (error) {
      setLogs(`加载日志出错: ${error}`);
    }
  };
  
  useEffect(() => {
    // 每秒刷新日志
    const interval = setInterval(loadLogs, 1000);
    
    // 初始加载
    loadLogs();
    
    // 监听显示事件
    const handleShowDebug = () => {
      setIsVisible(true);
      log.info('[调试] 调试覆盖层已激活');
    };
    
    global.EventEmitter.on('SHOW_DEBUG_OVERLAY', handleShowDebug);
    
    return () => {
      clearInterval(interval);
      global.EventEmitter.off('SHOW_DEBUG_OVERLAY', handleShowDebug);
    };
  }, []);
  
  useEffect(() => {
    // 当日志更新时，自动滚动到底部
    if (scrollViewRef.current && isExpanded) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [logs, isExpanded]);
  
  if (!isVisible) {
    return null;
  }
  
  // 获取最新的几条日志
  const logLines = logs.split('\n').filter(line => line.trim());
  const recentLogs = isExpanded ? logLines : logLines.slice(-3);
  
  return (
    <View style={styles.container} pointerEvents="box-none">
      <TouchableOpacity
        style={[styles.content, isExpanded && styles.expandedContent]}
        activeOpacity={0.9}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.header}>
          <Text style={styles.title}>调试日志 {isExpanded ? '▼' : '▶'}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsVisible(false)}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView
          ref={scrollViewRef}
          style={[styles.logContainer, isExpanded && styles.expandedLogContainer]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={isExpanded}
        >
          {recentLogs.map((line, index) => (
            <Text key={index} style={styles.logText} numberOfLines={isExpanded ? undefined : 1}>
              {line}
            </Text>
          ))}
        </ScrollView>
        
        {isExpanded && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if ((log as any).clearLogs) {
                  (log as any).clearLogs();
                  setLogs('日志已清空');
                }
              }}
            >
              <Text style={styles.actionText}>清空</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if (logs && logs.trim()) {
                  Clipboard.setString(logs);
                  Alert.alert('成功', '日志已复制到剪贴板');
                  log.info('[调试] 日志已复制到剪贴板');
                } else {
                  Alert.alert('提示', '暂无日志可复制');
                }
              }}
            >
              <Text style={styles.actionText}>复制</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={async () => {
                try {
                  log.info('[测试] ========== 开始通知测试 ==========');
                  const notificationService = require('../services/notificationService').default;
                  const hasPermission = await notificationService.checkAndRequestPermission();
                  log.info('[测试] 权限状态:', hasPermission ? '已授权' : '未授权');
                  
                  if (hasPermission) {
                    const token = await notificationService.getToken();
                    log.info('[测试] Token:', token ? `${token.substring(0, 30)}...` : 'null');
                  }
                  log.info('[测试] ========== 测试完成 ==========');
                } catch (error) {
                  log.error('[测试] 失败:', error);
                }
              }}
            >
              <Text style={styles.actionText}>测试通知</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={async () => {
                try {
                  log.info('[诊断] ========== iOS 通知诊断 ==========');
                  const messaging = require('@react-native-firebase/messaging').default;
                  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                  
                  // 1. 检查 APNs 注册状态
                  log.info('[诊断] 1. APNs 注册检查:');
                  const isRegistered = messaging().isDeviceRegisteredForRemoteMessages;
                  log.info('[诊断] - 设备已注册 APNs:', isRegistered ? '是' : '否');
                  
                  // 2. 检查权限状态
                  log.info('[诊断] 2. 权限状态检查:');
                  const authStatus = await messaging().hasPermission();
                  log.info('[诊断] - 权限状态码:', authStatus);
                  log.info('[诊断] - 权限状态:', authStatus === 1 ? '已授权' : authStatus === 2 ? '临时授权' : authStatus === 0 ? '已拒绝' : '未确定');
                  
                  // 3. 检查已保存的 Token
                  log.info('[诊断] 3. Token 检查:');
                  const savedToken = await AsyncStorage.getItem('fcmToken');
                  log.info('[诊断] - 本地保存的 Token:', savedToken ? '存在' : '不存在');
                  if (savedToken) {
                    log.info('[诊断] - Token 长度:', savedToken.length);
                  }
                  
                  // 4. 尝试获取新 Token
                  log.info('[诊断] 4. 尝试获取新 Token:');
                  try {
                    const newToken = await messaging().getToken();
                    log.info('[诊断] - 新 Token 获取:', newToken ? '成功' : '失败');
                    if (newToken && savedToken) {
                      log.info('[诊断] - Token 是否变化:', newToken === savedToken ? '未变化' : '已变化');
                    }
                  } catch (tokenError) {
                    log.error('[诊断] - Token 获取错误:', tokenError);
                  }
                  
                  // 5. 检查 App 配置
                  log.info('[诊断] 5. App 配置检查:');
                  const Constants = require('expo-constants').default;
                  log.info('[诊断] - Bundle ID:', Constants.expoConfig?.ios?.bundleIdentifier || 'unknown');
                  log.info('[诊断] - 项目 ID:', Constants.expoConfig?.extra?.eas?.projectId || 'unknown');
                  
                  // 6. 检查后台模式
                  log.info('[诊断] 6. 后台模式检查:');
                  const infoPlist = Constants.expoConfig?.ios?.infoPlist;
                  const backgroundModes = infoPlist?.UIBackgroundModes || [];
                  log.info('[诊断] - 后台模式:', backgroundModes.join(', ') || '未配置');
                  log.info('[诊断] - 包含 remote-notification:', backgroundModes.includes('remote-notification') ? '是' : '否');
                  
                  log.info('[诊断] ========== 诊断完成 ==========');
                } catch (error) {
                  log.error('[诊断] 诊断过程出错:', error);
                }
              }}
            >
              <Text style={styles.actionText}>iOS诊断</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 10,
    right: 10,
    zIndex: 999999,
    elevation: 999999,
  },
  content: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  expandedContent: {
    maxHeight: screenHeight * 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    color: '#FF0000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    color: '#FF0000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logContainer: {
    maxHeight: 60,
  },
  expandedLogContainer: {
    maxHeight: screenHeight * 0.4,
  },
  logText: {
    color: '#FF6B6B',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 14,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 0, 0, 0.2)',
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderRadius: 4,
    marginBottom: 5,
    marginHorizontal: 5,
  },
  actionText: {
    color: '#FF0000',
    fontSize: 12,
    fontWeight: 'bold',
  },
});