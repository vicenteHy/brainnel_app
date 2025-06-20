import { Dimensions, Platform, PixelRatio } from "react-native";
const { width, height } = Dimensions.get("window");

const fontSize = (size: number) => {
  // 设定基准尺寸 390x844 (iPhone 13/14标准版，更代表主流用户)
  const baseWidth = 390;
  const baseHeight = 844;

  // 计算屏幕缩放比例
  const scale = Math.min(width / baseWidth, height / baseHeight);
  
  // 计算自适应字体大小
  return Math.round(size * scale);
};

export default fontSize;
