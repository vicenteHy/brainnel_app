import React from 'react';
import { Svg, Path } from 'react-native-svg';

const OrangeCircleIcon = ({
  size = 24,
  fillColor = "#FF5100",
  strokeColor = "#FF5100",
  strokeWidth = 2
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* 圆形 */}
    <Path
      d="M12 23C15.0375 23 17.7875 21.7688 19.7782 19.7782C21.7688 17.7875 23 15.0375 23 12C23 8.96246 21.7688 6.21246 19.7782 4.22182C17.7875 2.23122 15.0375 1 12 1C8.96246 1 6.21246 2.23122 4.22182 4.22182C2.23122 6.21246 1 8.96246 1 12C1 15.0375 2.23122 17.7875 4.22182 19.7782C6.21246 21.7688 8.96246 23 12 23Z"
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    {/* 对勾（Check Mark） */}
    <Path
      d="M6 12L10 16L18 8"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default OrangeCircleIcon;
