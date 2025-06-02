import React from 'react';
import Svg, { Path } from 'react-native-svg';

const DocumentClockIcon = ({size = 200, color = "#707070"}) => (
  <Svg
    viewBox="0 0 1024 1024"
    width={size}
    height={size}
  >
    {/* Document top section */}
    <Path
      d="M59.2 345.6h822.4V512h38.4V148.8H22.4v600h635.2v-38.4H59.2V345.6z m0-158.4h822.4v120H59.2v-120z"
      fill="#707070"
    />
    
    {/* Document line */}
    <Path
      d="M128 438.4h171.2v38.4H128z"
      fill="#707070"
    />
    
    {/* Clock circle */}
    <Path
      d="M854.4 550.4c-86.4 0-158.4 70.4-158.4 158.4s70.4 158.4 158.4 158.4c86.4 0 158.4-70.4 158.4-158.4s-70.4-158.4-158.4-158.4z m0 283.2c-68.8 0-124.8-56-124.8-124.8s56-124.8 124.8-124.8 124.8 56 124.8 124.8-54.4 124.8-124.8 124.8z"
      fill="#e02211"
    />
    
    {/* Clock hands */}
    <Path
      d="M867.2 622.4h-32v104h97.6v-32h-65.6z"
      fill="#e02211"
    />
  </Svg>
);

export default DocumentClockIcon;