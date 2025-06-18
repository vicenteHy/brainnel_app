import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Keyboard, TouchableWithoutFeedback, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import fontSize from '../../../../utils/fontsizeUtils';
import widthUtils from '../../../../utils/widthUtils';

interface FormData {
  name: string;
  quantity: string;
  material: string; 
  link: string;
  remark: string;
}

interface InquiryFormProps {
  searchImg: string;
  formData: FormData;
  onFormDataChange: (data: FormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const InquiryForm: React.FC<InquiryFormProps> = ({
  searchImg,
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const { t } = useTranslation();

  const updateFormData = (field: keyof FormData, value: string) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <View style={styles.productCardContainer}>
          <View style={styles.productCardContainer1}>
            <Image
              source={{ uri: searchImg }}
              style={[styles.articleThumbnailContainer, { backgroundColor: '#f5f5f5' }]}
            />
            <View style={styles.articleTitleContainer}>
              <Text style={styles.elegantText}>{t('banner.inquiry.product_name')}</Text>
              <TextInput
                style={styles.articleTitleContainer1}
                value={formData.name}
                onChangeText={(text) => updateFormData('name', text)}
                placeholder={t('banner.inquiry.enter_product_name')}
                returnKeyType="done"
                onSubmitEditing={dismissKeyboard}
              />
            </View>
          </View>
          
          <View style={styles.flexRowWithContent}>
            <View style={styles.centerColumnWithText}>
              <Text style={styles.quantityLabelTextStyle}>
                <Text style={styles.highlightedText}>*</Text>
                <Text>{t('banner.inquiry.quantity')}</Text>
              </Text>
              <TextInput
                style={styles.quantityContainer}
                value={formData.quantity}
                onChangeText={(text) => updateFormData('quantity', text)}
                placeholder={t('banner.inquiry.enter_quantity')}
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={dismissKeyboard}
              />
            </View>
            <View style={styles.matiereContainer}>
              <Text style={styles.quantityLabelTextStyle}>
                {t('banner.inquiry.material')}
              </Text>
              <TextInput
                style={styles.quantityContainer}
                value={formData.material}
                onChangeText={(text) => updateFormData('material', text)}
                placeholder={t('banner.inquiry.enter_material')}
                returnKeyType="done"
                onSubmitEditing={dismissKeyboard}
              />
            </View>
          </View>

          <View style={styles.linkContainer}>
            <Text style={styles.elegantText}>{t('banner.inquiry.link')}</Text>
            <TextInput
              style={[styles.contentWrapper, styles.multilineInput]}
              value={formData.link}
              onChangeText={(text) => updateFormData('link', text)}
              placeholder={t('banner.inquiry.enter_link')}
              multiline={true}
              textAlignVertical="top"
              blurOnSubmit={true}
              returnKeyType="done"
              onSubmitEditing={dismissKeyboard}
            />
          </View>

          <View style={styles.linkContainer}>
            <Text style={styles.elegantText}>{t('banner.inquiry.remark')}</Text>
            <TextInput
              style={[styles.contentWrapper, styles.multilineInput]}
              value={formData.remark}
              onChangeText={(text) => updateFormData('remark', text)}
              placeholder={t('banner.inquiry.enter_remark')}
              multiline={true}
              textAlignVertical="top"
              blurOnSubmit={true}
              returnKeyType="done"
              onSubmitEditing={dismissKeyboard}
            />
          </View>
        </View>

          <View style={styles.buttonGroupConfirmation}>
          <TouchableOpacity
            style={styles.cancelButtonStyle}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>{t('banner.inquiry.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.confirmButtonStyle,
              isSubmitting && styles.disabledButton,
            ]}
            onPress={onSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.confirmButtonText}>
              {isSubmitting ? t('banner.inquiry.submitting') : t('banner.inquiry.confirm')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  productCardContainer: {
    flexDirection: "column",
    gap: 18,
    alignItems: "stretch",
    justifyContent: "flex-start",
    paddingTop: 26,
    paddingRight: 28,
    paddingBottom: 23,
    paddingLeft: 24,
    backgroundColor: "#f2f6ff",
  },
  productCardContainer1: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
  articleThumbnailContainer: {
    width: 76,
    height: 76,
    borderWidth: 0,
    borderRadius: 5,
    resizeMode: "cover",
  },
  articleTitleContainer: {
    width: widthUtils(221, 221).width,
    marginLeft: 11,
  },
  elegantText: {
    padding: 0,
    margin: 0,
    fontFamily: "PingFang SC",
    fontSize: fontSize(12),
    fontWeight: "500",
    color: "#676b74",
  },
  articleTitleContainer1: {
    width: "100%",
    height: 50,
    marginTop: 9,
    backgroundColor: "white",
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  flexRowWithContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  centerColumnWithText: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    width: widthUtils(152, 152).width,
  },
  quantityLabelTextStyle: {
    padding: 0,
    margin: 0,
    fontSize: fontSize(12),
    fontWeight: "500",
    color: "#676b74",
  },
  highlightedText: {
    fontSize: fontSize(12),
    fontWeight: "500",
    color: "#fe1e00",
  },
  quantityContainer: {
    height: 40,
    backgroundColor: "white",
    paddingHorizontal: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  matiereContainer: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    width: widthUtils(151, 151).width,
    marginLeft: 7,
  },
  linkContainer: {
    marginBottom: 5,
  },
  contentWrapper: {
    width: "100%",
    minHeight: 70,
    backgroundColor: "white",
    paddingHorizontal: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  multilineInput: {
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    maxHeight: 120,
  },
  buttonGroupConfirmation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 26,
    marginRight: 14,
    marginLeft: 9,
  },
  cancelButtonStyle: {
    width: 160,
    minWidth: 160,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f3f5",
    borderRadius: 43,
  },
  confirmButtonStyle: {
    width: 160,
    minWidth: 160,
    height: 46,
    marginLeft: 19,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#002fa7",
    borderRadius: 43,
  },
  cancelButtonText: {
    fontSize: fontSize(16),
    fontWeight: "500",
    lineHeight: 22,
    color: "#333333",
  },
  confirmButtonText: {
    fontSize: fontSize(16),
    fontWeight: "500",
    lineHeight: 22,
    color: "white",
  },
  disabledButton: {
    opacity: 0.7,
  },
});