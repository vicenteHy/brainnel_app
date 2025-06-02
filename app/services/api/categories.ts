import apiService from "./apiClient";

export interface Category {
  category_id: number;
  name: string;
  name_cn: string;
  name_en: string;
  image:string
  level: number;
  is_leaf: boolean;
  image_url?: string;
}

export const categoriesApi = {
    // 获取一级分类
  getCategories: () => apiService.get<Category[]>("/api/categories/level1/"),
  // 获取二级分类
  getCategory: (parent_id: number) => apiService.get<Category>(`/api/categories/level1/${parent_id}/children/`),
};

