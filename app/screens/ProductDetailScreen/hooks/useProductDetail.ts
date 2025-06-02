import { useState, useEffect } from 'react';
import { useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { productApi, ProductDetailParams, SkuAttribute, ProductGroupList } from '../../../services/api/productApi';
import useUserStore from '../../../store/user';
import useProductCartStore from '../../../store/productCart';
import useAnalyticsStore from '../../../store/analytics';
import { getSubjectTransLanguage } from '../../../utils/languageUtils';
import { t } from '../../../i18n';

type ProductDetailRouteParams = {
  offer_id: string;
  searchKeyword?: string;
  price: number;
};

export const useProductDetail = () => {
  const userStore = useUserStore();
  const analyticsData = useAnalyticsStore.getState();
  const { product, setProduct, groupList, setGroupList } = useProductCartStore();
  const route = useRoute<RouteProp<Record<string, ProductDetailRouteParams>, string>>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});
  const [priceSelectedSku, setPriceSelectedSku] = useState<any>();
  const [imageUrls, setImageUrls] = useState<any[]>([]);
  const [imageHeights, setImageHeights] = useState<{ [key: string]: number }>({});
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  const groupData = (res: ProductDetailParams, priceSelectedSku: SkuAttribute[]) => {
    let result = {} as any;
    res.skus.forEach((item) => {
      item.attributes.forEach((attribute) => {
        const { attribute_name_trans, value } = attribute;
        if (!result[attribute_name_trans]) {
          result[attribute_name_trans] = [];
        }
        if (!result[attribute_name_trans].some((existingAttribute: any) => existingAttribute.value === value)) {
          result[attribute_name_trans].push(attribute);
        }
      });
    });

    const list: ProductGroupList[] = [];
    for (const [attributeName, attributes] of Object.entries(result)) {
      const withImage: any[] = [];
      const withoutImage: any[] = [];
      
      // @ts-ignore
      attributes.forEach((attribute) => {
        attribute.has_color = false;
        const hasImage = attribute.sku_image_url !== null && attribute.sku_image_url !== undefined;
        if (hasImage) {
          withImage.push(attribute);
        } else {
          withoutImage.push(attribute);
        }
      });

      list.push({
        attribute_name: attributeName,
        attribute_name_trans: attributeName,
        attribute_name_trans_ar: attributeName,
        attribute_name_trans_en: attributeName,
        has_image: withImage.length > 0,
        attributes: [...withImage, ...withoutImage],
      });
    }

    if (!priceSelectedSku) {
      list.forEach((item) => {
        item.attributes[0].has_color = true;
      });
      return list;
    }

    if (priceSelectedSku.length >= 1) {
      priceSelectedSku.forEach((item) => {
        list.forEach((item1) => {
          item1.attributes.forEach((attribute) => {
            if (attribute.value === item.value) {
              attribute.has_color = true;
            }
          });
        });
      });
      return list;
    }
    return list;
  };

  const toggleExpand = (attributeName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [attributeName]: !prev[attributeName],
    }));
  };

  const getDisplayAttributes = (attributes: any[], attributeName: string) => {
    if (expandedGroups[attributeName]) {
      return attributes;
    }
    return attributes.slice(0, 6);
  };

  const updateProductPrice = (selectedSku: SkuAttribute[]) => {
    let price = 0;
    let original_price = 0;
    
    product?.skus.forEach((item) => {
      const values1 = item.attributes.map((item) => item.value).sort();
      const values2 = selectedSku.map((item) => item.value).sort();
      if (values1.every((val, index) => val === values2[index])) {
        if (item.offer_price) {
          price = item.offer_price;
          original_price = item.original_price;
        } else {
          price = product.sale_info.price_range_list[product.sale_info.price_range_list.length - 1].price;
          original_price = product.sale_info.price_range_list[product.sale_info.price_range_list.length - 1].original_price;
        }
      }
    });

    if (product) {
      setProduct({
        ...product,
        price: price === 0 ? t("no_stock") : price,
      });
    }
  };

  const handleSizeSelect = (size: string, index: number) => {
    const newGroupList = [...groupList];
    const attributeIndex = newGroupList[index]?.attributes.findIndex((item) => item.value === size);
    
    if (attributeIndex !== -1) {
      newGroupList[index].attributes = newGroupList[index].attributes.map((item, i) => {
        if (i === attributeIndex) {
          return { ...item, has_color: true };
        }
        return { ...item, has_color: false };
      });
      setGroupList(newGroupList);
    }

    const selectedSku: SkuAttribute[] = [];
    groupList.forEach((item) => {
      item.attributes.forEach((attribute) => {
        if (attribute.has_color) {
          selectedSku.push(attribute);
        }
      });
    });

    updateProductPrice(selectedSku);
  };

  const handleColorSelect = (colorId: string, index: number) => {
    const newGroupList = [...groupList];
    const attributeIndex = newGroupList[index]?.attributes.findIndex((item) => item.value === colorId);
    
    if (attributeIndex !== -1) {
      newGroupList[index].attributes = newGroupList[index].attributes.map((item, i) => {
        if (i === attributeIndex) {
          return { ...item, has_color: true };
        }
        return { ...item, has_color: false };
      });
      setGroupList(newGroupList);
    }

    const selectedSku: SkuAttribute[] = [];
    groupList.forEach((item) => {
      item.attributes.forEach((attribute) => {
        if (attribute.has_color) {
          selectedSku.push(attribute);
        }
      });
    });

    updateProductPrice(selectedSku);
  };

  const handleImageLoad = (src: string, event: any, width: number) => {
    const { width: imageWidth, height: imageHeight } = event;
    const aspectRatio = imageHeight / imageWidth;
    const containerWidth = width;
    const calculatedHeight = containerWidth * aspectRatio;
    
    setImageHeights((prev) => ({
      ...prev,
      [src]: calculatedHeight,
    }));
  };

  const getProductDetail = async () => {
    if (!route.params?.offer_id) return;
    setIsLoading(true);
    
    try {
      const res = await productApi.getProductDetail(route.params.offer_id, userStore.user?.user_id);
      
      if (res.skus != null) {
        const priceSelectedSku = res.skus.find((item) => item.offer_price === route.params.price);
        if (priceSelectedSku) {
          res.price = priceSelectedSku.offer_price;
          res.original_price = priceSelectedSku.original_price;
        } else {
          res.price = res?.sale_info?.price_range_list[res?.sale_info?.price_range_list?.length - 1]?.price;
          res.original_price = res?.sale_info?.price_range_list[res?.sale_info?.price_range_list?.length - 1]?.original_price;
        }
        setPriceSelectedSku(priceSelectedSku);
      } else {
        res.price = route.params.price;
      }

      setProduct(res);
      
      let list: ProductGroupList[] = [];
      if (res.skus != null) {
        list = groupData(res, priceSelectedSku?.attributes as SkuAttribute[]);
      } else {
        list = [];
      }

      const imageUrls = [];
      const regex = /<img[^>]+src="([^"]+)"/g;
      let match;
      while ((match = regex.exec(res.description)) !== null) {
        imageUrls.push(match[1]);
      }
      setImageUrls(imageUrls);
      setGroupList(list);

      const data = {
        offer_id: res.offer_id,
        category_id: res.category_id,
        price: res.price,
        sku_id: priceSelectedSku?.sku_id,
        currency: userStore.user?.currency,
        product_name: res.subject,
        product_img: res.product_image_urls[0],
        timestamp: new Date().toISOString(),
      };
      analyticsData.logViewProduct(data);
    } catch (error) {
      console.error("Error fetching product details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getProductDetail();
  }, []);

  return {
    product,
    groupList,
    isLoading,
    expandedGroups,
    priceSelectedSku,
    imageUrls,
    imageHeights,
    showBottomSheet,
    setShowBottomSheet,
    toggleExpand,
    getDisplayAttributes,
    handleSizeSelect,
    handleColorSelect,
    handleImageLoad,
    getProductDetail,
  };
};