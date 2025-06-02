import React from 'react';
import { Svg, Path, G, ClipPath, Rect, Defs } from 'react-native-svg';

const DiagonalArrowIcon = ({ 
  size = 19,
  color = "black",
  rotation = 0
}) => (
  <Svg 
    width={size} 
    height={size} 
    viewBox="0 0 19 19" 
    fill="none"
    style={{ transform: [{ rotate: `${rotation}deg` }] }}
  >
    <Defs>
      <ClipPath id="clip0_119_349">
        <Rect 
          width="18" 
          height="18" 
          fill="white" 
          transform="matrix(0.999955 -0.00951646 -0.00951646 -0.999955 0.171387 19)"
        />
      </ClipPath>
    </Defs>
    <G clipPath="url(#clip0_119_349)">
      <Path
        d="M5.65047 18.1171L4.08397 16.6172L10.9772 9.93139L3.95798 3.37801L5.49565 1.84857L14.0813 9.90185L5.65047 18.1171Z"
        fill={color}
      />
    </G>
  </Svg>
);

export default DiagonalArrowIcon;