import apiService from '../api/apiClient';

// 分类数据类型定义
export interface LocalCategory {
  category_id: number;
  parent_id: number | null;
  name: string;
  name_fr: string;
  level: number;
  name_en?: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
}

// API 响应类型
export interface GetCategoriesResponse {
  data?: LocalCategory[];
  categories?: LocalCategory[];
  items?: LocalCategory[];
  // 支持多种可能的响应格式
}

/**
 * 获取一级分类列表
 * @returns Promise<LocalCategory[]> 分类列表
 */
export const fetchLevel1Categories = async (): Promise<LocalCategory[]> => {
  try {
    const response = await apiService.get<GetCategoriesResponse | LocalCategory[]>('/api/flash-local/categories/level1/');
    
    // 处理不同的响应格式
    if (Array.isArray(response)) {
      return response;
    } else if (response && 'data' in response && Array.isArray(response.data)) {
      return response.data;
    } else if (response && 'categories' in response && Array.isArray(response.categories)) {
      return response.categories;
    } else if (response && 'items' in response && Array.isArray(response.items)) {
      return response.items;
    }
    
    console.warn('[categoryApi] Unexpected response format:', response);
    return [];
  } catch (error) {
    console.error('[categoryApi] Failed to fetch level1 categories:', error);
    throw error;
  }
};

/**
 * 根据分类ID获取子分类（预留接口，如果后续需要）
 * @param parentId 父分类ID
 * @returns Promise<LocalCategory[]> 子分类列表
 */
export const fetchSubCategories = async (parentId: number): Promise<LocalCategory[]> => {
  try {
    const response = await apiService.get<GetCategoriesResponse | LocalCategory[]>(`/api/flash-local/categories/${parentId}/children/`);
    
    // 处理不同的响应格式
    if (Array.isArray(response)) {
      return response;
    } else if (response && 'data' in response && Array.isArray(response.data)) {
      return response.data;
    } else if (response && 'categories' in response && Array.isArray(response.categories)) {
      return response.categories;
    } else if (response && 'items' in response && Array.isArray(response.items)) {
      return response.items;
    }
    
    console.warn('[categoryApi] Unexpected response format:', response);
    return [];
  } catch (error) {
    console.error('[categoryApi] Failed to fetch sub categories:', error);
    throw error;
  }
};

// 导出默认对象，包含所有分类相关的 API 方法
const categoryApi = {
  fetchLevel1Categories,
  fetchSubCategories,
};

export default categoryApi;
