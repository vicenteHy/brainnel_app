import apiService from './apiClient';

// ===== Interfaces for Live Product List =====

export interface LiveProductListItem {
  id: number;
  product_id: number;
  name: string;
  name_en: string;
  name_fr: string;
  price: number;
  original_price: number;
  currency: string;
  image_url: string;
  stock: number;
  sold_out: number;
  is_live: boolean;
  live_start: string; // ISO 8601 date string
  live_end: string;   // ISO 8601 date string
}

export interface GetLiveProductsParams {
  page: number;
  page_size: number;
}

export interface GetLiveProductsResponse {
  total: number;
  page: number;
  page_size: number;
  items: LiveProductListItem[];
}

// ===== Interfaces for Live Product Details =====

// NOTE: The structure for SKUs was not provided, so `any` is used as a placeholder.
// This should be updated when the SKU structure is known.
export interface LiveProductSku {
  [key: string]: any; 
}

export interface LiveProductDetail {
  id: number;
  product_id: number;
  name: string;
  name_en: string;
  name_fr: string;
  price: number;
  original_price: number;
  currency: string;
  image_url: string;
  stock: number;
  sold_out: number;
  is_live: boolean;
  live_start: string; // ISO 8601 date string
  live_end: string;   // ISO 8601 date string
  content: string;
  content_en: string;
  content_fr: string;
  description: string;
  description_en: string;
  description_fr: string;
  skus: LiveProductSku[];
}


// ===== API Functions =====

/**
 * Fetches a list of live products with pagination.
 * @param params - Parameters for pagination (page, page_size).
 */
export const getLiveProducts = (params: GetLiveProductsParams) => {
  return apiService.get<GetLiveProductsResponse>('/api/live-products/', params);
};

/**
 * Fetches the details for a specific live product.
 * @param product_id - The ID of the product to fetch.
 */
export const getLiveProductDetails = (product_id: number) => {
  return apiService.get<LiveProductDetail>(`/api/live-products/${product_id}/`);
}; 