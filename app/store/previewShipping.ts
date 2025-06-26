import { create } from 'zustand';
import { ordersApi } from '../services/api/orders';
import { AddressDataItem, CartShippingFeeData, ShippingFeeData,DomesticShippingFeeData } from '../services/api/orders';
import useAnalyticsStore from './analytics';
import useUserStore from './user';
import { getAnalyticsData } from './analytics';
import i18n from '../i18n';

interface PreviewShippingState {
  freightForwarderAddress: AddressDataItem | null;
  shippingFees: CartShippingFeeData | null;
  domesticShippingFees: DomesticShippingFeeData | null;
  isLoading: boolean;
  error: string | null;
}

interface PreviewShippingStore {
  // State
  state: PreviewShippingState;
  
  // 获取货代地址
  fetchFreightForwarderAddress: (transportMode: number | null, isToc?: number) => Promise<void>;
  // 计算物流价格
  calculateShippingFee: (data: ShippingFeeData) => Promise<void>;
  // 计算国内物流价格
  calculateDomesticShippingFee: (data: ShippingFeeData) => Promise<void>;
  // 计算所有运费（国际+国内）
  calculateAllShippingFees: (data: ShippingFeeData) => Promise<void>;
  // 重置状态
  resetState: () => void;
  // 清空运费数据
  clearShippingFees: () => void;
}

