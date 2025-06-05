import { create } from "zustand";
import { getCartList } from "../services/api/cart";
import useUserStore from "./user";

interface CartState {
  cartItemCount: number;
  setCartItemCount: (count: number) => void;
  updateCartItemCount: () => Promise<void>;
  addToCartCount: (quantity: number) => void;
  removeFromCartCount: (quantity: number) => void;
}

const useCartStore = create<CartState>((set, get) => ({
  cartItemCount: 0,
  
  setCartItemCount: (count: number) => set({ cartItemCount: count }),
  
  updateCartItemCount: async () => {
    try {
      const { user } = useUserStore.getState();
      if (!user?.user_id) {
        set({ cartItemCount: 0 });
        return;
      }
      
      const response = await getCartList();
      if (response && response.items) {
        // 计算购物车中所有商品的总数量
        const totalCount = response.items.reduce((total, item) => {
          return total + item.skus.reduce((skuTotal, sku) => {
            return skuTotal + sku.quantity;
          }, 0);
        }, 0);
        
        set({ cartItemCount: totalCount });
      } else {
        set({ cartItemCount: 0 });
      }
    } catch (error) {
      console.error("获取购物车数量失败:", error);
      set({ cartItemCount: 0 });
    }
  },
  
  addToCartCount: (quantity: number) => {
    const { cartItemCount } = get();
    set({ cartItemCount: cartItemCount + quantity });
  },
  
  removeFromCartCount: (quantity: number) => {
    const { cartItemCount } = get();
    const newCount = Math.max(0, cartItemCount - quantity);
    set({ cartItemCount: newCount });
  },
}));

export default useCartStore; 