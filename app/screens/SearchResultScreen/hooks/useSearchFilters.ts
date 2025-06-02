import { useState, useCallback } from "react";
import { type Product } from "../../../services/api/productApi";

export const useSearchFilters = () => {
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [sortField, setSortField] = useState<"price" | "time">("price");
  const [activeTab, setActiveTab] = useState<"default" | "volume" | "price">("default");

  const toggleFilter = useCallback(() => {
    setIsFilterVisible(!isFilterVisible);
  }, [isFilterVisible]);

  const handleSort = useCallback(
    (field: "price" | "time", order: "asc" | "desc", products: Product[], setProducts: (products: Product[]) => void) => {
      setSortField(field);
      setSortOrder(order);
      
      const sortedProducts = [...products];
      if (field === "price") {
        sortedProducts.sort((a, b) => {
          const priceA = a.min_price || 0;
          const priceB = b.min_price || 0;
          return order === "asc" ? priceA - priceB : priceB - priceA;
        });
      } else if (field === "time") {
        sortedProducts.sort((a, b) => {
          const timeA = new Date(a.create_date || 0).getTime();
          const timeB = new Date(b.create_date || 0).getTime();
          return order === "asc" ? timeA - timeB : timeB - timeA;
        });
      }
      setProducts(sortedProducts);
    },
    []
  );

  const handleTabChange = useCallback(
    (
      tab: "default" | "volume" | "price", 
      originalProducts: Product[], 
      setProducts: (products: Product[]) => void,
      scrollToTop: () => void
    ) => {
      if (tab === "price" && activeTab === "price") {
        const newOrder = sortOrder === "asc" ? "desc" : "asc";
        handleSort("price", newOrder, originalProducts, setProducts);
        scrollToTop();
      } else {
        setActiveTab(tab);
        if (tab === "price") {
          handleSort("price", "asc", originalProducts, setProducts);
          scrollToTop();
        } else if (tab === "volume") {
          const sortedProducts = [...originalProducts];
          sortedProducts.sort((a, b) => {
            const volumeA = a.sold_out || 0;
            const volumeB = b.sold_out || 0;
            return volumeB - volumeA;
          });
          setProducts(sortedProducts);
          scrollToTop();
        } else {
          setProducts([...originalProducts]);
          scrollToTop();
        }
      }
    },
    [handleSort, activeTab, sortOrder]
  );

  return {
    isFilterVisible,
    sortOrder,
    sortField,
    activeTab,
    toggleFilter,
    handleSort,
    handleTabChange,
    setActiveTab,
    setSortField,
    setSortOrder,
  };
};