const usePreviewShippingStore = create<PreviewShippingStore>((set) => ({
  state: {
    freightForwarderAddress: null,
    shippingFees: null,
    domesticShippingFees: null,
    isLoading: false,
    error: null,
  },
  
  fetchFreightForwarderAddress: async (transportMode: number | null, isToc?: number) => {
    set((state) => ({
      state: { ...state.state, isLoading: true, error: null }
    }));
    
    try {
      const response = await ordersApi.freightForwarderAddress(transportMode, isToc);     
      // 处理 current_country_addresses 数组（API实际返回的是复数）
      if ((response as any).current_country_addresses && (response as any).current_country_addresses.length > 0){
        // 将当前国家地址数组中的所有地址添加到other_addresses前面
        response.other_addresses.unshift(...(response as any).current_country_addresses);
      } 

      // 收集货代地址选择埋点数据


      // 准备货代地址埋点数据
      // if (response.current_country_address) {
      //   const forwarderLogData = {
      //     shipping_method: transportMode || 0,
      //     shipping_price_outside: 0,
      //     shipping_price_within: 0,
      //     currency: useUserStore().user.currency || "FCFA",
      //     forwarder_name: response.current_country_address.forwarder_name || "",
      //     country_city: `${response.current_country_address.country || ""} ${response.current_country_address.city || ""}`.trim(),
      //     timestamp: new Date().toISOString(),
      //   };

      //   // 记录货代地址埋点事件
      //   const analyticsStore = useAnalyticsStore.getState();
      //   analyticsStore.logShippingConfirm(forwarderLogData, "address");
      //   console.log("当前所有埋点数据:", getAnalyticsData());
      // }
      
      set((state) => ({
        state: { 
          ...state.state, 
          freightForwarderAddress: response, 
          isLoading: false 
        }
      }));
    } catch (error) {
      set((state) => ({
        state: { 
          ...state.state, 
          error: error instanceof Error ? error.message : i18n.t('shipping.errors.fetch_forwarder_failed'), 
          isLoading: false 
        }
      }));
    }
  },
  
  calculateShippingFee: async (data: ShippingFeeData) => {
    set((state) => ({
      state: { ...state.state, isLoading: true, error: null }
    }));
    
    try {
      const response = await ordersApi.calcShippingFee(data);
      


      // 准备物流信息埋点数据 - 按照指定的字段格式收集
      const shippingLogData = {
        shipping_method: 1, // 默认运输方式，可以根据实际情况调整
        shipping_price_outside: response.total_shipping_fee_air || 0,
        shipping_price_within: response.total_shipping_fee_sea || 0,
        currency: response.currency || "FCFA",
        forwarder_name: "", // CartShippingFeeData中没有这个字段
        country_city: "", // CartShippingFeeData中没有这个字段
        timestamp: new Date().toISOString(),
      };

      // 记录物流信息埋点事件
      const analyticsStore = useAnalyticsStore.getState();
      analyticsStore.logShippingConfirm(shippingLogData, "address");
      
      
      set((state) => ({
        state: { 
          ...state.state, 
          shippingFees: response, 
          isLoading: false 
        }
      }));
    } catch (error) {
      set((state) => ({
        state: { 
          ...state.state, 
          error: error instanceof Error ? error.message : i18n.t('shipping.errors.calculate_shipping_failed'), 
          isLoading: false 
        }
      }));
    }
  },
  
  calculateDomesticShippingFee: async (data: ShippingFeeData) => {
    set((state) => ({
      state: { ...state.state, isLoading: true, error: null }
    }));
    
    try {
      const response = await ordersApi.calcDomesticShippingFee(data);
      
      // 收集国内物流埋点数据


      // 准备国内物流信息埋点数据
      const domesticShippingLogData = {
        shipping_method: 2, // 国内物流方式
        shipping_price_outside: 0, // 国内物流没有境外价格
        shipping_price_within: response.total_shipping_fee || 0,
        currency: response.currency || "FCFA",
        forwarder_name: "", // DomesticShippingFeeData中没有这个字段
        country_city: "", // DomesticShippingFeeData中没有这个字段
        timestamp: new Date().toISOString(),
      };

      // 记录国内物流信息埋点事件
      const analyticsStore = useAnalyticsStore.getState();
      analyticsStore.logShippingConfirm(domesticShippingLogData, "address");
      
      
      set((state) => ({
        state: { 
          ...state.state, 
          domesticShippingFees: response, 
          isLoading: false 
        }
      }));
    } catch (error) {
      set((state) => ({
        state: { 
          ...state.state, 
          error: error instanceof Error ? error.message : i18n.t('shipping.errors.calculate_domestic_failed'), 
          isLoading: false 
        }
      }));
    }
  },
  
  resetState: () => {
    set({
      state: {
        freightForwarderAddress: null,
        shippingFees: null,
        domesticShippingFees: null,
        isLoading: false,
        error: null,
      }
    });
  },
  
  clearShippingFees: () => {
    set((state) => ({
      state: {
        ...state.state,
        shippingFees: null,
        domesticShippingFees: null,
      }
    }));
  },
  
  calculateAllShippingFees: async (data: ShippingFeeData) => {
    set((state) => ({
      state: { ...state.state, isLoading: true, error: null }
    }));
    
    try {
      // 并行执行两个API调用
      const [shippingResponse, domesticResponse] = await Promise.all([
        ordersApi.calcShippingFee(data),
        ordersApi.calcDomesticShippingFee(data)
      ]);
      
      // 处理国际运费埋点
      const shippingLogData = {
        shipping_method: 1,
        shipping_price_outside: shippingResponse.total_shipping_fee_air || 0,
        shipping_price_within: shippingResponse.total_shipping_fee_sea || 0,
        currency: shippingResponse.currency || "FCFA",
        forwarder_name: "",
        country_city: "",
        timestamp: new Date().toISOString(),
      };
      
      // 处理国内运费埋点
      const domesticShippingLogData = {
        shipping_method: 2,
        shipping_price_outside: 0,
        shipping_price_within: domesticResponse.total_shipping_fee || 0,
        currency: domesticResponse.currency || "FCFA",
        forwarder_name: "",
        country_city: "",
        timestamp: new Date().toISOString(),
      };
      
      // 记录埋点
      const analyticsStore = useAnalyticsStore.getState();
      analyticsStore.logShippingConfirm(shippingLogData, "address");
      analyticsStore.logShippingConfirm(domesticShippingLogData, "address");
      
      // 更新状态
      set((state) => ({
        state: { 
          ...state.state, 
          shippingFees: shippingResponse,
          domesticShippingFees: domesticResponse,
          isLoading: false 
        }
      }));
    } catch (error) {
      set((state) => ({
        state: { 
          ...state.state, 
          error: error instanceof Error ? error.message : i18n.t('shipping.errors.calculate_shipping_failed'), 
          isLoading: false 
        }
      }));
    }
  }
}));

export default usePreviewShippingStore;