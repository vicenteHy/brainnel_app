import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Home: undefined;
  ShippingDetails: undefined;
  Main: undefined;
  // Add other screens as needed
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export type ShippingMethod = "maritime" | "airway";