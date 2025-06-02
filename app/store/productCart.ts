import { create } from "zustand";
import {
  ProductDetailParams,
  ProductGroupList,
  SkuAttribute,
  Sku,
} from "../services/api/productApi";

interface ProductCartState {
  product: ProductDetailParams;
  groupList: ProductGroupList[];
  imgTitle: string;
  price: number;
  hasImg: ProductGroupList;
  totalPrice: number;
  sizeList: SkuAttribute[];
  selectedSize: number;
  setProduct: (product: ProductDetailParams) => void;
  setGroupList: (groupList: ProductGroupList[]) => void;
  setImgTitle: (imgTitle: string) => void;
  setPrice: (price: number) => void;
  setHasImg: (hasImg: ProductGroupList) => void;
  setSizeList: (sizeList: SkuAttribute[]) => void;
  setTotalPrice: (totalPrice: number) => void;
  setSelectedSize: (selectedSize: number) => void;
  noImgList: Sku[];
  setNoImgList: (noImgList: Sku[]) => void;
  flag: boolean;
  setFlag: (flag: boolean) => void;
  sizeTitle: string;
  setSizeTitle: (sizeTitle: string) => void;
  size: string;
  setSize: (size: string) => void;
  processProductData: () => void;
  handleSizeSelect: (
    value: string,
    type: string,
    index: number,
    amount_on_sale: number
  ) => void;
  handleNoImgSizeSelect: (
    value: string,
    type: string,
    index: number,
    amount_on_sale: number
  ) => void;
  calculateTotalSize: (hasImgData: ProductGroupList | undefined) => void;
  handleColorSelect: (
    colorId: string,
    index: number,
    sku_image_url: string
  ) => void;
  offer_id:number;
  setOfferId: (offer_id:number) => void;
}

