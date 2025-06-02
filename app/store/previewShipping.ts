import { create } from 'zustand';
import { ordersApi } from '../services/api/orders';
import { AddressDataItem, CartShippingFeeData, ShippingFeeData,DomesticShippingFeeData } from '../services/api/orders';
import useBurialPointStore from './burialPoint';
import useUserStore from './user';
import { getBurialPointData } from './burialPoint';

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
  fetchFreightForwarderAddress: (transportMode: number | null) => Promise<void>;
  // 计算物流价格
  calculateShippingFee: (data: ShippingFeeData) => Promise<void>;
  // 计算国内物流价格
  calculateDomesticShippingFee: (data: ShippingFeeData) => Promise<void>;
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
  
  fetchFreightForwarderAddress: async (transportMode: number | null) => {
    set((state) => ({
      state: { ...state.state, isLoading: true, error: null }
    }));
    
    try {
      const response = await ordersApi.freightForwarderAddress(transportMode);     
      if (response.current_country_address != null){
        response.other_addresses.unshift(response.current_country_address);
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
      //   const burialPointStore = useBurialPointStore.getState();
      //   burialPointStore.logShippingConfirm(forwarderLogData, "address");
      //   console.log("当前所有埋点数据:", getBurialPointData());
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
          error: error instanceof Error ? error.message : 'Failed to fetch freight forwarder address', 
          isLoading: false 
        }
      }));
    }
  },
  
  calculateShippingFee: async (data: ShippingFeeData) => {
    set((state) => ({
      state: { ...state.state, isLoading: false, error: null }
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
      const burialPointStore = useBurialPointStore.getState();
      burialPointStore.logShippingConfirm(shippingLogData, "address");
      
      console.log("当前所有埋点数据:", getBurialPointData());
      
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
          error: error instanceof Error ? error.message : 'Failed to calculate shipping fee', 
          isLoading: false 
        }
      }));
    }
  },
  
  calculateDomesticShippingFee: async (data: ShippingFeeData) => {
    set((state) => ({
      state: { ...state.state, isLoading: false, error: null }
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
      const burialPointStore = useBurialPointStore.getState();
      burialPointStore.logShippingConfirm(domesticShippingLogData, "address");
      
      console.log("国内物流信息埋点数据:", domesticShippingLogData);
      
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
          error: error instanceof Error ? error.message : 'Failed to calculate domestic shipping fee', 
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
  }
}));

export default usePreviewShippingStore;