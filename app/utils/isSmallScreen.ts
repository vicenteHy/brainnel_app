import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isSmallScreen = width <= 375; 


export default isSmallScreen;