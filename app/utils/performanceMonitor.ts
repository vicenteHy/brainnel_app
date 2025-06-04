class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private isDebugMode: boolean = __DEV__;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // 记录加载时间
  recordLoadTime(key: string, startTime: number, endTime?: number) {
    if (!this.isDebugMode) return;
    
    const duration = (endTime || Date.now()) - startTime;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const times = this.metrics.get(key)!;
    times.push(duration);
    
    // 只保留最近20次记录
    if (times.length > 20) {
      times.shift();
    }
    
    console.log(`[性能监控] ${key}: ${duration}ms`, {
      average: this.getAverageTime(key),
      count: times.length,
    });
  }

  // 获取平均加载时间
  getAverageTime(key: string): number {
    const times = this.metrics.get(key);
    if (!times || times.length === 0) return 0;
    
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  }

  // 获取性能报告
  getPerformanceReport(): Record<string, { average: number; count: number; latest: number }> {
    const report: Record<string, { average: number; count: number; latest: number }> = {};
    
    this.metrics.forEach((times, key) => {
      if (times.length > 0) {
        report[key] = {
          average: this.getAverageTime(key),
          count: times.length,
          latest: times[times.length - 1],
        };
      }
    });
    
    return report;
  }

  // 打印性能报告
  printReport() {
    if (!this.isDebugMode) return;
    
    const report = this.getPerformanceReport();
    console.log('\n=== 性能监控报告 ===');
    Object.entries(report).forEach(([key, data]) => {
      console.log(`${key}: 平均${data.average}ms, 最新${data.latest}ms, 记录${data.count}次`);
    });
    console.log('===================\n');
  }

  // 清除指定指标
  clearMetric(key: string) {
    this.metrics.delete(key);
  }

  // 清除所有指标
  clearAll() {
    this.metrics.clear();
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
export default performanceMonitor;