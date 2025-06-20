import React, { useState, useCallback, useEffect } from "react";
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
import useAnalyticsStore from "../../store/analytics";
import useCartStore from "../../store/cartStore";
import { deleteCartItem } from "../../services/api/cart";
import { t } from "../../i18n";
import { getSubjectTransLanguage } from "../../utils/languageUtils";
import Toast from "react-native-toast-message";
import { eventBus } from "../../utils/eventBus";

// 导入拆分的组件和hooks
import { CartItem, CartBottom, CartModals, LoginOverlay } from "./components";
import { useCartData } from "./hooks/useCartData";
import { styles } from "./styles";

export const CartScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { setItems, setCartData } = useCreateOrderStore();
  const { updateCartItemCount } = useCartStore();

  // 使用自定义hook管理购物车数据
  const {
    cartList,
    setCartList,
    selectedItems,
    allSelected,
    totalAmount,
    loading,
    setLoading,
    user_id,
    currency,
    vip_discount,
    vip_level,
    country_code,
    is_leader,
    convertCurrency,
    toggleSelection,
    getCart,
    selectAllHandel,
    calculateTotalAmount,
    updateCartIconCount,
    calculateProductGroupTotalQuantity,
    handleDecreaseQuantity,
    handleIncreaseQuantity,
    updateQuantity,
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
  const [quantityInputModalVisible, setQuantityInputModalVisible] = useState(false);
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

  // 监听设置变更事件，刷新购物车数据以更新价格和货币
  useEffect(() => {
    const handleSettingsChanged = () => {
      // 重新获取购物车数据以更新价格和货币显示
      if (user_id) {
        setTimeout(() => {
          getCart();
        }, 300);
      }
    };

    // 监听设置变更事件
    eventBus.on('settingsChanged', handleSettingsChanged);
    eventBus.on('refreshSetting', handleSettingsChanged);
    
    // 清理监听器
    return () => {
      eventBus.off('settingsChanged', handleSettingsChanged);
      eventBus.off('refreshSetting', handleSettingsChanged);
    };
  }, [user_id, getCart]);

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

    // 更新购物车列表
    const itemToUpdate = cartList.find((item) => item.cart_id === cartId);
    
    if (itemToUpdate) {
      const remainingSkus = itemToUpdate.skus.filter(
        (sku) => sku.cart_item_id !== cartItemId
      );

      // 立即更新本地UI状态，提供即时反馈
      let updatedCartList: any[];
      if (remainingSkus.length === 0) {
        // 删除整个商品
        updatedCartList = cartList.filter((item) => item.cart_id !== cartId);
      } else {
        // 删除单个SKU
        updatedCartList = cartList.map((item) => {
          if (item.cart_id === cartId) {
            return {
              ...item,
              skus: remainingSkus
            };
          }
          return item;
        });
      }
      
      setCartList(updatedCartList);
      calculateTotalAmount(updatedCartList);
      // 立即更新购物车图标数字
      updateCartIconCount(updatedCartList);

      if (remainingSkus.length === 0) {
        deleteCartItem(cartId1, cartItemId)
          .then((res) => {
            // API删除成功后重新获取购物车数据（同步服务器状态）
            getCart();
          })
          .catch((error) => {
            console.error('删除失败', error);
            // 即使删除失败也重新获取数据以确保状态一致
            getCart();
          });
      } else {
        deleteCartItem(cartId, cartItemId)
          .then((res) => {
            // API删除成功后重新获取购物车数据（同步服务器状态）
            getCart();
          })
          .catch((error) => {
            console.error('删除失败', error);
            // 即使删除失败也重新获取数据以确保状态一致
            getCart();
          });
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
      // 调用updateQuantity方法来更新数量
      updateQuantity(cartId, cartItemId, newQuantity);
      setEditingItem(null);
      setQuantityInput("");
      setQuantityInputModalVisible(false);
    }
  };

  // 处理数量输入弹窗取消
  const handleQuantityInputCancel = () => {
    setQuantityInputModalVisible(false);
    setEditingItem(null);
    setQuantityInput("");
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
    setQuantityInputModalVisible(true);
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
  const goToOrder = async () => {
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
      const analyticsStore = useAnalyticsStore.getState();
      analyticsStore.logAddToCart(cartList as any, "cart");

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

      // 获取50000FCFA等值的用户货币金额
      const minAmountInUserCurrency = await convertCurrency();
      
      // 第一步：检查是否可以下单（金额限制）
      if (is_leader === 1) {
        // Leader用户无金额限制
      } else {
        if (country_code !== 225) {
          // 非科特迪瓦用户：需要达到50000FCFA等值金额才能下单
          if (totalAmount < minAmountInUserCurrency) {
            Toast.show({
              text1: `${t('cart.minimum')}${minAmountInUserCurrency?.toFixed(2)}${currency}`,
            });
            return;
          }
        }
      }
      
      // 第二步：判断isToc参数（科特迪瓦用户且金额<50000FCFA时为1）
      let isToc = 0;
      
      if (country_code === 225) {
        // 科特迪瓦用户：金额<50000FCFA时isToc=1
        if (currency === "FCFA") {
          if (totalAmount < 50000) {
            isToc = 1; // 低于50000FCFA，isToc=1
          } else {
            isToc = 0; // 达到50000FCFA，isToc=0
          }
        } else {
          if (totalAmount < minAmountInUserCurrency) {
            isToc = 1; // 低于50000FCFA等值，isToc=1
          } else {
            isToc = 0; // 达到50000FCFA等值，isToc=0
          }
        }
      } else {
        isToc = 0;
      }
      
      // 第三步：根据isToc判断初始COD状态
      let isCOD = true;
      
      if (country_code === 225) {
        if (isToc === 1) {
          isCOD = false; // 科特迪瓦小金额用户不可以COD
        } else {
          isCOD = true; // 科特迪瓦大金额用户可以COD
        }
      } else {
        isCOD = true;
      }

      setItems(items);
      setCartData(cartList);
      navigation.navigate("PreviewAddress", { isCOD: isCOD, isToc: isToc });
    } catch (error) {
      console.error("提交订单失败:", error);
      Toast.show({
        text1: t("cart.submit_failed"),
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理返回按钮逻辑
  const handleBackPress = () => {
    navigation.goBack();
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
            onPress={handleBackPress}
            activeOpacity={1}
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
                  <View style={styles.iconContainer18}>
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
                  user_id={user_id?.toString() || null}
                  vip_discount={vip_discount}
                  vip_level={vip_level}
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
                  onQuantityInputBlur={() => {}}
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
            user_id={user_id?.toString() || null}
            allSelected={allSelected}
            totalAmount={totalAmount}
            currency={currency}
            loading={loading}
            onSelectAll={selectAllHandel}
            onSubmitOrder={goToOrder}
          />

          {/* 未登录遮罩 */}
          <LoginOverlay user_id={user_id?.toString() || null} onGoToLogin={goToLogin} />
        </View>
      </View>

      {/* 模态框 */}
      <CartModals
        deleteModalVisible={deleteModalVisible}
        minQuantityModalVisible={minQuantityModalVisible}
        minQuantityMessage={minQuantityMessage}
        quantityInputModalVisible={quantityInputModalVisible}
        quantityInput={quantityInput}
        onConfirmDelete={confirmDelete}
        onCancelDelete={cancelDelete}
        onCloseMinQuantityModal={() => setMinQuantityModalVisible(false)}
        onQuantityInputChange={setQuantityInput}
        onQuantityInputConfirm={handleQuantityInputConfirm}
        onQuantityInputCancel={handleQuantityInputCancel}
        user_id={user_id?.toString() || null}
      />
    </SafeAreaView>
  );
};