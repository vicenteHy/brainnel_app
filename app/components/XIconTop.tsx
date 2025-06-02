import React from 'react';
import { Svg, Path } from 'react-native-svg';

const XIconTop = ({
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
      d="M1 1H7V7"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default XIconTop;