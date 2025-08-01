import { logger, consoleTransport, configLoggerType } from 'react-native-logs';

// 配置日志系统
const defaultConfig: configLoggerType = {
  severity: __DEV__ ? 'debug' : 'info', // 在生产环境也记录 info 级别
  transport: [consoleTransport],
  transportOptions: {
    colors: {
      info: 'blueBright',
      warn: 'yellowBright',
      error: 'redBright'
    }
  }
};

// 创建日志实例
const log = logger.createLogger(defaultConfig);

// 创建一个全局的日志存储（在所有环境中都启用）
const logs: string[] = [];
const MAX_LOGS = 1000;

// 保存原始方法
const originalMethods = {
  debug: log.debug.bind(log),
  info: log.info.bind(log),
  warn: log.warn.bind(log),
  error: log.error.bind(log)
};

// 重写日志方法以保存到内存
Object.keys(originalMethods).forEach((level) => {
  (log as any)[level] = (...args: any[]) => {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    logs.push(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    
    // 保持最新的日志
    if (logs.length > MAX_LOGS) {
      logs.shift();
    }
    
    // 调用原始方法
    (originalMethods as any)[level](...args);
  };
});

// 导出获取日志的方法（在所有环境中都可用）
(log as any).getLogs = () => logs.join('\n');
(log as any).clearLogs = () => {
  logs.length = 0;
};

// 添加一个标记表示日志系统已初始化
(log as any).isInitialized = true;

export default log;