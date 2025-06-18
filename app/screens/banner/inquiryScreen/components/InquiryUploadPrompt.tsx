import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import fontSize from '../../../../utils/fontsizeUtils';

interface InquiryUploadPromptProps {
  onUploadPress: () => void;
}

export const InquiryUploadPrompt: React.FC<InquiryUploadPromptProps> = ({ onUploadPress }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.productInfoContainer}>
      <View style={styles.productImageUploadSection}>
        <View style={styles.productInfoContainer1}>
          <Image
            source={require("../../../../../assets/img/image_fac2b0a9.png")}
            style={styles.productImageIcon}
            resizeMode="cover"
          />
          <View style={styles.productQuoteContainer}>
            <Text style={styles.productInfoHeading}>
              {t('banner.inquiry.upload_image_get_quote')}
            </Text>
            <Text style={styles.productInfoMessage1}>
              {t('banner.inquiry.upload_image_get_quote_message')}
            </Text>
          </View>
        </View>
        <View style={styles.photoUploadContainer}>
          <TouchableOpacity
            style={styles.photoUploadContainer1}
            onPress={onUploadPress}
          >
            <LinearGradient
              colors={["#F5F9FF", "#D8E8FF", "#B9D6FF"]}
              style={styles.gradientBackground}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <View style={styles.photoUploadPromptContainer}>
                <Text style={styles.centerHeadingBoldWhite}>
                  {t('banner.inquiry.take_photo_or_upload')}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  productInfoContainer: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    backgroundColor: "#0766e9",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    marginHorizontal: 16,
    flex: 1,
  },
  productImageUploadSection: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "space-between",
    flex: 1,
    paddingBottom: 24,
  },
  productInfoContainer1: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 24,
    paddingBottom: 22,
    paddingLeft: 29,
    paddingRight: 29,
  },
  productImageIcon: {
    width: 60,
    height: 60,
    borderWidth: 0,
  },
  productQuoteContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 15,
    marginBottom: 20,
  },
  productInfoHeading: {
    fontWeight: "900",
    fontSize: fontSize(16),
    lineHeight: 20,
    color: "white",
  },
  productInfoMessage1: {
    marginTop: 7,
    fontWeight: "400",
    fontSize: fontSize(12),
    lineHeight: 16,
    color: "white",
    textAlign: "center",
  },
  photoUploadContainer: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  photoUploadContainer1: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    shadowColor: "#fd5000",
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
    height: 60,
  },
  gradientBackground: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  photoUploadPromptContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    height: "100%",
    paddingRight: 20,
  },
  centerHeadingBoldWhite: {
    fontWeight: "700",
    fontSize: fontSize(16),
    lineHeight: 20,
    color: "#002FA7",
    textAlign: "right",
  },
});