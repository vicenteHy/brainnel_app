import { useState, useEffect } from "react";
import { ProductInquiry } from "../types";
import { loadProductInquiries } from "../utils/storage";
import useUserStore from "../../../store/user";

export const useProductInquiries = (activeTab: string) => {
  const [productInquiries, setProductInquiries] = useState<ProductInquiry[]>([]);
  const { user } = useUserStore();

  const refreshProductInquiries = async () => {
    const inquiries = await loadProductInquiries();
    setProductInquiries(inquiries);
  };

  useEffect(() => {
    if (user.user_id) {
      refreshProductInquiries();
    }
  }, [user.user_id]);

  useEffect(() => {
    if (user.user_id && activeTab === "product") {
      refreshProductInquiries();
    }
  }, [user.user_id, activeTab]);

  return {
    productInquiries,
    refreshProductInquiries,
  };
};