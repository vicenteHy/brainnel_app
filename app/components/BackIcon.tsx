import { Svg, Path, G, ClipPath, Rect, Defs } from 'react-native-svg';
const BackIcon = ({ color = "#373737", size = 20 }) => (
  <Svg width={size} height={size}  viewBox="0 0 11 18" fill="none">
        <Path
          d="M8.52018 17.1171L10.0867 15.6172L3.19348 8.93139L10.2127 2.37801L8.67501 0.848572L0.0893813 8.90185L8.52018 17.1171Z"
          fill={color}
        />
      </Svg>
)

export default BackIcon;