import React from 'react';
import Svg, { Path } from 'react-native-svg';

const BookLabIcon = ({ size = 16, color = "white" }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <Path
      d="M11.3332 3.33325V1.33325H2.6665V12.6666L4.6665 11.6666"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5.6001 13.6V4H12.8001V13.6L9.2001 11.8289L5.6001 13.6Z"
      fill="white"
      stroke="white"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </Svg>
);

export default BookLabIcon;
