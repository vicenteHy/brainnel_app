import { Dimensions } from "react-native";

// 获取屏幕宽高
const { width, height } = Dimensions.get("window");

const widthUtils = (heights: number, widths: number) => {
  const baseWidth = 430;
  const baseHeight = 932;

  // 计算屏幕宽度和高度的缩放比例
  const scaleWidth = width / baseWidth;
  const scaleHeight = height / baseHeight;

  // 选择较小的比例来进行自适应，保证布局不会过大
  const scale = Math.min(scaleWidth, scaleHeight);

  // 基准宽度和高度
  const baseWidthValue = widths; // 设定一个基准宽度值
  const baseHeightValue = heights; // 设定一个基准高度值

  // 计算自适应的宽度和高度
  const customWidth = baseWidthValue * scale + 2;
  const customHeight = baseHeightValue * scale + 2;
  return {
    width: customWidth,
    height: customHeight,
  };
};

export default widthUtils;
