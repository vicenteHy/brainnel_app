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
    const densityFactor = pixelRatio / 3; // 以密度3为基准
    
    // 基于屏幕尺寸的动态字体缩放
    const getAndroidFontScale = () => {
      const screenSize = Math.sqrt(width * width + height * height);
      
      // 基于屏幕对角线尺寸动态调整
      if (screenSize < 900) {
        return 1.15; // 小屏手机，保持15%放大
      } else if (screenSize < 1100) {
        return 1.08; // 中等屏幕，适度放大
      } else {
        return 1.0; // 大屏设备，不放大
      }
    };
    
    const androidFontScale = getAndroidFontScale();
    
    baseFontSize = size * androidFontScale * Math.max(0.9, Math.min(1.1, densityFactor));
  }

  // 计算自适应字体大小
  const customFontSize = baseFontSize * scale;
  return Math.round(customFontSize);
};

export default fontSize;
