// 公司介绍
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import { VideoView, useVideoPlayer } from "expo-video";
import { useTranslation } from "react-i18next";
import BackIcon from "../../components/BackIcon";
import fontSize from "../../utils/fontsizeUtils";


export const CompanyScreen = () => {
  const [showVideo, setShowVideo] = useState(false);
  const { t } = useTranslation();
  const player = useVideoPlayer({
    uri: "https://app.brainnel.com/static/uploadfile/file/2023-02-03/63dcb246a86aa.mp4",
  });
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // Only UI, no logic or API

  const goDetail = () => {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView style={styles.scrollView} bounces={false} overScrollMode="never" showsVerticalScrollIndicator={false}>
        {/* Top Bar */}
        <View style={styles.indexTop}>
          <Image source={require("../../../assets/img/公司介绍 1 (1).png")} />
          <View style={styles.headAbsolute}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <BackIcon />
            </TouchableOpacity>
            <View style={styles.headTitleWrapper}>
              <Text style={styles.headTitleText}>{t("company.about")}</Text>
            </View>
          </View>
        </View>

        {/* Introduction */}
        <View style={styles.intro}>
          <Text style={styles.introworld}>
            {t("company.tagline")}
          </Text>
          <Text style={styles.offredes}>
            {t("company.description")}
          </Text>
          {/* Product Data */}
          <View style={styles.products}>
            <View style={styles.productItem}>
              <Text style={[styles.productItemTop, { color: "#FF5100" }]}>
                56M<Text style={{ fontSize: 24 }}>+</Text>
              </Text>
              <Text style={styles.productItemBot}>{t("company.stats.customizable_products")}</Text>
            </View>
            <View style={styles.productItem}>
              <Text style={styles.productItemTop}>
                1M<Text style={{ fontSize: 24 }}>+</Text>
              </Text>
              <Text style={styles.productItemBot}>
                {t("company.stats.service_providers")}
              </Text>
            </View>
          </View>
        </View>

        {/* Media */}
        <View style={{ marginTop: 40, paddingLeft: 19, paddingRight: 19 }}>
          <Text style={styles.faisons}>{t("company.what_we_do.caption")}</Text>
          <Text style={styles.faisons1}>{t("company.what_we_do.title")}</Text>
          <Image
            source={require("../../../assets/img/公司介绍 1 (2).png")}
            style={{ width: "100%", height: 200, marginTop: 10 }}
          />

          <Text style={styles.offredes}>
            {t("company.what_we_do.description")}
          </Text>
          {/* <ScrollView horizontal>
            {indexProductList.info.map((item, i) => (
              <View key={i} style={styles.showImages1}>
                <Video
                  source={{ uri: item.url }}
                  poster={item.src}
                  style={{ width: '100%', height: 200 }}
                  controls
                  resizeMode="cover"
                />
                <View style={styles.videoFooter}>
                  <Text style={{ color: '#fff' }}>{item.remark}</Text>
                </View>
              </View>
            ))}
          </ScrollView> */}
        </View>

        <View style={{ marginTop: 40, paddingLeft: 19, paddingRight: 19 }}>
          <Text style={styles.faisons}>{t("company.media.caption")}</Text>
          <Text style={styles.faisons1}>{t("company.media.title")}</Text>
        </View>

        <View style={{ marginTop: 40, paddingLeft: 19, paddingRight: 19 }}>
          <VideoView player={player} style={styles.video} nativeControls />
        </View>

        {/* Register/Login */}
        <TouchableOpacity style={styles.registerBtn} onPress={goDetail}>
          <Text style={{ color: "#fff", textAlign: "center" }}>
            {t("company.register_sign_in")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    paddingTop: 0,
  },
  indexTop: {
    width: "100%",
    backgroundColor: "#fff",
    // Other styles
  },
  headAbsolute: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 19,
    paddingRight: 19,
    paddingTop: 10,
    paddingBottom: 10,
    zIndex: 10,
  },
  headTitleWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
  },
  headTitle: {
    // 不再需要 marginLeft
  },
  headTitleText: {
    fontSize: fontSize(16),
    fontWeight: "bold",
  },
  indexTopItemFirst: {
    // Styles
  },
  intro: {
    padding: 20,
    marginTop: 20,
  },
  introworld: {
    fontSize: fontSize(22),
    fontWeight: "bold",
    color: "#242529",
  },
  offredes: {
    fontSize: fontSize(16),
    color: "#000",
    marginTop: 10,
  },
  products: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  productItem: {
    width: "45%",
    alignItems: "center",
  },
  productItemTop: {
    fontSize: fontSize(30),
    fontWeight: "bold",
    color: "#002fa7",
  },
  productItemBot: {
    marginTop: 10,
    backgroundColor: "rgba(186, 221, 255, 0.15)",
    borderRadius: 5,
    fontSize: fontSize(14),
    color: "#05A9C8",
    padding: 6,
    textAlign: "center",
  },
  faisons: {
    fontSize: fontSize(30),
    fontWeight: "bold",
    color: "#D4D8E0",
    opacity: 0.6,
    textAlign: "center",
  },
  faisons1: {
    fontSize: fontSize(24)  ,
    fontWeight: "bold",
    color: "#0035a3",
    textAlign: "center",
    marginTop: -19,
  },
  showImages1: {
    width: 300,
    marginRight: 10,
  },
  videoFooter: {
    height: 40,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  registerBtn: {
    margin: 20,
    backgroundColor: "#FF5100",
    borderRadius: 20,
    padding: 15,
  },
  video: {
    alignSelf: "center",
    width: "100%",
    height: 200,
  },
});
