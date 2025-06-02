import React from "react";
import Svg, { Path } from "react-native-svg";

const FolderIcon = ({ size = 200 }) => (
  <Svg viewBox="0 0 1024 1024" width={size} height={size}>
    <Path
      d="M288 256V128a64 64 0 0 1 64-64h320a64 64 0 0 1 64 64v128h160a64 64 0 0 1 64 64v576a64 64 0 0 1-64 64H128a64 64 0 0 1-64-64V320a64 64 0 0 1 64-64h160z m480 256h128v-160a32 32 0 0 0-32-32H160a32 32 0 0 0-32 32v160h128v-32a32 32 0 0 1 64 0v32h384v-32a32 32 0 0 1 64 0v32z m0 64v32a32 32 0 0 1-64 0v-32H320v32a32 32 0 0 1-64 0v-32H128v288a32 32 0 0 0 32 32h704a32 32 0 0 0 32-32v-288h-128zM384 128a32 32 0 0 0-32 32v96h320V160a32 32 0 0 0-32-32h-256z"
      fill="#707070"
    />
  </Svg>
);

export default FolderIcon;
