import React from 'react';
import Svg, { Path } from 'react-native-svg';

const PlusIcon = ({size}:{size:number}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
  >
    <Path
      d="M12.03 5L12.0117 19"
      stroke="#002FA7"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5 12H19"
      stroke="#002FA7"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default PlusIcon;