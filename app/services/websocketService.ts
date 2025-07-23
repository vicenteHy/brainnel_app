import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS, WS_BASE_URL } from "../constants/config";
import { handleMultipleDeviceLogin } from "../utils/navigationUtils";

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 3000; // 3秒
  private wsUrl: string = WS_BASE_URL;
  
  // 回调函数
  private onOpenCallback?: () => void;
  private onCloseCallback?: (event: WebSocketCloseEvent) => void;
  private onErrorCallback?: (error: WebSocketErrorEvent) => void;
  private onMessageCallback?: (data: any) => void;

  constructor() {
    // 绑定方法确保this上下文正确
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.reconnect = this.reconnect.bind(this);
  }

  // 设置回调函数
  onOpen(callback: () => void) {
    this.onOpenCallback = callback;
  }

  onClose(callback: (event: WebSocketCloseEvent) => void) {
    this.onCloseCallback = callback;
  }

  onError(callback: (error: WebSocketErrorEvent) => void) {
    this.onErrorCallback = callback;
  }

  onMessage(callback: (data: any) => void) {
    this.onMessageCallback = callback;
  }

  // 连接WebSocket
  async connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      console.log("WebSocket 已经连接或正在连接中");
      return;
    }

    this.isConnecting = true;

    try {
      // 获取token
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        console.log("没有找到token，无法建立WebSocket连接");
        this.isConnecting = false;
        return;
      }

      // 移除 Bearer 前缀（如果有）
      const cleanToken = token.replace(/^Bearer\s+/i, '');
      
      const url = `${this.wsUrl}?token=${cleanToken}`;
      console.log("🔄 正在连接WebSocket...");
      console.log(`🌐 目标地址: ${this.wsUrl}`);
      console.log(`🔑 Token长度: ${cleanToken.length}字符`);

      this.ws = new WebSocket(url);

      // 设置事件监听器
      this.ws.onopen = () => {
        console.log("🟢 WebSocket 连接成功");
        console.log(`📡 连接状态: ${this.getReadyStateText()}`);
        console.log(`🔗 URL: ${url}`);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        if (this.onOpenCallback) {
          this.onOpenCallback();
        }
      };

      this.ws.onclose = async (event: WebSocketCloseEvent) => {
        console.log("🔴 WebSocket 连接关闭");
        console.log(`❌ 关闭码: ${event.code}`);
        console.log(`📝 关闭原因: ${event.reason || '未知'}`);
        console.log(`🔄 是否正常关闭: ${event.code === 1000 ? '是' : '否'}`);
        this.isConnecting = false;
        
        if (this.onCloseCallback) {
          this.onCloseCallback(event);
        }

        // 处理认证失败（401错误通常会用4001关闭码）
        if (event.code === 4001 || event.reason?.includes('401') || event.reason?.includes('Unauthorized')) {
          console.log("WebSocket 认证失败，清除token");
          
          // 清除认证token
          await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          await AsyncStorage.removeItem("token");
          
          // 如果是多设备登录，显示提示
          if (event.reason?.includes('multiple device')) {
            setTimeout(() => {
              handleMultipleDeviceLogin();
            }, 100);
          }
          
          // 不再尝试重连
          return;
        }

        // 如果不是主动关闭，尝试重连
        if (event.code !== 1000) {
          this.reconnect();
        }
      };

      this.ws.onerror = (error: WebSocketErrorEvent) => {
        console.error("⚠️ WebSocket 错误:");
        console.error(`❌ 错误类型: ${error.type || '未知'}`);
        console.error(`📍 当前连接状态: ${this.getReadyStateText()}`);
        console.error("🔍 错误详情:", error);
        this.isConnecting = false;
        
        if (this.onErrorCallback) {
          this.onErrorCallback(error);
        }
      };

      this.ws.onmessage = (event: WebSocketMessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📨 收到WebSocket消息:");
          console.log(`⏰ 时间: ${new Date().toLocaleTimeString()}`);
          console.log(`📊 数据大小: ${event.data.length}字节`);
          console.log("📦 消息内容:", data);
          
          if (this.onMessageCallback) {
            this.onMessageCallback(data);
          }
        } catch (error) {
          console.error("❌ 解析WebSocket消息失败:");
          console.error("🔍 原始数据:", event.data);
          console.error("⚠️ 错误信息:", error);
        }
      };

    } catch (error) {
      console.error("❌ WebSocket 连接失败:");
      console.error("⚠️ 错误信息:", error);
      console.error(`🔄 将进行重连，当前重连次数: ${this.reconnectAttempts}`);
      this.isConnecting = false;
      this.reconnect();
    }
  }

  // 断开连接
  disconnect() {
    console.log("🔌 正在断开WebSocket连接...");
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
      console.log("⏹️ 已取消重连定时器");
    }

    if (this.ws) {
      console.log(`📍 断开前状态: ${this.getReadyStateText()}`);
      this.ws.close(1000, "主动断开连接");
      this.ws = null;
      console.log("✅ WebSocket连接已断开");
    } else {
      console.log("ℹ️ WebSocket未连接，无需断开");
    }

    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  // 重连逻辑
  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("达到最大重连次数，停止重连");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5); // 最多延迟15秒

    console.log(`⏳ 将在 ${delay / 1000} 秒后进行第 ${this.reconnectAttempts} 次重连`);
    console.log(`📊 最大重连次数: ${this.maxReconnectAttempts}`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  // 发送消息
  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      console.log("📤 发送WebSocket消息:");
      console.log(`⏰ 时间: ${new Date().toLocaleTimeString()}`);
      console.log(`📊 数据大小: ${message.length}字节`);
      console.log("📦 消息内容:", data);
      this.ws.send(message);
      console.log("✅ 消息发送成功");
    } else {
      console.warn("⚠️ WebSocket 未连接，无法发送消息");
      console.warn(`📍 当前连接状态: ${this.getReadyStateText()}`);
      console.warn("📦 尝试发送的数据:", data);
    }
  }

  // 获取连接状态
  getReadyState(): number | null {
    return this.ws ? this.ws.readyState : null;
  }

  // 检查是否已连接
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // 获取连接状态的文本描述
  private getReadyStateText(): string {
    if (!this.ws) return "未初始化";
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return "🟡 连接中 (CONNECTING)";
      case WebSocket.OPEN:
        return "🟢 已连接 (OPEN)";
      case WebSocket.CLOSING:
        return "🟠 关闭中 (CLOSING)";
      case WebSocket.CLOSED:
        return "🔴 已关闭 (CLOSED)";
      default:
        return "❓ 未知状态";
    }
  }
}

// 创建单例实例
const websocketService = new WebSocketService();

export default websocketService;