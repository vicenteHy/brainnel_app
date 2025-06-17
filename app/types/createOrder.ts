/**
 * OrderCreate，订单创建模型
 */
export interface createOrderDataType {
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
     * Is COD，是否货到付款
     */
    is_cod?: boolean | null;
    [property: string]: any;
}

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
