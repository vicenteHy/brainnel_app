import NetInfo from '@react-native-community/netinfo';
import { Dimensions, PixelRatio, Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';
import * as Localization from 'expo-localization';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';

interface DeviceFingerprint {
  // 设备唯一标识
  deviceId: string; // 持久化的设备ID
  installationId: string | null; // 应用安装ID
  
  // 硬件信息
  brand: string | null; // 设备品牌
  manufacturer: string | null; // 制造商
  modelName: string | null; // 设备型号名称
  modelId: string | null; // 设备型号ID
  deviceType: number | null; // 设备类型（手机/平板）
  deviceYearClass: number | null; // 设备年份等级
  totalMemory: number | null; // 总内存
  supportedCpuArchitectures: string[] | null; // CPU架构
  
  // 平台信息
  platform: string;
  platformVersion: string | undefined;
  osName: string | null; // 操作系统名称
  osBuildId: string | null; // 系统构建ID
  osBuildFingerprint: string | null; // Android指纹
  
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
  screenDensity: number | null; // 屏幕密度DPI
  
  // 系统设置
  locale: string;
  locales: string[];
  timezone: string;
  isRTL: boolean;
  is24HourFormat: boolean | null; // 24小时制
  
  // 字体信息
  systemFonts: string[] | null; // 系统可用字体列表
  defaultFont: string | null; // 默认字体
  fontSmoothing: boolean | null; // 字体平滑
  
  // 网络信息
  networkType: string | null;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  carrier: string | null; // 运营商
  
  // 设备状态
  isDevice: boolean | null;
  isEmulator: boolean | null; // 是否模拟器
  
  // Android特定
  androidId: string | null; // Android ID
  androidFingerprint: string | null; // Android设备指纹
  
  // 用户代理
  userAgent: string; // User Agent 字符串
  
  // 采集时间
  collectedAt: string;
  
  // 指纹哈希
  fingerprintHash: string;
}

// 后端匹配用的简化指纹
interface DeviceFingerprintForMatching {
  deviceId: string;
  fingerprintHash: string;
  
  // 核心硬件特征
  brand: string | null;
  manufacturer: string | null;
  modelName: string | null;
  modelId: string | null;
  
  // 核心系统特征
  platform: string;
  platformVersion: string | undefined;
  
  // 核心屏幕特征
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  screenDensity: number | null;
  
  // Android特定标识
  androidId: string | null;
  androidFingerprint: string | null;
  
  // iOS特定标识
  iosModel: string | null;
  
  // 其他稳定特征
  timezone: string;
  locale: string;
  totalMemory: number | null;
  deviceYearClass: number | null;
}

// 简化的设备信息接口
interface SimpleDeviceInfo {
  pixelRatio: number;
  screenSize: string;
  brand: string | null;
  platformVersion: string | undefined;
  fontScale: number;
  defaultFont: string | null;
  fingerprintString: string; // 规范化的指纹字符串
  fingerprintHash: string; // SHA-256 哈希值
}

export class DeviceFingerprintCollector {
  private static readonly DEVICE_ID_KEY = '@device_fingerprint_id';
  
  // Android API 级别到版本号映射
  private static readonly ANDROID_API_TO_VERSION: { [key: string]: string } = {
    '34': 'Android 14',
    '33': 'Android 13',
    '32': 'Android 12L',
    '31': 'Android 12',
    '30': 'Android 11',
    '29': 'Android 10',
    '28': 'Android 9',
    '27': 'Android 8.1',
    '26': 'Android 8.0',
    '25': 'Android 7.1',
    '24': 'Android 7.0',
    '23': 'Android 6.0',
    '22': 'Android 5.1',
    '21': 'Android 5.0',
    '20': 'Android 4.4W',
    '19': 'Android 4.4',
    '18': 'Android 4.3',
    '17': 'Android 4.2',
    '16': 'Android 4.1',
    '15': 'Android 4.0.3',
    '14': 'Android 4.0',
  };
  
  // 获取 Android 版本号
  static getAndroidVersionName(apiLevel: string | undefined): string | undefined {
    if (!apiLevel) return undefined;
    return this.ANDROID_API_TO_VERSION[apiLevel] || `Android API ${apiLevel}`;
  }
  
  // 获取或生成持久化的设备ID
  private static async getOrCreateDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem(this.DEVICE_ID_KEY);
      if (!deviceId) {
        deviceId = uuidv4();
        await AsyncStorage.setItem(this.DEVICE_ID_KEY, deviceId);
      }
      return deviceId;
    } catch (error) {
      console.warn('获取设备ID失败:', error);
      return uuidv4();
    }
  }
  
  // 获取iOS设备型号
  private static getIOSModel(): string | null {
    if (Platform.OS !== 'ios') return null;
    
    // 尝试多种方式获取
    if (Constants.platform?.ios?.model) {
      return Constants.platform.ios.model;
    }
    
    if (NativeModules.PlatformConstants?.model) {
      return NativeModules.PlatformConstants.model;
    }
    
    return null;
  }
  
  // 收集完整设备信息
  static async collectFullDeviceInfo(): Promise<DeviceFingerprint> {
    try {
      console.log('开始采集设备指纹信息...');
      
      // 获取持久化的设备ID
      const deviceId = await this.getOrCreateDeviceId();
      
      // 获取应用安装ID
      let installationId: string | null = null;
      try {
        // 检查方法是否存在
        if (typeof Application.getInstallationIdAsync === 'function') {
          installationId = await Application.getInstallationIdAsync();
        } else {
          // 如果方法不存在，使用 installationId 作为替代
          installationId = Application.installationId || null;
        }
      } catch (e) {
        console.warn('获取安装ID失败:', e);
      }
      
      // 获取网络信息
      let netInfo = { type: null, isConnected: null, isInternetReachable: null, details: null } as any;
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
      
      // 获取硬件信息
      const brand = Device.brand;
      const manufacturer = Device.manufacturer;
      const modelName = Device.modelName;
      const modelId = Device.modelId;
      const deviceType = Device.deviceType;
      const deviceYearClass = Device.deviceYearClass;
      const totalMemory = Device.totalMemory;
      const supportedCpuArchitectures = Device.supportedCpuArchitectures;
      const isDevice = Device.isDevice;
      const osName = Device.osName;
      const osBuildId = Device.osBuildId;
      const osBuildFingerprint = Device.osBuildFingerprint;
      
      // 获取运营商信息（仅Android）
      let carrier: string | null = null;
      if (Platform.OS === 'android' && netInfo.details && netInfo.details.carrier) {
        carrier = netInfo.details.carrier;
      }
      
      // 获取平台特定的常量
      const platformConstants = Platform.constants || {};
      
      // Android特定信息
      let androidId: string | null = null;
      let androidFingerprint: string | null = null;
      if (Platform.OS === 'android') {
        androidId = Application.androidId || null;
        androidFingerprint = platformConstants.Fingerprint || osBuildFingerprint;
      }
      
      // 字体信息采集
      let systemFonts: string[] | null = null;
      let defaultFont: string | null = null;
      let fontSmoothing: boolean | null = null;
      
      try {
        if (Platform.OS === 'android') {
          // Android 平台字体信息
          if (platformConstants.systemFontFamilies) {
            systemFonts = platformConstants.systemFontFamilies;
          }
          // Android 默认字体通常是 Roboto
          defaultFont = 'Roboto';
        } else if (Platform.OS === 'ios') {
          // iOS 平台字体信息
          if (platformConstants.systemFontFamilies) {
            systemFonts = platformConstants.systemFontFamilies;
          }
          // iOS 默认字体
          defaultFont = platformConstants.systemFontFamily || 'System';
          // iOS 字体平滑始终开启
          fontSmoothing = true;
        }
      } catch (e) {
        console.warn('获取字体信息失败:', e);
      }
      
      // 屏幕密度
      let screenDensity: number | null = null;
      if (Platform.OS === 'android' && platformConstants.Density) {
        screenDensity = platformConstants.Density * 160; // 转换为DPI
      } else if (Platform.OS === 'ios') {
        screenDensity = pixelRatio * 160; // 估算iOS DPI
      }
      
      // 系统设置
      let locale = 'unknown';
      let locales: string[] = [];
      let timezone = 'unknown';
      let isRTL = false;
      let is24HourFormat: boolean | null = null;
      
      try {
        if (Localization) {
          locale = Localization.locale || 'unknown';
          timezone = Localization.timezone || 'unknown';
          isRTL = Localization.isRTL || false;
          is24HourFormat = Localization.uses24HourClock || null;
          
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
      
      const deviceFingerprint: DeviceFingerprint = {
        // 设备唯一标识
        deviceId,
        installationId,
        
        // 硬件信息
        brand,
        manufacturer,
        modelName,
        modelId,
        deviceType,
        deviceYearClass,
        totalMemory,
        supportedCpuArchitectures,
        
        // 平台信息
        platform: Platform.OS,
        platformVersion: Platform.Version?.toString(),
        osName,
        osBuildId,
        osBuildFingerprint,
        
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
        screenDensity,
        
        // 系统设置
        locale,
        locales,
        timezone,
        isRTL,
        is24HourFormat,
        
        // 网络信息
        networkType: netInfo.type,
        isConnected: netInfo.isConnected,
        isInternetReachable: netInfo.isInternetReachable,
        carrier,
        
        // 设备状态
        isDevice,
        isEmulator: !isDevice,
        
        // Android特定
        androidId,
        androidFingerprint,
        
        // 字体信息
        systemFonts,
        defaultFont,
        fontSmoothing,
        
        // 采集时间
        collectedAt: new Date().toISOString(),
        
        // 指纹哈希（稍后计算）
        fingerprintHash: ''
      };
      
      // 计算指纹哈希
      deviceFingerprint.fingerprintHash = this.generateFingerprintHash(deviceFingerprint);
      
      console.log('设备指纹采集完成');
      return deviceFingerprint;
    } catch (error) {
      console.error('采集设备信息失败:', error);
      throw error;
    }
  }
  
  // 获取用于后端匹配的简化指纹
  static async collectDeviceFingerprintForMatching(): Promise<DeviceFingerprintForMatching> {
    const fullInfo = await this.collectFullDeviceInfo();
    
    return {
      deviceId: fullInfo.deviceId,
      fingerprintHash: fullInfo.fingerprintHash,
      
      // 核心硬件特征
      brand: fullInfo.brand,
      manufacturer: fullInfo.manufacturer,
      modelName: fullInfo.modelName,
      modelId: fullInfo.modelId,
      
      // 核心系统特征
      platform: fullInfo.platform,
      platformVersion: fullInfo.platformVersion,
      
      // 核心屏幕特征
      screenWidth: fullInfo.screenWidth,
      screenHeight: fullInfo.screenHeight,
      pixelRatio: fullInfo.pixelRatio,
      screenDensity: fullInfo.screenDensity,
      
      // Android特定标识
      androidId: fullInfo.androidId,
      androidFingerprint: fullInfo.androidFingerprint,
      
      // iOS特定标识
      iosModel: this.getIOSModel(),
      
      // 其他稳定特征
      timezone: fullInfo.timezone,
      locale: fullInfo.locale,
      totalMemory: fullInfo.totalMemory,
      deviceYearClass: fullInfo.deviceYearClass
    };
  }
  
  // 使用SHA-256生成更安全的指纹哈希
  private static generateFingerprintHash(info: DeviceFingerprint): string {
    // 选择稳定的设备特征组合
    const stableFeatures = [
      info.platform,
      info.platformVersion,
      info.brand,
      info.manufacturer,
      info.modelName,
      info.modelId,
      info.screenWidth,
      info.screenHeight,
      info.pixelRatio,
      info.screenDensity,
      info.locale,
      info.timezone,
      info.totalMemory,
      info.deviceYearClass,
      // Android特定
      info.androidId,
      info.androidFingerprint,
      info.osBuildFingerprint,
      // iOS特定
      Platform.OS === 'ios' ? this.getIOSModel() : null
    ].filter(Boolean).join('|');
    
    // 使用简单的哈希函数（在React Native中crypto模块不可用）
    let hash = 0;
    for (let i = 0; i < stableFeatures.length; i++) {
      const char = stableFeatures.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    // 转换为16进制字符串
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
  
  // 打印完整的设备指纹信息
  static printDeviceFingerprint(fingerprint: DeviceFingerprint | DeviceFingerprintForMatching) {
    console.log('\n===== 设备指纹详细信息 =====\n');
    
    // 设备标识
    console.log('🔑 设备标识:');
    console.log(`  设备ID: ${fingerprint.deviceId}`);
    console.log(`  指纹哈希: ${fingerprint.fingerprintHash}`);
    if ('installationId' in fingerprint) {
      console.log(`  安装ID: ${fingerprint.installationId || '未知'}`);
    }
    
    // 硬件信息
    console.log('\n📱 硬件信息:');
    console.log(`  品牌: ${fingerprint.brand || '未知'}`);
    console.log(`  制造商: ${fingerprint.manufacturer || '未知'}`);
    console.log(`  型号名称: ${fingerprint.modelName || '未知'}`);
    console.log(`  型号ID: ${fingerprint.modelId || '未知'}`);
    if ('deviceType' in fingerprint) {
      console.log(`  设备类型: ${fingerprint.deviceType === 1 ? '手机' : fingerprint.deviceType === 2 ? '平板' : '未知'}`);
    }
    console.log(`  设备年份: ${fingerprint.deviceYearClass || '未知'}`);
    console.log(`  总内存: ${fingerprint.totalMemory ? (fingerprint.totalMemory / 1024 / 1024 / 1024).toFixed(2) + ' GB' : '未知'}`);
    if ('supportedCpuArchitectures' in fingerprint) {
      console.log(`  CPU架构: ${fingerprint.supportedCpuArchitectures?.join(', ') || '未知'}`);
    }
    
    // 系统信息
    console.log('\n💻 系统信息:');
    console.log(`  平台: ${fingerprint.platform}`);
    
    // 显示友好的系统版本
    if (fingerprint.platform === 'android' && fingerprint.platformVersion) {
      const androidVersion = this.getAndroidVersionName(fingerprint.platformVersion);
      console.log(`  系统版本: ${androidVersion} (API ${fingerprint.platformVersion})`);
    } else if (fingerprint.platform === 'ios' && fingerprint.platformVersion) {
      console.log(`  系统版本: iOS ${fingerprint.platformVersion}`);
    } else {
      console.log(`  系统版本: ${fingerprint.platformVersion || '未知'}`);
    }
    
    if ('osName' in fingerprint) {
      console.log(`  系统名称: ${fingerprint.osName || '未知'}`);
      console.log(`  构建ID: ${fingerprint.osBuildId || '未知'}`);
      console.log(`  系统指纹: ${fingerprint.osBuildFingerprint || '未知'}`);
    }
    
    // 屏幕信息
    console.log('\n📐 屏幕信息:');
    console.log(`  屏幕尺寸: ${fingerprint.screenWidth} x ${fingerprint.screenHeight}`);
    console.log(`  像素比: ${fingerprint.pixelRatio}`);
    console.log(`  屏幕密度: ${fingerprint.screenDensity ? fingerprint.screenDensity + ' DPI' : '未知'}`);
    if ('windowWidth' in fingerprint) {
      console.log(`  窗口尺寸: ${fingerprint.windowWidth} x ${fingerprint.windowHeight}`);
      console.log(`  字体缩放: ${fingerprint.fontScale}`);
    }
    
    // 地区设置
    console.log('\n🌍 地区设置:');
    console.log(`  语言: ${fingerprint.locale}`);
    console.log(`  时区: ${fingerprint.timezone}`);
    if ('locales' in fingerprint) {
      console.log(`  支持的语言: ${fingerprint.locales.join(', ')}`);
      console.log(`  从右到左: ${fingerprint.isRTL ? '是' : '否'}`);
      console.log(`  24小时制: ${fingerprint.is24HourFormat ? '是' : '否'}`);
    }
    
    // 字体信息
    if ('systemFonts' in fingerprint || 'defaultFont' in fingerprint) {
      console.log('\n🔤 字体信息:');
      console.log(`  字体缩放: ${fingerprint.fontScale || 1}`);
      console.log(`  默认字体: ${fingerprint.defaultFont || '未知'}`);
      if ('fontSmoothing' in fingerprint) {
        console.log(`  字体平滑: ${fingerprint.fontSmoothing ? '开启' : (fingerprint.fontSmoothing === false ? '关闭' : '未知')}`);
      }
      if ('systemFonts' in fingerprint && fingerprint.systemFonts) {
        console.log(`  系统字体数量: ${fingerprint.systemFonts.length}`);
        if (fingerprint.systemFonts.length > 0 && fingerprint.systemFonts.length <= 10) {
          console.log(`  系统字体列表: ${fingerprint.systemFonts.join(', ')}`);
        }
      }
    }
    
    // 网络信息
    if ('networkType' in fingerprint) {
      console.log('\n📡 网络信息:');
      console.log(`  网络类型: ${fingerprint.networkType || '未知'}`);
      console.log(`  已连接: ${fingerprint.isConnected ? '是' : '否'}`);
      console.log(`  可访问互联网: ${fingerprint.isInternetReachable ? '是' : '否'}`);
      console.log(`  运营商: ${fingerprint.carrier || '未知'}`);
    }
    
    // 应用信息
    if ('appName' in fingerprint) {
      console.log('\n📦 应用信息:');
      console.log(`  应用名: ${fingerprint.appName || '未知'}`);
      console.log(`  版本: ${fingerprint.appVersion || '未知'}`);
      console.log(`  构建版本: ${fingerprint.appBuildVersion || '未知'}`);
      console.log(`  Bundle ID: ${fingerprint.bundleId || '未知'}`);
    }
    
    // 平台特定信息
    if (fingerprint.platform === 'android') {
      console.log('\n🤖 Android特定信息:');
      console.log(`  Android ID: ${fingerprint.androidId || '未知'}`);
      console.log(`  Android指纹: ${fingerprint.androidFingerprint || '未知'}`);
    } else if (fingerprint.platform === 'ios' && 'iosModel' in fingerprint) {
      console.log('\n🍎 iOS特定信息:');
      console.log(`  iOS型号: ${fingerprint.iosModel || '未知'}`);
    }
    
    // 设备状态
    if ('isDevice' in fingerprint) {
      console.log('\n📊 设备状态:');
      console.log(`  是否真机: ${fingerprint.isDevice ? '是' : '否'}`);
      console.log(`  是否模拟器: ${fingerprint.isEmulator ? '是' : '否'}`);
    }
    
    // 采集时间
    if ('collectedAt' in fingerprint) {
      console.log(`\n⏰ 采集时间: ${fingerprint.collectedAt}`);
    }
    
    console.log('\n=============================\n');
  }
  
  // 验证两个指纹是否匹配
  static compareFingerprints(fingerprint1: DeviceFingerprintForMatching, fingerprint2: DeviceFingerprintForMatching): number {
    let matchScore = 0;
    let totalWeight = 0;
    
    // 权重配置
    const weights = {
      deviceId: 50, // 最高权重
      fingerprintHash: 30,
      brand: 10,
      modelName: 10,
      screenSize: 8,
      androidId: 20,
      androidFingerprint: 15,
      iosModel: 20,
      platform: 5,
      timezone: 3,
      locale: 3
    };
    
    // 比较设备ID（最重要）
    if (fingerprint1.deviceId === fingerprint2.deviceId) {
      matchScore += weights.deviceId;
    }
    totalWeight += weights.deviceId;
    
    // 比较指纹哈希
    if (fingerprint1.fingerprintHash === fingerprint2.fingerprintHash) {
      matchScore += weights.fingerprintHash;
    }
    totalWeight += weights.fingerprintHash;
    
    // 比较品牌和型号
    if (fingerprint1.brand && fingerprint1.brand === fingerprint2.brand) {
      matchScore += weights.brand;
    }
    if (fingerprint1.brand) totalWeight += weights.brand;
    
    if (fingerprint1.modelName && fingerprint1.modelName === fingerprint2.modelName) {
      matchScore += weights.modelName;
    }
    if (fingerprint1.modelName) totalWeight += weights.modelName;
    
    // 比较屏幕尺寸
    if (fingerprint1.screenWidth === fingerprint2.screenWidth && 
        fingerprint1.screenHeight === fingerprint2.screenHeight) {
      matchScore += weights.screenSize;
    }
    totalWeight += weights.screenSize;
    
    // Android特定比较
    if (fingerprint1.platform === 'android') {
      if (fingerprint1.androidId && fingerprint1.androidId === fingerprint2.androidId) {
        matchScore += weights.androidId;
      }
      if (fingerprint1.androidId) totalWeight += weights.androidId;
      
      if (fingerprint1.androidFingerprint && fingerprint1.androidFingerprint === fingerprint2.androidFingerprint) {
        matchScore += weights.androidFingerprint;
      }
      if (fingerprint1.androidFingerprint) totalWeight += weights.androidFingerprint;
    }
    
    // iOS特定比较
    if (fingerprint1.platform === 'ios') {
      if (fingerprint1.iosModel && fingerprint1.iosModel === fingerprint2.iosModel) {
        matchScore += weights.iosModel;
      }
      if (fingerprint1.iosModel) totalWeight += weights.iosModel;
    }
    
    // 其他特征比较
    if (fingerprint1.platform === fingerprint2.platform) {
      matchScore += weights.platform;
    }
    totalWeight += weights.platform;
    
    if (fingerprint1.timezone === fingerprint2.timezone) {
      matchScore += weights.timezone;
    }
    totalWeight += weights.timezone;
    
    if (fingerprint1.locale === fingerprint2.locale) {
      matchScore += weights.locale;
    }
    totalWeight += weights.locale;
    
    // 返回匹配度百分比
    return totalWeight > 0 ? (matchScore / totalWeight) * 100 : 0;
  }
  
  // 生成规范化的指纹字符串
  private static normalizeString(str: string | null | undefined): string {
    if (!str) return '';
    // 转换为小写并去除所有空白字符
    return str.toLowerCase().replace(/\s+/g, '');
  }
  
  // 生成设备指纹字符串和哈希
  private static generateDeviceFingerprintHash(data: {
    pixelRatio: number;
    screenSize: string;
    brand: string | null;
    platformVersion: string | undefined;
    fontScale?: number;
    defaultFont?: string | null;
  }): { fingerprintString: string; fingerprintHash: string } {
    // 规范化各个字段
    const pixelRatio = data.pixelRatio.toString();
    const screenSize = data.screenSize.replace(' x ', '*'); // 440 x 956 -> 440*956
    const brand = this.normalizeString(data.brand);
    const platformVersion = this.normalizeString(data.platformVersion);
    const fontScale = data.fontScale ? data.fontScale.toString() : '1';
    const defaultFont = this.normalizeString(data.defaultFont);
    
    // 按照指定顺序拼接：像素比_屏幕尺寸_品牌_系统版本_字体缩放_默认字体
    const fingerprintString = `${pixelRatio}_${screenSize}_${brand}_${platformVersion}_${fontScale}_${defaultFont}`;
    
    // 使用 SHA-256 生成哈希
    const fingerprintHash = CryptoJS.SHA256(fingerprintString).toString();
    
    return { fingerprintString, fingerprintHash };
  }
  
  // 收集简化的设备信息
  static async collectSimpleDeviceInfo(): Promise<SimpleDeviceInfo> {
    try {
      // 获取屏幕信息
      const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
      const pixelRatio = PixelRatio.get();
      const fontScale = PixelRatio.getFontScale();
      
      // 获取硬件信息
      const brand = Device.brand;
      
      // 获取平台信息
      const platformVersion = Platform.Version?.toString();
      const platformConstants = Platform.constants || {};
      
      // 获取默认字体
      let defaultFont: string | null = null;
      if (Platform.OS === 'android') {
        defaultFont = 'Roboto';
      } else if (Platform.OS === 'ios') {
        defaultFont = platformConstants.systemFontFamily || 'System';
      }
      
      // 准备基础数据
      const baseData = {
        pixelRatio,
        screenSize: `${windowWidth} x ${windowHeight}`,
        brand,
        platformVersion,
        fontScale,
        defaultFont
      };
      
      // 生成指纹字符串和哈希
      const { fingerprintString, fingerprintHash } = this.generateDeviceFingerprintHash(baseData);
      
      return {
        ...baseData,
        fingerprintString,
        fingerprintHash
      };
    } catch (error) {
      console.error('采集设备信息失败:', error);
      throw error;
    }
  }
  
  // 打印简化的设备信息
  static printSimpleDeviceInfo(info: SimpleDeviceInfo) {
    console.log(`  像素比: ${info.pixelRatio}`);
    console.log(`  屏幕尺寸: ${info.screenSize}`);
    console.log(`  品牌: ${info.brand || '未知'}`);
    
    // 显示友好的系统版本
    if (Platform.OS === 'android' && info.platformVersion) {
      const androidVersion = this.getAndroidVersionName(info.platformVersion);
      console.log(`  系统版本: ${androidVersion} (API ${info.platformVersion})`);
    } else if (Platform.OS === 'ios' && info.platformVersion) {
      console.log(`  系统版本: iOS ${info.platformVersion}`);
    } else {
      console.log(`  系统版本: ${info.platformVersion || '未知'}`);
    }
    
    console.log(`  字体缩放: ${info.fontScale}`);
    console.log(`  默认字体: ${info.defaultFont || '未知'}`);
    console.log(`  指纹字符串: ${info.fingerprintString}`);
    console.log(`  指纹哈希: ${info.fingerprintHash}`);
  }
}

export type { DeviceFingerprint, DeviceFingerprintForMatching, SimpleDeviceInfo };