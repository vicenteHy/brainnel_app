import React from "react";
import Svg, { G, Path, Defs, ClipPath, Rect } from "react-native-svg";

interface DropdownIconProps {
  size?: number;
  color?: string;
}

const DropdownIcon: React.FC<DropdownIconProps> = ({ 
  size = 16, 
  color = "#373737" 
}) => {
  return (
    <Svg 
      width={size} 
      height={size} 
      viewBox="0 0 16 16" 
      fill="none"
    >
      <G clipPath="url(#clip0_953_1200)">
        <Path 
          d="M15.2615 4.87749L13.915 3.4978L8.03071 9.68137L2.14637 3.4978L0.799937 4.87749L8.03071 12.4407L15.2615 4.87749Z" 
          fill={color}
        />
      </G>
      <Defs>
        <ClipPath id="clip0_953_1200">
          <Rect width="16" height="16" fill="white" transform="translate(16) rotate(90)"/>
        </ClipPath>
      </Defs>
    </Svg>
  );
};

export default DropdownIcon; 