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
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
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
    
    // 如果后端已经返回了距离信息，直接使用
    const locationsWithDistance = locations.filter(loc => loc.distance !== null);
    if (locationsWithDistance.length > 0) {
      return locationsWithDistance.reduce((nearest, current) => 
        (current.distance! < nearest.distance!) ? current : nearest
      );
    }
    
    // 否则在前端计算距离
    let nearestLocation = locations[0];
    let minDistance = this.calculateDistance(userLat, userLng, nearestLocation.latitude, nearestLocation.longitude);
    
    for (let i = 1; i < locations.length; i++) {
      const distance = this.calculateDistance(userLat, userLng, locations[i].latitude, locations[i].longitude);
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
   */
  formatDistance(distance: number | null): string {
    if (distance === null) return '';
    
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
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