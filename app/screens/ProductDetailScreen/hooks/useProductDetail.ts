import { useState, useEffect } from 'react';
import { useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { productApi, ProductDetailParams, SkuAttribute, ProductGroupList } from '../../../services/api/productApi';
import { getLiveProductDetails, LiveProductDetail } from '../../../services/api/liveProductApi';
import useUserStore from '../../../store/user';
import useProductCartStore from '../../../store/productCart';
import useAnalyticsStore from '../../../store/analytics';
import { getSubjectTransLanguage } from '../../../utils/languageUtils';
import { t } from '../../../i18n';

type ProductDetailRouteParams = {
  offer_id: string;
  searchKeyword?: string;
  price: number;
  is_live_item?: boolean; // 标识是否为直播商品
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
      let res: any;
      
      // 检查是否为直播商品
      if (route.params.is_live_item) {
        console.log('[ProductDetail] 获取直播商品详情', {
          product_id: route.params.offer_id,
          price: route.params.price,
          is_live_item: route.params.is_live_item
        });
        
        res = await getLiveProductDetails(parseInt(route.params.offer_id));
        
        console.log('[ProductDetail] 直播商品API响应', {
          product_id: res.product_id,
          name: res.name,
          name_en: res.name_en,
          price: res.price,
          original_price: res.original_price,
          image_url: res.image_url,
          skus_length: res.skus?.length || 0,
          description_length: res.description?.length || 0
        });
        
        // 直播商品保持原始数据结构，只做最小必要的字段映射
        res.offer_id = res.product_id;
        res.subject = res.name;
        res.subject_trans = res.name_en || res.name;
        res.product_image_urls = res.image_url ? [res.image_url] : [];
        res.is_live_item = true; // 标记为直播商品
        
        console.log('[ProductDetail] 直播商品字段映射完成', {
          offer_id: res.offer_id,
          subject: res.subject,
          subject_trans: res.subject_trans,
          product_image_urls: res.product_image_urls,
          final_price: res.price,
          is_live_item: res.is_live_item
        });
      } else {
        console.log('[ProductDetail] 获取普通商品详情', {
          offer_id: route.params.offer_id,
          user_id: userStore.user?.user_id
        });
        
        res = await productApi.getProductDetail(route.params.offer_id, userStore.user?.user_id);
        
        console.log('[ProductDetail] 普通商品API响应', {
          offer_id: res.offer_id,
          subject: res.subject,
          price_range: res.sale_info?.price_range_list?.length || 0,
          skus_length: res.skus?.length || 0
        });
      }
      
      if (res.skus != null) {
        let priceSelectedSku;
        console.log('[ProductDetail] 处理SKU数据', {
          skus_count: res.skus.length,
          route_price: route.params.price,
          is_live_item: route.params.is_live_item,
          skus_preview: res.skus.slice(0, 2).map((sku: any) => ({
            sku_id: sku.sku_id,
            price: sku.price,
            offer_price: sku.offer_price,
            original_price: sku.original_price
          }))
        });
        
        if (route.params.is_live_item) {
          // 直播商品：根据价格匹配SKU
          priceSelectedSku = res.skus.find((item: any) => item.price === route.params.price);
          console.log('[ProductDetail] 直播商品SKU匹配结果', {
            found: !!priceSelectedSku,
            matched_sku: priceSelectedSku ? {
              sku_id: priceSelectedSku.sku_id,
              price: priceSelectedSku.price,
              original_price: priceSelectedSku.original_price
            } : null
          });
          
          if (priceSelectedSku) {
            res.price = priceSelectedSku.price;
            res.original_price = priceSelectedSku.original_price;
          }
        } else {
          // 普通商品：使用offer_price匹配
          priceSelectedSku = res.skus.find((item: any) => item.offer_price === route.params.price);
          console.log('[ProductDetail] 普通商品SKU匹配结果', {
            found: !!priceSelectedSku,
            matched_sku: priceSelectedSku ? {
              sku_id: priceSelectedSku.sku_id,
              offer_price: priceSelectedSku.offer_price,
              original_price: priceSelectedSku.original_price
            } : null
          });
          
          if (priceSelectedSku) {
            res.price = priceSelectedSku.offer_price;
            res.original_price = priceSelectedSku.original_price;
          } else {
            res.price = res?.sale_info?.price_range_list[res?.sale_info?.price_range_list?.length - 1]?.price;
            res.original_price = res?.sale_info?.price_range_list[res?.sale_info?.price_range_list?.length - 1]?.original_price;
          }
        }
        setPriceSelectedSku(priceSelectedSku);
      } else {
        console.log('[ProductDetail] 无SKU数据，使用路由价格', {
          route_price: route.params.price
        });
        res.price = route.params.price;
      }

      console.log('[ProductDetail] 设置最终产品数据', {
        offer_id: res.offer_id,
        final_price: res.price,
        original_price: res.original_price,
        is_live_item: res.is_live_item,
        has_skus: !!res.skus,
        product_image_urls_count: res.product_image_urls?.length || 0
      });
      
      setProduct(res);
      
      let list: ProductGroupList[] = [];
      if (res.skus != null && !route.params.is_live_item) {
        // 只有普通商品才处理属性分组，直播商品不需要
        console.log('[ProductDetail] 处理普通商品属性分组');
        list = groupData(res, priceSelectedSku?.attributes as SkuAttribute[]);
        console.log('[ProductDetail] 属性分组完成', {
          groups_count: list.length,
          groups: list.map(group => ({
            name: group.attribute_name,
            attributes_count: group.attributes.length
          }))
        });
      } else if (route.params.is_live_item) {
        console.log('[ProductDetail] 直播商品跳过属性分组处理');
      }

      const imageUrls = [];
      const regex = /<img[^>]+src="([^"]+)"/g;
      let match;
      while ((match = regex.exec(res.description)) !== null) {
        imageUrls.push(match[1]);
      }
      console.log('[ProductDetail] 解析描述图片', {
        description_length: res.description?.length || 0,
        extracted_images: imageUrls.length
      });
      
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
      console.log('[ProductDetail] 记录产品浏览分析数据', {
        offer_id: data.offer_id,
        category_id: data.category_id,
        price: data.price,
        sku_id: data.sku_id,
        product_name: data.product_name,
        has_product_img: !!data.product_img
      });
      analyticsData.logViewProduct(data);
      
      console.log('[ProductDetail] 产品详情加载完成');
    } catch (error: any) {
      console.error("[ProductDetail] 获取产品详情失败:", error);
      console.error("[ProductDetail] 错误详情:", {
        message: error.message,
        stack: error.stack,
        offer_id: route.params?.offer_id,
        is_live_item: route.params?.is_live_item
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getProductDetail();
  }, [route.params?.offer_id]);

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