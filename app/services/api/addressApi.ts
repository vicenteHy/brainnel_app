import apiService from "./apiClient";

export interface Address {
  items: AddressItem[];
}

export interface AddressItem {
  receiver_first_name: string;
  receiver_last_name: string;
  country: string;
  receiver_phone: string;
  whatsapp_phone: string;
  province: string;
  city: string;
  district: string;
  detail_address: string;
  is_default: number;
  address_id: number;
  user_id: number;
  create_time: string;
  update_time: string;
}

export interface addressData {
  user_id: number;
  receiver_first_name: string;
  receiver_last_name: string;
  country: string;
  receiver_phone: string;
  whatsapp_phone: string;
  province: string;
  city: string;
  district: string;
  detail_address: string;
  is_default: number;
  address_id: number;
}

export const addressApi = {
  getAddress: () => {
    return apiService.get<Address>("/api/addresses/");
  },
  postAddress: (data: any) => {
    return apiService.post("/api/addresses/",  data );
  },
  addressesDefault: () => {
    return apiService.get<addressData>("/api/addresses/default/");
  },

  updateAddress: (data: any) => {
    return apiService.put(`/api/addresses/${data.address_id}/`, data);
  },

  deleteAddress: (address_id: number) => {
    return apiService.delete(`/api/addresses/${address_id}/`);
  },
};
