import { create } from 'zustand';

/**
 * OrderItemBase，订单项基础信息模型
 */
export interface OrderItemBase {
    /**
     * Cart Item Id，购物车项ID（如来源于购物车则必填）
     */
    cart_item_id?: number | null;
    /**
     * Offer Id，商品ID
     */
    offer_id: string | number;
    /**
     * Product Image，商品图片
     */
    product_image?: null | string;
    /**
     * Product Name，商品名称
     */
    product_name: string;
    /**
     * Product Name Ar，商品阿拉伯语名称
     */
    product_name_ar?: null | string;
    /**
     * Product Name En，商品法语名称
     */
    product_name_en?: null | string;
    /**
     * Product Name Fr，商品中文名称
     */
    product_name_fr?: null | string;
    /**
     * Quantity，商品数量
     */
    quantity: number;
    /**
     * Sku Attributes，SKU属性
     */
    sku_attributes?: { [key: string]: any }[] | null;
    /**
     * Sku Id，SKU ID
     */
    sku_id?: number | null | string;
    /**
     * Total Price，商品总价
     */
    total_price: number;
    /**
     * Unit Price，商品单价
     */
    unit_price: number;
    [property: string]: any;
}

/**
 * OrderCreate，订单创建模型
 */
export interface OrderCreateRequest {
    /**
     * Actual Amount，实际支付金额
     */
    actual_amount?: number | null;
    /**
     * Address Id，收货地址ID
     */
    address_id: number;
    /**
     * Buyer Message，买家留言
     */
    buyer_message?: null | string;
    /**
     * Create Payment，是否创建支付记录
     */
    create_payment?: boolean | null;
    /**
     * Currency，货币
     */
    currency?: null | string;
    /**
     * Discount Amount，优惠金额
     */
    discount_amount?: number | null;
    /**
     * Domestic Shipping Fee，国内运费
     */
    domestic_shipping_fee?: number | null;
    /**
     * Items，订单项
     */
    items: OrderItemBase[];
    /**
     * Payment Method，支付方式
     */
    payment_method?: null | string;
    /**
     * Receiver Address，货代地址
     */
    receiver_address: string;
    /**
     * Shipping Fee，运费
     */
    shipping_fee?: number | null;
    /**
     * Total Amount，订单总金额
     */
    total_amount?: number | null;
    /**
     * Transport Type，运输方式 1-海运 2-空运
     */
    transport_type?: number | null;
    /**
     * Is COD，是否货到付款 (0=非COD，1=COD)
     */
    is_cod?: number | null;
    [property: string]: any;
}

interface CreateOrderState {
    orderData: OrderCreateRequest;
    setOrderData: (data: Partial<OrderCreateRequest>) => void;
    setOrderItems: (items: OrderItemBase[]) => void;
    addOrderItem: (item: OrderItemBase) => void;
    removeOrderItem: (offerId: string | number, skuId?: string | number | null) => void;
    updateOrderItem: (item: Partial<OrderItemBase> & { offer_id: string | number, sku_id?: string | number | null }) => void;
    resetOrder: () => void;
    items: {cart_item_id: number}[];
    setItems: (items: {cart_item_id: number}[]) => void;
    cartData: any[];
    setCartData: (data: any[]) => void;
}

const initialOrderData: OrderCreateRequest = {
    address_id: 0,
    items: [],
    buyer_message: '',
    payment_method: '',
    create_payment: true,
    actual_amount: 0,
    discount_amount: 0,
    shipping_fee: 0,
    domestic_shipping_fee: 0,
    currency: '',
    receiver_address: '',
    total_amount: 0,
    transport_type: null,
    is_cod: 0
};

const useCreateOrderStore = create<CreateOrderState>((set) => ({
    orderData: { ...initialOrderData },
    
    setOrderData: (data: Partial<OrderCreateRequest>) => set((state) => ({
        orderData: { ...state.orderData, ...data }
    })),
    
    setOrderItems: (items: OrderItemBase[]) => set((state) => ({
        orderData: { ...state.orderData, items }
    })),
    
    addOrderItem: (item: OrderItemBase) => set((state) => {
        const items = [...state.orderData.items, item];
        return {
            orderData: { ...state.orderData, items }
        };
    }),
    
    removeOrderItem: (offerId: string | number, skuId?: string | number | null) => set((state) => {
        const items = state.orderData.items.filter(item => {
            if (skuId) {
                return !(item.offer_id === offerId && item.sku_id === skuId);
            }
            return item.offer_id !== offerId;
        });
        
        return {
            orderData: { ...state.orderData, items }
        };
    }),
    
    updateOrderItem: (item: Partial<OrderItemBase> & { offer_id: string | number, sku_id?: string | number | null }) => set((state) => {
        const items = state.orderData.items.map(existingItem => {
            const matchesOfferId = existingItem.offer_id === item.offer_id;
            const matchesSkuId = item.sku_id 
                ? existingItem.sku_id === item.sku_id 
                : true;
                
            if (matchesOfferId && matchesSkuId) {
                return { ...existingItem, ...item };
            }
            return existingItem;
        });
        
        return {
            orderData: { ...state.orderData, items }
        };
    }),
    
    resetOrder: () => set({
        orderData: { ...initialOrderData },
        cartData: []
    }),
    items: [],
    setItems: (items: {cart_item_id: number}[]) => set({ items }),
    cartData: [],
    setCartData: (data: any[]) => set({ cartData: data })
}));

export default useCreateOrderStore;
