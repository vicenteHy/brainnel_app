import apiService from './apiClient';


export interface AddToCartParams {
  offer_id: number | string;
  skus?: {sku_id:number | string,quantity:number}[];
  quantity?: number;
  sku_id?: number | string | null;
  is_inquiry_item?: boolean;
  is_live_item?: boolean;
}

export interface GetCartListResponse {
    items: GetCartList[]
}
export interface attributes{
  attribute_name:string,
  attribute_name_trans:string,
  attribute_name_trans_ar:string,
  attribute_name_trans_en:string,
  attribute_value:string,
  sku_id:number,
  sku_image_url:string,
  value:string,
  value_trans:string,
  value_trans_ar:string,
  value_trans_en:string,
  attribute_id:number,
  
}
export interface CartSku {
    cart_item_id: number,
    price: number,
    quantity: number,
    original_price: number,
    selected: number,
    currency:string,
    sku_id: number,
    original_min_price:number,
    attributes:attributes[],
}
export interface GetCartList {
    "cart_id": number,
    "user_id": number,
    "offer_id": number,
    "sku_id": number,
    "quantity": number,
    "selected": number,
    "subject": string,
    "subject_trans": string,
    "subject_trans_en": string,
    "subject_trans_ar": string,
    "category_id": number,
    "price": number,
    "product_image": string,
    min_order_quantity:number
    skus:CartSku[]
  }
export const cartApi = (data: AddToCartParams) => {
    return apiService.post('/api/cart/', data);
}


export const getCartList = () => {
    return apiService.get<GetCartListResponse>('https://api.brainnel.com/backend/api/cart/');
}

export const updateCartItem = (cart_id:number,data?:{cart_item_id?:number | null,selected:number | null,quantity:number | null}) => {
  return apiService.put(`/api/cart/${cart_id}/`,data);
}

// 批量更新选中状态
export const updateBatchCartSelected = (data?:{cart_id?:number | null,selected:number | null,offer_ids:Array<number> | null}) => {
    return apiService.patch(`/api/cart/selected/`,data);
}

export const deleteCartItem = (cart_id:number,cart_item_id:number) => {
  return apiService.delete(`/api/cart/${cart_id}/?cart_item_id=${cart_item_id}`);
}