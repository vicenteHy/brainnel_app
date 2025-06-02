import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableOpacity,
} from "react-native";
import BackIcon from "../../components/BackIcon";
import fontSize from "../../utils/fontsizeUtils";
import TiktokIcon from "../../components/TiktokIcon";
import widthUtils from "../../utils/widthUtils";
import Carousel from "react-native-reanimated-carousel";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

export const TikTokScreen = () => {
  const { width: screenWidth } = Dimensions.get("window");
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigation = useNavigation();
  const { t } = useTranslation();
  
  const carouselItems = [
    {
      id: 1,
      image: require("../../../assets/img/Mask group.png"),
      liveText: t('banner.tiktok.live'),
      subTitle: t('banner.tiktok.live'),
    },
    {
      id: 2,
      image: require("../../../assets/img/Mask group (1).png"),
      liveText: t('banner.tiktok.video'),
      subTitle: t('banner.tiktok.shorts'),
    },
  ];

  const renderItem = ({ item }: { item: (typeof carouselItems)[0] }) => {
    return (
      <View style={styles.maskGroup}>
        <ImageBackground
          source={item.image}
          style={styles.maskGroupImage}
          resizeMode="contain"
        >
          <View style={styles.content}>
            <View style={styles.titleContainer}>
              <View style={styles.titleLogo}>
                <TiktokIcon color="#fff" size={22} />
                <Text style={styles.tikTokText}>TikTok</Text>
                <Text style={styles.LiveText}>{item.liveText}</Text>
              </View>
              <View style={styles.titleText}>
                <Text style={styles.titleTextTitle}>{t('banner.tiktok.category')}</Text>
                <Text style={styles.titleTextSubTitle}>{item.subTitle}</Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  };

  const onSnapToItem = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.safeAreaContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <BackIcon color="#fff" size={fontSize(22)} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('banner.tiktok.store')}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.maskGroup}>
          <Carousel
            data={carouselItems}
            renderItem={renderItem}
            width={screenWidth}
            loop={true}
            autoPlayInterval={3000}
            onSnapToItem={onSnapToItem}
          />

          <View
            style={[styles.Instruction, { top: widthUtils(210, 210).height }]}
          >
            <View
              style={[
                styles.instructionLine1,
                currentIndex === 0 && styles.instructionLine3,
              ]}
            />
            <View
              style={[
                styles.instructionLine2,
                currentIndex === 1 && styles.instructionLine3,
              ]}
            />
          </View>
        </View>

        <ScrollView
          style={styles.productContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.productList}>
            <View style={styles.productItem}>
              <View style={styles.productItemImage}></View>
              <View style={styles.productItemInfo}>
                <View style={styles.priceInfo}></View>
                <View style={styles.priceTitle}>
                  <Text 
                    style={styles.priceTitleText}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >1231231131231231221323123123123123123123123121231231212311232</Text>
                </View>
                <View style={styles.ventes}></View>
              </View>
            </View>
            
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeAreaContent: {
    flex: 1,
    paddingTop: 0,
  },
  container: {
    flex: 1,
  },
  header: {
    width: "100%",
    padding: 19,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
  },
  backButton: {
    width: widthUtils(24, 24).width,
  },
  placeholder: {
    width: widthUtils(24, 24).width,
  },
  title: {
    color: "#fff",
    fontSize: fontSize(22),
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },
  maskGroup: {
    width: "100%",
    height: widthUtils(321, 321).height,
    backgroundColor: "#000",
    position: "relative",
    top: 0,
    left: 0,
  },
  maskGroupImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  content: {
    width: "100%",
    flex: 1,
    justifyContent: "center",
  },
  titleContainer: {
    width: "100%",
    alignItems: "center",
  },
  titleLogo: {
    width: "100%",
    paddingLeft: 22,
    paddingRight: 22,
    flexDirection: "row",
    alignItems: "center",
  },
  tikTokText: {
    color: "#fff",
    fontSize: fontSize(26),
    fontWeight: "600",
  },
  LiveText: {
    marginLeft: 5,
    backgroundColor: "#ff188a",
    paddingLeft: 5,
    paddingRight: 5,
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "#fff",
  },
  titleText: {
    width: "100%",
    paddingTop: widthUtils(19, 19).height,
    paddingBottom: widthUtils(19, 19).height,
    paddingLeft: widthUtils(22, 22).height,
    paddingRight: widthUtils(22, 22).height,
  },
  Instruction: {
    width: "100%",
    paddingTop: widthUtils(19, 19).height,
    paddingBottom: widthUtils(19, 19).height,
    paddingLeft: widthUtils(22, 22).height,
    paddingRight: widthUtils(22, 22).height,
    flexDirection: "row",
    gap: 6,
    position: "absolute",
    bottom: widthUtils(50, 50).height,
    left: 0,
    zIndex: 2,
  },
  instructionLine1: {
    width: 10,
    height: 6,
    backgroundColor: "#52595f",
    borderRadius: 10,
  },
  instructionLine2: {
    width: 10,
    height: 6,
    backgroundColor: "#52595f",
    borderRadius: 10,
  },
  instructionLine3: {
    width: 20,
    height: 6,
    backgroundColor: "#ffff",
    borderRadius: 10,
  },
  titleTextTitle: {
    color: "#fff",
    fontSize: fontSize(26),
    fontWeight: "900",
    fontFamily: "Montserrat-Bold",
  },
  titleTextSubTitle: {
    color: "#fff",
    fontSize: fontSize(30),
    fontWeight: "900",
    fontFamily: "Montserrat-Bold",
  },
  productContainer: {
    flex: 1,
    width: "100%",
    position: "absolute",
    top: widthUtils(321, 321).height,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    backgroundColor: "#000",
    marginTop: -10,
    paddingLeft: 19,
    paddingRight: 19,
  },
  productList: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  productItem: {
    width: "48%",
    height: widthUtils(298, 298).height,
    borderRadius: 10,
  },
  productItemImage:{
    width: "100%",
    height:widthUtils(190, 190).height,
    borderRadius: 10,
  },
  productItemInfo:{
    width: "100%",
    flex: 1,
  },
  priceInfo:{
    width: "100%",
    padding: 10,
  },
  priceTitle: {
    width: "100%",
    padding: 10,
  },
  priceTitleText: {
    color: "#fff",
    fontSize: fontSize(14),
    lineHeight: fontSize(20),
  },
  ventes:{
    width: "100%",
    padding: 10,
  }
});
