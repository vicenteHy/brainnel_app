import React from 'react';
import Svg, { Path } from 'react-native-svg';

const TrapezoidIcon = ({ color = "#006be5", size = 20 }) => {
  const parentWidth = 131;  // 父容器的宽度
  const parentHeight = 50;  // 父容器的高度

  return (
    <Svg
      viewBox="0 0 300 150"  // 原始比例 (300x150)
      width='100%'     // 设置宽度为父容器的宽度
      height='100%'   // 设置高度为父容器的高度
      preserveAspectRatio="none"  // 让路径按比例填充整个容器
    >
      <Path
        d="M 80 0
           Q 0 0 0 80
           L 0 150
           L 300 150
           L 260 20
           Q 245 0 225 0
           Z"
        fill={color}   // 填充颜色
      />
    </Svg>
  );
};

export default TrapezoidIcon;
