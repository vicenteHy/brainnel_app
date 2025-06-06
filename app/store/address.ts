import { create } from "zustand";
import { addressApi } from "../services/api/addressApi";
import i18n from "../i18n";

interface Address {
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

interface AddressStore {
  addresses: Address[];
  defaultAddress: Address | null;
  loading: boolean;
  error: string | null;
  fetchAddresses: () => Promise<void>;
  addAddress: (
    address: Omit<
      Address,
      "address_id" | "user_id" | "create_time" | "update_time"
    >
  ) => Promise<void>;
  addAddressStatic: (address: Address) => void;
  updateAddress: (
    addressId: number,
    address: Partial<Address>
  ) => Promise<void>;
  deleteAddress: (addressId: number) => Promise<void>;
  fetchDefaultAddress: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setDefaultAddressStatic: (addressId: number) => void;
}

export const useAddressStore = create<AddressStore>((set) => ({
  addresses: [],
  defaultAddress: null,
  loading: false,
  error: null,
  setLoading: (loading: boolean) => set({ loading }),
  fetchAddresses: async () => {
    try {
      set({ loading: true, error: null });
      const response = await addressApi.getAddress();

      // 检查响应格式
      const addresses = response.items
        ? (response.items as Address[])
        : ((Array.isArray(response) ? response : [response]) as Address[]);

      set({
        addresses,
        loading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : i18n.t("address.errors.fetch_failed"),
        loading: false,
      });
    }
  },

  addAddress: async (address) => {
    try {
      set({ loading: true, error: null });
      const response = await addressApi.postAddress(address);
      set((state) => ({
        addresses: [...state.addresses, response as Address],
      }));
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : i18n.t("address.errors.add_failed"),
        loading: false,
      });
    }
  },

  addAddressStatic: (address: Address) => {
    set((state) => ({
      addresses: [...state.addresses, address],
    }));
  },

  setDefaultAddressStatic: (addressId: number) => {
    set((state) => {
      const newDefaultAddress =
        state.addresses.find((addr) => addr.address_id === addressId) || null;

      return {
        defaultAddress: newDefaultAddress,
      };
    });
  },

  updateAddress: async (addressId, updatedAddress) => {
    try {
      set({ loading: true, error: null });
      const response = await addressApi.updateAddress({
        address_id: addressId,
        ...updatedAddress,
      });
      const updated = response as Address;
      set((state) => {
        const newAddresses = state.addresses.map((addr) =>
          addr.address_id === addressId ? updated : addr
        );
        return {
          addresses: newAddresses,
          loading: false,
        };
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : i18n.t("address.errors.update_failed"),
        loading: false,
      });
    }
  },

  deleteAddress: async (addressId) => {
    try {
      set({ loading: true, error: null });
      await addressApi.deleteAddress(addressId);
      set((state) => {
        const newAddresses = state.addresses.filter(
          (addr) => addr.address_id !== addressId
        );
        return {
          addresses: newAddresses,
          loading: false,
        };
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : i18n.t("address.errors.delete_failed"),
        loading: false,
      });
    }
  },

  fetchDefaultAddress: async () => {
    try {
      set({ loading: true, error: null });
      const response = await addressApi.addressesDefault();

      if (!response) {
        set({
          defaultAddress: null,
          loading: false,
          error: i18n.t("address.errors.no_default_found"),
        });
        return;
      }

      const defaultAddress = response as Address;
      set({
        defaultAddress,
        loading: false,
      });
    } catch (error) {
      console.error("Error in fetchDefaultAddress:", error);
      set({
        defaultAddress: null,
        error:
          error instanceof Error
            ? error.message
            : i18n.t("address.errors.fetch_default_failed"),
        loading: false,
      });
    }
  },
}));
