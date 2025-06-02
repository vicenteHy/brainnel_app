import { Dimensions, Platform, StatusBar, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 基准尺寸（以 iPhone 11 为基准）
const baseWidth = 375;
const baseHeight = 812;

// 计算缩放比例
const widthRatio = SCREEN_WIDTH / baseWidth;
const heightRatio = SCREEN_HEIGHT / baseHeight;

// 获取状态栏高度
const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

// 响应式尺寸计算函数
export const scale = (size: number) => {
  return Math.round(size * widthRatio);
};

export const verticalScale = (size: number) => {
  return Math.round(size * heightRatio);
};

export const moderateScale = (size: number, factor = 0.5) => {
  return Math.round(size + (scale(size) - size) * factor);
};

// 获取屏幕尺寸
export const getScreenWidth = () => SCREEN_WIDTH;
export const getScreenHeight = () => SCREEN_HEIGHT;

// 获取状态栏高度
export const getStatusBarHeight = () => statusBarHeight;

// 判断是否为小屏幕设备
export const isSmallDevice = () => SCREEN_WIDTH < 375;

// 判断是否为平板设备
export const isTablet = () => {
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = SCREEN_WIDTH * pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT * pixelDensity;
  return Math.sqrt(Math.pow(adjustedWidth, 2) + Math.pow(adjustedHeight, 2)) >= 1000;
}; 