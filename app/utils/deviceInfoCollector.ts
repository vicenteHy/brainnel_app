import NetInfo from '@react-native-community/netinfo';
import { Dimensions, PixelRatio, Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';
import * as Localization from 'expo-localization';

interface DeviceFingerprint {
  // 平台信息
  platform: string;
  platformVersion: string | undefined;
  
  // 应用信息
  appName: string | null;
  appVersion: string | null;
  appBuildVersion: string | null;
  bundleId: string | null;
  
  // 屏幕信息
  screenWidth: number;
  screenHeight: number;
  windowWidth: number;
  windowHeight: number;
  pixelRatio: number;
  fontScale: number;
  
  // 系统设置
  locale: string;
  locales: string[];
  timezone: string;
  isRTL: boolean;
  
  // 网络信息
  networkType: string | null;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  
  // Expo 配置信息
  expoVersion: string | null;
  sdkVersion: string | null;
  statusBarHeight: number | undefined;
  
  // 设备信息（从 Constants 获取）
  deviceName: string | undefined;
  isDevice: boolean | undefined;
  
  // 平台特定信息
  platformConstants: any;
  
  // 采集时间
  collectedAt: string;
}

export class DeviceInfoCollector {
  // 获取 iOS 设备型号映射
  private static getIOSDeviceModel(identifier: string): string {
    // iPhone 型号映射
    const modelMap: { [key: string]: string } = {
      // iPhone 15 系列
      'iPhone16,2': 'iPhone 15 Pro Max',
      'iPhone16,1': 'iPhone 15 Pro',
      'iPhone15,5': 'iPhone 15 Plus',
      'iPhone15,4': 'iPhone 15',
      
      // iPhone 14 系列
      'iPhone15,3': 'iPhone 14 Pro Max',
      'iPhone15,2': 'iPhone 14 Pro',
      'iPhone14,8': 'iPhone 14 Plus',
      'iPhone14,7': 'iPhone 14',
      
      // iPhone 13 系列
      'iPhone14,3': 'iPhone 13 Pro Max',
      'iPhone14,2': 'iPhone 13 Pro',
      'iPhone14,5': 'iPhone 13',
      'iPhone14,4': 'iPhone 13 mini',
      
      // iPhone 12 系列
      'iPhone13,4': 'iPhone 12 Pro Max',
      'iPhone13,3': 'iPhone 12 Pro',
      'iPhone13,2': 'iPhone 12',
      'iPhone13,1': 'iPhone 12 mini',
      
      // iPhone 11 系列
      'iPhone12,5': 'iPhone 11 Pro Max',
      'iPhone12,3': 'iPhone 11 Pro',
      'iPhone12,1': 'iPhone 11',
      
      // iPhone SE
      'iPhone14,6': 'iPhone SE (3rd generation)',
      'iPhone12,8': 'iPhone SE (2nd generation)',
      
      // iPad
      'iPad13,1': 'iPad Air (4th generation)',
      'iPad13,2': 'iPad Air (4th generation)',
      'iPad14,1': 'iPad mini (6th generation)',
      'iPad14,2': 'iPad mini (6th generation)',
      
      // 模拟器
      'x86_64': 'Simulator',
      'arm64': 'Simulator (Apple Silicon)',
    };
    
    return modelMap[identifier] || identifier;
  }
  
  static async collectDeviceInfo(): Promise<DeviceFingerprint> {
    try {
      console.log('===== 开始采集设备信息 =====');
      
      // 获取网络信息
      let netInfo = { type: null, isConnected: null, isInternetReachable: null };
      try {
        netInfo = await NetInfo.fetch();
      } catch (e) {
        console.warn('获取网络信息失败:', e);
      }
      
      // 获取屏幕信息
      const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');
      const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
      const pixelRatio = PixelRatio.get();
      const fontScale = PixelRatio.getFontScale();
      
      // 从 Constants 获取设备信息
      const deviceName = Constants.deviceName;
      const isDevice = Constants.isDevice;
      const statusBarHeight = Constants.statusBarHeight;
      
      // 安全获取 Localization 信息
      let locale = 'unknown';
      let locales: string[] = [];
      let timezone = 'unknown';
      let isRTL = false;
      
      try {
        if (Localization) {
          locale = Localization.locale || 'unknown';
          timezone = Localization.timezone || 'unknown';
          isRTL = Localization.isRTL || false;
          
          // 安全处理 locales
          if (Localization.locales && Array.isArray(Localization.locales)) {
            locales = Localization.locales.map(l => {
              if (typeof l === 'string') return l;
              if (l && typeof l.languageTag === 'string') return l.languageTag;
              if (l && typeof l.languageCode === 'string') return l.languageCode;
              return 'unknown';
            });
          }
        }
      } catch (e) {
        console.warn('获取本地化信息失败:', e);
      }
      
      // 获取平台特定的常量
      const platformConstants = Platform.constants || {};
      
      const deviceFingerprint: DeviceFingerprint = {
        // 平台信息
        platform: Platform.OS,
        platformVersion: Platform.Version?.toString(),
        
        // 应用信息
        appName: Constants.manifest?.name || Constants.expoConfig?.name || null,
        appVersion: Constants.manifest?.version || Constants.expoConfig?.version || null,
        appBuildVersion: Constants.manifest?.ios?.buildNumber || Constants.manifest?.android?.versionCode?.toString() || null,
        bundleId: Constants.manifest?.ios?.bundleIdentifier || Constants.manifest?.android?.package || Constants.expoConfig?.ios?.bundleIdentifier || Constants.expoConfig?.android?.package || null,
        
        // 屏幕信息
        screenWidth,
        screenHeight,
        windowWidth,
        windowHeight,
        pixelRatio,
        fontScale,
        
        // 系统设置
        locale,
        locales,
        timezone,
        isRTL,
        
        // 网络信息
        networkType: netInfo.type,
        isConnected: netInfo.isConnected,
        isInternetReachable: netInfo.isInternetReachable,
        
        // Expo 配置信息
        expoVersion: Constants.expoConfig?.version || null,
        sdkVersion: Constants.expoConfig?.sdkVersion || null,
        statusBarHeight,
        
        // 设备信息
        deviceName,
        isDevice,
        
        // 平台特定信息
        platformConstants,
        
        // 采集时间
        collectedAt: new Date().toISOString()
      };
      
      // 打印详细日志
      this.printDeviceInfo(deviceFingerprint);
      
      return deviceFingerprint;
    } catch (error) {
      console.error('采集设备信息失败:', error);
      throw error;
    }
  }
  
  private static printDeviceInfo(info: DeviceFingerprint) {
    console.log('\n===== 设备信息采集完成 =====\n');
    
    console.log('📱 平台信息:');
    console.log(`  操作系统: ${info.platform}`);
    console.log(`  系统版本: ${info.platformVersion || '未知'}`);
    console.log(`  设备名称: ${info.deviceName || '未知'}`);
    console.log(`  是否真机: ${info.isDevice ? '是' : '否'}`);
    console.log(`  状态栏高度: ${info.statusBarHeight || '未知'}`);
    
    console.log('\n📦 应用信息:');
    console.log(`  应用名: ${info.appName || '未知'}`);
    console.log(`  版本: ${info.appVersion || '未知'}`);
    console.log(`  构建版本: ${info.appBuildVersion || '未知'}`);
    console.log(`  Bundle ID: ${info.bundleId || '未知'}`);
    console.log(`  Expo版本: ${info.expoVersion || '未知'}`);
    console.log(`  SDK版本: ${info.sdkVersion || '未知'}`);
    
    console.log('\n📐 屏幕信息:');
    console.log(`  屏幕尺寸: ${info.screenWidth} x ${info.screenHeight}`);
    console.log(`  窗口尺寸: ${info.windowWidth} x ${info.windowHeight}`);
    console.log(`  像素密度: ${info.pixelRatio}`);
    console.log(`  字体缩放: ${info.fontScale}`);
    
    console.log('\n🌐 系统设置:');
    console.log(`  语言: ${info.locale}`);
    console.log(`  支持的语言: ${info.locales.join(', ')}`);
    console.log(`  时区: ${info.timezone}`);
    console.log(`  从右到左: ${info.isRTL ? '是' : '否'}`);
    
    console.log('\n📡 网络信息:');
    console.log(`  网络类型: ${info.networkType}`);
    console.log(`  已连接: ${info.isConnected ? '是' : '否'}`);
    console.log(`  可访问互联网: ${info.isInternetReachable ? '是' : '否'}`);
    
    console.log(`\n⏰ 采集时间: ${info.collectedAt}`);
    console.log('\n=============================\n');
    
    // 打印原始的 Platform 信息供调试
    console.log('\n🔍 调试信息:');
    console.log('Platform 详细信息:', {
      OS: Platform.OS,
      Version: Platform.Version,
      isPad: Platform.isPad,
      isTV: Platform.isTV,
      isTesting: Platform.isTesting,
      constants: info.platformConstants
    });
    
    // 如果是 Android，打印更多信息
    if (Platform.OS === 'android' && info.platformConstants) {
      console.log('\n🤖 Android 特定信息:');
      console.log(`  品牌: ${info.platformConstants.Brand || '未知'}`);
      console.log(`  型号: ${info.platformConstants.Model || '未知'}`);
      console.log(`  制造商: ${info.platformConstants.Manufacturer || '未知'}`);
      console.log(`  API级别: ${info.platformConstants.Version || '未知'}`);
      console.log(`  指纹: ${info.platformConstants.Fingerprint || '未知'}`);
      console.log(`  序列号: ${info.platformConstants.Serial || '未知'}`);
    }
    
    // 如果是 iOS，打印更多信息
    if (Platform.OS === 'ios' && info.platformConstants) {
      console.log('\n🍎 iOS 特定信息:');
      console.log(`  系统名称: ${info.platformConstants.systemName || '未知'}`);
      console.log(`  界面风格: ${info.platformConstants.interfaceIdiom || '未知'}`);
      console.log(`  是否为Catalyst: ${info.platformConstants.isMacCatalyst || false}`);
      
      // 尝试获取设备型号
      let deviceModel = '未知';
      
      // 方法1: 从 Constants.platform 获取
      if (Constants.platform?.ios?.model) {
        deviceModel = this.getIOSDeviceModel(Constants.platform.ios.model);
      }
      // 方法2: 从 Constants.deviceName 获取
      else if (info.deviceName) {
        deviceModel = info.deviceName;
      }
      // 方法3: 从 NativeModules 获取
      else if (NativeModules.PlatformConstants?.model) {
        deviceModel = this.getIOSDeviceModel(NativeModules.PlatformConstants.model);
      }
      
      console.log(`  设备型号: ${deviceModel}`);
      
      // 检查是否是模拟器
      if (!info.isDevice) {
        console.log(`  模拟器架构: ${Platform.constants?.reactNativeVersion ? 'React Native ' + JSON.stringify(Platform.constants.reactNativeVersion) : '未知'}`);
      }
    }
    
    // 打印 Constants 中的额外信息
    console.log('\n📱 Constants 额外信息:');
    console.log('Constants.platform 原始数据:', JSON.stringify(Constants.platform, null, 2));
    
    // 尝试从 NativeModules 获取更多信息
    if (Platform.OS === 'ios' && NativeModules.PlatformConstants) {
      console.log('\n📱 iOS NativeModules 信息:');
      console.log('PlatformConstants:', JSON.stringify(NativeModules.PlatformConstants, null, 2));
    }
    
    // 打印所有 Constants 信息以便调试
    console.log('\n📋 所有 Constants 信息:');
    const constantsInfo = {
      deviceName: Constants.deviceName,
      isDevice: Constants.isDevice,
      platform: Constants.platform,
      statusBarHeight: Constants.statusBarHeight,
      manifest: Constants.manifest ? {
        name: Constants.manifest.name,
        version: Constants.manifest.version,
        ios: Constants.manifest.ios
      } : null,
      expoConfig: Constants.expoConfig ? {
        name: Constants.expoConfig.name,
        version: Constants.expoConfig.version,
        ios: Constants.expoConfig.ios
      } : null
    };
    console.log(JSON.stringify(constantsInfo, null, 2));
  }
  
  // 计算设备指纹哈希
  static generateFingerprintHash(info: DeviceFingerprint): string {
    // 选择稳定的设备特征组合
    const stableFeatures = [
      info.platform,
      info.platformVersion,
      info.screenWidth,
      info.screenHeight,
      info.pixelRatio,
      info.locale,
      info.timezone,
      // 添加平台特定的硬件信息
      info.platformConstants?.Brand,
      info.platformConstants?.Model,
      info.platformConstants?.Manufacturer
    ].filter(Boolean).join('|');
    
    // 简单的哈希函数
    let hash = 0;
    for (let i = 0; i < stableFeatures.length; i++) {
      const char = stableFeatures.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(16);
  }
}

export default DeviceInfoCollector;