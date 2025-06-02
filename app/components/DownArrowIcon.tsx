// 下拉icon

import React from 'react';
import { Svg, Path } from 'react-native-svg';

const DownArrowIcon = ({ 
  size = 18,
  color = "black",
  rotation = 270 // 0=down, 90=left, 180=up, 270=right
}) => (
  <Svg 
    width={size} 
    height={size} 
    viewBox="0 0 18 18" 
    fill="none"
    style={{ transform: [{ rotate: `${rotation}deg` }] }}
  >
    <Path
      d="M17.1694 5.48721L15.6547 3.93506L9.03482 10.8916L2.41494 3.93506L0.900204 5.48721L9.03482 13.9958L17.1694 5.48721Z"
      fill={color}
    />
  </Svg>
);

export default DownArrowIcon;