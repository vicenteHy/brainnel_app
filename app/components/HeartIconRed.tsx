import React from 'react';
import { Svg, Path } from 'react-native-svg';

const HeartIcon = ({ 
  color = "#FF6F30", 
  size = 18,
  filled = true,
  strokeColor = "#373737",
  strokeWidth = 0
}) => (
  <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <Path
      d="M12.9407 1C11.3911 1 9.95439 1.74601 9 2.97301C8.05587 1.74601 6.60889 1 5.05929 1C2.26796 1 0 3.37546 0 6.2908C0 8.02822 0.810718 9.25522 1.4675 10.2368C3.36602 13.0933 8.14823 16.6368 8.35348 16.784C8.54846 16.9313 8.77423 17 9 17C9.22577 17 9.45154 16.9313 9.64652 16.784C9.85177 16.6368 14.6237 13.0834 16.5325 10.2368C17.1893 9.25522 18 8.02822 18 6.2908C18 3.37546 15.732 1 12.9407 1Z"
      fill={filled ? color : "transparent"}
      stroke={filled ? "transparent" : strokeColor}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export default HeartIcon;