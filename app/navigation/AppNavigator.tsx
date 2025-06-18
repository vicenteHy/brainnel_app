import React, { useRef } from 'react';
import { NavigationContainer, NavigationState, PartialState } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from './types';
import * as Screens from './screens';
import Toast from "react-native-toast-message";
import { View, Text, Dimensions } from 'react-native';
import { createNavigationContainerRef } from '@react-navigation/native';
import { setNavigationRef } from '../utils/navigationUtils';
import fontSize from '../utils/fontsizeUtils';

const Stack = createNativeStackNavigator<RootStackParamList>();

// 获取屏幕尺寸
const { height: screenHeight } = Dimensions.get('window');


export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        // 设置导航引用供其他模块使用
        setNavigationRef(navigationRef);
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "none",
        }}
      >
        <Stack.Screen name="CountrySelect" component={Screens.CountrySelect} />
        <Stack.Screen
          name="Login"
          component={Screens.LoginScreen}
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
        />
        <Stack.Screen
          name="EmailOtp"
          component={Screens.EmailOtpScreen}
        />
        <Stack.Screen
          name="Search"
          component={Screens.SearchScreen}
        />
        <Stack.Screen
          name="SearchResult"
          component={Screens.SearchResultScreen}
        />
        <Stack.Screen
          name="ImageSearchResultScreen"
          component={Screens.ImageSearchResultScreen}
        />
        <Stack.Screen
          name="ProductDetail"
          component={Screens.ProductDetailScreen}
        />
        <Stack.Screen
          name="RelatedProductsScreen"
          component={Screens.RelatedProductsScreen}
        />
        <Stack.Screen
          name="ChatScreen"
          component={Screens.ChatScreen}
        />
        <Stack.Screen
          name="ProductChatScreen"
          component={Screens.ProductChatScreen}
        />
        <Stack.Screen
          name="Balance"
          component={Screens.BalanceScreen}
        />
        <Stack.Screen
          name="ShippingDetailsSection"
          component={Screens.ShippingDetailsSection}
        />
        <Stack.Screen
          name="InquiryScreen"
          component={Screens.InquiryScreen}
        />
        <Stack.Screen
          name="Recipient"
          component={Screens.Recipient}
        />
        <Stack.Screen
          name="AddRess"
          component={Screens.AddRess}
        />
        <Stack.Screen
          name="SettingList"
          component={Screens.SettingList}
        />
        <Stack.Screen
          name="CountrySetting"
          component={Screens.CountrySetting}
        />
        <Stack.Screen
          name="MyAddress"
          component={Screens.MyAddress}
        />
        <Stack.Screen
          name="CartScreen"
          component={Screens.CartScreen}
        />
        <Stack.Screen
          name="PaymentSuccessScreen"
          component={Screens.PaymentSuccessScreen}
        />
        <Stack.Screen
          name="PayError"
          component={Screens.PayError}
        />
        <Stack.Screen
          name="RechargePay"
          component={Screens.RechargePay}
        />
        <Stack.Screen
          name="Recharge"
          component={Screens.RechargeScreen}
        />
        <Stack.Screen
          name="RechargeSummary"
          component={Screens.RechargeSummaryScreen}
        />
        <Stack.Screen
          name="OfflinePayment"
          component={Screens.OfflinePayment}
        />
        <Stack.Screen
          name="MyAccount"
          component={Screens.MyAccount}
        />
        <Stack.Screen
          name="ConfirmOrder"
          component={Screens.ConfirmOrder}
        />
        <Stack.Screen
          name="Pay"
          component={Screens.Pay}
        />
        <Stack.Screen
          name="Status"
          component={Screens.Status}
        />
        <Stack.Screen
          name="OrderDetails"
          component={Screens.OrderDetails}
        />
        <Stack.Screen
          name="TikTokScreen"
          component={Screens.TikTokScreen}
        />
        <Stack.Screen
          name="BrowseHistoryScreen"
          component={Screens.BrowseHistoryScreen}
        />
        <Stack.Screen
          name="Collection"
          component={Screens.Collection}
        />
        <Stack.Screen
          name="MemberIntroduction"
          component={Screens.MemberIntroduction}
        />
        <Stack.Screen
          name="CompanyScreen"
          component={Screens.CompanyScreen}
        />
        <Stack.Screen
          name="PreviewAddress"
          component={Screens.PreviewAddress}
        />
        <Stack.Screen
          name="AddressList"
          component={Screens.AddressList}
        />
        <Stack.Screen
          name="AddAddress"
          component={Screens.AddAddress}
        />
        <Stack.Screen
          name="EditAddress"
          component={Screens.EditAddress}
        />
        <Stack.Screen
          name="PaymentMethod"
          component={Screens.PaymentMethod}
        />
        <Stack.Screen
          name="ShippingFee"
          component={Screens.ShippingFee}
        />
        <Stack.Screen
          name="PreviewOrder"
          component={Screens.PreviewOrder}
        />
        <Stack.Screen
          name="ForgotPhonePassword"
          component={Screens.ForgotPhonePassword}
        />
        <Stack.Screen
          name="PhoneLoginScreen"
          component={Screens.PhoneLoginScreen}
        />
        <Stack.Screen
          name="WhatsAppLoginScreen"
          component={Screens.WhatsAppLoginScreen}
        />
        <Stack.Screen
          name="Info"
          component={Screens.Info}
        />
        <Stack.Screen
          name="ChangePassword"
          component={Screens.ChangePassword}
        />
        <Stack.Screen
          name="PrivacyPolicyScreen"
          component={Screens.PrivacyPolicyScreen}
        />
        <Stack.Screen
          name="TermsOfUseScreen"
          component={Screens.TermsOfUseScreen}
        />
        <Stack.Screen
          name="LoginPromptScreen"
          component={Screens.LoginPromptScreen}
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
                fontSize: fontSize(16),
                textAlign: 'center',
              }}>
                {props.text1}
              </Text>
              {props.text2 && (
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: fontSize(14),
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
                fontSize: fontSize(16),
                textAlign: 'center',
              }}>
                {props.text1}
              </Text>
              {props.text2 && (
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: fontSize(14),
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
                fontSize: fontSize(16),
                textAlign: 'center',
              }}>
                {props.text1}
              </Text>
              {props.text2 && (
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: fontSize(14),
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