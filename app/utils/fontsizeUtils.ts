import { Dimensions } from "react-native";
const { width, height } = Dimensions.get("window");

const fontSize = (size: number) => {
  // 设定基准尺寸 430x932
  const baseWidth = 430;
  const baseHeight = 932;

  // 计算屏幕宽度和高度的缩放比例
  const scaleWidth = width / baseWidth;
  const scaleHeight = height / baseHeight;

  // 选择较小的比例来进行自适应，保证字体不会过大
  const scale = Math.min(scaleWidth, scaleHeight);
  // 设置基准字体大小
  const baseFontSize = size;

  // 计算自适应字体大小
  const customFontSize = baseFontSize * scale;
  return customFontSize;
};

export default fontSize;
