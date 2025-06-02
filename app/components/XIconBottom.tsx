import React from 'react';
import { Svg, Path } from 'react-native-svg';

const XIconBottom = ({
  size = 8,
  color = "white",
  strokeWidth = 1,
  rotation = 0
}) => (
  <Svg 
    width={size} 
    height={size} 
    viewBox="0 0 8 8" 
    fill="none"
    style={{ transform: [{ rotate: `${rotation}deg` }] }}
  >
    <Path
      d="M7 7L1 7L0.999999 1"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default XIconBottom;