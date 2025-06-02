import { Svg, Path, G, ClipPath, Rect, Defs } from 'react-native-svg';
const SearchIcon = ({ color = "#373737", size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Defs>
        <ClipPath id="clip0_121_22">
          <Rect width="20" height="20" fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#clip0_121_22)">
        <Path 
          d="M15.13 16.91C11.44 19.73 6.13 19.46 2.76 16.08C-0.92 12.4 -0.92 6.44 2.76 2.76C6.44 -0.92 12.4 -0.92 16.08 2.76C19.46 6.14 19.73 11.44 16.91 15.13L19.63 17.85C20.1 18.36 20.08 19.15 19.57 19.63C19.09 20.08 18.34 20.08 17.85 19.63L15.13 16.91ZM4.53 14.3C7.23 17 11.6 17 14.3 14.3C17 11.6 17 7.23 14.3 4.53C11.6 1.83 7.23 1.83 4.53 4.53C1.83 7.23 1.84 11.61 4.53 14.3Z" 
          fill={color}
        />
      </G>
    </Svg>
  );

  export default SearchIcon;