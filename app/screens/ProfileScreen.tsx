import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  SafeAreaView,
  Linking,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import SettingsIcon from "../components/SettingsIcon";
import fontSize from "../utils/fontsizeUtils";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import BookmarkIcon from "../components/BookmarkIcon";
import LeftArrowIcon from "../components/DownArrowIcon";
import { flagMap } from "../utils/flagMap";
import DocumentApprovedIcon from "../components/DocumentApprovedIcon";
import PdfDocumentIcon from "../components/PdfDocumentIcon";
import DocumentClockIcon from "../components/DocumentClockIcon";
import widthUtils from "../utils/widthUtils";
import { productStatus } from "../constants/productStatus";
import useUserStore from "../store/user";
import Modal from "react-native-modal";
import { CountrySetting } from "./setting/CountrySetting";
import CloseIcon from "../components/CloseIcon";
import Toast from "react-native-toast-message";
import { userApi } from "../services/api/userApi";
import * as ImagePicker from 'expo-image-picker';

type RootStackParamList = {
  SettingList: undefined;
  Home: undefined;
  MyAccount: undefined;
  Login: undefined;
  Status: { status: number | null };
  BrowseHistoryScreen: undefined;
  AddressList: undefined;
  Collection: undefined;
  Balance: undefined;
  MemberIntroduction: undefined;
};

