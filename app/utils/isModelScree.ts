import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isModelScreen = width <= 392; 

export default isModelScreen;