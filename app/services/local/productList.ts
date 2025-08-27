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
  // 1: 本地现货(3天); 0: 仓储(7天)
  is_local_stock?: 0 | 1;
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
  category_id?: number;  // 添加分类ID参数
}

export const fetchLocalProducts = async (params?: LocalProductListParams): Promise<LocalProductListResponse> => {
  try {
    const requestParams: any = {
      page: params?.page || 1,
      page_size: params?.page_size || 20,
      is_top: 0,
      sort_order: 'asc'
    };
    
    // 如果提供了 category_id，添加到请求参数中
    if (params?.category_id) {
      requestParams.category_id = params.category_id;
    }
    
    console.log('========== 开始请求本地产品列表 ==========');
    console.log('请求URL: /api/flash-local/');
    console.log('请求参数:', JSON.stringify(requestParams, null, 2));
    console.log('请求时间:', new Date().toISOString());
    
    // 注意：apiService.get 的第二个参数会被放入 params 对象中
    // 所以直接传递参数对象，不要再包装
    const response = await apiService.get('/api/flash-local/', requestParams);
    
    console.log('========== API 响应信息 ==========');
    console.log('响应时间:', new Date().toISOString());
    console.log('响应类型:', typeof response);
    console.log('响应对象键:', response ? Object.keys(response) : 'null');
    console.log('完整响应数据:', JSON.stringify(response, null, 2));
    
    // 检查 response 是否直接就是数据对象
    // 从日志看，response 直接就是包含 items 的对象
    let data = response;
    
    // 如果 response 有 data 属性，使用 data
    if (response && typeof response === 'object' && 'data' in response) {
      console.log('响应包含 data 属性，提取 data');
      data = response.data;
    } else {
      console.log('响应直接就是数据对象');
    }
    
    console.log('========== 处理后的数据 ==========');
    console.log('数据类型:', typeof data);
    console.log('数据对象键:', data ? Object.keys(data) : 'null');
    if (data && data.items) {
      console.log('items 数组长度:', data.items.length);
      console.log('第一个商品示例:', data.items[0] ? JSON.stringify(data.items[0], null, 2) : '无商品');
    }
    
    // 确保返回正确的数据格式
    if (data && data.items && Array.isArray(data.items)) {
      const result = {
        total: data.total || 0,
        page: data.page || 1,
        page_size: data.page_size || 20,
        items: data.items
      };
      console.log('========== 返回数据 ==========');
      console.log('返回数据结构:', {
        total: result.total,
        page: result.page,
        page_size: result.page_size,
        items_count: result.items.length
      });
      console.log('==========================================\n');
      return result;
    }
    
    // 如果没有数据，返回空结构
    console.log('========== 警告：没有有效数据，返回空结构 ==========');
    console.log('==========================================\n');
    return {
      total: 0,
      page: 1,
      page_size: 20,
      items: []
    };
  } catch (error) {
    console.log('========== 请求失败 ==========');
    console.error('错误类型:', error?.constructor?.name);
    console.error('错误消息:', error?.message);
    console.error('错误堆栈:', error?.stack);
    if (error?.response) {
      console.error('错误响应状态:', error.response.status);
      console.error('错误响应数据:', JSON.stringify(error.response.data, null, 2));
      console.error('错误响应头:', error.response.headers);
    }
    console.log('==========================================\n');
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