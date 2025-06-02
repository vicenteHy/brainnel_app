import React from 'react';
import Svg, { Path, LinearGradient, Stop, Defs } from 'react-native-svg';

const CrownIcon = ({size,color}:{size:number,color:string}) => (
  <Svg width={size} height={size} viewBox="0 0 30 28" fill="none">
    <Defs>
      <LinearGradient
        id="paint0_linear_14_260"
        x1="3.75006"
        y1="25.4999"
        x2="30.0001"
        y2="7.87494"
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor={color} />
        <Stop offset="1" stopColor={color} />
      </LinearGradient>
    </Defs>
    <Path
      d="M28.1926 7.15493C27.6376 7.04993 27.0676 7.12493 26.5726 7.37993L22.5376 9.40493C22.4626 9.43493 22.3726 9.41993 22.3276 9.34493L17.3176 2.06993C16.5526 0.959931 15.0526 0.644931 13.9126 1.34993L13.7926 1.42493C13.5526 1.58993 13.3426 1.79993 13.1626 2.03993L8.00263 9.34493C7.95763 9.41993 7.86763 9.43493 7.79263 9.40493L3.90763 7.40993C2.66263 6.77993 1.14763 7.27493 0.502627 8.51993C0.247627 9.02993 0.157627 9.61493 0.277627 10.1699L3.08263 24.2399C3.44263 26.0549 5.03263 27.3749 6.89263 27.3749H23.5876C25.4326 27.3749 27.0376 26.0699 27.3976 24.2399L30.2026 10.1399C30.4576 8.77493 29.5726 7.43993 28.1926 7.15493Z"
      fill="url(#paint0_linear_14_260)"
    />
  </Svg>
);

export default CrownIcon;