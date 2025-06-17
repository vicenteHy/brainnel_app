export type RootStackParamList = {
  Login: undefined;
  EmailLogin: undefined;
  CountrySelect: undefined;
  MainTabs: undefined;
  Cart: undefined;
  Home: undefined;
  Category: undefined;
  Chat: undefined;
  ChatScreen: {
    product_id?: string;
    product_image_urls?: string[];
    subject_trans?: string;
    min_price?: number;
    offer_id?: string;
  };
  Profile: undefined;
  Search: undefined;
  SearchResult: { keyword: string };
  ProductDetail: { offer_id: string; searchKeyword?: string; price?: number };
  ShippingDetailsSection: undefined;
  InquiryScreen: undefined;
  Address:undefined
}; 