const useProductCartStore = create<ProductCartState>((set, get) => ({
  product: {} as ProductDetailParams,
  groupList: [] as ProductGroupList[],
  imgTitle: "",
  price: 0,
  hasImg: {} as ProductGroupList,
  sizeList: [] as SkuAttribute[],
  totalPrice: 0,
  selectedSize: 0,
  noImgList: [] as Sku[],
  flag: false,
  sizeTitle: "",
  size: "",
  offer_id:0,
  setOfferId: (offer_id:number) => set({ offer_id }),
  setSizeTitle: (sizeTitle: string) => set({ sizeTitle }),
  setSize: (size: string) => set({ size }),
  setProduct: (product: ProductDetailParams) => set({ product }),
  setGroupList: (groupList: ProductGroupList[]) => set({ groupList }),
  setImgTitle: (imgTitle: string) => set({ imgTitle }),
  setPrice: (price: number = 0) =>
    set((state) => ({
      price: price,
    })),
  setHasImg: (hasImg: ProductGroupList) => set({ hasImg }),
  setSizeList: (sizeList: SkuAttribute[]) => set({ sizeList }),
  setTotalPrice: (totalPrice: number) => set({ totalPrice }),
  setSelectedSize: (selectedSize: number) => set({ selectedSize }),
  setNoImgList: (noImgList: Sku[]) => set({ noImgList }),
  setFlag: (flag: boolean) => set({ flag }),
  processProductData: () => {
    const { groupList, product, offer_id, setOfferId, hasImg: existingHasImg, noImgList: existingNoImgList } = get();
    set({ price: product.price as number });
    if (product) {
      if (offer_id !== product.offer_id) {
        set({ totalPrice: 0, selectedSize: 0 });
      }
      const imageItem = groupList.filter((item) => item.has_image);
      if (imageItem.length > 0) {
        set({ sizeTitle: imageItem[imageItem.length - 1].attribute_name });
        imageItem.forEach((item) => {
          const colorItem = item.attributes.filter(
            (attribute) => attribute.has_color
          );
          if (colorItem.length > 0) {
            set({ imgTitle: colorItem[0].sku_image_url });
          }
        });
        set({ flag: true });
      } else {
        set({ flag: false });
      }
      if (imageItem.length === 0) {
        set({ imgTitle: product?.product_image_urls?.[0] || '' });
      }

      const sizeItem = groupList.filter((item) => !item.has_image);
      if (sizeItem.length > 0) {
        set({ sizeTitle: sizeItem[sizeItem.length - 1].attribute_name });
      }

      const noImg = groupList
        .find((item) => !item.has_image)
        ?.attributes.find((item) => item.has_color);
      set({ size: noImg?.value ?? "" });

      const shotData = groupList.sort((a, b) => (a.has_image ? -1 : 1));
      if (shotData.length > 1) {
        const hasImg = shotData[0];
        if (hasImg) {
          // 创建一个深拷贝，避免修改原始数据
          const processedImg = { ...hasImg };
          processedImg.attributes = hasImg.attributes.map((attr) => ({
            ...attr,
            list: [],
          }));
          // 处理每个属性，添加匹配的SKU到list
          processedImg.attributes.forEach((attribute) => {
            product.skus.forEach((sku) => {
              // 检查SKU是否包含当前属性值
              const matchedAttr = sku.attributes.find(
                (attr) => attr.value === attribute.value
              );

              if (matchedAttr) {
                // 创建SKU的复制，不修改原始SKU
                const skuCopy = { ...sku };
                // 过滤属性，创建新的属性数组而不是修改原始数组
                skuCopy.attributes = sku.attributes
                  .filter((attr) => attr.value !== attribute.value)
                  .map((attr) => ({ ...attr })); // 复制每个属性对象

                // 将处理后的SKU添加到list
                attribute.list.push(skuCopy);
              }
            });
          });
          
          // 保留之前选择的数量信息
          if (existingHasImg && offer_id === product.offer_id) {
            processedImg.attributes.forEach((attr, attrIndex) => {
              // 查找匹配的属性
              const existingAttr = existingHasImg.attributes?.find(ea => ea.value === attr.value);
              if (existingAttr) {
                // 保留颜色选择状态
                attr.has_color = existingAttr.has_color;
                // 保留总数量
                attr.size = existingAttr.size;

                // 保留每个列表项的数量
                attr.list.forEach((item, itemIndex) => {
                  const matchingExistingItem = existingAttr.list?.find(
                    ei => ei.sku_id === item.sku_id
                  );
                  if (matchingExistingItem && matchingExistingItem.size) {
                    item.size = matchingExistingItem.size;
                  }
                });
              }
            });
          }
                                  
          set({ hasImg: processedImg });
        } else {
          set({ hasImg: groupList[0] });
        }
      } else {
        // 处理noImgList，保留之前的数量信息
        const newNoImgList = (product.skus || []).map(sku => {
          if (existingNoImgList && offer_id === product.offer_id) {
            // 查找匹配的已存在项目
            const existingItem = existingNoImgList.find(item => item.sku_id === sku.sku_id);
            if (existingItem && existingItem.size) {
              return {...sku, size: existingItem.size};
            }
          }
          return sku;
        });
        set({ noImgList: newNoImgList });
      }

      const img = groupList
        .find((item) => item.has_image)
        ?.attributes.find((item) => item.has_color);

      set({ size: img?.value ?? "" });
      setOfferId(product.offer_id);
      
      // 重新计算总数量和总价格
      const hasImgData = get().hasImg;
      if (Object.keys(hasImgData).length > 0) {
        get().calculateTotalSize(hasImgData);
      } else {
        const noImgList = get().noImgList;
        if (noImgList && noImgList.length > 0) {
          let total = 0;
          let priceSum = 0;
          noImgList.forEach((item) => {
            total += item.size ?? 0;
            priceSum +=
              ((item.offer_price ??
                product.sale_info?.price_range_list?.[
                  (product.sale_info?.price_range_list?.length || 1) - 1
                ]?.price) || 0) * (item.size ?? 0);
          });
          set({ selectedSize: total, totalPrice: priceSum });
        }
      }
    }
  },
  handleColorSelect: (
    colorId: string,
    index: number,
    sku_image_url: string
  ) => {
    const { hasImg, product, setImgTitle, setPrice, setHasImg } = get();
    if (!hasImg) return;
    if (sku_image_url) {
      setImgTitle(sku_image_url);
    }
    // 创建attributes的深拷贝
    const newAttributes = hasImg.attributes.map((attr, i) => {
      if (i === index) {
        // 当前选中项设为true
        return { ...attr, has_color: true };
      } else {
        // 其他项设为false
        return { ...attr, has_color: false };
      }
    });

    const newPrice = newAttributes[index].list[0].offer_price;
    setPrice(
      newPrice ??
        product.sale_info.price_range_list[
          product.sale_info.price_range_list.length - 1
        ].price
    );

    set({ size: newAttributes[index].value });

    // 更新hasImg状态
    setHasImg({
      ...hasImg,
      attributes: newAttributes,
    });
  },
  handleSizeSelect: (
    value: string,
    type: string,
    index: number,
    amount_on_sale: number
  ) => {
    const { hasImg, product } = get();
    if (!hasImg) return;

    const data = hasImg.attributes.find((item) => item.has_color);
    if (data) {
      // 创建hasImg的深拷贝
      const newHasImg = { ...hasImg };

      // 找到有颜色的属性索引
      const colorIndex = newHasImg.attributes.findIndex(
        (item) => item.has_color
      );
      if (colorIndex !== -1) {
        // 创建属性数组的深拷贝
        newHasImg.attributes = [...newHasImg.attributes];

        // 创建特定属性的深拷贝
        newHasImg.attributes[colorIndex] = {
          ...newHasImg.attributes[colorIndex],
        };

        // 创建list数组的深拷贝
        newHasImg.attributes[colorIndex].list = [
          ...(newHasImg.attributes[colorIndex].list || []),
        ];

        // 创建特定list项的深拷贝
        if (index < newHasImg.attributes[colorIndex].list.length) {
          newHasImg.attributes[colorIndex].list[index] = {
            ...newHasImg.attributes[colorIndex].list[index],
          };

          // 修改size值
          if (type === "+") {
            newHasImg.attributes[colorIndex].size =
              (newHasImg.attributes[colorIndex].size ?? 0) + 1;
            if (newHasImg.attributes[colorIndex].size > amount_on_sale) {
              newHasImg.attributes[colorIndex].size = amount_on_sale;
            }
            newHasImg.attributes[colorIndex].list[index].size =
              (newHasImg.attributes[colorIndex].list[index].size ?? 0) + 1;

            if (
              newHasImg.attributes[colorIndex].list[index].size > amount_on_sale
            ) {
              newHasImg.attributes[colorIndex].list[index].size =
                amount_on_sale;
            }
          } else if (type === "-") {
            newHasImg.attributes[colorIndex].size =
              (newHasImg.attributes[colorIndex].size ?? 0) - 1;
            newHasImg.attributes[colorIndex].list[index].size =
              (newHasImg.attributes[colorIndex].list[index].size ?? 0) - 1;

            if (newHasImg.attributes[colorIndex].list[index].size < 0) {
              newHasImg.attributes[colorIndex].list[index].size = 0;
            }
            if (newHasImg.attributes[colorIndex].size < 0) {
              newHasImg.attributes[colorIndex].size = 0;
            }
          } else {
            // 处理直接输入数字的情况
            const newSize = parseInt(type);
            if (!isNaN(newSize)) {
              // 确保输入的数字在有效范围内
              const validSize = Math.min(Math.max(0, newSize), amount_on_sale);
              newHasImg.attributes[colorIndex].list[index].size = validSize;
              
              // 更新总数量
              let totalSize = 0;
              newHasImg.attributes[colorIndex].list.forEach(item => {
                totalSize += item.size ?? 0;
              });
              newHasImg.attributes[colorIndex].size = totalSize;
            }
          }
          // 更新hasImg状态
          set({ hasImg: newHasImg });
          get().calculateTotalSize(newHasImg);
        }
      }
    }
  },
  handleNoImgSizeSelect: (
    value: string,
    type: string,
    index: number,
    amount_on_sale: number
  ) => {
    const { noImgList, product } = get();
    if (!noImgList || !product || !product.sale_info || !product.sale_info.price_range_list) return;

    const newNoImgList = [...noImgList];
    if (type === "+") {
      newNoImgList[index].size = (newNoImgList[index].size ?? 0) + 1;
      if (newNoImgList[index].size > amount_on_sale) {
        newNoImgList[index].size = amount_on_sale;
      }
    } else if (type === "-") {
      newNoImgList[index].size = (newNoImgList[index].size ?? 0) - 1;
      if (newNoImgList[index].size < 0) {
        newNoImgList[index].size = 0;
      }
    } else {
      // Handle direct number input
      const newSize = parseInt(type);
      if (!isNaN(newSize)) {
        // Ensure the input number is within valid range
        const validSize = Math.min(Math.max(0, newSize), amount_on_sale);
        newNoImgList[index].size = validSize;
      }
    }
    set({ noImgList: newNoImgList });

    let total = 0;
    let priceSum = 0;

    newNoImgList.forEach((item) => {
      total += item.size ?? 0;
      priceSum +=
        (item.offer_price ??
          product.sale_info.price_range_list[
            product.sale_info.price_range_list.length - 1
          ].price) * (item.size ?? 0);
    });

    set({ selectedSize: total, totalPrice: priceSum });
  },
  calculateTotalSize: (hasImgData: ProductGroupList | undefined) => {
    if (!hasImgData) return;
    const { product } = get();

    let total = 0;
    let priceSum = 0;
    hasImgData.attributes.forEach((attr) => {
      attr.list?.forEach((item) => {
        const itemSize = item.size ?? 0;
        total += itemSize;
        priceSum +=
          (item.offer_price ??
            product.sale_info.price_range_list[
              product.sale_info.price_range_list.length - 1
            ].price) * itemSize;
      });
    });

    set({ selectedSize: total, totalPrice: priceSum });
  },
}));

export default useProductCartStore;
