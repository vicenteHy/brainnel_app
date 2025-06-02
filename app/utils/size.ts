import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 设计稿尺寸
const DESIGN_WIDTH = 430;
const DESIGN_HEIGHT = 932;

// 计算缩放比例
const widthScale = SCREEN_WIDTH / DESIGN_WIDTH;
const heightScale = SCREEN_HEIGHT / DESIGN_HEIGHT;

// 创建尺寸转换函数
export const size = {
  // 宽度适配
  w: (width: number) => width * widthScale,
  // 高度适配
  h: (height: number) => height * heightScale,
  // 字体大小适配
  f: (fontSize: number) => fontSize * widthScale,
  // 边距适配
  m: (margin: number) => margin * widthScale,
  // 圆角适配
  r: (radius: number) => radius * widthScale,
  // 获取屏幕宽度
  screenWidth: SCREEN_WIDTH,
  // 获取屏幕高度
  screenHeight: SCREEN_HEIGHT,
}; 