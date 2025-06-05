import { useState, useEffect, useCallback } from "react";
import { Alert, InteractionManager } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ProductDetailParams, ProductGroupList } from "../../../services/api/productApi";
import { cartApi } from "../../../services/api/cart";
import useProductCartStore from "../../../store/productCart";
import useUserStore from "../../../store/user";
import useCartStore from "../../../store/cartStore";
import { t } from "../../../i18n";

interface UseProductCardProps {
  localProduct: ProductDetailParams;
  localGroupList: ProductGroupList[];
}

export const useProductCard = ({ localProduct, localGroupList }: UseProductCardProps) => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  
  // 模态框状态
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [alertModalVisible, setAlertModalVisible] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<{
    title: string;
    message: string;
  }>({
    title: "",
    message: "",
  });
  const [alertConfirmCallback, setAlertConfirmCallback] = useState<
    (() => void) | null
  >(null);

  // 数量输入弹窗相关状态
  const [quantityInputVisible, setQuantityInputVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    type: "hasImg" | "noImg";
    index: number;
    currentQuantity: number;
    maxQuantity: number;
    attributeValue?: string;
  } | null>(null);
  const [quantityInput, setQuantityInput] = useState("");
  
  // 产品数量状态
  const [mainProductQuantity, setMainProductQuantity] = useState(1);
  const [skuQuantities, setSkuQuantities] = useState<{[key: number]: number}>({});

  const {
    user: { user_id, vip_level, currency, vip_discount },
  } = useUserStore();
  
  const { updateCartItemCount } = useCartStore();
  
  const {
    product,
    groupList,
    imgTitle,
    price,
    hasImg,
    noImgList,
    sizeTitle,
    size,
    flag,
    totalPrice,
    selectedSize,
    setProduct,
    setGroupList,
    setImgTitle,
    setPrice,
    setHasImg,
    setNoImgList,
    setSizeTitle,
    setSize,
    setFlag,
    setTotalPrice,
    setSelectedSize,
    processProductData,
    handleSizeSelect,
    handleNoImgSizeSelect,
    handleColorSelect,
  } = useProductCartStore();

  useEffect(() => {
    setProduct(localProduct);
    setGroupList(localGroupList);
    processProductData();
    
    // 为多SKU商品初始化数量状态
    if (localProduct.skus && localProduct.skus.length > 1) {
      const initialQuantities: {[key: number]: number} = {};
      localProduct.skus.forEach((sku, index) => {
        initialQuantities[index] = 0;
      });
      setSkuQuantities(initialQuantities);
    }
  }, [localProduct, localGroupList]);

  // 无sku或只有一个sku且为文字时，mainProductQuantity变化时同步更新底部总价和数量
  useEffect(() => {
    if (
      !localProduct.skus ||
      localProduct.skus.length === 0 ||
      (localProduct.skus.length === 1 && !localProduct.skus[0].sku_image_url)
    ) {
      setSelectedSize(mainProductQuantity);
      const price =
        localProduct.skus && localProduct.skus.length === 1 && !localProduct.skus[0].sku_image_url
          ? Number(localProduct.skus[0].offer_price || localProduct.price || 0)
          : Number(localProduct.price) || 0;
      setTotalPrice(price * mainProductQuantity);
    }
  }, [mainProductQuantity, localProduct, setSelectedSize, setTotalPrice]);

  // 多SKU商品的总价和数量计算
  useEffect(() => {
    if (localProduct.skus && localProduct.skus.length > 1) {
      const totalQuantity = Object.values(skuQuantities).reduce((sum, qty) => sum + qty, 0);
      const totalPrice = localProduct.skus.reduce((sum, sku, index) => {
        const price = Number(sku.offer_price || sku.price || 0);
        const quantity = skuQuantities[index] || 0;
        return sum + (quantity * price);
      }, 0);
      setSelectedSize(totalQuantity);
      setTotalPrice(totalPrice);
    }
  }, [skuQuantities, localProduct.skus, setSelectedSize, setTotalPrice]);

  // 显示自定义警告
  const showCustomAlert = useCallback((
    title: string,
    message: string,
    callback?: () => void
  ) => {
    setAlertMessage({ title, message });
    setAlertModalVisible(true);
    setAlertConfirmCallback(callback ? () => callback : null);
  }, []);

  // 处理数量输入弹窗确认
  const handleQuantityInputConfirm = useCallback(() => {
    if (!editingItem) return;

    const newQuantity = parseInt(quantityInput);
    if (isNaN(newQuantity) || newQuantity < 1) {
      showCustomAlert(
        t("productCard.inputError"),
        t("productCard.enterValidQuantity")
      );
      return;
    }

    if (newQuantity > editingItem.maxQuantity) {
      showCustomAlert(
        t("productCard.stockInsufficient"),
        t("productCard.maxQuantityAvailable", {
          maxQuantity: editingItem.maxQuantity,
        })
      );
      return;
    }

    // 处理多SKU商品的数量输入
    if (localProduct.skus && localProduct.skus.length > 1) {
      setSkuQuantities(prev => ({
        ...prev,
        [editingItem.index]: newQuantity
      }));
    } else if (editingItem.attributeValue === "default") {
      // 无SKU商品
      setMainProductQuantity(newQuantity);
    } else {
      // 原有的单个或少量SKU逻辑
      if (editingItem.type === "hasImg") {
        handleSizeSelect(
          editingItem.attributeValue || "",
          newQuantity.toString(),
          editingItem.index,
          editingItem.maxQuantity
        );
      } else {
        handleNoImgSizeSelect(
          editingItem.attributeValue || "",
          newQuantity.toString(),
          editingItem.index,
          editingItem.maxQuantity
        );
      }
    }

    setQuantityInputVisible(false);
    setEditingItem(null);
    setQuantityInput("");
  }, [editingItem, quantityInput, localProduct, showCustomAlert, handleSizeSelect, handleNoImgSizeSelect]);

  // 处理点击数量显示
  const handleQuantityPress = useCallback((
    type: "hasImg" | "noImg",
    index: number,
    currentQuantity: number,
    maxQuantity: number,
    attributeValue?: string
  ) => {
    setEditingItem({
      type,
      index,
      currentQuantity,
      maxQuantity,
      attributeValue,
    });
    setQuantityInput(currentQuantity.toString());
    setQuantityInputVisible(true);
  }, []);

  // 多SKU数量变化处理
  const handleSkuQuantityChange = useCallback((index: number, quantity: number) => {
    setSkuQuantities(prev => ({
      ...prev,
      [index]: quantity
    }));
  }, []);

  // 加入购物车
  const handleAddToCart = useCallback(() => {
    
    if (!user_id) {
      showCustomAlert(
        t("productCard.addFailed"),
        t("productCard.pleaseLoginFirst"),
        () => {
          navigation.navigate("Login");
        }
      );
      return;
    }

    // 检查总数量是否为0
    if (selectedSize === 0) {
      showCustomAlert(
        t("productCard.notice"),
        t("productCard.pleaseAddProductQuantityZero")
      );
      return;
    }

    // 判断无sku
    const isNoSku = !localProduct.skus || localProduct.skus.length === 0;
    // 判断单sku
    const isSingleSku = localProduct.skus && localProduct.skus.length === 1;
    
    if (isNoSku || isSingleSku) {
      if (mainProductQuantity < 1) {
        showCustomAlert(
          t("productCard.addFailed"),
          t("productCard.pleaseSelectProduct")
        );
        return;
      }
      if (mainProductQuantity < (localProduct.min_order_quantity || 1)) {
        showCustomAlert(
          t("productCard.quantityInsufficient"),
          t("productCard.minOrderQuantity", {
            minQuantity: localProduct.min_order_quantity,
          })
        );
        return;
      }
      const data = {
        offer_id: localProduct.offer_id,
        skus: [
          { 
            sku_id: isSingleSku ? localProduct.skus[0].sku_id : localProduct.offer_id, 
            quantity: mainProductQuantity,
            is_inquiry_item: false
          },
        ],
      };
      
      cartApi(data)
        .then(() => {
          setDeleteModalVisible(true);
          // 更新全局购物车数量
          updateCartItemCount();
        })
        .catch(() => {
          Alert.alert(
            t("productCard.addFailed"),
            t("productCard.addFailedTryAgain")
          );
        });
      return;
    }

    // 有多个SKU的商品
    if (localProduct.skus && localProduct.skus.length > 1) {
      const selectedSkus = localProduct.skus
        .map((sku, index) => ({
          ...sku,
          selected_quantity: skuQuantities[index] || 0
        }))
        .filter(sku => sku.selected_quantity > 0);
      
      if (selectedSkus.length === 0) {
        showCustomAlert(
          t("productCard.addFailed"),
          t("productCard.pleaseSelectProduct")
        );
        return;
      }

      const totalQuantity = selectedSkus.reduce((sum, sku) => sum + sku.selected_quantity, 0);
      if (totalQuantity < (localProduct.min_order_quantity || 1)) {
        showCustomAlert(
          t("productCard.quantityInsufficient"),
          t("productCard.minOrderQuantity", {
            minQuantity: localProduct.min_order_quantity,
          })
        );
        return;
      }

      const skus = selectedSkus.map(sku => ({
        sku_id: sku.sku_id,
        quantity: sku.selected_quantity,
        is_inquiry_item: false
      }));

      const data = {
        offer_id: localProduct.offer_id,
        skus,
      };

      cartApi(data)
        .then(() => {
          setDeleteModalVisible(true);
          // 更新全局购物车数量
          updateCartItemCount();
        })
        .catch(() => {
          Alert.alert(
            t("productCard.addFailed"),
            t("productCard.addFailedTryAgain")
          );
        });
      return;
    }

    // 有sku的原有逻辑
    if (totalPrice === 0) {
      showCustomAlert(
        t("productCard.addFailed"),
        t("productCard.pleaseSelectProduct")
      );
      return;
    }
    if (selectedSize < product.min_order_quantity) {
      showCustomAlert(
        t("productCard.quantityInsufficient"),
        t("productCard.minOrderQuantity", {
          minQuantity: product.min_order_quantity,
        })
      );
      return;
    }
    if (groupList.length > 1) {
      const selectedSku =
        hasImg?.attributes?.filter((item) => (item.size ?? 0) > 0) || [];
      
      const skus: { sku_id: number; quantity: number; is_inquiry_item: boolean }[] = [];
      selectedSku.forEach((item) => {
        item.list?.forEach((item) => {
          if ((item.size ?? 0) > 0) {
            skus.push({
              sku_id: item.sku_id,
              quantity: item.size as number,
              is_inquiry_item: false
            });
          }
        });
      });
      const data = {
        offer_id: product.offer_id,
        skus,
      };

      cartApi(data)
        .then((res) => {
          // ... existing code ...
          // 更新全局购物车数量
          updateCartItemCount();
        })
        .catch((err) => {
          Alert.alert(
            t("productCard.addFailed"),
            t("productCard.addFailedTryAgain")
          );
        });
    } else if (groupList.length === 1) {
      const selectedSku =
        noImgList.filter((item) => (item.size ?? 0) > 0) || [];
      const skus: { sku_id: number; quantity: number; is_inquiry_item: boolean }[] = [];
      selectedSku.forEach((item) => {
        skus.push({
          sku_id: item.sku_id,
          quantity: item.size as number,
          is_inquiry_item: false
        });
      });
      const data = {
        offer_id: product.offer_id,
        skus,
      };
      cartApi(data)
        .then((res) => {
          // 更新全局购物车数量
          updateCartItemCount();
        })
        .catch((err) => {
          Alert.alert(
            t("productCard.addFailed"),
            t("productCard.addFailedTryAgain")
          );
        });
    }
    setDeleteModalVisible(true);
  }, [user_id, localProduct, mainProductQuantity, skuQuantities, totalPrice, selectedSize, product, groupList, hasImg, noImgList, showCustomAlert, navigation]);

  const handleCancelDelete = useCallback(() => {
    setDeleteModalVisible(false);
  }, []);

  const handleNavigateToCart = useCallback(() => {
    setDeleteModalVisible(false);
    InteractionManager.runAfterInteractions(() => {
      navigation.push("CartScreen");
    });
  }, [navigation]);

  return {
    // 状态
    deleteModalVisible,
    alertModalVisible,
    alertMessage,
    quantityInputVisible,
    quantityInput,
    mainProductQuantity,
    skuQuantities,
    
    // Store 数据
    imgTitle,
    price,
    totalPrice,
    selectedSize,
    vip_level,
    vip_discount,
    
    // 方法
    showCustomAlert,
    handleQuantityInputConfirm,
    handleQuantityPress,
    handleSkuQuantityChange,
    handleAddToCart,
    handleCancelDelete,
    handleNavigateToCart,
    setMainProductQuantity,
    setQuantityInput,
    setQuantityInputVisible,
    setEditingItem,
    setAlertModalVisible,
  };
};