import apiService from "../api/apiClient";

export interface LocalProductSku {
  id: number;
  sku_id: string;
  product_id: number;
  name_cn: string;
  name_fr: string;
  attr_key_1: string | null;
  attr_value_1: string | null;
  attr_key_2: string | null;
  attr_value_2: string | null;
  price: number;
  image_url: string | null;
  stock: number;
  is_active: boolean;
}

export interface LocalProduct {
  id: number;
  product_id: number;
  category_id: number | null;
  profit_rate: number;
  name_cn: string;
  name_fr: string;
  content_cn: string | null;
  content_fr: string | null;
  stock: number;
  description_cn: string | string[] | null;  // 可以是字符串或字符串数组（详情图片）
  description_fr: string | string[] | null;  // 可以是字符串或字符串数组（详情图片）
  price: number;
  original_price: number;
  off: number;
  image_url: string | string[] | null;  // 轮播图
  is_active: boolean;
  skus: LocalProductSku[];
}

export interface LocalProductListResponse {
  total: number;
  page: number;
  page_size: number;
  items: LocalProduct[];
}

export interface LocalProductListParams {
  page?: number;
  page_size?: number;
}

export const fetchLocalProducts = async (params?: LocalProductListParams): Promise<LocalProductListResponse> => {
  try {
    console.log('调用 API: /api/flash-local/', params);
    const response = await apiService.get('/api/flash-local/', {
      params: {
        page: params?.page || 1,
        page_size: params?.page_size || 20,
      }
    });
    
    console.log('API 原始响应类型:', typeof response);
    console.log('API 原始响应:', response);
    
    // 检查 response 是否直接就是数据对象
    // 从日志看，response 直接就是包含 items 的对象
    let data = response;
    
    // 如果 response 有 data 属性，使用 data
    if (response && typeof response === 'object' && 'data' in response) {
      data = response.data;
    }
    
    console.log('提取的数据:', data);
    
    // 确保返回正确的数据格式
    if (data && data.items && Array.isArray(data.items)) {
      return {
        total: data.total || 0,
        page: data.page || 1,
        page_size: data.page_size || 20,
        items: data.items
      };
    }
    
    // 如果没有数据，返回空结构
    return {
      total: 0,
      page: 1,
      page_size: 20,
      items: []
    };
  } catch (error) {
    console.error('fetchLocalProducts 错误:', error);
    console.error('错误响应:', error.response);
    throw error;
  }
};

export const parseProductImages = (imageUrl: string | string[] | null): string[] => {
  if (!imageUrl) return [];
  
  if (typeof imageUrl === 'string') {
    try {
      const parsed = JSON.parse(imageUrl);
      return Array.isArray(parsed) ? parsed : [imageUrl];
    } catch {
      return [imageUrl];
    }
  }
  
  return Array.isArray(imageUrl) ? imageUrl : [];
};

export const getFirstProductImage = (product: LocalProduct): string => {
  const images = parseProductImages(product.image_url);
  if (images.length > 0) return images[0];
  
  if (product.skus && product.skus.length > 0 && product.skus[0].image_url) {
    return product.skus[0].image_url;
  }
  
  return '';
};