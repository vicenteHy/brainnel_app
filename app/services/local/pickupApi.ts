import { API_BASE_URL } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PickupTimetable {
  day_of_week: string;
  start_time: string;
  end_time: string;
  description: string;
}

export interface PickupLocation {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number | null;
  timetables: PickupTimetable[];
}

export interface PickupLocationsParams {
  latitude?: number | null;
  longitude?: number | null;
}

class PickupApi {
  private baseURL = API_BASE_URL;

  private async getHeaders() {
    const token = await AsyncStorage.getItem('userToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  /**
   * 获取自提点列表
   * @param params 包含用户经纬度（可选）
   * @returns 自提点列表，如果提供了经纬度会包含距离信息
   */
  async getPickupLocations(params?: PickupLocationsParams): Promise<PickupLocation[]> {
    try {
      const headers = await this.getHeaders();
      
      // 构建查询参数
      const queryParams = new URLSearchParams();
      if (params?.latitude !== undefined && params?.latitude !== null) {
        queryParams.append('latitude', params.latitude.toString());
      }
      if (params?.longitude !== undefined && params?.longitude !== null) {
        queryParams.append('longitude', params.longitude.toString());
      }
      
      const url = `${this.baseURL}/api/flash-local/pickup-locations/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      console.log('请求自提点列表 URL:', url);
      console.log('请求参数:', params);
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      console.log('API 响应状态:', response.status);
      console.log('API 响应 headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 错误响应内容:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const responseText = await response.text();
      console.log('API 原始响应内容:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('解析后的自提点列表:', data);
        console.log('自提点数量:', data.length);
        if (data.length > 0) {
          console.log('第一个自提点示例:', data[0]);
        }
      } catch (parseError) {
        console.error('JSON 解析失败:', parseError);
        throw new Error('Invalid JSON response from API');
      }
      
      return data;
    } catch (error) {
      console.error('获取自提点列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取最近的自提点
   * @param userLat 用户纬度
   * @param userLng 用户经度
   * @param locations 自提点列表
   * @returns 最近的自提点
   */
  getNearestPickupLocation(
    userLat: number, 
    userLng: number, 
    locations: PickupLocation[]
  ): PickupLocation | null {
    if (!locations || locations.length === 0) return null;
    
    // 如果后端已经返回了距离信息（单位：公里），直接使用
    const locationsWithDistance = locations.filter(loc => loc.distance !== null);
    if (locationsWithDistance.length > 0) {
      return locationsWithDistance.reduce((nearest, current) => 
        (current.distance! < nearest.distance!) ? current : nearest
      );
    }
    
    // 否则在前端计算距离（米），然后转换为公里
    let nearestLocation = locations[0];
    let minDistance = this.calculateDistance(userLat, userLng, nearestLocation.latitude, nearestLocation.longitude) / 1000; // 转换为公里
    
    for (let i = 1; i < locations.length; i++) {
      const distance = this.calculateDistance(userLat, userLng, locations[i].latitude, locations[i].longitude) / 1000; // 转换为公里
      if (distance < minDistance) {
        minDistance = distance;
        nearestLocation = locations[i];
      }
    }
    
    return nearestLocation;
  }

  /**
   * 计算两点之间的距离（Haversine公式）
   * @returns 距离（米）
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * 格式化距离显示
   * @param distance 距离（后端返回的单位是公里）
   */
  formatDistance(distance: number | null): string {
    if (distance === null) return '';
    
    // 后端返回的距离单位已经是公里
    if (distance < 1) {
      // 小于1公里时，转换为米显示
      return `${Math.round(distance * 1000)}m`;
    } else {
      // 大于等于1公里时，显示公里
      return `${distance.toFixed(1)}km`;
    }
  }

  /**
   * 格式化营业时间
   */
  formatTimetable(timetable: PickupTimetable): string {
    return timetable.description || `${timetable.start_time} - ${timetable.end_time}`;
  }

  /**
   * 检查自提点是否正在营业
   */
  isOpen(timetables: PickupTimetable[]): boolean {
    const now = new Date();
    const currentDay = this.getCurrentDayOfWeek();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
    
    return timetables.some(timetable => {
      if (timetable.day_of_week !== 'everyday' && timetable.day_of_week !== currentDay) {
        return false;
      }
      
      return currentTime >= timetable.start_time && currentTime <= timetable.end_time;
    });
  }

  private getCurrentDayOfWeek(): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  }
}

export const pickupApi = new PickupApi();