import { apiService } from '../api/apiClient';

export interface District {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

export interface City {
  id: number;
  name: string;
  districts: District[];
}

class DistrictApi {
  /**
   * 获取城市和大区列表
   */
  async getCitiesAndDistricts(): Promise<City[]> {
    try {
      const data = await apiService.get<City[]>('/api/flash-local/cities-and-districts/');
      console.log('获取城市和大区列表成功:', data);
      return data;
    } catch (error) {
      console.error('获取城市和大区列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有大区（扁平化列表）
   */
  async getAllDistricts(): Promise<(District & { cityName: string })[]> {
    const cities = await this.getCitiesAndDistricts();
    const allDistricts: (District & { cityName: string })[] = [];
    
    cities.forEach(city => {
      city.districts.forEach(district => {
        allDistricts.push({
          ...district,
          cityName: city.name,
        });
      });
    });
    
    return allDistricts;
  }
}

export const districtApi = new DistrictApi();
