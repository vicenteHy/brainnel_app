import { RFValue } from 'react-native-responsive-fontsize';

// 设置全局基准尺寸（放在 App.js 或入口文件）
const guidelineBaseWidth = 394; // 你的设计稿宽度
const guidelineBaseHeight = 848; // 你的设计稿高度

// 自定义 RFValue
const customRF = (size:number) => RFValue(size, guidelineBaseHeight); 


export default customRF;