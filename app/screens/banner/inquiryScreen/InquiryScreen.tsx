import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from "react-native";
import fontSize from "../../../utils/fontsizeUtils";
import widthUtils from "../../../utils/widthUtils";

// Components
import { SimpleHeader } from "./components/SimpleHeader";
import { InquiryTabs } from "./components/InquiryTabs";
import { InquiryForm } from "./components/InquiryForm";
import { InquiryUploadPrompt } from "./components/InquiryUploadPrompt";
import { InquiryList } from "./components/InquiryList";
import { ImagePickerModal } from "./components/ImagePickerModal";

// Hooks
import { useImagePicker } from "./hooks/useImagePicker";
import { useInquiryForm } from "./hooks/useInquiryForm";
import { useInquiryList } from "./hooks/useInquiryList";

export const InquiryScreen = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  // 使用自定义 hooks
  const {
    searchImg,
    base64Data,
    showImagePickerModal,
    galleryUsed,
    setShowImagePickerModal,
    handleChooseFromGallery,
    handleTakePhoto,
    resetAppState,
    openImagePicker,
    clearImage,
  } = useImagePicker();

  const {
    formData,
    setFormData,
    isSubmitting,
    handleSubmit: submitForm,
    resetForm,
  } = useInquiryForm();

  const {
    inquiries,
    loading,
    hasMore,
    expandedItems,
    toggleExpanded,
    handleScroll,
  } = useInquiryList(activeTab);

  // 处理表单提交
  const handleSubmit = async () => {
    const success = await submitForm(searchImg, base64Data);
    if (success) {
      clearImage();
      resetForm();
    }
  };

  // 处理取消
  const handleCancel = () => {
    clearImage();
    resetForm();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SimpleHeader />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <View style={styles.productInquirySection1}>
          <View style={[styles.productQuoteSection, activeTab !== 0 && styles.productQuoteSectionCompact]}>
            <InquiryTabs activeTab={activeTab} onTabChange={setActiveTab} />
            
            {activeTab === 0 ? (
              <View style={styles.formContainer}>
                {searchImg ? (
                  <InquiryForm
                    searchImg={searchImg}
                    formData={formData}
                    onFormDataChange={setFormData}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    isSubmitting={isSubmitting}
                  />
                ) : (
                  <InquiryUploadPrompt onUploadPress={openImagePicker} />
                )}
              </View>
            ) : (
              <InquiryList
                inquiries={inquiries}
                loading={loading}
                hasMore={hasMore}
                isCompleted={activeTab === 2}
                expandedItems={expandedItems}
                onToggleExpanded={toggleExpanded}
                onScroll={handleScroll}
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      <ImagePickerModal
        visible={showImagePickerModal}
        galleryUsed={galleryUsed}
        onClose={() => setShowImagePickerModal(false)}
        onTakePhoto={handleTakePhoto}
        onChooseFromGallery={handleChooseFromGallery}
        onResetCamera={resetAppState}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  keyboardAvoidingContainer: {
    flex: 1,
    width: "100%",
  },
  productInquirySection1: {
    flexDirection: "column",
    alignItems: "stretch",
    backgroundColor: "#f8f9fa",
    flex: 1,
    paddingTop: 10,
  },
  productQuoteSection: {
    paddingRight: 0,
    paddingLeft: 0,
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  formContainer: {
    flex: 1,
    marginTop: 16,
  },
  productQuoteSectionCompact: {
    flex: 1,
  },
});