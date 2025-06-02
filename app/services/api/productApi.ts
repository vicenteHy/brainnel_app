import apiService from './apiClient';

export interface products {
    "total": number,
    "page": number,
    "page_size": number,
    "products":Products
  }

 export interface Product {
      "offer_id": number,
      "subject": string,
      "subject_trans": string,
      "subject_trans_ar": string,
      "subject_trans_en": string,
      "product_image_urls": string[],
      "category_id": number,
      "sold_out": number,
      "create_date": string,
      "seller_open_id": string,
      "min_price": number,
      "max_price": number,
      "currency": string,
      "original_min_price": number
}

export type Products = Product[]


  export interface ProductParams {
    page: number;
    page_size: number;
    category_id?: number | null;
    keyword?: string;
    max_price?: number | null;
    min_price?: number | null;
    sort_order?:string;
    sort_by:string,
    language:string,
    user_id?:number,
    type?: number,
    image?: string
  }

  export interface ImageSearchParams {
    page_size?: number;
  }

  export interface SkuAttribute {
    "attribute_id": number,
    "attribute_name": string,
    "attribute_name_trans": string,
    "value": string,
    "value_trans": string,
    "value_trans_ar": string,
    "value_trans_en": string,
    "sku_image_url": string,
    'has_color'?: boolean,
    currency:string
    size?:number,
    list:Sku[],

  }
  
  export interface Sku {
    "sku_id": 0,
    "price": number,
    sku_image_url:string
    "spec_id": "string",
    "amount_on_sale": 0,
    "consign_price": 0,
    quantity:number,
    "cargo_number": "string",
    "one_piece_price": 0,
    "offer_price": number,
    "attributes": SkuAttribute[],
    "original_price": number,
    value?:string,
    size?:number
  }

  export interface ColorOptions {
    "title": string,
    "options": SkuAttribute[]
  }

  export interface ProductDetailParams {
    "offer_id": 0,
    currency:string
    is_favorited:boolean
    "category_id": 0,
    "price": number | string,
    "subject": "string",
    "subject_trans": "string",
    "vip_discount": number,
    "subject_trans_ar": "string",
    "subject_trans_en": "string",
    "description": "string",
    "original_min_price": number,
    "original_price": number,
    "main_video": "https://example.com/",
    "detail_video": "https://example.com/",
    "product_image_urls": [
      "string"
    ],
    "min_order_quantity": 1,
    "status": "string",
    "create_date": "2025-03-31T15:07:27.792Z",
    "top_category_id": 0,
    "second_category_id": 0,
    "third_category_id": 0,
    "seller_open_id": "string",
    "sold_out": 0,
    "batchNumber": 0,
    "sale_info": {
      "amount_on_sale": 0,
      "price_range_list": [
        {
          "min_quantity": 0,
          "price": 0,
          "original_price": number
        }
      ],
      "quote_type": 0,
      "unit_info": {
        "name": "string",
        "count": 0
      },
      "fenxiao_sale_info": {},
      "last_update_time": "2025-03-31T15:07:27.792Z"
    },
    "shipping_info": {
      "send_goods_address_text": "string",
      "weight_kg": 0,
      "width_cm": 0,
      "height_cm": 0,
      "length_cm": 0,
      "shipping_time_guarantee": "string"
    },
    "attributes": [
      {
        "attribute_id": "string",
        "attribute_name": "string",
        "attribute_name_trans": "string",
        "value": "string",
        "value_trans": "string",
        "value_trans_ar": "string",
        "value_trans_en": "string"
      }
    ],
    "skus": Sku[],
    "categories": [
      {
        "category_id": 0,
        "original_price": number,
        "parent_category_id": 0,
        "category_level": 0,
        "category_name": "string",
        "category_name_trans": "string",
        "language": "string",
        "is_leaf": true
      }
    ]
  }

  export interface similar {
    "offer_id": number,
    "subject": string,
    "subject_trans": string,
    "subject_trans_ar": string,
    "subject_trans_en": string,
    "product_image_urls": string[],
    "category_id": number,
    "sold_out": number,
    "create_date": string,
    "seller_open_id": string,
    "min_price": number,
    "max_price": number
  }

  export interface ProductGroupList {
    attribute_name:string,
    has_image:boolean,
    attribute_name_trans:string,
    attribute_name_trans_ar:string,
    attribute_name_trans_en:string,
    attributes:SkuAttribute[],
    value?:string
  }
  export type Similars = similar[]
  

export interface HotTerms {
  terms: string[];
}


interface SuccessfulResponse {
  total: number;
  page: number;
  page_size: number;
  items: FavoriteItem[];
}

interface FavoriteItem {
  favorite_id: number;
  user_id: number;
  offer_id: number;
  create_time: string; // ISO 8601 date string
  product: Favorite;
}

interface Favorite {
  offer_id: number;
  subject: string;
  subject_trans: string;
  subject_trans_en: string;
  subject_trans_ar: string;
  product_image_urls: string[];
  min_price: number;
  max_price: number;
  original_min_price: number;
  original_max_price: number;
  currency: string;
  vip_discount: number;
  vip_level: number;
  discount_percent: number;
  sold_out: number;
}

export interface Category {
    "category_id": number,
    "name": string,
    "name_cn": string,
    "name_en": string,
    "image": string,
    "level": number,
    "is_leaf": boolean
}

  // 搜索商品
  export const productApi = {
    // 搜索商品
    getSearchProducts: (params: ProductParams) => {
        return apiService.get<products>('/api/search/', params);
    },
    // 获取热门搜索词
    getHotTerms: () => {
        return apiService.get<HotTerms>('/api/search/hot-terms/');
    },
    // 获取商品详情
    getProductDetail: (offer_id: string, user_id?: number) => {
        const url = user_id ? `/api/products/${offer_id}/?user_id=${user_id}` : `/api/products/${offer_id}/`;
        return apiService.get<ProductDetailParams>(url);
    },
    // 获取相似商品
    getSimilarProducts: (offer_id: string, user_id?: number) => {
        const url = user_id ? `/api/products/${offer_id}/similar/?limit=5&user_id=${user_id}` : `/api/products/${offer_id}/similar/?limit=5`;
        return apiService.get<Similars>(url);
    },
    // 图片搜索
    searchByImage: (data:{image_base64: string,user_id?:number | null,page?:number,page_size?:number}) => {
        return apiService.post<Products>('/api/search/image_search/?user_id='+data.user_id+'&page='+data.page+'&page_size='+data.page_size,{
          image_base64: data.image_base64
        });
    },
    // 收藏商品
    collectProduct: (offer_id: string) => {
        return apiService.post<Products>(`/api/favorites/`,{
          offer_id:offer_id
        });
    },
    // 收藏商品列表
    getCollectProductList: (page:number,page_size:number) => {
        return apiService.get<SuccessfulResponse>(`/api/favorites/?page=${page}&page_size=${page_size}`);
    },
    // 删除收藏商品
    deleteCollectProduct: (offer_id: number) => {
        return apiService.delete<Products>(`/api/favorites/${offer_id}/`);
    },

    // 获取一级类目录
    getFirstCategory: () => {
        return apiService.get<Category[]>(`/api/categories/level1/`);
    },
    // 获取二级类目录
    getSecondCategory: (parent_category_id: number) => {
        return apiService.get<Category[]>(`/api/categories/level1/${parent_category_id}/children/`);
    },

  }