export const ProfileScreen = () => {
  const handleLogin = async () => {
    navigation.navigate("Login");
  };

  const { user, setUser } = useUserStore();
  const { t } = useTranslation();

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // 选择头像
  const selectAvatar = async () => {
    try {
      // 请求权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('permissions.required'),
          t('permissions.photo_library_required'),
          [{ text: t('common.ok') }]
        );
        return;
      }

      // 选择图片
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('选择头像失败:', error);
      Alert.alert(t('common.error'), t('common.something_went_wrong'));
    }
  };

  // 上传头像
  const uploadAvatar = async (imageUri: string) => {
    try {
      setUploadingAvatar(true);

      // 读取图片并转换为base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // 将blob转换为base64
      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      // 直接使用updateProfile更新头像
      const updatedProfile = await userApi.updateProfile({ 
        avatar_url: base64data 
      });
      
      // 更新本地状态
      setUser(updatedProfile);

      Toast.show({
        text1: t('profile.avatar_updated_successfully'),
        type: 'success',
        visibilityTime: 2000,
      });

    } catch (error) {
      console.error('处理头像失败:', error);
      Alert.alert(t('common.error'), t('profile.avatar_upload_failed'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const CountrySettingModalContent = () => {
    const { t } = useTranslation();
    const handleSuccess = () => {
      setCountryModalVisible(false);
      Toast.show({
        text1: t('settings.success'),
        visibilityTime: 1000,
      });
    };
    return (
      <View style={{ height: '90%', backgroundColor: '#fff', borderRadius: 16, alignSelf: 'center', width: '100%', overflow: 'hidden' }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 15,
          borderBottomWidth: 1,
          borderBottomColor: '#e9ecef',
        }}>
          <View style={{ width: 24 }} />
          <Text style={{ fontSize: 20, fontWeight: '600', flex: 1, textAlign: 'center' }}>{t('settings.title')}</Text>
          <TouchableOpacity onPress={() => setCountryModalVisible(false)}>
            <CloseIcon size={24} color="#231815" />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={true}>
          <CountrySetting hideHeader onSuccess={handleSuccess} />
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        <View style={styles.flexColumnContainer1}>
          {user.user_id ? (
            <ImageBackground
              source={require("../../assets/img/my_bg.png")}
              style={styles.timecardWidget}
              resizeMode="stretch"
            >
              <View style={styles.flexRowWithContent}>
                {user.user_id && user?.country_en && (
                  <TouchableOpacity onPress={() => setCountryModalVisible(true)}>
                    <Image
                      source={flagMap.get(user?.country_en)}
                      style={styles.imageContainerWithText}
                    />
                  </TouchableOpacity>
                )}
                <View style={[
                  styles.financialInfoContainer,
                  user.user_id && user?.country_en ? styles.financialInfoContainerWithFlag : null
                ]}>
                  {/* <Text style={styles.whiteTextHeading}>{user?.currency}</Text> */}
                  <TouchableOpacity
                    onPress={() => navigation.navigate("SettingList")}
                  >
                    <View style={styles.svgContainer1}>
                      <SettingsIcon size={fontSize(24)} color="white" />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 弹窗Modal */}
              <Modal
                isVisible={countryModalVisible}
                style={{ margin: 0 }}
                onBackdropPress={() => setCountryModalVisible(false)}
                onBackButtonPress={() => setCountryModalVisible(false)}
                useNativeDriver
                hideModalContentWhileAnimating
              >
                <CountrySettingModalContent />
              </Modal>

              <View style={styles.flexColumnContainer}>
                <View style={styles.flexContainerWithImageAndText}>
                  <View style={styles.flexRowWithContent1}>
                    <TouchableOpacity 
                      onPress={selectAvatar}
                      disabled={uploadingAvatar}
                      style={styles.avatarTouchable}
                    >
                      <Image
                        source={{ uri: user?.avatar_url }}
                        style={[
                          styles.profileImageCircle,
                          uploadingAvatar && styles.profileImageLoading
                        ]}
                      />
                      {uploadingAvatar && (
                        <View style={styles.uploadingOverlay}>
                          <Text style={styles.uploadingText}>...</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <View style={styles.customerInfoPanel}>
                      <View>
                        <Text style={styles.uniqueHeaderTextStyle}>
                          {user?.username}
                        </Text>
                        <Text style={styles.elegantText}>
                          ID: {user?.user_id}
                        </Text>
                      </View>
                      {user.user_id && (
                        <TouchableOpacity
                          style={styles.transactionSummaryBox}
                          onPress={() => navigation.navigate("Balance")}
                        >
                          <View style={styles.svgContainer}>
                            <BookmarkIcon size={fontSize(24)} />
                          </View>
                          <Text style={styles.soldeTextDisplayStyle}>
                            {t("balance.screen.balance_title")}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.gradientCardContainer}>
                  <View style={styles.promoCardContainerVip}>
                    <View style={styles.VipCard}>
                      <View style={styles.Vip}>
                        <Text style={styles.goldenItalicHeading}>
                          VIP{user?.vip_level}
                        </Text>
                        <View style={styles.vipContainer}>
                          <Image
                            source={require("../../assets/img/zkVIP1.png")}
                            style={styles.VipImg}
                          />
                          <Text style={styles.discountPercentageTextStyle}>
                            -{((1 - user?.vip_discount) * 100).toFixed(0)}%
                          </Text>
                        </View>
                      </View>
                      <View style={styles.progressBar}>
                        <View style={styles.progressBarFill}>
                          <Text style={styles.progressBarText}>
                            {user.points}/{user.next_level_points_threshold}
                          </Text>
                        </View>
                        <View style={styles.progressBarContainer}>
                          <View
                            style={[
                              styles.progressBarFilled,
                              {
                                width: `${Math.min(
                                  (user.points /
                                    user.next_level_points_threshold) *
                                    100,
                                  100
                                )}%`,
                              },
                            ]}
                          ></View>
                          <View style={[
                            styles.progressBarEndDot,
                            {
                              left: `${Math.min(
                                (user.points /
                                  user.next_level_points_threshold) *
                                  100,
                                100
                              )}%`,
                            }
                          ]}></View>
                        </View>
                      </View>
                    </View>
                    <View style={styles.vipExplanation}>
                      <View style={styles.vipExplanationText}>
                        <Text style={styles.vipExplanationText1}>
                          {t("profile.spend")} {user.next_level_points_threshold - user.points} {user?.currency} {t("profile.more_to_become")} {" "}
                          <Text style={styles.nextVipText}>
                            VIP{user.vip_level + 1}
                          </Text>{" "}
                          {t("profile.and_enjoy")} {" "}
                          <Text style={styles.nextVipText}>
                            -{((1 - user?.vip_discount) * 100).toFixed(0)}%
                          </Text>{" "}
                          {t("profile.discount")}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.vipExplanationButton}
                        onPress={() =>
                          navigation.navigate("MemberIntroduction")
                        }
                      >
                        <Text style={styles.vipExplanationButtonText}>
                          {t("profile.learn_more")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </ImageBackground>
          ) : (
            <ImageBackground
              source={require("../../assets/img/image_b64646d0.png")}
              style={styles.timecardWidget}
              resizeMode="stretch"
            >
              <View style={styles.flexRowWithContent}>
                <View style={styles.financialInfoContainer}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("SettingList")}
                  >
                    <View style={styles.svgContainer1}>
                      <SettingsIcon size={fontSize(24)} color="white" />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.notLoggedInContainer}>
                <TouchableOpacity 
                  onPress={() => {
                    Alert.alert(
                      t('common.login_required'),
                      t('profile.login_required_for_avatar'),
                      [
                        { text: t('common.cancel'), style: 'cancel' },
                        { text: t('login.now'), onPress: handleLogin }
                      ]
                    );
                  }}
                  style={styles.avatarTouchable}
                >
                  <View style={styles.profileImageCircle}>
                    <Image
                      source={require("../../assets/img/brainnel-0000.jpg")}
                      style={styles.profileImage}
                    />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLogin}
                >
                  <Text style={styles.loginButtonText}>{t("login.now")}</Text>
                </TouchableOpacity>
              </View>
            </ImageBackground>
          )}

          {/* <View style={styles.verticalCenterImageGallery}>
            <TouchableOpacity onPress={handleLogin}>
              <Text>{t("login.button")}</Text>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() =>
                  Linking.openURL("exp://192.168.0.101:8084/--/payment-success")
                }
              >
                <Text style={styles.loginButtonText}>{t("test.payment.callback")}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View> */}

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            bounces={false}
            overScrollMode="never"
          >
            <View style={styles.groupContainer}>
              <View style={styles.groupItemList}>
                <View style={styles.groupItemTitle}>
                  <Text style={styles.groupItemTitleText}>
                    {t("order.title")}
                  </Text>
                  <TouchableOpacity
                    style={styles.groupItemTitleTextTout}
                    onPress={() =>
                      navigation.navigate("Status", { status: null })
                    }
                  >
                    <Text style={styles.groupItemTitleTextTout1}>
                      {t("all")}
                    </Text>
                    <LeftArrowIcon size={fontSize(14)} color="#8f8684" />
                  </TouchableOpacity>
                </View>

                <View style={styles.groupItem}>
                  {productStatus.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.groupItemContent}
                      onPress={() =>
                        item.status !== null
                          ? navigation.navigate("Status", {
                              status: item.status,
                            })
                          : null
                      }
                    >
                      <View style={styles.groupItemContentIcon}>
                        {item.img ? <Image source={item.img} style={styles.groupItemContentIconImg} /> : <item.icon size={fontSize(38)} color="#707070" />}
                      </View>
                      <Text style={styles.groupItemContentText}>
                        {t(item.textKey)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.groupContainer}>
              <View style={styles.groupItemList}>
                <View style={styles.groupItemTitle}>
                  <Text style={styles.groupItemTitleText}>
                    {t("tool.title")}
                  </Text>
                </View>

                <View style={styles.groupItem}>
                  <View style={styles.groupItemContent}>
                    <TouchableOpacity
                      style={styles.groupItemContentIcon}
                      onPress={() => navigation.navigate("BrowseHistoryScreen")}
                    >
                      <Image source={require("../../assets/home/4.png")} style={styles.groupItemContentIconImg} />
                      {/* <DocumentApprovedIcon
                        size={fontSize(38)}
                        color="#707070"
                      /> */}
                    </TouchableOpacity>
                    <Text style={styles.groupItemContentText}>
                      {t("browse.history")}
                    </Text>
                  </View>

                  <View style={styles.groupItemContent}>
                    <TouchableOpacity
                      style={styles.groupItemContentIcon}
                      onPress={() => navigation.navigate("Collection")}
                    >
                      <Image source={require("../../assets/home/5.png")} style={styles.groupItemContentIconImg} />
                      {/* <PdfDocumentIcon size={fontSize(38)} color="#707070" /> */}
                    </TouchableOpacity>
                    <Text style={styles.groupItemContentText}>
                      {t("collection")}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.groupItemContent}
                    onPress={() => navigation.navigate("AddressList")}
                  >
                    <View style={styles.groupItemContentIcon}>
                      <Image source={require("../../assets/home/3.png")} style={styles.groupItemContentIconImg} />
                      {/* <DocumentClockIcon size={fontSize(38)} color="#707070" /> */}
                    </View>
                    <Text style={styles.groupItemContentText}>
                      {t("address.management")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Login Button at bottom of screen */}
          {/* <TouchableOpacity
            style={styles.fixedLoginButton}
            onPress={handleLogin}
          >
            <Text style={styles.loginButtonText}>{t("login.now")}</Text>
          </TouchableOpacity> */}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  safeAreaContent: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 0 : 0,
  },
  flexColumnContainer1: {
    flex: 1,
  },
  timecardWidget: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    width: "100%",
    height: widthUtils(272, 272).height,
    overflow: "hidden",
  },

  timeContainer1: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    height: widthUtils(43, 43).height,
    paddingTop: 21,
  },
  timeContainer2: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "space-between",
  },
  timeContainer: {
    display: "flex",
    flex: 1,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 153,
    paddingRight: 6,
    paddingLeft: 16,
  },
  timeDisplayStyle: {
    padding: 0,
    margin: 0,
    fontSize: fontSize(17),
    fontWeight: "600",
    fontFamily:
      "SF Pro, -apple-system, system-ui, BlinkMacSystemFont, sans-serif",
    color: "white",
  },
  timeDisplayContainer: {
    width: widthUtils(10, 124).width,
    height: widthUtils(10, 124).height,
  },
  timeDisplayContainer1: {
    flex: 1,
    width: widthUtils(13, 153).width,
    height: widthUtils(13, 153).height,
  },
  flexColumnContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    paddingVertical: widthUtils(10, 10).height,
    paddingHorizontal: 20,
    paddingBottom: 3.5,
    flex: 1,
  },
  flexContainerWithImageAndText: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  flexRowWithContent: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 10,
    paddingTop: 10,
  },
  flexRowWithContent1: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  profileImageCircle: {
    width: widthUtils(90, 90).width,
    height: widthUtils(90, 90).height,
    borderWidth: 0,
    backgroundColor: "#fff",
    borderRadius: 50,
    padding: 10,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  customerInfoPanel: {
    marginLeft: 20,
  },
  uniqueHeaderTextStyle: {
    padding: 0,
    margin: 0,
    fontSize: fontSize(20),
    fontWeight: "900",
    fontFamily: "Archivo Black, sans-serif",
    color: "white",
  },
  elegantText: {
    padding: 0,
    margin: 0,
    marginTop: widthUtils(6, 6).height,
    fontSize: fontSize(16),
    fontWeight: "900",
    fontFamily: "PingFang SC",
    lineHeight: 22,
    color: "white",
  },
  transactionSummaryBox: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: widthUtils(6, 6).height,
  },
  svgContainer: {
    display: "flex",
    width: widthUtils(24, 24).width,
    height: widthUtils(24, 24).height,
    color: "#ffffff",
    marginRight: 8,
  },
  soldeTextDisplayStyle: {
    padding: 0,
    margin: 0,
    marginLeft: 3,
    fontSize: fontSize(20),
    fontWeight: "900",
    fontFamily: "PingFang SC",
    lineHeight: 24,
    color: "#f4f6fb",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  imageContainerWithText: {
    width: widthUtils(16, 24).width,
    height: widthUtils(16, 24).height,
    borderWidth: 0,
    resizeMode: "cover",
  },
  financialInfoContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginLeft: 3,
  },
  financialInfoContainerWithFlag: {
    marginLeft: 10,
  },
  whiteTextHeading: {
    padding: 0,
    margin: 0,
    fontSize: fontSize(16),
    fontWeight: "500",
    fontFamily: "PingFang SC",
    lineHeight: 22,
    color: "white",
  },
  svgContainer1: {
    width: widthUtils(24, 24).width,
    height: widthUtils(24, 24).height,
    marginLeft: 11,
    color: "#ffffff",
  },
  gradientCardContainer: {
    position: "absolute",
    bottom: 9,
    left: 19,
    right: 19,
    borderRadius: 10,
    zIndex: 1,
  },
  promoCardContainer2: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    height: widthUtils(100, 100).height,
    paddingRight: 9.5,
    paddingBottom: 15,
    paddingLeft: 9,
    width: "100%",
  },
  promoCardContainerVip: {
    width: "100%",
    paddingTop: 5,
    paddingLeft: 10,
    paddingRight: 10,
    height: "100%",
  },
  VipCard: {
    width: "100%",
    height: "50%",
    flexDirection: "row",
  },
  Vip: {
    width: "35%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  progressBar: {
    width: "65%",
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  progressBarFill: {
    width: "100%",
    height: "50%",
  },
  progressBarText: {
    fontSize: fontSize(16),
    fontWeight: "900",
    fontFamily: "Segoe UI",
    color: "#fcca80",
  },
  progressBarContainer: {
    width: "100%",
    height: 3,
    backgroundColor: "#d9d9d9",
    position: "relative",
  },
  progressBarFilled: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    backgroundColor: "#f2cc86",
  },
  progressBarEndDot: {
    position: "absolute",
    top: -2,
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f2cc86",
    borderWidth: 1,
    borderColor: "#fff",
  },
  vipExplanation: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  vipExplanationText: {
    width: "70%",
    height: "100%",
  },
  vipExplanationText1: {
    fontSize: fontSize(12),
    padding: 5,
    color: "#fff",
  },
  nextVipText: {
    color: "#f8cb7a",
    fontWeight: "900",
    fontStyle: "italic",
  },
  vipExplanationButton: {
    width: "30%",
    height: "60%",
    backgroundColor: "#ffd89b",
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  vipExplanationButtonText: {
    fontSize: fontSize(14),
  },
  vipContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  VipImg: {
    width: widthUtils(28, 28).width,
    height: widthUtils(28, 28).height,
  },
  discountPercentageTextStyle: {
    position: "absolute",
    fontSize: fontSize(12),
    fontFamily: "Segoe UI",
    fontWeight: "900",
    fontStyle: "italic",
    color: "#4e2000",
    textAlign: "center",
  },
  productInfoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  imageWithTextRatio: {
    width: widthUtils(23.5, 56).width,
    height: widthUtils(23.5, 56).height,
  },
  goldenItalicHeading: {
    fontSize: fontSize(34),
    fontWeight: "900",
    fontStyle: "italic",
    color: "#f8cb7a",
  },
  discountSectionContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    marginLeft: 4,
  },
  discountAmountContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  negativeMarginTopDiscountPercentage: {
    marginTop: -22,
  },
  nestedContentContainer: {
    marginTop: -25,
  },
  negativeMarginTop2: {
    marginTop: -36,
  },
  imageContainer2: {
    width: widthUtils(36, 36).width,
    height: widthUtils(36, 36).height,
  },
  negativeMarginTop1: {
    marginTop: -36,
  },
  imgStyleF62: {
    width: "100%",
    height: widthUtils(36, 36).height,
  },
  discountStatusContainer: {
    paddingRight: 7,
    paddingLeft: 7,
    marginTop: -23,
  },
  discountStatusLabel: {
    padding: 0,
    margin: 0,
    fontSize: fontSize(10),
    fontWeight: "600",
    fontStyle: "italic",
    fontFamily: "Segoe UI",
    color: "#4e2000",
  },
  productSummaryBlock: {
    paddingTop: 4,
    paddingBottom: 6.5,
    marginLeft: 16,
  },
  goldenTextHeading: {
    padding: 0,
    margin: 0,
    fontSize: fontSize(13),
    fontWeight: "600",
    fontFamily: "PingFang SC",
    color: "#f8cb7a",
  },
  negativeMarginTop: {
    marginTop: -0.5,
  },
  horizontalLineWidget: {
    width: widthUtils(4, 235).width,
    height: widthUtils(4, 235).height,
  },
  promoCardContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "flex-start",
    height: widthUtils(34, 34).height,
    marginTop: 6,
  },
  promoCardContainer1: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-end",
  },
  pingfangScTextWhite: {
    padding: 0,
    margin: 0,
    fontSize: fontSize(11),
    fontWeight: "400",
    fontFamily: "PingFang SC",
    lineHeight: 17,
    color: "white",
    textAlign: "left",
    letterSpacing: -0.1,
  },
  promoDetailsContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: -17,
  },
  goldenLabel: {
    width: "30%",
    padding: 0,
    margin: 0,
    fontSize: fontSize(12),
    fontWeight: "900",
    fontFamily: "MiSans",
    lineHeight: 15,
    color: "#f5c164",
  },
  goldenText: {
    width: "70%",
    padding: 0,
    paddingRight: 24,
    paddingLeft: 37,
    margin: 0,
    fontSize: fontSize(12),
    fontWeight: "900",
    fontFamily: "MiSans",
    lineHeight: 15,
    color: "#f5c164",
  },
  goldenGradientBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 6,
    paddingLeft: 6,
    marginLeft: 11,
    backgroundColor: "#F5C164",
    borderRadius: 50,
  },
  featuredText: {
    padding: 0,
    margin: 0,
    fontSize: fontSize(11),
    fontWeight: "700",
    fontFamily: "Source Han Sans CN",
    color: "#473c30",
  },
  verticalCenterImageGallery: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    paddingTop: 21.5,
    paddingRight: 20,
    paddingLeft: 20,
    backgroundColor: "#f0f0f0",
  },
  cardContainer1: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    paddingTop: 14,
    paddingRight: 9,
    paddingBottom: 14,
    paddingLeft: 10,
    backgroundColor: "white",
    borderRadius: 10,
  },
  imageContainer: {
    height: widthUtils(212, 212).height,
    borderWidth: 0,
    resizeMode: "cover",
  },
  cardContainer: {
    paddingTop: 15,
    paddingRight: 11,
    paddingBottom: 17,
    paddingLeft: 11,
    marginTop: 20,
    backgroundColor: "white",
    borderRadius: 10,
  },
  imageContainer1: {
    width: "100%",
    height: widthUtils(228, 228).height,
    borderWidth: 0,
    resizeMode: "cover",
  },
  groupContainer: {
    padding: 20,
  },
  groupItemList: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "white",
  },
  groupItemTitle: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
  },
  groupItemTitleText: {
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#000",
  },
  groupItemTitleTextTout: {
    fontSize: fontSize(16),
    fontWeight: "400",
    color: "#8f8684",
    flexDirection: "row",
    alignItems: "center",
  },
  groupItemTitleTextTout1: {
    marginRight: 3,
    fontSize: fontSize(16),
    fontWeight: "400",
    color: "#8f8684",
    flexDirection: "row",
    alignItems: "center",
  },
  groupItem: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    marginTop: 25,
  },
  groupItemContent: {
    width: "23%",
    borderRadius: 8,
    marginLeft: 5,
    alignItems: "center",
    justifyContent: "flex-start",
    flexDirection: "column",
    marginBottom: 10,
  },
  groupItemContentText: {
    fontSize: fontSize(14),
    fontWeight: "400",
    color: "#8f8684",
    width: "100%",
    textAlign: "center",
    marginTop: 5,
  },
  groupItemContentIcon: {
    width: widthUtils(50, 50).width,
    height: widthUtils(50, 50).height,
  },
  groupItemContentIconImg: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  notLoggedInContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
  },
  loginButton: {
    backgroundColor: "#ff701e",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: fontSize(16),
    fontWeight: "600",
  },
  fixedLoginButton: {
    backgroundColor: "#ff701e",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  avatarTouchable: {
    position: "relative",
  },
  profileImageLoading: {
    opacity: 0.5,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingText: {
    fontSize: fontSize(24),
    fontWeight: "bold",
    color: "#fff",
  },
});
