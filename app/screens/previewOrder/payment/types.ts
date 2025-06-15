import { Order } from "../../../services/api/orders";

// Define route params type
export type PaymentMethodRouteParams = {
  freight_forwarder_address_id?: number;
  isCOD?: boolean;
};

// Define the root navigation params
export type RootStackParamList = {
  Login: undefined;
  ProductDetail: { offer_id: number, price?: number | string };
  Home: undefined;
  ProductList: undefined;
  PreviewAddress: undefined;
  AddressList: undefined;
  PreviewOrder: { data: Order, payMethod: string, currency: string };
  OfflinePayment: undefined;
  Pay: { order_id: string };
  ShippingFee: { freight_forwarder_address_id?: number; isCOD?: boolean };
  PaymentMethod: { freight_forwarder_address_id?: number; isCOD?: boolean };
  // Add other routes as needed
};

export interface PaymentOption {
  id: string;
  label: string;
  icon: string;
  value?: string | string[];
  key?: string;
}

export interface PaymentTab {
  id: string;
  label: string;
  options: PaymentOption[];
}

export interface PaymentMethodItemProps {
  option: PaymentOption;
  isSelected: boolean;
  onSelect: () => void;
  selectedCurrency?: string;
  onSelectCurrency?: (currency: string) => void;
  exchangeRates?: {
    usd: number;
    eur: number;
  };
  convertedAmount?: {
    converted_amount: number;
    item_key: string;
    original_amount: number;
  }[];
  isConverting?: boolean;
  isPaypalExpanded?: boolean;
  isCreditCardExpanded?: boolean;
  isCOD?: boolean;
}

export interface AlertModalState {
  visible: boolean;
  title: string;
  message: string;
}

export interface ConvertedAmount {
  converted_amount: number;
  item_key: string;
  original_amount: number;
}