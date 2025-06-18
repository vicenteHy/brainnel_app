import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import BackIcon from '../../../../components/BackIcon';
import fontSize from '../../../../utils/fontsizeUtils';
import widthUtils from '../../../../utils/widthUtils';

export const InquiryHeader = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <LinearGradient
      colors={["#C8DFFF", "#ECF5FF"]}
      style={styles.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <View>
        <View style={styles.titleContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <BackIcon size={fontSize(24)} />
          </TouchableOpacity>
          <View style={styles.titleTextContainer}>
            <Text style={styles.titleText}>{t('banner.inquiry.image_inquiry')}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.heardContainer}>
          <View>
            <Text style={styles.heardContainer1Text}>
              {t('banner.inquiry.upload_image')}
            </Text>
          </View>
          <View>
            <Text style={styles.heardContainer1Img}>
              <Image
                source={require("../../../../../assets/img/image_7a9fbefc.png")}
                style={styles.heardContainer1Img}
              />
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    paddingBottom: 60,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: widthUtils(24, 24).width,
  },
  titleTextContainer: {
    flex: 1,
    alignItems: "center",
  },
  titleText: {
    fontSize: fontSize(18),
    fontWeight: "600",
    textAlign: "center",
  },
  placeholder: {
    width: widthUtils(24, 24).width,
    opacity: 0,
  },
  heardContainer: {
    paddingLeft: 16,
    paddingRight: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 100,
    marginTop: 10,
  },
  heardContainer1Text: {
    fontSize: fontSize(16),
    fontWeight: 400,
    color: "#000",
  },
  heardContainer1Img: {
    width: 80,
    height: 80,
  },
});