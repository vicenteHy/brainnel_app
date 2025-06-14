import { useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { inquiriesApi, InquiryBase64Data } from '../../../../services/api/inquiries';

interface FormData {
  name: string;
  quantity: string;
  material: string;
  link: string;
  remark: string;
}

export const useInquiryForm = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    quantity: "",
    material: "",
    link: "",
    remark: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(0);
  const [lastInquiry, setLastInquiry] = useState<any>(null);

  const resetForm = () => {
    setFormData({
      name: "",
      quantity: "",
      material: "",
      link: "",
      remark: "",
    });
  };

  const handleSubmit = async (searchImg: string, base64Data: string | null) => {
    if (!searchImg) {
      Alert.alert(t('banner.inquiry.hint'), t('banner.inquiry.hint'));
      return;
    }

    if (!formData.quantity) {
      Alert.alert(t('banner.inquiry.hint'), t('banner.inquiry.quantity_required'));
      return;
    }

    try {
      setIsSubmitting(true);

      let imageBase64 = base64Data;
      if (!imageBase64) {
        Alert.alert(t("common.error"), t("banner.inquiry.image_process_error"));
        setIsSubmitting(false);
        return;
      }

      // 创建提交数据对象，只包含非空字段
      const submitData: any = {
        image_base64: imageBase64,
        quantity: formData.quantity, // 必填字段
      };

      // 只添加非空字段
      if (formData.name.trim()) {
        submitData.name = formData.name.trim();
      }
      if (formData.material.trim()) {
        submitData.material = formData.material.trim();
      }
      if (formData.link.trim()) {
        submitData.link = formData.link.trim();
      }
      if (formData.remark.trim()) {
        submitData.remark = formData.remark.trim();
      }

      console.log("=== 提交询盘表单数据 ===");
      console.log("完整提交数据:", {
        ...submitData,
        image_base64_length: imageBase64.length,
        image_base64_preview: imageBase64.substring(0, 100) + "...",
      });
      console.log("数据字段详情:");
      Object.keys(submitData).forEach(key => {
        if (key === 'image_base64') {
          console.log(`${key}: [base64数据长度: ${submitData[key].length}]`);
        } else {
          console.log(`${key}: ${submitData[key]}`);
        }
      });
      console.log("========================");

      // Submit the inquiry
      try {
        const response = await inquiriesApi.createInquiry(submitData);
        console.log("Inquiry created:", response);
        
        // 检查响应中的 success 字段
        if (response.success === false) {
          // 如果后端返回失败，显示错误消息
          const errorMessage = response.message || t("banner.inquiry.submit_failed");
          Alert.alert(t("common.error"), errorMessage);
          return false;
        }
        
        // 如果没有 success 字段或 success 为 true，检查 status
        if (response.status !== undefined) {
          setStatus(response.status);
          if (response.status === 1) {
            setLastInquiry(response);
          }
        }
        
        // Reset form and show success message
        resetForm();
        Alert.alert(t("common.success"), t("banner.inquiry.submit_success"));
        
        return true; // Success
      } catch (error: any) {
        console.error("创建询盘出错:", error);
        // 尝试从错误响应中获取消息
        let errorMessage = t("banner.inquiry.submit_failed");
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        Alert.alert(t("common.error"), errorMessage);
        return false;
      }
    } catch (error: any) {
      console.error("Error creating inquiry:", error);
      Alert.alert(t("common.error"), t("banner.inquiry.submit_error"));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    isSubmitting,
    status,
    lastInquiry,
    handleSubmit,
    resetForm,
  };
};