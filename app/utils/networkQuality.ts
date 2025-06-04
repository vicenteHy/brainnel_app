import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkQuality {
  type: 'slow' | 'medium' | 'fast';
  connectionType: string;
  effectiveType?: string;
  isConnected: boolean;
}

export interface LoadingStrategy {
  initialCount: number;
  preloadCount: number;
  triggerThreshold: number; // 剩余百分比触发预加载
  enableImageLazyLoad: boolean;
  maxConcurrentRequests: number;
}

class NetworkQualityDetector {
  private static instance: NetworkQualityDetector;
  private currentQuality: NetworkQuality = {
    type: 'medium',
    connectionType: 'unknown',
    isConnected: true,
  };
  
  private qualityChangeCallbacks: ((quality: NetworkQuality) => void)[] = [];

  static getInstance(): NetworkQualityDetector {
    if (!NetworkQualityDetector.instance) {
      NetworkQualityDetector.instance = new NetworkQualityDetector();
    }
    return NetworkQualityDetector.instance;
  }

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // 监听网络状态变化
    NetInfo.addEventListener(state => {
      const quality = this.analyzeNetworkQuality(state);
      if (quality.type !== this.currentQuality.type) {
        console.log('[NetworkQuality] 网络质量变化:', {
          from: this.currentQuality.type,
          to: quality.type,
          connectionType: quality.connectionType,
          effectiveType: quality.effectiveType,
        });
        this.currentQuality = quality;
        this.notifyQualityChange(quality);
      }
    });

    // 初始检测
    const state = await NetInfo.fetch();
    this.currentQuality = this.analyzeNetworkQuality(state);
    console.log('[NetworkQuality] 初始网络质量:', this.currentQuality);
  }

  private analyzeNetworkQuality(state: NetInfoState): NetworkQuality {
    const { type, isConnected, details } = state;
    
    if (!isConnected) {
      return {
        type: 'slow',
        connectionType: 'none',
        isConnected: false,
      };
    }

    let qualityType: 'slow' | 'medium' | 'fast' = 'medium';
    
    // 根据连接类型判断
    switch (type) {
      case 'wifi':
        qualityType = 'fast';
        break;
      case 'cellular':
        // 根据蜂窝网络类型细分
        const cellularGeneration = details?.cellularGeneration;
        if (cellularGeneration === '2g') {
          qualityType = 'slow';
        } else if (cellularGeneration === '3g') {
          qualityType = 'medium';
        } else if (cellularGeneration === '4g' || cellularGeneration === '5g') {
          qualityType = 'fast';
        } else {
          // 未知蜂窝类型，保守估计
          qualityType = 'medium';
        }
        break;
      case 'ethernet':
        qualityType = 'fast';
        break;
      default:
        qualityType = 'medium';
    }

    // 如果有effectiveType信息，优先使用（仅Web环境）
    if (details?.effectiveType) {
      switch (details.effectiveType) {
        case 'slow-2g':
        case '2g':
          qualityType = 'slow';
          break;
        case '3g':
          qualityType = 'medium';
          break;
        case '4g':
          qualityType = 'fast';
          break;
      }
    }

    return {
      type: qualityType,
      connectionType: type,
      effectiveType: details?.effectiveType,
      isConnected,
    };
  }

  getCurrentQuality(): NetworkQuality {
    return this.currentQuality;
  }

  getLoadingStrategy(): LoadingStrategy {
    const quality = this.currentQuality;
    
    // 针对非洲用户的网络环境优化策略
    switch (quality.type) {
      case 'slow':
        return {
          initialCount: 8,  // 2G/3G网络：减少初始加载
          preloadCount: 4,  // 预加载数量小
          triggerThreshold: 40, // 剩余40%时触发预加载
          enableImageLazyLoad: true,
          maxConcurrentRequests: 1, // 限制并发请求
        };
      
      case 'medium':
        return {
          initialCount: 12, // 3G/4G网络：适中加载
          preloadCount: 8,  
          triggerThreshold: 30, // 剩余30%时触发
          enableImageLazyLoad: true,
          maxConcurrentRequests: 2,
        };
      
      case 'fast':
        return {
          initialCount: 15, // WiFi/4G+：正常加载
          preloadCount: 10, 
          triggerThreshold: 25, // 剩余25%时触发
          enableImageLazyLoad: false, // 快网络可以直接加载图片
          maxConcurrentRequests: 3,
        };
      
      default:
        return {
          initialCount: 10,
          preloadCount: 6,
          triggerThreshold: 30,
          enableImageLazyLoad: true,
          maxConcurrentRequests: 2,
        };
    }
  }

  onQualityChange(callback: (quality: NetworkQuality) => void) {
    this.qualityChangeCallbacks.push(callback);
    
    // 返回取消监听的函数
    return () => {
      const index = this.qualityChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.qualityChangeCallbacks.splice(index, 1);
      }
    };
  }

  private notifyQualityChange(quality: NetworkQuality) {
    this.qualityChangeCallbacks.forEach(callback => {
      try {
        callback(quality);
      } catch (error) {
        console.error('[NetworkQuality] 回调执行错误:', error);
      }
    });
  }

  // 检测设备性能（简单估算）
  getDevicePerformance(): 'low' | 'medium' | 'high' {
    // 在React Native中，我们可以根据一些指标估算设备性能
    // 这里提供一个基础版本，实际项目中可以根据需要扩展
    
    try {
      // 可以根据设备内存、CPU核心数等判断
      // 这里使用简单的时间测试作为性能指标
      const start = Date.now();
      
      // 执行一个简单的计算密集任务
      let result = 0;
      for (let i = 0; i < 100000; i++) {
        result += Math.random();
      }
      
      const duration = Date.now() - start;
      
      if (duration < 10) {
        return 'high';
      } else if (duration < 20) {
        return 'medium';
      } else {
        return 'low';
      }
    } catch (error) {
      console.warn('[NetworkQuality] 设备性能检测失败:', error);
      return 'medium'; // 默认中等性能
    }
  }

  // 获取适应设备性能的加载策略
  getPerformanceAdjustedStrategy(): LoadingStrategy {
    const baseStrategy = this.getLoadingStrategy();
    const devicePerformance = this.getDevicePerformance();
    
    // 根据设备性能调整策略
    switch (devicePerformance) {
      case 'low':
        return {
          ...baseStrategy,
          initialCount: Math.max(6, Math.floor(baseStrategy.initialCount * 0.7)),
          preloadCount: Math.max(3, Math.floor(baseStrategy.preloadCount * 0.6)),
          triggerThreshold: Math.min(50, baseStrategy.triggerThreshold + 10),
          maxConcurrentRequests: 1,
          enableImageLazyLoad: true,
        };
      
      case 'medium':
        return baseStrategy; // 使用标准策略
      
      case 'high':
        return {
          ...baseStrategy,
          initialCount: Math.floor(baseStrategy.initialCount * 1.2),
          preloadCount: Math.floor(baseStrategy.preloadCount * 1.3),
          triggerThreshold: Math.max(20, baseStrategy.triggerThreshold - 5),
          maxConcurrentRequests: Math.min(4, baseStrategy.maxConcurrentRequests + 1),
        };
      
      default:
        return baseStrategy;
    }
  }
}

export const networkQualityDetector = NetworkQualityDetector.getInstance();
export default networkQualityDetector;