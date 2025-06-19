import { Dimensions, Platform, PixelRatio } from "react-native";
const { width, height } = Dimensions.get("window");

const fontSize = (size: number) => {
  // 设定基准尺寸 390x844 (iPhone 13/14标准版，更代表主流用户)
  const baseWidth = 390;
  const baseHeight = 844;

  // 计算屏幕宽度和高度的缩放比例
  const scaleWidth = width / baseWidth;
  const scaleHeight = height / baseHeight;

  // 选择较小的比例来进行自适应，保证字体不会过大
  const scale = Math.min(scaleWidth, scaleHeight);
  
  // 设置基准字体大小
  let baseFontSize = size;

  // Android字体补偿系数
  if (Platform.OS === 'android') {
    // 根据像素密度调整Android字体大小
    const pixelRatio = PixelRatio.get();
    
    // 针对不同设备的像素密度优化
    let densityFactor;
    if (pixelRatio <= 2) {
      densityFactor = 1.0; // 低密度屏幕
    } else if (pixelRatio <= 3) {
      densityFactor = 1.0; // 标准密度屏幕（基准）
    } else if (pixelRatio <= 4) {
      densityFactor = 0.88; // 高密度屏幕，如Realme GT Neo5
    } else {
      densityFactor = 0.9; // 超高密度屏幕
    }
    
    // 基于屏幕尺寸的动态字体缩放
    const getAndroidFontScale = () => {
      const screenSize = Math.sqrt(width * width + height * height);
      
      // 针对Realme GT Neo5等高分辨率设备优化
      if (width >= 1200 && height >= 2700) {
        return 1.0; // 高分辨率设备，不放大
      } else if (screenSize < 900) {
        return 1.15; // 小屏手机，保持15%放大
      } else if (screenSize < 1100) {
        return 1.08; // 中等屏幕，适度放大
      } else {
        return 1.0; // 大屏设备，不放大
      }
    };
    
    const androidFontScale = getAndroidFontScale();
    
    baseFontSize = size * androidFontScale * densityFactor;
  }

  // 计算自适应字体大小
  const customFontSize = baseFontSize * scale;
  return Math.round(customFontSize);
};

export default fontSize;
