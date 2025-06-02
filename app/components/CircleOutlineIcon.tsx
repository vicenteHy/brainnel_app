import React from 'react';
import { Svg, Path, G, ClipPath, Rect, Defs } from 'react-native-svg';

const CircleOutlineIcon = ({ 
  size = 24,
  strokeColor = "#C6C6C6",
  strokeWidth = 1,
  fillColor = "transparent"
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <ClipPath id="clip0_296_2188">
        <Rect width="24" height="24" fill="white" />
      </ClipPath>
    </Defs>
    <G clipPath="url(#clip0_296_2188)">
      <Path
        d="M12 23C15.0375 23 17.7875 21.7688 19.7782 19.7782C21.7688 17.7875 23 15.0375 23 12C23 8.96246 21.7688 6.21246 19.7782 4.22182C17.7875 2.23122 15.0375 1 12 1C8.96246 1 6.21246 2.23122 4.22182 4.22182C2.23122 6.21246 1 8.96246 1 12C1 15.0375 2.23122 17.7875 4.22182 19.7782C6.21246 21.7688 8.96246 23 12 23Z"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        fill={fillColor}
      />
    </G>
  </Svg>
);

export default CircleOutlineIcon;