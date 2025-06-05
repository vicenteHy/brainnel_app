import { NavigationProp } from '@react-navigation/native';

/**
 * 导航到购物车页面
 * 这个函数确保从任何地方都能正确导航到Tab Navigator中的Cart页面
 * 而不是独立的CartScreen Stack Screen
 */
export const navigateToCart = (navigation: NavigationProp<any>) => {
  // 尝试导航到Tab Navigator的Cart页面
  // 如果当前已经在Tab Navigator中，直接跳转到Cart tab
  // 如果不在Tab Navigator中，先导航到TabNavigator然后跳转到Cart tab
  try {
    navigation.navigate('TabNavigator', { screen: 'Cart' });
  } catch (error) {
    // 如果上面的方法失败，尝试直接导航到Cart
    try {
      navigation.navigate('Cart');
    } catch (fallbackError) {
      console.error('无法导航到购物车页面:', fallbackError);
    }
  }
};

/**
 * 重置到Tab Navigator并导航到Cart页面
 * 用于需要清除导航栈并直接跳转到购物车的场景
 */
export const resetToCart = (navigation: NavigationProp<any>) => {
  navigation.reset({
    index: 0,
    routes: [
      {
        name: 'TabNavigator',
        params: { screen: 'Cart' }
      }
    ],
  });
};

/**
 * 跳转到主页面然后打开购物车
 */
export const goToCartFromAnywhere = (navigation: NavigationProp<any>) => {
  // 这个方法确保从任何地方都能正确跳转到购物车
  navigation.navigate('TabNavigator', { 
    screen: 'Cart',
    initial: false 
  });
}; 