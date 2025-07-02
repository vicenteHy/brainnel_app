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