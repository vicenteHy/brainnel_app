import React, { useEffect, useState, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, Modal, View, StyleSheet, Text, TouchableOpacity, Animated, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import useUserStore from '../store/user';
import useCartStore from '../store/cartStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeScreen } from '../screens/HomeScreen';
import { CategoryScreen } from '../screens/CategoryScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { CartScreen } from '../screens/CartScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
type IconProps = {
  name: string;
  size: number;
  color: string;
};

const IconComponent = ({ name, size, color }: IconProps) => {
  const Icon = Ionicons as any;
  return <Icon name={name} size={size} color={color} />;
};

// 购物车图标组件，带有数量标识
const CartIconWithBadge = ({ color, size }: TabBarIconProps) => {
  const { cartItemCount } = useCartStore();
  
  return (
    <View style={{ position: 'relative' }}>
      <IconComponent name="cart-outline" size={size} color={color} />
      {cartItemCount > 0 && (
        <View style={{
          position: 'absolute',
          top: -8,
          right: -8,
          backgroundColor: '#FF5100',
          borderRadius: 8,
          minWidth: 16,
          height: 16,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 3,
        }}>
          <Text style={{
            color: 'white',
            fontSize: 9,
            fontWeight: 'bold',
            textAlign: 'center',
          }}>
            {cartItemCount > 99 ? '99+' : cartItemCount.toString()}
          </Text>
        </View>
      )}
    </View>
  );
};

type TabBarIconProps = {
  color: string;
  size: number;
};

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { isLoggedIn } = useAuth();
  const { user } = useUserStore();
  const { updateCartItemCount } = useCartStore();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [promptShownBefore, setPromptShownBefore] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>('');
  const isFocused = useIsFocused();
  
  // 动画值
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const insets = useSafeAreaInsets();

  // 监听键盘事件
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // 检查是否已经显示过弹窗
  useEffect(() => {
    const checkPromptShown = async () => {
      try {
        const value = await AsyncStorage.getItem('loginPromptShown');
        setPromptShownBefore(value === 'true');
      } catch (error) {
        console.error('Error checking prompt status:', error);
      }
    };
    
    checkPromptShown();
  }, []);

  // 监听当前tab页面变化及用户登录状态，决定是否显示登录提示
  useEffect(() => {
    if (isFocused && (currentTab === 'Home' || currentTab === 'Cart')) {
      if (!user?.user_id && !promptShownBefore) {
        showLoginModal();
      }
    }
  }, [currentTab, user?.user_id, isFocused, promptShownBefore]);

  // 监听用户登录状态，更新购物车数量
  useEffect(() => {
    if (user?.user_id) {
      updateCartItemCount();
    }
  }, [user?.user_id]);

  const showLoginModal = () => {
    setShowLoginPrompt(true);
    // 重置动画值到初始状态
    fadeAnim.setValue(0);
    slideAnim.setValue(300);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleCloseModal = async () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowLoginPrompt(false);
    });
    
    // 记录已经显示过登录提示
    try {
      await AsyncStorage.setItem('loginPromptShown', 'true');
      setPromptShownBefore(true);
    } catch (error) {
      console.error('Error saving prompt status:', error);
    }
  };

  const handleGoToLogin = () => {
    handleCloseModal();
    navigation.navigate('Login');
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#FF5100',
          tabBarInactiveTintColor: '#000000',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#F0F0F0',
            display: keyboardVisible ? 'none' : 'flex',
            paddingBottom: insets.bottom + 8,
            height: 75 + insets.bottom,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            marginTop: 2,
            marginBottom: 4,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
          headerShown: false,
        }}
        screenListeners={({ route }) => ({
          focus: () => {
            setCurrentTab(route.name);
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: t('home'),
            tabBarIcon: ({ color, size }: TabBarIconProps) => (
              <IconComponent name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="CategoryScreen"
          component={CategoryScreen}
          options={{
            tabBarLabel: t('common.categoryTab'),
            tabBarIcon: ({ color, size }: TabBarIconProps) => (
              <IconComponent name="grid-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            tabBarLabel: t('chat.tab_label'),
            tabBarIcon: ({ color, size }: TabBarIconProps) => (
              <IconComponent name="chatbubble-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Cart"
          component={CartScreen}
          options={{
            tabBarLabel: t('cart.cart'),
            tabBarIcon: ({ color, size }: TabBarIconProps) => (
              <CartIconWithBadge color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: t('my'),
            tabBarIcon: ({ color, size }: TabBarIconProps) => (
              <IconComponent name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      {/* {showLoginPrompt && (
        <Modal
          animationType="none"
          transparent={true}
          visible={showLoginPrompt}
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalContainer}>
            <Animated.View 
              style={[
                styles.modalOverlay,
                { opacity: fadeAnim }
              ]}
            >
              <TouchableOpacity
                style={styles.modalOverlayTouch}
                onPress={handleCloseModal}
                activeOpacity={1}
              />
            </Animated.View>
            
            <Animated.View
              style={[
                styles.modalContent,
                {
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalIndicator} />
                <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <Text style={styles.modalTitle}>{t('loginRequired')}</Text>
                <Text style={styles.modalText}>{t('loginPrompt')}</Text>
                
                <TouchableOpacity style={styles.modalButton} onPress={handleGoToLogin}>
                  <Text style={styles.modalButtonText}>{t('loginNow')}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )} */}
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalOverlayTouch: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    minHeight: 280,
    maxHeight: '70%',
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 10,
    position: 'relative',
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 20,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 15,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  modalButton: {
    backgroundColor: '#0066FF',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 