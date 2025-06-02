import { useState, useCallback } from "react";
import { Alert } from "react-native";
import {
  getCartList,
  GetCartList,
  updateCartItem,
  deleteCartItem,
  updateBatchCartSelected,
} from "../../../services/api/cart";
import { payApi } from "../../../services/api/payApi";
import useUserStore from "../../../store/user";
import { t } from "../../../i18n";
import Toast from "react-native-toast-message";

export const useCartData = () => {
  const [cartList, setCartList] = useState<GetCartList[]>([]);
  const {
    user: { user_id, currency, vip_discount, country_code },
  } = useUserStore();
  const [selectedItems, setSelectedItems] = useState<{
    [key: string]: boolean;
  }>({});
  const [allSelected, setAllSelected] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [convertedMinAmount, setConvertedMinAmount] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  // 货币转换函数
  const convertCurrency = async () => {
    if (!user_id) {
      return;
    }

    try {
      const data = {
        from_currency: "FCFA",
        to_currency: currency,
        amounts: {
          total_amount: 50000,
        },
      };

      const response = await payApi.convertCurrency(data);

      if (
        response &&
        response.converted_amounts_list &&
        response.converted_amounts_list.length > 0
      ) {
        const convertedTotal = response.converted_amounts_list.find(
          (item: any) => item.item_key === "total_amount"
        );
        if (convertedTotal) {
          return convertedTotal.converted_amount;
        }
      } else {
        return null;
      }
    } catch (error) {
      console.error("货币转换失败:", error);
      return null;
    }
  };

  // 计算选中商品的总金额
  const calculateTotalAmount = (list: GetCartList[]) => {
    let total = 0;
    list.forEach((item) => {
      item.skus.forEach((sku) => {
        if (sku.selected === 1) {
          total = Number((total + sku.price * sku.quantity).toFixed(2));
        }
      });
    });
    setTotalAmount(total);
  };

  // 在状态更新后计算总金额
  const updateCartList = (newList: GetCartList[]) => {
    setCartList(newList);
    calculateTotalAmount(newList);

    if (newList.length === 0) {
      setAllSelected(false);
    }
  };

  const changeAllSelected = (newList: GetCartList[]) => {
    const allSkusSelected = newList.every((item) =>
      item.skus.every((sku) => sku.selected === 1)
    );
    setAllSelected(allSkusSelected);
  };

  const toggleSelection = async (
    cartItemId: string,
    index1: number,
    index: number | null
  ) => {
    if (!user_id) {
      return;
    }

    if (index != null) {
      // 处理子类 SKU 的选择
      const data = {
        cart_item_id: cartList[index1].skus[index].cart_item_id,
        selected: cartList[index1].skus[index].selected === 1 ? 0 : 1,
        quantity: cartList[index1].skus[index].quantity,
      };

      // 立即更新本地状态
      setCartList((prev) => {
        const newList = prev.map((item, idx) => {
          if (idx === index1) {
            const newSkus = item.skus.map((sku) => ({
              ...sku,
              selected:
                sku.cart_item_id === data.cart_item_id
                  ? data.selected
                  : sku.selected,
            }));
            const allSelected = newSkus.every((sku) => sku.selected === 1);
            return {
              ...item,
              skus: newSkus,
              selected: allSelected ? 1 : 0,
            };
          }
          return item;
        });
        calculateTotalAmount(newList);
        changeAllSelected(newList);
        return newList;
      });

      setSelectedItems((prev) => ({
        ...prev,
        [cartItemId]: !prev[cartItemId],
      }));

      // 在后台发起网络请求
      updateCartItem(cartList[index1].cart_id, data).catch((error) => {
        console.error("更新购物车商品状态失败:", error);
        // 如果请求失败，回滚本地状态
        setCartList((prev) => {
          const newList = prev.map((item, idx) => {
            if (idx === index1) {
              const newSkus = item.skus.map((sku) => ({
                ...sku,
                selected:
                  sku.cart_item_id === data.cart_item_id
                    ? data.selected === 1
                      ? 0
                      : 1
                    : sku.selected,
              }));
              const allSelected = newSkus.every((sku) => sku.selected === 1);
              return {
                ...item,
                skus: newSkus,
                selected: allSelected ? 1 : 0,
              };
            }
            return item;
          });
          calculateTotalAmount(newList);
          changeAllSelected(newList);
          return newList;
        });
      });
    } else {
      // 处理父类商品的选择
      const newSelected = cartList[index1].selected === 1 ? 0 : 1;

      // 立即更新本地状态
      setCartList((prev) => {
        const newList = prev.map((item, idx) => {
          if (idx === index1) {
            return {
              ...item,
              skus: item.skus.map((sku) => ({
                ...sku,
                selected: newSelected,
              })),
              selected: newSelected,
            };
          }
          return item;
        });
        calculateTotalAmount(newList);
        changeAllSelected(newList);
        return newList;
      });

      // 获取所有子类的 cart_item_id
      const cartItemIds = cartList[index1].skus.map((sku) => sku.cart_item_id);

      // 在后台发起网络请求
      updateBatchCartSelected({
        cart_id: cartList[index1].cart_id,
        selected: newSelected,
        offer_ids: cartItemIds,
      }).catch((error) => {
        console.error("批量更新购物车商品状态失败:", error);
        // 如果请求失败，回滚本地状态
        setCartList((prev) => {
          const newList = prev.map((item, idx) => {
            if (idx === index1) {
              return {
                ...item,
                skus: item.skus.map((sku) => ({
                  ...sku,
                  selected: newSelected === 1 ? 0 : 1,
                })),
                selected: newSelected === 1 ? 0 : 1,
              };
            }
            return item;
          });
          calculateTotalAmount(newList);
          changeAllSelected(newList);
          return newList;
        });
      });
    }
  };

  const getCart = async () => {
    if (!user_id) {
      return;
    }

    const res = await getCartList();

    // 修正父商品的选择状态，确保与子商品状态一致
    const correctedItems = res.items.map((item) => {
      const allSkusSelected = item.skus.every((sku) => sku.selected === 1);
      return {
        ...item,
        selected: allSkusSelected ? 1 : 0,
      };
    });

    setCartList(correctedItems);
    calculateTotalAmount(correctedItems);

    if (correctedItems.length === 0) {
      setAllSelected(false);
    } else {
      changeAllSelected(correctedItems);
    }
  };

  const selectAllHandel = () => {
    if (!user_id) {
      return;
    }

    const newAllSelected = !allSelected;
    setAllSelected(newAllSelected);

    // 立即更新本地状态
    setCartList((prev) => {
      const newList = prev.map((item) => {
        // 获取所有子类的 cart_item_id
        const cartItemIds = item.skus.map((sku) => sku.cart_item_id);

        // 在后台发起网络请求
        updateBatchCartSelected({
          cart_id: item.cart_id,
          selected: newAllSelected ? 1 : 0,
          offer_ids: cartItemIds,
        }).catch((error) => {
          console.error("批量更新购物车商品状态失败:", error);
          // 如果请求失败，回滚本地状态
          setCartList((prev) => {
            const newList = prev.map((item) => {
              return {
                ...item,
                selected: newAllSelected ? 0 : 1,
                skus: item.skus.map((sku) => ({
                  ...sku,
                  selected: newAllSelected ? 0 : 1,
                })),
              };
            });
            calculateTotalAmount(newList);
            setAllSelected(!newAllSelected);
            return newList;
          });
        });

        return {
          ...item,
          selected: newAllSelected ? 1 : 0,
          skus: item.skus.map((sku) => {
            return { ...sku, selected: newAllSelected ? 1 : 0 };
          }),
        };
      });
      calculateTotalAmount(newList);
      return newList;
    });
  };

  // 添加更新商品数量的方法
  const updateQuantity = async (
    cartId: number,
    cartItemId: number,
    newQuantity: number
  ) => {
    if (!user_id) {
      return;
    }

    try {
      // 更新本地状态
      setCartList((prev) => {
        const newList = prev.map((item) => {
          if (item.cart_id === cartId) {
            return {
              ...item,
              skus: item.skus.map((sku) => {
                if (sku.cart_item_id === cartItemId) {
                  return { ...sku, quantity: newQuantity };
                }
                return sku;
              }),
            };
          }
          return item;
        });
        calculateTotalAmount(newList);
        return newList;
      });

      // 调用API更新数量
      await updateCartItem(cartId, {
        cart_item_id: cartItemId,
        quantity: newQuantity,
        selected: 1,
      });
    } catch (error) {
      console.error("更新商品数量失败:", error);
      // 如果更新失败，回滚本地状态
      getCart();
    }
  };

  // 计算同一商品组的总数量
  const calculateProductGroupTotalQuantity = (cartId: number) => {
    const product = cartList.find((item) => item.cart_id === cartId);
    if (!product) return 0;

    return product.skus.reduce((total, sku) => total + sku.quantity, 0);
  };

  // 处理减少数量
  const handleDecreaseQuantity = (
    cartId: number,
    cartItemId: number,
    currentQuantity: number,
    minOrderQuantity: number,
    showMinQuantityModal: (message: string) => void
  ) => {
    if (!user_id) {
      return;
    }

    // 计算减少1个数量后，该商品组的总数量
    const currentGroupTotal = calculateProductGroupTotalQuantity(cartId);
    const newGroupTotal = currentGroupTotal - 1;

    if (newGroupTotal >= minOrderQuantity) {
      updateQuantity(cartId, cartItemId, currentQuantity - 1);
    } else {
      showMinQuantityModal(
        `${t("cart.notice")}：${t("cart.min_order")}${minOrderQuantity}${t(
          "cart.pieces"
        )}`
      );
    }
  };

  // 处理增加数量
  const handleIncreaseQuantity = (
    cartId: number,
    cartItemId: number,
    currentQuantity: number
  ) => {
    if (!user_id) {
      return;
    }

    updateQuantity(cartId, cartItemId, currentQuantity + 1);
  };

  return {
    cartList,
    selectedItems,
    allSelected,
    totalAmount,
    convertedMinAmount,
    loading,
    setLoading,
    user_id,
    currency,
    vip_discount,
    country_code,
    convertCurrency,
    updateCartList,
    toggleSelection,
    getCart,
    selectAllHandel,
    updateQuantity,
    calculateProductGroupTotalQuantity,
    handleDecreaseQuantity,
    handleIncreaseQuantity,
  };
};