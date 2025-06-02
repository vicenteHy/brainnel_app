import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Text,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import BackIcon from "../../components/BackIcon";
import useCreateOrderStore from "../../store/createOrder";
import useBurialPointStore from "../../store/burialPoint";
import { deleteCartItem } from "../../services/api/cart";
import { t } from "../../i18n";
import { getSubjectTransLanguage } from "../../utils/languageUtils";
import Toast from "react-native-toast-message";

// 导入拆分的组件和hooks
import { CartItem, CartBottom, CartModals, LoginOverlay } from "./components";
import { useCartData } from "./hooks/useCartData";
import { styles } from "./styles";

export const CartScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { setItems } = useCreateOrderStore();

  // 使用自定义hook管理购物车数据
  const {
    cartList,
    selectedItems,
    allSelected,
    totalAmount,
    loading,
    setLoading,
    user_id,
    currency,
    vip_discount,
    country_code,
    convertCurrency,
    toggleSelection,
    getCart,
    selectAllHandel,
    calculateProductGroupTotalQuantity,
    handleDecreaseQuantity,
    handleIncreaseQuantity,
  } = useCartData();

  // 本地状态
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    cartId: number;
    cartItemId: number;
    cartId1: number;
  } | null>(null);
  const [editingItem, setEditingItem] = useState<{
    cartId: number;
    cartItemId: number;
    currentQuantity: number;
  } | null>(null);
  const [quantityInput, setQuantityInput] = useState("");
  const [minQuantityModalVisible, setMinQuantityModalVisible] = useState(false);
  const [minQuantityMessage, setMinQuantityMessage] = useState("");

  // 获取购物车数据
  useFocusEffect(
    useCallback(() => {
      if (user_id) {
        getCart();
      }
    }, [user_id])
  );

  // 统一的提示函数
  const showMinQuantityModal = (message: string) => {
    setMinQuantityMessage(message);
    setMinQuantityModalVisible(true);
  };

  // 处理删除SKU
  const handleDeleteSku = (
    cartId: number,
    cartItemId: number,
    cartId1: number
  ) => {
    if (!user_id) {
      return;
    }
    setItemToDelete({ cartId, cartItemId, cartId1 });
    setDeleteModalVisible(true);
  };

  // 确认删除
  const confirmDelete = () => {
    if (!user_id || !itemToDelete) {
      return;
    }

    const { cartId, cartItemId, cartId1 } = itemToDelete;

    // 执行删除逻辑
    const itemToRemove = cartList.find((item) => item.cart_id === cartId);
    if (itemToRemove) {
      const skuToRemove = itemToRemove.skus.find(
        (sku) => sku.cart_item_id === cartItemId
      );
      if (skuToRemove && skuToRemove.selected === 1) {
        // 如果商品是已选中状态，从总价中减去
        // setTotalAmount((prev) =>
        //   Number((prev - skuToRemove.price * skuToRemove.quantity).toFixed(2))
        // );
      }
    }

    // 更新购物车列表
    const itemToUpdate = cartList.find((item) => item.cart_id === cartId);
    if (itemToUpdate) {
      const remainingSkus = itemToUpdate.skus.filter(
        (sku) => sku.cart_item_id !== cartItemId
      );

      if (remainingSkus.length === 0) {
        deleteCartItem(cartId1, cartItemId).then((res) => {
          console.log(res);
        });
        // 删除整个商品
        getCart(); // 重新获取购物车数据
      } else {
        deleteCartItem(cartId, cartItemId).then((res) => {
          console.log(res);
        });
        // 重新获取购物车数据
        getCart();
      }
    }

    // 关闭确认对话框
    setDeleteModalVisible(false);
    setItemToDelete(null);
  };

  // 取消删除
  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setItemToDelete(null);
  };

  // 处理数量输入框确认
  const handleQuantityInputConfirm = () => {
    if (!user_id || !editingItem) {
      return;
    }

    const newQuantity = parseInt(quantityInput);
    if (isNaN(newQuantity) || newQuantity < 1) {
      showMinQuantityModal(t("cart.enter_valid_quantity"));
      return;
    }

    const { cartId, cartItemId } = editingItem;
    const product = cartList.find((item) => item.cart_id === cartId);
    const minOrderQuantity = product?.min_order_quantity || 1;

    // 计算修改数量后，该商品组的总数量
    const currentGroupTotal = calculateProductGroupTotalQuantity(cartId);
    const currentSkuQuantity =
      product?.skus.find((sku) => sku.cart_item_id === cartItemId)?.quantity ||
      0;
    const quantityDifference = newQuantity - currentSkuQuantity;
    const newGroupTotal = currentGroupTotal + quantityDifference;

    if (newGroupTotal < minOrderQuantity) {
      showMinQuantityModal(
        `${t("cart.notice")}：${t("cart.min_order")}${minOrderQuantity}${t(
          "cart.pieces"
        )}`
      );
    } else {
      // updateQuantity(cartId, cartItemId, newQuantity);
      setEditingItem(null);
      setQuantityInput("");
    }
  };

  // 处理点击数量显示
  const handleQuantityPress = (
    cartId: number,
    cartItemId: number,
    currentQuantity: number
  ) => {
    if (!user_id) {
      return;
    }
    setEditingItem({ cartId, cartItemId, currentQuantity });
    setQuantityInput(currentQuantity.toString());
  };

  // 处理数量输入失焦
  const handleQuantityInputBlur = () => {
    if (quantityInput.trim() === "") {
      setEditingItem(null);
      setQuantityInput("");
    } else {
      handleQuantityInputConfirm();
    }
  };

  // 导航到商品详情页
  const handleNavigateToProduct = (offerId: string, subject: string, price: number) => {
    navigation.navigate("ProductDetail", {
      offer_id: offerId,
      searchKeyword: subject,
      price: price,
    });
  };

  // 提交订单
  const gotoOrder = async () => {
    if (!user_id) {
      Alert.alert(t("cart.add_failed"), t("cart.login_required"));
      return;
    }

    setLoading(true);

    try {
      // 检查是否有选中的商品
      const items: { cart_item_id: number }[] = [];
      cartList.forEach((item) => {
        item.skus.forEach((sku) => {
          if (sku.selected === 1) {
            if (sku.cart_item_id) {
              items.push({
                cart_item_id: sku.cart_item_id,
              });
            }
          }
        });
      });
      if (items.length === 0) {
        Alert.alert(t("cart.add_failed"), t("cart.select_products"));
        return;
      }

      // 收集购物车提交埋点数据
      const burialPointStore = useBurialPointStore.getState();
      burialPointStore.logAddToCart(cartList as any, "cart");

      // 检查每个商品组的最小起订量
      for (const item of cartList) {
        const hasSelectedSku = item.skus.some((sku) => sku.selected === 1);
        if (hasSelectedSku) {
          const currentGroupTotal = calculateProductGroupTotalQuantity(
            item.cart_id
          );
          if (currentGroupTotal < item.min_order_quantity) {
            Toast.show({
              text1: `${getSubjectTransLanguage(item)} ${t("cart.min_order")}${
                item.min_order_quantity
              }${t("cart.pieces")}，${t(
                "cart.current_quantity"
              )}${currentGroupTotal}${t("cart.pieces")}`,
            });
            return;
          }
        }
      }

      const conver = await convertCurrency();
      let isFei = true;
      if (country_code !== 225) {
        if (totalAmount < conver) {
          Toast.show({
            text1: `${t('cart.minimum')}${conver}${currency}`,
          });
          return;
        }
      } else {
        if (totalAmount < conver) {
          isFei = false;
        } else {
          isFei = true;
        }
      }

      setItems(items);
      navigation.navigate("PreviewAddress", { isFei: isFei });
    } catch (error) {
      console.error("提交订单失败:", error);
      Toast.show({
        text1: t("cart.submit_failed"),
      });
    } finally {
      setLoading(false);
    }
  };

  // 导航到登录页面
  const goToLogin = () => {
    navigation.navigate("Login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        {/* 头部导航栏 */}
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <BackIcon size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("cart.cart")}</Text>
          <View style={styles.headerRightSpace} />
        </View>
        
        <View style={styles.container}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContentContainer}
          >
            <View style={styles.productListingContainer}>
              <View style={styles.shoppingCartSection}>
                <View style={styles.productCardContainer7}>
                  <View style={styles.svgContainer}>
                    {/* Replace SVG with actual icon component or image */}
                  </View>
                </View>
              </View>
            </View>
            {cartList.map((item, index1) => (
              <React.Fragment key={item.cart_id}>
                <CartItem
                  item={item}
                  index1={index1}
                  user_id={user_id}
                  vip_discount={vip_discount}
                  editingItem={editingItem}
                  quantityInput={quantityInput}
                  onToggleSelection={toggleSelection}
                  onDeleteSku={handleDeleteSku}
                  onNavigateToProduct={handleNavigateToProduct}
                  onDecreaseQuantity={(cartId, cartItemId, currentQuantity, minOrderQuantity) =>
                    handleDecreaseQuantity(cartId, cartItemId, currentQuantity, minOrderQuantity, showMinQuantityModal)
                  }
                  onIncreaseQuantity={handleIncreaseQuantity}
                  onQuantityPress={handleQuantityPress}
                  onQuantityInputChange={setQuantityInput}
                  onQuantityInputConfirm={handleQuantityInputConfirm}
                  onQuantityInputBlur={handleQuantityInputBlur}
                  calculateProductGroupTotalQuantity={calculateProductGroupTotalQuantity}
                />
                {/* 商品组分隔线 */}
                {index1 < cartList.length - 1 && (
                  <View style={styles.productGroupDivider} />
                )}
              </React.Fragment>
            ))}
          </ScrollView>

          {/* Fixed Bottom Section */}
          <CartBottom
            user_id={user_id}
            allSelected={allSelected}
            totalAmount={totalAmount}
            currency={currency}
            loading={loading}
            onSelectAll={selectAllHandel}
            onSubmitOrder={gotoOrder}
          />

          {/* 未登录遮罩 */}
          <LoginOverlay user_id={user_id} onGoToLogin={goToLogin} />
        </View>
      </View>

      {/* 模态框 */}
      <CartModals
        deleteModalVisible={deleteModalVisible}
        minQuantityModalVisible={minQuantityModalVisible}
        minQuantityMessage={minQuantityMessage}
        onConfirmDelete={confirmDelete}
        onCancelDelete={cancelDelete}
        onCloseMinQuantityModal={() => setMinQuantityModalVisible(false)}
        user_id={user_id}
      />
    </SafeAreaView>
  );
};