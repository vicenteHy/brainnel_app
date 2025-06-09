import React, { useRef } from 'react';
import { NavigationContainer, NavigationState, PartialState } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from './types';
import * as Screens from './screens';
import Toast from "react-native-toast-message";
import { View, Text, Dimensions } from 'react-native';
import { createNavigationContainerRef } from '@react-navigation/native';

const Stack = createNativeStackNavigator<RootStackParamList>();

// 获取屏幕尺寸
const { height: screenHeight } = Dimensions.get('window');

// 获取当前路由信息的工具函数
// [DEBUG-ROUTER-LOGGER] 路由跟踪函数 - 生产环境可删除
const getActiveRouteName = (state: NavigationState | PartialState<NavigationState> | undefined): string => {
  if (!state || !state.routes) return '';

  const route = state.routes[state.index || 0];

  // 检查是否存在嵌套导航
  if (route.state && route.state.routes) {
    return getActiveRouteName(route.state);
  }

  return route.name;
};

// 获取路由的完整路径
// [DEBUG-ROUTER-LOGGER] 路由跟踪函数 - 生产环境可删除
const getRoutePath = (state: NavigationState | PartialState<NavigationState> | undefined): string[] => {
  if (!state || !state.routes) return [];

  const route = state.routes[state.index || 0];
  const currentPath = [route.name];

  // 检查是否存在嵌套导航
  if (route.state && route.state.routes) {
    return [...currentPath, ...getRoutePath(route.state)];
  }

  return currentPath;
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const AppNavigator = () => {
  // [DEBUG-ROUTER-LOGGER] 路由跟踪引用 - 生产环境可删除
  const routeNameRef = useRef<string | undefined>(undefined);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        // [DEBUG-ROUTER-LOGGER] 初始路由日志 - 生产环境可删除 - 开始
        routeNameRef.current = getActiveRouteName(navigationRef.current?.getRootState());
        console.log('[DEBUG-ROUTER] 初始路由:', routeNameRef.current);
        
        // 打印组件信息
        let componentInfo;
        if (routeNameRef.current) {
          componentInfo = Screens[routeNameRef.current as keyof typeof Screens];
          if (!componentInfo) {
            const screenName = `${routeNameRef.current}Screen`;
            componentInfo = Screens[screenName as keyof typeof Screens];
          }
          // 如果仍然找不到，则在Screens中进行更广泛的搜索
          if (!componentInfo) {
            const screenKeys = Object.keys(Screens);
            const matchedKey = screenKeys.find(key => key.toLowerCase() === routeNameRef.current?.toLowerCase() || key.toLowerCase() === `${routeNameRef.current?.toLowerCase()}screen`);
            if (matchedKey) {
              componentInfo = Screens[matchedKey as keyof typeof Screens];
            }
          }
        }
        console.log('[DEBUG-ROUTER] 组件信息:', componentInfo ? (componentInfo as any).name || '未命名组件' : '未找到组件');
        // [DEBUG-ROUTER-LOGGER] 初始路由日志 - 生产环境可删除 - 结束
      }}
      onStateChange={(state) => {
        // [DEBUG-ROUTER-LOGGER] 路由变化日志 - 生产环境可删除 - 开始
        const previousRouteName = routeNameRef.current;
        const currentRouteName = getActiveRouteName(state);

        if (previousRouteName !== currentRouteName) {
          // 记录路由变化
          console.log(`[DEBUG-ROUTER] 路由变化: ${previousRouteName} -> ${currentRouteName}`);
          
          // 打印完整路径
          const fullPath = getRoutePath(state);
          console.log('[DEBUG-ROUTER] 路由完整路径:', fullPath.join(' -> '));
          
          // 打印组件信息
          let componentInfo;
          if (currentRouteName) {
            componentInfo = Screens[currentRouteName as keyof typeof Screens];
            if (!componentInfo) {
              const screenName = `${currentRouteName}Screen`;
              componentInfo = Screens[screenName as keyof typeof Screens];
            }
            // 如果仍然找不到，则在Screens中进行更广泛的搜索
            if (!componentInfo) {
              const screenKeys = Object.keys(Screens);
              const matchedKey = screenKeys.find(key => key.toLowerCase() === currentRouteName.toLowerCase() || key.toLowerCase() === `${currentRouteName.toLowerCase()}screen`);
              if (matchedKey) {
                componentInfo = Screens[matchedKey as keyof typeof Screens];
              }
            }
          }
          console.log('[DEBUG-ROUTER] 组件信息:', componentInfo ? (componentInfo as any).name || '未命名组件' : '未找到组件');
          
          // 打印路由参数信息
          const currentRoute = state?.routes?.[state.index || 0];
          if (currentRoute && currentRoute.params) {
            console.log('[DEBUG-ROUTER] 路由参数:', JSON.stringify(currentRoute.params, null, 2));
          }
          
          // 更新当前路由名称引用
          routeNameRef.current = currentRouteName;
        }
        // [DEBUG-ROUTER-LOGGER] 路由变化日志 - 生产环境可删除 - 结束
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="CountrySelect" component={Screens.CountrySelect} />
        <Stack.Screen
          name="Login"
          component={Screens.LoginScreen}
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            gestureEnabled: true,
            gestureDirection: "vertical",
          }}
        />
        <Stack.Screen
          name="MainTabs"
          component={Screens.TabNavigator}
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="EmailLogin"
          component={Screens.EmailLoginScreen}
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            gestureEnabled: true,
            gestureDirection: "vertical",
          }}
        />
        <Stack.Screen
          name="Search"
          component={Screens.SearchScreen}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="SearchResult"
          component={Screens.SearchResultScreen}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="ImageSearchResultScreen"
          component={Screens.ImageSearchResultScreen}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="ProductDetail"
          component={Screens.ProductDetailScreen}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="RelatedProductsScreen"
          component={Screens.RelatedProductsScreen}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="ChatScreen"
          component={Screens.ChatScreen}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="ProductChatScreen"
          component={Screens.ProductChatScreen}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="Balance"
          component={Screens.BalanceScreen}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="ShippingDetailsSection"
          component={Screens.ShippingDetailsSection}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="InquiryScreen"
          component={Screens.InquiryScreen}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="Recipient"
          component={Screens.Recipient}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="AddRess"
          component={Screens.AddRess}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="SettingList"
          component={Screens.SettingList}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="CountrySetting"
          component={Screens.CountrySetting}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="MyAddress"
          component={Screens.MyAddress}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="CartScreen"
          component={Screens.CartScreen}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="PaymentSuccessScreen"
          component={Screens.PaymentSuccessScreen}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="PayError"
          component={Screens.PayError}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="MyAccount"
          component={Screens.MyAccount}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="Google"
          component={Screens.GoogleScreen}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="ConfirmOrder"
          component={Screens.ConfirmOrder}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="Pay"
          component={Screens.Pay}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="Status"
          component={Screens.Status}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="OrderDetails"
          component={Screens.OrderDetails}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="TikTokScreen"
          component={Screens.TikTokScreen}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="BrowseHistoryScreen"
          component={Screens.BrowseHistoryScreen}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="Collection"
          component={Screens.Collection}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="MemberIntroduction"
          component={Screens.MemberIntroduction}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="CompanyScreen"
          component={Screens.CompanyScreen}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="PreviewAddress"
          component={Screens.PreviewAddress}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="AddressList"
          component={Screens.AddressList}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="AddAddress"
          component={Screens.AddAddress}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="EditAddress"
          component={Screens.EditAddress}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="PaymentMethod"
          component={Screens.PaymentMethod}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="ShippingFee"
          component={Screens.ShippingFee}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="PreviewOrder"
          component={Screens.PreviewOrder}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="ForgotPhonePassword"
          component={Screens.ForgotPhonePassword}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="Info"
          component={Screens.Info}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="ChangePassword"
          component={Screens.ChangePassword}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="PrivacyPolicyScreen"
          component={Screens.PrivacyPolicyScreen}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="TermsOfUseScreen"
          component={Screens.TermsOfUseScreen}
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
      </Stack.Navigator>
      <Toast 
        config={{
          success: (props) => (
            <View style={{
              backgroundColor: '#000000',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
              marginHorizontal: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                textAlign: 'center',
              }}>
                {props.text1}
              </Text>
              {props.text2 && (
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  textAlign: 'center',
                  marginTop: 4,
                  opacity: 0.8,
                }}>
                  {props.text2}
                </Text>
              )}
            </View>
          ),
          error: (props) => (
            <View style={{
              backgroundColor: '#000000',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
              marginHorizontal: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                textAlign: 'center',
              }}>
                {props.text1}
              </Text>
              {props.text2 && (
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  textAlign: 'center',
                  marginTop: 4,
                  opacity: 0.8,
                }}>
                  {props.text2}
                </Text>
              )}
            </View>
          ),
          info: (props) => (
            <View style={{
              backgroundColor: '#000000',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
              marginHorizontal: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                textAlign: 'center',
              }}>
                {props.text1}
              </Text>
              {props.text2 && (
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  textAlign: 'center',
                  marginTop: 4,
                  opacity: 0.8,
                }}>
                  {props.text2}
                </Text>
              )}
            </View>
          ),
        }}
        position="top"
        topOffset={screenHeight / 2 - 50}
        visibilityTime={3000}
      />
    </NavigationContainer>
  );
}; 