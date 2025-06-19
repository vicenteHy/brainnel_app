// 会员权益
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  Image,
  TouchableOpacity
} from "react-native";
import { useTranslation } from "react-i18next";
import widthUtils from "../../utils/widthUtils";
import fontSize from "../../utils/fontsizeUtils";
import WatchAppIcon from "../../components/WatchAppIcon";
import CrownIcon from "../../components/CrownIcon";
import BookLabIcon from "../../components/BookLabIcon";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import useUserStore from "../../store/user";
import BackIcon from "../../components/BackIcon";
import { SafeAreaView } from "react-native-safe-area-context";


type RootStackParamList = {
  Balance: undefined;
  ChatScreen: {
    product_id?: string;
    product_image_urls?: string[];
    subject_trans?: string;
    min_price?: number;
    offer_id?: string;
  };
};
export const MemberIntroduction = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const userStore = useUserStore();
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        bounces={false}
        overScrollMode="never"
        style={styles.scrollView}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.backgroundContainer}>
          <ImageBackground
            style={styles.timecardWidget}
            source={require("../../../assets/img/制作背景图 (1) (2).png")}
            resizeMode="stretch"
          >
            <View style={styles.titleContainer}>
              <View style={styles.backIconContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <BackIcon size={20} color="#fff"/>
                </TouchableOpacity>
              </View>

              <Text style={styles.titleHeading}>{t("member.introduction")}</Text>
            </View>
          </ImageBackground>
          <View style={styles.VipContainer}>
            <View style={styles.VipContainerTop}>
              <View style={styles.VipContainerBox}>
                <View style={styles.Vip}>
                  <Text style={[styles.VipText, { color: '#6b3611' }]}>
                    VIP {userStore.user?.vip_level || 0}
                  </Text>
                </View>
                <View style={styles.VipLine}>
                  <View style={styles.lineText}>
                    <Text style={[styles.lineTextText, { color: '#6b3611' }]}>{t("member.vip.progress", {current: userStore.user?.points || 0, target: userStore.user.next_level_points_threshold})}</Text>
                  </View>
                  <View style={styles.line}>
                    <View
                      style={[
                        styles.lineProgress,
                        { width: `${Math.min((userStore.user?.points || 0) / (userStore.user?.next_level_points_threshold || 1), 1) * 100}%` }
                      ]}
                    />
                  </View>
                </View>
              </View>
              <View style={styles.VipContainerTopPhone}>
                <View style={styles.VipContainerTopPhoneBox}>
                  <TouchableOpacity style={styles.VipContainerTopPhoneBoxTop} onPress={() => {
                    navigation.navigate("ChatScreen", {});
                  }}>
                    <WatchAppIcon size={20} color="#fff" />
                    <Text style={[styles.VipContainerTopPhoneBoxTopText, { color: '#ffffff' }]}>
                      {t("member.client_service")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.VipContainerBottom}>
              <View style={styles.left}>
                <Text style={[styles.leftText, { color: '#6b3611' }]}>
                  {t("member.vip.spend_more_text")}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.right}
                onPress={() => {
                  navigation.navigate("Balance");
                }}
              >
                <View style={styles.rechargeContainer}>
                  <Text style={[styles.rechargeText, { color: '#6b3611' }]}>{t("member.recharge")}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.membershipBenefitsContainer}>
          <View style={styles.membershipBenefitsSection1}>
            <Text style={[styles.membershipBenefitsTitle, { color: '#000000' }]}>
              {t("member.benefits.title")}
            </Text>
            <TouchableOpacity style={styles.membershipBenefitsButton}>
              <Text style={[styles.buttonText, { color: '#7e522c' }]}>{t("member.learn_more")}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.membershipBenefitsSection}>
            <Text style={[styles.membershipBenefitsDescription, { color: '#000000' }]}>
              {t("member.benefits.description")}
            </Text>

            <View style={styles.featureBoxContainer}>
              {/* Member Pricing Section */}
              <View style={styles.membershipPricingSection}>
                <View style={styles.membershipPricingSection1}>
                  <View style={styles.memberPricingBadge}>
                    <Text style={[styles.memberPricingBadgeText, { color: '#ffffff' }]}>01</Text>
                  </View>
                  <View style={styles.memberPricingSection1}>
                    <View style={styles.memberPricingDetailsContainer}>
                      <Text style={[styles.memberPriceDescription, { color: '#002fa7' }]}>
                        {t("member.benefits.pricing.title")}
                      </Text>
                      <Text style={[styles.vipDiscountDetailsTextStyle, { color: '#000000' }]}>
                        {t("member.benefits.pricing.description")}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.memberPricingSection}>
                  <Image
                    source={require("../../../assets/img/image_55603bad.png")}
                    style={styles.blueBoxThumbnail}
                  />
                </View>
              </View>

              {/* Dedicated Service Section */}
              <View style={styles.dedicatedServiceSection}>
                <View style={styles.serviceCard}>
                  <View style={styles.serviceSection}>
                    <View style={styles.serviceDetailsContainer}>
                      <Text style={[styles.dedicatedServiceTextStyle, { color: '#002fa7' }]}>
                        {t("member.benefits.dedicated_service.title")}
                      </Text>
                      <Text
                        style={[styles.orderTrackingServiceDescriptionTextStyle, { color: '#271f18' }]}
                      >
                        {t("member.benefits.dedicated_service.description")}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.dedicatedServiceBadge}>
                    <Text style={[styles.dedicatedServiceBadgeText, { color: '#ffffff' }]}>02</Text>
                  </View>
                </View>
                <View style={styles.shoppingExperienceDetails}>
                  <Image
                    source={require("../../../assets/img/image_57170660.png")}
                    style={styles.imageContainer1}
                  />
                </View>
              </View>

              {/* Photo Service Section */}
              <View style={styles.photoServiceSection}>
                <View style={styles.photoServiceContainer1}>
                  <View style={styles.photoRequestServiceBlock}>
                    <Text style={[styles.memberPriceDescription, { color: '#002fa7' }]}>
                      {t("member.benefits.photo_service.title")}
                    </Text>
                    <Text style={[styles.vipDiscountDetailsTextStyle, { color: '#000000' }]}>
                      {t("member.benefits.photo_service.description")}
                    </Text>
                  </View>
                  <View style={styles.photoServiceBadge}>
                    <Text style={[styles.photoServiceBadgeText, { color: '#ffffff' }]}>03</Text>
                  </View>
                </View>

                <View style={styles.photoServiceContainer}>
                  <Image
                    source={require("../../../assets/img/image_1b6e6ccd.png")}
                    style={styles.imageContainer}
                  />
                </View>
              </View>

              {/* Dedicated Service Section */}
              <View style={styles.dedicatedServiceSection}>
                <View style={styles.serviceCard}>
                  <View style={styles.serviceSection}>
                    <View style={styles.serviceDetailsContainer}>
                      <Text style={[styles.dedicatedServiceTextStyle, { color: '#002fa7' }]}>
                        {t("member.benefits.inspection.title")}
                      </Text>
                      <Text
                        style={[styles.orderTrackingServiceDescriptionTextStyle, { color: '#271f18' }]}
                      >
                        {t("member.benefits.inspection.description")}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.dedicatedServiceBadge}>
                    <Text style={[styles.dedicatedServiceBadgeText, { color: '#ffffff' }]}>04</Text>
                  </View>
                </View>
                <View style={styles.shoppingExperienceDetails}>
                  <Image
                    source={require("../../../assets/img/image_48e613b.png")}
                    style={styles.imageContainer1}
                  />
                </View>
              </View>

              {/* Photo Service Section */}
              <View style={styles.photoServiceSection}>
                <View style={styles.photoServiceContainer1}>
                  <View style={styles.photoRequestServiceBlock}>
                    <Text style={[styles.memberPriceDescription, { color: '#002fa7' }]}>
                      {t("member.benefits.forwarder.title")}
                    </Text>
                    <Text style={[styles.vipDiscountDetailsTextStyle, { color: '#000000' }]}>
                      {t("member.benefits.forwarder.description")}
                    </Text>
                  </View>
                  <View style={styles.photoServiceBadge}>
                    <Text style={[styles.photoServiceBadgeText, { color: '#ffffff' }]}>05</Text>
                  </View>
                </View>

                <View style={styles.photoServiceContainer}>
                  <Image
                    source={require("../../../assets/img/image_163f035d.png")}
                    style={styles.imageContainer}
                  />
                </View>
              </View>

              {/* Dedicated Service Section */}
              <View style={styles.dedicatedServiceSection}>
                <View style={styles.serviceCard}>
                  <View style={styles.serviceSection}>
                    <View style={styles.serviceDetailsContainer}>
                      <Text style={[styles.dedicatedServiceTextStyle, { color: '#002fa7' }]}>
                        {t("member.benefits.custom_products.title")}
                      </Text>
                      <Text
                        style={[styles.orderTrackingServiceDescriptionTextStyle, { color: '#271f18' }]}
                      >
                        {t("member.benefits.custom_products.description")}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.dedicatedServiceBadge}>
                    <Text style={[styles.dedicatedServiceBadgeText, { color: '#ffffff' }]}>06</Text>
                  </View>
                </View>
                <View style={styles.shoppingExperienceDetails}>
                  <Image
                    source={require("../../../assets/img/image_d4f32d4e.png")}
                    style={styles.imageContainer1}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.membershipCard}>
          <View style={styles.inquirySection}>
            <Text style={[styles.gradientHeading, { color: '#fa934f' }]}>{t("member.how_to_become")}</Text>
            <Text style={[styles.infoText, { color: '#fdd08f' }]}>
              <Text style={[styles.cumulativeInfo, { color: '#fdd08f' }]}>{t("member.calculation_part1")} </Text>
              <Text style={[styles.highlightedText, { color: '#fdd08f' }]}>
                {t("member.calculation_part2")}
              </Text>
              <Text style={[styles.cumulativeInfo, { color: '#fdd08f' }]}> {t("member.calculation_part3")}</Text>
              <Text style={[styles.totalStats, { color: '#fdd08f' }]}> 365 </Text>
              <Text style={[styles.cumulativeInfo, { color: '#fdd08f' }]}>{t("member.calculation_part4")}</Text>
            </Text>
          </View>

          <View style={styles.cardSection}>
            {/* 第一张卡片 */}
            <ImageBackground
              source={require("../../../assets/img/VIP1 (1).png")}
              resizeMode="stretch"
              style={styles.cardItem}
            >
              <View style={styles.row}>
                {/* SVG 图标可用 react-native-svg 实现 */}
                <CrownIcon size={30} color="#3496FF" />
                <Image
                  source={require("../../../assets/img/image_7f13ecf8.png")}
                  style={styles.cardImage}
                />
                <Text style={[styles.majesticText, { color: '#3496ff' }]}>1</Text>
              </View>
              <View style={styles.amountContainer}>
                <Text style={[styles.amountMessage, { color: '#5fa9ff' }]}>
                  {t("member.vip.consumption_total")}
                </Text>
                <Text style={[styles.amountLabel, { color: '#2a8bfa' }]}>500 000 FCFA</Text>
              </View>
              <Text style={[styles.discountMessage, { color: '#2a8bfa' }]}>
                <Text style={{ color: '#2a8bfa' }}>{t("member.vip.discount_part1")} </Text>
                <Text style={[styles.discountBold, { color: '#2a8bfa' }]}>5%</Text>
                <Text style={{ color: '#2a8bfa' }}> {t("member.vip.discount_part2")}</Text>
              </Text>
            </ImageBackground>
            {/* 第二张卡片 */}
            <ImageBackground
              source={require("../../../assets/img/VIP2.png")}
              resizeMode="stretch"
              style={[styles.cardItem]}
            >
              {/* 可用渐变 */}
              <View style={styles.row}>
                <CrownIcon size={30} color="#29809a" />
                <Image
                  source={require("../../../assets/img/image_cce3278c.png")}
                  style={styles.cardImage}
                />
                <Text style={[styles.majesticText, { color: "#33748e" }]}>
                  2
                </Text>
              </View>
              <View style={styles.amountContainer}>
                <Text style={[styles.amountMessage, { color: "#6aa4ba" }]}>
                  {t("member.vip.consumption_total")}
                </Text>
                <Text style={[styles.amountLabel, { color: "#33748e" }]}>
                  1 000 000 FCFA (1563 USD / 1502 EUR)
                </Text>
              </View>
              <Text style={[styles.discountMessage, { color: "#33748e" }]}>
                {t("member.vip.discount_part1")} <Text style={[styles.discountBold, { color: "#33748e" }]}>10%</Text> {t("member.vip.discount_part2")}
              </Text>
            </ImageBackground>
            {/* 第三张卡片 */}
            <ImageBackground
              source={require("../../../assets/img/VIP3.png")}
              resizeMode="stretch"
              style={[styles.cardItem]}
            >
              {/* 可用渐变 */}
              <View style={styles.row}>
                <CrownIcon size={30} color="#b76101" />
                <Image
                  source={require("../../../assets/img/image_73f27ef8.png")}
                  style={styles.cardImage}
                />
                <Text style={[styles.majesticText, { color: "#b76101" }]}>
                  3
                </Text>
              </View>
              <View style={styles.amountContainer}>
                <Text style={[styles.amountMessage, { color: "#e7851b" }]}>
                  {t("member.vip.consumption_total")}
                </Text>
                <Text style={[styles.amountLabel, { color: "#b76101" }]}>
                  2 000 000 FCFA (3125 USD / 3005 EUR)
                </Text>
              </View>
              <Text style={[styles.discountMessage, { color: "#b76101" }]}>
                {t("member.vip.discount_part1")} <Text style={[styles.discountBold, { color: "#b76101" }]}>12%</Text> {t("member.vip.discount_part2")}
              </Text>
            </ImageBackground>
            {/* 第四张卡片 */}
            <ImageBackground
              source={require("../../../assets/img/VIP4.png")}
              resizeMode="stretch"
              style={[styles.cardItem]}
            >
              {/* 可用渐变 */}
              <View style={styles.row}>
                <CrownIcon size={30} color="#3d35fa" />
                <Image
                  source={require("../../../assets/img/image_d01fd911.png")}
                  style={styles.cardImage}
                />
                <Text style={[styles.majesticText, { color: "#3d35fa" }]}>
                  4
                </Text>
              </View>
              <View style={styles.amountContainer}>
                <Text style={[styles.amountMessage, { color: "#7e68f5" }]}>
                  {t("member.vip.consumption_total")}
                </Text>
                <Text style={[styles.amountLabel, { color: "#3d35fa" }]}>
                  3 000 000 FCFA (4688 USD / 4507 EUR)
                </Text>
              </View>
              <Text style={[styles.discountMessage, { color: "#3d35fa" }]}>
                {t("member.vip.discount_part1")} <Text style={[styles.discountBold, { color: "#3d35fa" }]}>15%</Text> {t("member.vip.discount_part2")}
              </Text>
            </ImageBackground>
            {/* 第五张卡片 */}
            <ImageBackground
              source={require("../../../assets/img/VIP5.png")}
              resizeMode="stretch"
              style={[styles.cardItem]}
            >
              {/* 可用渐变 */}
              <View style={styles.row}>
                <CrownIcon size={30} color="#ffd692" />
                <Image
                  source={require("../../../assets/img/image_6175cc9d.png")}
                  resizeMode="stretch"
                  style={styles.cardImage}
                />
                <Text style={[styles.majesticText, { color: "#ffd692" }]}>
                  5
                </Text>
              </View>
              <View style={styles.amountContainer}>
                <Text style={[styles.amountMessage, { color: "#ccb78e" }]}>
                  {t("member.vip.consumption_total")}
                </Text>
                <Text style={[styles.amountLabel, { color: "#fed78d" }]}>
                  5 000 000 FCFA (7813 USD / 7512 EUR)
                </Text>
              </View>
              <Text style={[styles.discountMessage, { color: "#fed78d" }]}>
                {t("member.vip.discount_part1")} <Text style={[styles.discountBold, { color: "#fed78d" }]}>20%</Text> {t("member.vip.discount_part2")}
              </Text>
            </ImageBackground>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <ImageBackground
            source={require("../../../assets/img/注意.png")}
            resizeMode="stretch"
            style={[styles.outerContainer, { flex: 1 }]}
          >
            <View style={styles.importantInfoContainer1}>
              <View style={styles.importantInfoContainer2}>
                <View>
                  <View style={styles.importantInfoContainer}>
                    <Text style={[styles.importantInfoHeading, { color: 'white' }]}>
                      {t("member.important_info.title")}
                    </Text>
                  </View>
                  <View style={styles.vipStatusUpdateContainer}>
                    <View style={styles.vipStatusContainer}>
                      <View style={styles.svgContainer1}>
                        <BookLabIcon />
                      </View>
                    </View>
                    <Text style={[styles.vipStatusMessageTextStyle, { color: 'white' }]}>
                      {t("member.important_info.auto_update")}
                    </Text>
                  </View>
                </View>
                <View style={styles.vipLevelInfoContainer}>
                  <View style={styles.importantInfoContainer}>
                    <View style={styles.vipStatusContainer}>
                      <View style={styles.svgContainer1}>
                        <BookLabIcon />
                      </View>
                    </View>
                    <Text style={[styles.vipDescriptionTextStyle, { color: 'white' }]}>
                      {t("member.important_info.reset_rule")}
                    </Text>
                  </View>
                  <View style={styles.paragraphContainer}>
                    <Text style={[styles.exampleParagraphStyle, { color: '#ffffffcc' }]}>
                      {t("member.important_info.example")}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  backgroundContainer: {
    width: "100%",
    height: widthUtils(300, 300).height,
    position: "relative",
  },
  timecardWidget: {
    width: "100%",
    height: "100%",
  },
  titleContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    left: 0,
    right: 0,
    top: 10,
    height: 48,
    zIndex: 10,
    paddingBottom: 10,
  },
  backIconContainer: {
    position: "absolute",
    left: 19,
    top: 10,
    zIndex: 11,
  },
  titleHeading: {
    fontWeight: "600",
    fontSize: fontSize(20),
    lineHeight: 40,
    color: "#fff",
  },
  VipContainer: {
    width: widthUtils(400, 400).width,
    height: widthUtils(200, 200).height,
    position: "absolute",
    left: "50%",
    top: 100,
    transform: [{ translateX: -widthUtils(400, 400).width / 2 }],
    borderRadius: 10,
  },
  VipContainerTop: {
    width: "100%",
    height: "60%",
    backgroundColor: "#dfb57b",
    padding: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  VipContainerBottom: {
    width: "100%",
    height: "40%",
    backgroundColor: "#fee1b4",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
    flexDirection: "row",
  },
  VipContainerBox: {
    width: "100%",
    height: "50%",
    flexDirection: "row",
    alignItems: "center",
  },
  VipContainerTopPhone: {
    width: "100%",
    height: "50%",
  },
  VipContainerTopPhoneBox: {
    width: "60%",
  },
  VipContainerTopPhoneBoxTop: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 30,
    backgroundColor: "#00a849",
    justifyContent: "center",
  },
  VipContainerTopPhoneBoxTopText: {
    fontSize: fontSize(20),
    color: "#fff",
    fontWeight: "bold",
  },
  Vip: {
    width: "30%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  VipText: {
    fontSize: fontSize(34),
    fontFamily: "PingFangSC-Medium",
    color: "#6b3611",
    fontWeight: "900",
    fontStyle: "italic",
  },
  VipLine: {
    width: "70%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  lineText: {
    width: "100%",
    height: "50%",
  },
  lineTextText: {
    fontSize: fontSize(12),
    color: "#6b3611",
    fontWeight: "bold",
  },
  line: {
    width: "100%",
    height: 8,
    backgroundColor: "#d9d9d9",
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
    marginTop: 2,
  },
  lineProgress: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#fcca81",
    borderRadius: 4,
  },
  left: {
    width: "60%",
    height: "100%",
  },
  leftText: {
    fontSize: fontSize(14),
    color: "#6b3611",
  },
  right: {
    width: "40%",
    height: "100%",
  },
  rechargeContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  rechargeText: {
    fontSize: fontSize(16),
    color: "#6b3611",
    fontWeight: "bold",
    borderRadius: 30,
    backgroundColor: "#deb479",
    padding: 10,
  },
  scrollView: {
    flex: 1,

    backgroundColor: "#f1f3f6",
  },
  scrollViewContent: {
    flex: 1,
    padding: 10,
    margin: 10,
    borderRadius: 10,
  },
  membershipBenefitsContainer: {
    padding: 15,
    marginTop: 80,
  },
  membershipBenefitsSection1: {
    alignItems: "center",
  },
  membershipBenefitsTitle: {
    fontSize: fontSize(22),
    fontWeight: "900",
    color: "black",
  },
  membershipBenefitsButton: {
    width: 200,
    height: 40,
    marginTop: 10,
    backgroundColor: "#fef7e9",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: fontSize(14),
    fontWeight: "700",
    color: "#7e522c",
  },
  membershipBenefitsSection: {
    marginTop: 20,
  },
  membershipBenefitsDescription: {
    fontSize: fontSize(12),
    lineHeight: 18,
    color: "black",
  },
  featureBoxContainer: {
    marginTop: 16,
    gap: 14,
  },
  membershipPricingSection: {
    flexDirection: "column",
  },
  membershipPricingSection1: {
    backgroundColor: "white",
    borderRadius: 5,
    overflow: "hidden",
  },
  memberPricingSection1: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 30,
    position: "relative",
    overflow: "hidden",
  },
  vipDiscountDetails: {
    position: "absolute",
    top: -10,
    left: -10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0071f7",
    justifyContent: "center",
    alignItems: "center",
    fontSize: fontSize(20),
    color: "white",
  },
  memberPricingDetailsContainer: {
    marginLeft: 16,
    flex: 1,
  },
  memberPriceDescription: {
    fontSize: fontSize(14),
    fontWeight: "bold",
    color: "#002fa7",
  },
  vipDiscountDetailsTextStyle: {
    fontSize: fontSize(12),
    lineHeight: 16,
    color: "#000",
    marginTop: 5,
    width: "75%",
  },
  memberPricingSection: {
    alignSelf: "flex-end",
    marginTop: -76,
    paddingHorizontal: 27.5,
  },
  blueBoxThumbnail: {
    width: 67,
    height: 91,
    shadowColor: "#2a88c84d",
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
  },
  dedicatedServiceSection: {
    marginTop: 14,
  },
  serviceCard: {
    backgroundColor: "white",
    borderRadius: 5,
    overflow: "hidden",
    position: "relative",
  },
  serviceSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    backgroundColor: "#fff",
  },
  serviceDetailsContainer: {
    flex: 1,
    alignItems: "flex-end",
    marginRight: 10,
  },
  dedicatedServiceTextStyle: {
    fontSize: fontSize(14),
    color: "#002fa7",
    fontWeight: "bold",
    width: "50%",
    textAlign: "right",
  },
  orderTrackingServiceDescriptionTextStyle: {
    fontSize: fontSize(12),
    lineHeight: 16,
    color: "#271f18",
    textAlign: "right",
    marginTop: 3,
    width: "75%",
  },
  shoppingExperienceDetails: {
    marginTop: -86,
    paddingHorizontal: 16,
  },
  imageContainer1: {
    width: 80,
    height: 100,
    shadowColor: "#406fe54d",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
  },
  photoServiceSection: {
    marginTop: 14,
  },
  photoServiceContainer1: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 5,
    padding: 16,
    overflow: "hidden",
    position: "relative",
  },
  circularGradientBadge: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: "#3955f6",
    justifyContent: "center",
    alignItems: "center",
  },
  photoRequestServiceBlock: {
    flex: 1,
    marginLeft: 16,
  },
  photoServiceContainer: {
    marginTop: -84,
    paddingHorizontal: 9,
    alignSelf: "flex-end",
    width: 105,
    height: 105,
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    shadowColor: "#b5b6ba66",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
  },
  inspectionSection: {
    marginTop: -10,
  },
  inspectionCard: {
    backgroundColor: "white",
    borderRadius: 5,
    paddingBottom: 7,
  },
  inspectionContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
  },
  inspectionTitle: {
    fontSize: fontSize(14),
    color: "#002fa7",
    marginRight: 10,
  },
  inspectionMessageStyle: {
    fontSize: fontSize(12),
    lineHeight: 15,
    color: "#271f18",
    textAlign: "right",
    marginTop: -52,
    paddingHorizontal: 33,
  },
  contentWrapper: {
    marginTop: -61,
    paddingHorizontal: 16,
  },
  imageContainer2: {
    width: 74,
    height: 77,
    shadowColor: "#38babd4d",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
  },
  transitaireSection: {
    marginTop: -2,
  },
  transitaireInfoBox: {
    flex: 1,
    marginLeft: 8,
  },
  transitaireDesigneBlock: {
    marginTop: -71,
    paddingHorizontal: 23.5,
    alignSelf: "flex-end",
  },
  imageContainerStyled: {
    width: 68,
    height: 88,
    shadowColor: "#fa9b484d",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
  },
  personalizedProductAssistanceContainer: {
    backgroundColor: "white",
    borderRadius: 5,
    paddingBottom: 10,
  },
  personalizedProductAssistanceSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    height: 85,
    backgroundColor: "#002fa7",
    padding: 16,
  },
  personalizedProductsAssistanceText: {
    fontSize: fontSize(14),
    lineHeight: 18,
    color: "#002fa7",
    textAlign: "right",
    marginRight: 10,
  },
  customProductDescription: {
    marginTop: -33,
    paddingHorizontal: 39,
  },
  customTextBlock: {
    fontSize: fontSize(12),
    lineHeight: 16,
    color: "#271f18",
    textAlign: "right",
  },
  customProductAssistanceBlock: {
    marginTop: -86,
  },
  imageContainerWithShadow: {
    width: 110,
    height: 110,
    shadowColor: "#fe592933",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
  },
  memberPricingBadge: {
    position: "absolute",
    top: -12,
    left: -12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1c62f3",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  memberPricingBadgeText: {
    fontSize: fontSize(16),
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    marginLeft: 8,
    marginTop: 6,
  },
  dedicatedServiceBadge: {
    position: "absolute",
    top: -12,
    right: -12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1c62f3",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  dedicatedServiceBadgeText: {
    fontSize: fontSize(16),
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    marginRight: 8,
    marginTop: 6,
  },
  photoServiceBadge: {
    position: "absolute",
    top: -12,
    left: -12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1c62f3",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  photoServiceBadgeText: {
    fontSize: fontSize(16),
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    marginLeft: 8,
    marginTop: 6,
  },
  membershipCard: {
    borderRadius: 10,
    padding: 19,
    backgroundColor: "#3a3128", // 可用渐变
  },
  inquirySection: {
    marginBottom: 20,
  },
  gradientHeading: {
    fontSize: fontSize(24),
    fontWeight: "500",
    color: "#fa934f", // 可用渐变文字
    marginBottom: 10,
  },
  infoText: {
    color: "#fdd08f",
    marginTop: 26,
  },
  cumulativeInfo: {
    fontSize: fontSize(13),
    color: "#fdd08f",
  },
  highlightedText: {
    fontWeight: "900",
    fontSize: fontSize(15),
    color: "#fdd08f",
  },
  totalStats: {
    fontWeight: "900",
    fontSize: fontSize(16),
    color: "#fdd08f",
  },
  cardSection: {
    marginTop: 19,
  },
  cardItem: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  iconPlaceholder: {
    width: 32,
    height: 32,
    backgroundColor: "#eee", // SVG 占位
    borderRadius: 16,
  },
  cardImage: {
    width: 62,
    height: 26,
    marginLeft: 10,
    resizeMode: "contain",
  },
  majesticText: {
    fontStyle: "italic",
    fontWeight: "900",
    fontSize: fontSize(38),
    marginLeft: 10,
    color: "#3496ff",
  },
  amountContainer: {
    marginTop: 11,
  },
  amountMessage: {
    fontSize: fontSize(12),
    color: "#5fa9ff",
  },
  amountLabel: {
    fontSize: fontSize(12),
    fontWeight: "900",
    color: "#2a8bfa",
    marginTop: -2,
  },
  discountMessage: {
    fontSize: fontSize(14),
    color: "#2a8bfa",
    marginTop: 8,
  },
  discountBold: {
    fontWeight: "900",
    fontSize: fontSize(14),
  },
  outerContainer: {
    backgroundColor: "#f1f2f6",
    flex: 1,
  },
  importantInfoContainer1: {
    paddingTop: 30,
    paddingRight: 20,
    paddingBottom: 17,
    paddingLeft: 20,
  },
  contentWrapperq: {
    paddingRight: 30,
    paddingLeft: 30,
  },
  svgContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    color: "#0051ff",
  },
  svgPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  importantInfoContainer2: {
    width: "100%",
    paddingRight: 19,
    paddingBottom: 26,
    paddingLeft: 19,
    marginTop: -5,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  importantInfoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  importantInfoHeading: {
    paddingTop: 10,
    fontWeight: "900",
    fontSize: fontSize(20),
    lineHeight: 22,
    color: "white",
    fontFamily: "System",
  },
  importantInfoImage: {
    width: 90,
    height: 90,
    marginLeft: 4,
    borderRadius: 8,
    resizeMode: "cover",
  },
  vipStatusUpdateContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
  },
  vipStatusContainer: {
    paddingTop: 3,
  },
  svgContainer1: {
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  svgPlaceholderSmall: {
    width: 16,
    height: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  vipStatusMessageTextStyle: {
    marginLeft: 2,
    fontWeight: "500",
    fontSize: fontSize(13),
    lineHeight: 20,
    color: "white",
    textAlign: "left",
    fontFamily: "System",
  },
  vipLevelInfoContainer: {
    width: "100%",
    marginTop: 18,
  },
  vipDescriptionTextStyle: {
    flex: 1,
    marginLeft: 2,
    fontWeight: "500",
    fontSize: fontSize(13),
    lineHeight: 20,
    color: "white",
    textAlign: "left",
    fontFamily: "System",
  },
  paragraphContainer: {
    paddingRight: 19,
    paddingLeft: 19,
    marginTop: 6,
  },
  exampleParagraphStyle: {
    fontSize: fontSize(11),
    lineHeight: 16,
    color: "#ffffffcc",
    textAlign: "left",
    fontFamily: "System",
  },
});
