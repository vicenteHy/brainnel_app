import { create } from 'zustand';



interface SkuAttribute {
    [key: string]: any; // Since the example shows an empty object, we use a generic type
  }
  
  interface CartItem {
    offer_id: number;
    cart_item_id: number;
    sku_id: number;
    product_name: string;
    product_name_en: string;
    product_name_ar: string;
    product_name_fr: string;
    product_image: string;
    sku_attributes: SkuAttribute[];
    quantity: number;
    unit_price: number;
    total_price: number;
  }
  
  export interface StoreState {
    address_id: number;
    items: CartItem[];
    buyer_message: string;
    payment_method: string;
    create_payment: boolean;
    total_amount: number;
    actual_amount: number;
    discount_amount: number;
    shipping_fee: number;
    domestic_shipping_fee: number;
    currency: string;
    receiver_address: string;
    orderInfo:string;
  }

  interface OrderStore  {
    order:StoreState,
    setOrder: (newOrder: Partial<StoreState>) => void;
  }
const useOrderStore = create<OrderStore>((set) => ({
    order:{
        address_id: 0,
        items: [],
        buyer_message: '',
        payment_method: '',
        create_payment: false,
        total_amount: 0,
        actual_amount: 0,
        discount_amount: 0,
        shipping_fee: 0,
        domestic_shipping_fee: 0,
        currency: '',
        receiver_address: '',
        orderInfo:""
    },
    setOrder: (newOrder: Partial<StoreState>) => set((state) => ({
        order: { ...state.order, ...newOrder }
    }))
}));

export default useOrderStore;
