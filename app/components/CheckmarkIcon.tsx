import React from 'react';
import { Svg, Path } from 'react-native-svg';

const CheckmarkIcon = ({ 
  size = 16,
  color = "#272636",
  strokeColor = "transparent",
  strokeWidth = 0
}) => (
  <Svg width={size} height={size * (12/16)} viewBox="0 0 16 12" fill="none">
    <Path
      d="M15.6954 2.16915L6.52241 11.4529L6.25381 11.7059L5.98521 11.4529L0.304688 5.70371L2.15683 3.82891L6.25337 7.97547L13.8433 0.294067L15.6954 2.16915Z"
      fill={color}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export default CheckmarkIcon;