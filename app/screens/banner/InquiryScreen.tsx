import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
} from "react-native";
import BackIcon from "../../components/BackIcon";
import fontSize from "../../utils/fontsizeUtils";
import { LinearGradient } from "expo-linear-gradient";
import widthUtils from "../../utils/widthUtils";
import TrapezoidIcon from "../../components/TrapezoidIcon";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { inquiriesApi, InquiryFormData, InquiryBase64Data } from "../../services/api/inquiries";
import DownArrowIcon from "../../components/DownArrowIcon";
import { useTranslation } from "react-i18next";

export const InquiryScreen = () => {
  const { t } = useTranslation();
  const [searchImg, setSearchImg] = useState("");
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [status, setStatus] = useState(0);
  const [galleryUsed, setGalleryUsed] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    material: "",
    link: "",
    remark: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inquiryStatus, setInquiryStatus] = useState(0); // 0: 请求报价, 1: 进行中
  const [lastInquiry, setLastInquiry] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0); // 0: 请求报价, 1: 进行中, 2: 已完成
  const [inquiries, setInquiries] = useState<any[]>([]); // 询盘列表
  const [completedInquiries, setCompletedInquiries] = useState<any[]>([]); // 已完成询盘列表
  const [page, setPage] = useState(1); // 当前页码
  const [loading, setLoading] = useState(false); // 加载状态
  const [hasMore, setHasMore] = useState(true); // 是否还有更多数据
  const [refreshing, setRefreshing] = useState(false); // 下拉刷新状态
  const [expandedItems, setExpandedItems] = useState<{[key: string]: {link: boolean, remark: boolean}}>({});
  const navigation = useNavigation();
  const [base64Data, setBase64Data] = useState<string | null>(null);

  // 切换展开状态
  const toggleExpanded = (inquiryId: string, type: 'link' | 'remark') => {
    setExpandedItems(prev => ({
      ...prev,
      [inquiryId]: {
        ...prev[inquiryId],
        [type]: !prev[inquiryId]?.[type]
      }
    }));
  };

  // 清理expo-image-picker临时文件
  const cleanupImagePickerCache = async () => {
    try {
      const cacheDir = `${FileSystem.cacheDirectory}ImagePicker`;
      await FileSystem.deleteAsync(cacheDir, { idempotent: true });
      console.log("已清理ImagePicker缓存");
      setGalleryUsed(false);
    } catch (error) {
      console.log("清理缓存错误", error);
    }
  };

  // 处理从相册选择
  const handleChooseFromGallery = async () => {
    console.log("handleChooseFromGallery");
    setShowImagePickerModal(false);

    setTimeout(async () => {
      try {
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.status !== "granted") {
          console.log("相册权限被拒绝");
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          console.log("相册选择成功:", result.assets[0].uri);
          const selectedAsset = result.assets[0];
          setSearchImg(selectedAsset.uri);
          if (selectedAsset.base64) {
            setBase64Data(selectedAsset.base64);
          }
        }
      } catch (error: any) {
        console.error("相册错误:", error);
        Alert.alert(t("common.error"), t("banner.inquiry.gallery_error"));
      } finally {
        await cleanupImagePickerCache();
      }
    }, 500);
  };

  // 处理相机拍照
  const handleTakePhoto = async () => {
    console.log("handleTakePhoto");
    setShowImagePickerModal(false);

    setTimeout(async () => {
      try {
        const permissionResult =
          await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.status !== "granted") {
          console.log("相机权限被拒绝");
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          console.log("拍照成功:", result.assets[0].uri);
          const selectedAsset = result.assets[0];
          setSearchImg(selectedAsset.uri);
          if (selectedAsset.base64) {
            setBase64Data(selectedAsset.base64);
          }
        }
      } catch (error: any) {
        console.error("相机错误:", error);
        Alert.alert(t("common.error"), t("banner.inquiry.camera_error"));
      } finally {
        await cleanupImagePickerCache();
      }
    }, 500);
  };

  // 重置应用状态函数
  const resetAppState = () => {
    setGalleryUsed(false);
    cleanupImagePickerCache();
    Alert.alert(t('banner.inquiry.camera_reset'), t('banner.inquiry.camera_reset_message'));
  };

  const updataImg = () => {
    setShowImagePickerModal(true);
  };

  // 将图片转换为base64格式
  const uriToBase64 = async (uri: string): Promise<string> => {
    try {
      console.log("开始转换图片为Base64", uri);
      
      // 使用 FileSystem.readAsStringAsync 替代 FormData
      const base64String = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log("图片转换为Base64完成，纯Base64字符串长度:", base64String.length);
      return base64String;
    } catch (error) {
      console.error("图片转换Base64出错:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
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
        try {
          imageBase64 = await FileSystem.readAsStringAsync(searchImg, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (error) {
          console.error("读取图片文件失败:", error);
          Alert.alert(t("common.error"), t("banner.inquiry.image_process_error"));
          setIsSubmitting(false);
          return;
        }
      }

      // 创建提交数据对象
      const submitData: InquiryBase64Data = {
        image_base64: imageBase64,
        name: formData.name,
        quantity: formData.quantity,
        material: formData.material,
        link: formData.link,
        remark: formData.remark,
      };

      console.log("Submitting form data:", {
        image_base64_length: imageBase64.length,
        name: formData.name,
        quantity: formData.quantity,
        material: formData.material,
        link: formData.link,
        remark: formData.remark,
      });

      // Submit the inquiry
      try {
        const response = await inquiriesApi.createInquiry(submitData);
        console.log("Inquiry created:", response);
        setStatus(response.status);
        if (response.status === 1) {
          setLastInquiry(response);
        }
        
        // Reset form and show success message
        setSearchImg("");
        setBase64Data(null);
        setFormData({
          name: "",
          quantity: "",
          material: "",
          link: "",
          remark: "",
        });
        Alert.alert(t("common.success"), t("banner.inquiry.submit_success"));
      } catch (error: any) {
        console.error("创建询盘出错:", error);
        Alert.alert(t("common.error"), t("banner.inquiry.submit_failed"));
      }
    } catch (error: any) {
      console.error("Error creating inquiry:", error);
      Alert.alert(t("common.error"), t("banner.inquiry.submit_error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 获取询盘列表
  const fetchInquiries = async (pageNum = 1, refresh = false) => {
    try {
      if (!hasMore && !refresh) return; // 没有更多数据且不是刷新操作，直接返回
      
      setLoading(true);
      const response = await inquiriesApi.getInquiries(pageNum,10,2);
      console.log("Inquiries fetched:", response);
      
      // 处理响应数据，兼容不同格式
      const inquiryData = response.items.filter(item => {
        return item.status === (activeTab === 1 ? 1 : 2);
      });
          
      if (inquiryData && inquiryData.length >= 0) {
        if (refresh) {
          if (activeTab === 1) {
            setInquiries(inquiryData);
          } else {
            setCompletedInquiries(inquiryData);
          }
        } else {
          if (activeTab === 1) {
            setInquiries(prev => [...prev, ...inquiryData]);
          } else {
            setCompletedInquiries(prev => [...prev, ...inquiryData]);
          }
        }
        
        // 判断是否还有更多数据
        setHasMore(inquiryData.length > 0);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      Alert.alert(t('banner.inquiry.error'), t('banner.inquiry.fetch_failed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // 加载更多
  const handleLoadMore = () => {
    if (loading || !hasMore) return;
    fetchInquiries(page + 1);
  };
  
  // 检测滚动到底部
  const handleScroll = (event: any) => {
    if ((activeTab !== 1 && activeTab !== 2) || loading || !hasMore) return;
    
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20; // 距离底部多少触发加载
    
    if (layoutMeasurement.height + contentOffset.y >= 
        contentSize.height - paddingToBottom) {
      handleLoadMore();
    }
  };
  
  // Tab切换时加载对应数据
  React.useEffect(() => {
    if (activeTab === 1 || activeTab === 2) {
      fetchInquiries(1, true);
    }
  }, [activeTab]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#C8DFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <View style={styles.productInquirySection1}>
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
                      source={require("../../../assets/img/image_7a9fbefc.png")}
                      style={styles.heardContainer1Img}
                    />
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.productQuoteSection}>
            <View style={styles.tabContainer}>
              {[
                { label: t('banner.inquiry.tab_request'), id: 0 },
                { label: t('banner.inquiry.tab_in_progress'), id: 1 },
                { label: t('banner.inquiry.tab_completed'), id: 2 }
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={[
                    styles.tabButton,
                    activeTab === tab.id && styles.activeTabButton
                  ]}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === tab.id && styles.activeTabButtonText
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {activeTab === 0 && (
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {searchImg ? (
                  <View style={styles.container}>
                    <View style={styles.cardContainerWithButtons}>
                      <View style={styles.productCardContainer}>
                        <View style={styles.productCardContainer1}>
                          <Image
                            source={
                              { uri: Platform.OS === 'android' ? `file://${searchImg}` : searchImg }
                            }
                            style={[styles.articleThumbnailContainer, { backgroundColor: '#f5f5f5' }]}
                          />
                          <View style={styles.articleTitleContainer}>
                            <Text style={styles.elegantText}>{t('banner.inquiry.product_name')}</Text>
                            <TextInput
                              style={styles.articleTitleContainer1}
                              value={formData.name}
                              onChangeText={(text) =>
                                setFormData((prev) => ({ ...prev, name: text }))
                              }
                              placeholder={t('banner.inquiry.enter_product_name')}
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
                              onChangeText={(text) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  quantity: text,
                                }))
                              }
                              placeholder={t('banner.inquiry.enter_quantity')}
                              keyboardType="numeric"
                            />
                          </View>
                          <View style={styles.matiereContainer}>
                            <Text style={styles.quantityLabelTextStyle}>
                              {t('banner.inquiry.material')}
                            </Text>
                            <TextInput
                              style={styles.quantityContainer}
                              value={formData.material}
                              onChangeText={(text) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  material: text,
                                }))
                              }
                              placeholder={t('banner.inquiry.enter_material')}
                            />
                          </View>
                        </View>
                        <View style={styles.linkContainer}>
                          <Text style={styles.elegantText}>{t('banner.inquiry.link')}</Text>
                          <TextInput
                            style={styles.contentWrapper}
                            value={formData.link}
                            onChangeText={(text) =>
                              setFormData((prev) => ({ ...prev, link: text }))
                            }
                            placeholder={t('banner.inquiry.enter_link')}
                            multiline={true}
                          />
                        </View>
                        <View style={styles.linkContainer}>
                          <Text style={styles.elegantText}>{t('banner.inquiry.remark')}</Text>
                          <TextInput
                            style={styles.contentWrapper}
                            value={formData.remark}
                            onChangeText={(text) =>
                              setFormData((prev) => ({ ...prev, remark: text }))
                            }
                            placeholder={t('banner.inquiry.enter_remark')}
                            multiline={true}
                          />
                        </View>
                      </View>
                      <View style={styles.buttonGroupConfirmation}>
                        <TouchableOpacity
                          style={styles.cancelButtonStyle}
                          onPress={() => setSearchImg("")}
                        >
                          <Text style={styles.cancelButtonText}>{t('banner.inquiry.cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.confirmButtonStyle,
                            isSubmitting && styles.disabledButton,
                          ]}
                          onPress={handleSubmit}
                          disabled={isSubmitting}
                        >
                          <Text style={styles.confirmButtonText}>
                            {isSubmitting ? t('banner.inquiry.submitting') : t('banner.inquiry.confirm')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.productInfoContainer}>
                    <View style={styles.productImageUploadSection}>
                      <View style={styles.productInfoContainer1}>
                        <Image
                          source={require("../../../assets/img/image_fac2b0a9.png")}
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
                          onPress={updataImg}
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
                )}
              </ScrollView>
            )}
          </View>
        </View>

        {activeTab === 1 && (
          <ScrollView
            style={{ flex: 1, backgroundColor: "white" }}
            contentContainerStyle={{ paddingBottom: 16 }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {inquiries.length > 0 ? (
              <>
                {inquiries.map((inquiry, index) => (
                  <View
                    key={inquiry.id || index}
                    style={{
                      backgroundColor: "#f2f6ff",
                      borderRadius: 16,
                      margin: 16,
                      marginBottom: 8,
                      shadowColor: "#000",
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    {/* 顶部蓝色条 */}
                    <View
                      style={{
                        backgroundColor: "#c8e0ff",
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingHorizontal: 20,
                        paddingVertical: 10,
                      }}
                    >
                      <Text
                        style={{ color: "#006fe1", fontWeight: "bold", fontSize: fontSize(16) }}
                      >
                        {t('banner.inquiry.in_progress')}
                      </Text>
                      <Text style={{ color: "#006fe1", fontSize: fontSize(14) }}>
                        {inquiry.create_time || new Date().toLocaleString()}
                      </Text>
                    </View>
                    {/* 内容区 */}
                    <View
                      style={{
                        flexDirection: "row",
                        padding: 20,
                        backgroundColor: "#f2f6ff",
                        borderBottomLeftRadius: 16,
                        borderBottomRightRadius: 16,
                      }}
                    >
                      <Image
                        source={
                          inquiry.image_url
                          
                        }
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 8,
                          marginRight: 18,
                          backgroundColor: "#fff",
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontWeight: "bold",
                            fontSize: fontSize(18),
                            marginBottom: 8,
                          }}
                        >
                          {inquiry.name || t('banner.inquiry.item_name')}
                        </Text>
                        <View style={{ flexDirection: "row", marginBottom: 8 }}>
                          <View>
                            <Text style={{ color: "#888", fontSize: fontSize(14) }}>
                              {t('banner.inquiry.quantity')}
                            </Text>
                            <Text style={{ fontSize: fontSize(16), fontWeight: "bold" }}>
                              {inquiry.quantity || "--"}
                            </Text>
                          </View>
                          <View style={{ marginLeft: 32 }}>
                            <Text style={{ color: "#888", fontSize: fontSize(14) }}>
                              {t('banner.inquiry.material')}
                            </Text>
                            <Text style={{ fontSize: fontSize(16), fontWeight: "bold" }}>
                              {inquiry.material || "--"}
                            </Text>
                          </View>
                        </View>
                        <View>
                          <TouchableOpacity
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: 4,
                            }}
                            onPress={() => toggleExpanded(inquiry.id, 'link')}
                          >
                            <Text
                              style={{ color: "#888", fontSize: fontSize(14), marginRight: 8 }}
                            >
                              {t('banner.inquiry.link')}
                            </Text>
                            <View style={{ flex: 1 }} />
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                              {/* <Text style={{ color: "#888" }}>{t('banner.inquiry.more')}</Text> */}
                              <View style={{ marginLeft: 4 }}>
                                <DownArrowIcon size={12} color="#888" rotation={expandedItems[inquiry.id]?.link ? 180 : 0} />
                              </View>
                            </View>
                          </TouchableOpacity>
                          {expandedItems[inquiry.id]?.link && (
                            <Text style={{ fontSize: fontSize(14), marginBottom: 4, paddingLeft: 8 }}>
                              {inquiry.link || t('banner.inquiry.none')}
                            </Text>
                          )}
                        </View>
                        <View>
                          <TouchableOpacity
                            style={{ flexDirection: "row", alignItems: "center" }}
                            onPress={() => toggleExpanded(inquiry.id, 'remark')}
                          >
                            <Text
                              style={{ color: "#888", fontSize: fontSize(14), marginRight: 8 }}
                            >
                              {t('banner.inquiry.remark')}
                            </Text>
                            <View style={{ flex: 1 }} />
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                              {/* <Text style={{ color: "#888" }}>{t('banner.inquiry.more')}</Text> */}
                              <View style={{ marginLeft: 4 }}>
                                <DownArrowIcon size={12} color="#888" rotation={expandedItems[inquiry.id]?.remark ? 180 : 0} />
                              </View>
                            </View>
                          </TouchableOpacity>
                          {expandedItems[inquiry.id]?.remark && (
                            <Text style={{ fontSize: fontSize(14), marginTop: 4, paddingLeft: 8 }}>
                              {inquiry.remark || t('banner.inquiry.none')}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
                {/* 底部加载更多 */}
                {loading && (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>{t('banner.inquiry.loading')}</Text>
                  </View>
                )}
                {!hasMore && inquiries.length > 0 && (
                  <Text style={styles.noMoreText}>{t('banner.inquiry.no_more_data')}</Text>
                )}
              </>
            ) : loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>{t('banner.inquiry.loading')}</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('banner.inquiry.no_in_progress')}</Text>
              </View>
            )}
          </ScrollView>
        )}
        {activeTab === 2 && (
          <ScrollView
            style={{ flex: 1, backgroundColor: "white" }}
            contentContainerStyle={{ paddingBottom: 16 }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {completedInquiries.length > 0 ? (
              <>
                {completedInquiries.map((inquiry, index) => (
                  <View
                    key={inquiry.id || index}
                    style={{
                      backgroundColor: "#f2f6ff",
                      borderRadius: 16,
                      margin: 16,
                      marginBottom: 8,
                      shadowColor: "#000",
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    {/* 顶部蓝色条 */}
                    <View
                      style={{
                        backgroundColor: "#c8e0ff",
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingHorizontal: 20,
                        paddingVertical: 10,
                      }}
                    >
                      <Text
                        style={{ color: "#006fe1", fontWeight: "bold", fontSize: fontSize(16) }}
                      >
                        {t('banner.inquiry.completed')}
                      </Text>
                      <Text style={{ color: "#006fe1", fontSize: fontSize(14) }}>
                        {inquiry.create_time || new Date().toLocaleString()}
                      </Text>
                    </View>
                    {/* 内容区 */}
                    <View
                      style={{
                        flexDirection: "row",
                        padding: 20,
                        backgroundColor: "#f2f6ff",
                        borderBottomLeftRadius: 16,
                        borderBottomRightRadius: 16,
                      }}
                    >
                      <Image
                        source={
                         
                             { uri: inquiry.image_url }
                        }
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 8,
                          marginRight: 18,
                          backgroundColor: "#fff",
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontWeight: "bold",
                            fontSize: fontSize(18),
                            marginBottom: 8,
                          }}
                        >
                          {inquiry.name || t('banner.inquiry.item_name')}
                        </Text>
                        <View style={{ flexDirection: "row", marginBottom: 8 }}>
                          <View>
                            <Text style={{ color: "#888", fontSize: fontSize(14) }}>
                              {t('banner.inquiry.quantity')}
                            </Text>
                            <Text style={{ fontSize: fontSize(16), fontWeight: "bold" }}>
                              {inquiry.quantity || "--"}
                            </Text>
                          </View>
                          <View style={{ marginLeft: 32 }}>
                            <Text style={{ color: "#888", fontSize: fontSize(14) }}>
                              {t('banner.inquiry.material')}
                            </Text>
                            <Text style={{ fontSize: fontSize(16), fontWeight: "bold" }}>
                              {inquiry.material || "--"}
                            </Text>
                          </View>
                        </View>
                        <View>
                          <TouchableOpacity
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: 4,
                            }}
                            onPress={() => toggleExpanded(inquiry.id, 'link')}
                          >
                            <Text
                              style={{ color: "#888", fontSize: fontSize(14), marginRight: 8 }}
                            >
                              {t('banner.inquiry.link')}
                            </Text>
                            <View style={{ flex: 1 }} />
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                              {/* <Text style={{ color: "#888" }}>{t('banner.inquiry.more')}</Text> */}
                              <View style={{ marginLeft: 4 }}>
                                <DownArrowIcon size={12} color="#888" rotation={expandedItems[inquiry.id]?.link ? 180 : 0} />
                              </View>
                            </View>
                          </TouchableOpacity>
                          {expandedItems[inquiry.id]?.link && (
                            <Text style={{ fontSize: fontSize(14), marginBottom: 4, paddingLeft: 8 }}>
                              {inquiry.link || t('banner.inquiry.none')}
                            </Text>
                          )}
                        </View>
                        <View>
                          <TouchableOpacity
                            style={{ flexDirection: "row", alignItems: "center" }}
                            onPress={() => toggleExpanded(inquiry.id, 'remark')}
                          >
                            <Text
                              style={{ color: "#888", fontSize: fontSize(14), marginRight: 8 }}
                            >
                              {t('banner.inquiry.remark')}
                            </Text>
                            <View style={{ flex: 1 }} />
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                              {/* <Text style={{ color: "#888" }}>{t('banner.inquiry.more')}</Text> */}
                              <View style={{ marginLeft: 4 }}>
                                <DownArrowIcon size={12} color="#888" rotation={expandedItems[inquiry.id]?.remark ? 180 : 0} />
                              </View>
                            </View>
                          </TouchableOpacity>
                          {expandedItems[inquiry.id]?.remark && (
                            <Text style={{ fontSize: fontSize(14), marginTop: 4, paddingLeft: 8 }}>
                              {inquiry.remark || t('banner.inquiry.none')}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
                {/* 底部加载更多 */}
                {loading && (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>{t('banner.inquiry.loading')}</Text>
                  </View>
                )}
                {!hasMore && completedInquiries.length > 0 && (
                  <Text style={styles.noMoreText}>{t('banner.inquiry.no_completed')}</Text>
                )}
              </>
            ) : loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>{t('banner.inquiry.loading')}</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('banner.inquiry.no_completed')}</Text>
              </View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePickerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImagePickerModal(false)}
      >
        <TouchableOpacity
          style={styles.imagePickerOverlay}
          activeOpacity={1}
          onPress={() => setShowImagePickerModal(false)}
        >
          <View style={styles.imagePickerContent}>
            {!galleryUsed ? (
              <TouchableOpacity
                style={styles.imagePickerOption}
                onPress={handleTakePhoto}
              >
                <Text style={styles.imagePickerText}>{t('banner.inquiry.take_photo')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.imagePickerOption}
                onPress={resetAppState}
              >
                <Text style={styles.imagePickerText}>{t('banner.inquiry.reset_camera')}</Text>
              </TouchableOpacity>
            )}

            <View style={styles.imagePickerDivider} />

            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={handleChooseFromGallery}
            >
              <Text style={styles.imagePickerText}>{t('banner.inquiry.choose_from_gallery')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imagePickerCancelButton}
              onPress={() => setShowImagePickerModal(false)}
            >
              <Text style={styles.imagePickerCancelText}>{t('banner.inquiry.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#C8DFFF",
  },
  keyboardAvoidingContainer: {
    flex: 1,
    width: "100%",
  },
  container: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
  },
  productInquirySection1: {
    flexDirection: "column",
    alignItems: "stretch",
    backgroundColor: "#f0f0f0",
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
    height: 234,
    marginTop: 50,
  },

  heardContainer1Text: {
    fontSize: 16,
    fontWeight: 400,
    color: "#000",
  },
  heardContainer1Img: {
    width: 116,
    height: 116,
  },
  productQuoteSection: {
    paddingRight: 16,
    paddingLeft: 16,
    marginTop: -110,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tabButton: {
    width: (widthUtils(375, 375).width - 64) / 3,
    height: 44,
    backgroundColor: "#f5f8ff",
    borderRadius: 8,
    alignItems: "center", 
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  activeTabButton: {
    backgroundColor: "#006fe1",
    borderColor: "#006fe1",
    shadowColor: "#006fe1",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    color: "#888",
    fontWeight: "500",
    fontSize: 14,
  },
  activeTabButtonText: {
    color: "#fff", 
    fontWeight: "bold",
  },
  productInfoContainer: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    backgroundColor: "#0766e9",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  productImageUploadSection: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    maxWidth: "100%",
    height: 300,
    paddingBottom: 24,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
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
  },
  productInfoHeading: {
    fontWeight: "900",
    fontSize: 16,
    lineHeight: 20,
    color: "white",
  },
  productInfoMessage1: {
    marginTop: 7,
    fontWeight: "400",
    fontSize: 12,
    lineHeight: 16,
    color: "white",
    textAlign: "center",
  },
  photoUploadContainer: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    height: widthUtils(80, 80).height,
    paddingRight: 29,
    paddingLeft: 29,
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
    height: "100%",
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
    fontSize: 16,
    lineHeight: 20,
    color: "#002FA7",
    textAlign: "right",
  },
  headerGradient: {
    paddingBottom: 20,
  },
  labelItemTextThree: {
    position: "absolute",
    color: "#808080",
    fontSize: 14,
    fontWeight: "600",
    width: "33%",
    textAlign: "center",
    paddingHorizontal: 10,
    flexWrap: "wrap",
    lineHeight: 16,
    right: 0,
    top: "50%",
    transform: [{ translateY: -8 }],
  },
  cardContainerWithButtons: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingBottom: 38,
    backgroundColor: "white",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
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
    backgroundColor: '#f5f5f5',
  },
  articleTitleContainer: {
    width: widthUtils(221, 221).width,
    marginLeft: 11,
  },
  elegantText: {
    padding: 0,
    margin: 0,
    fontFamily: "PingFang SC",
    fontSize: 12,
    fontWeight: "500",
    color: "#676b74",
  },
  articleTitleContainer1: {
    width: "100%",
    height: 50,
    marginTop: 9,
    backgroundColor: "white",
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
    fontFamily: "PingFang SC",
    fontSize: 12,
    fontWeight: "500",
    color: "#676b74",
  },
  highlightedText: {
    fontFamily: "PingFang SC",
    fontSize: 12,
    fontWeight: "500",
    color: "#fe1e00",
  },
  quantityContainer: {
    height: 40,
    backgroundColor: "white",
  },
  matiereContainer: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    width: widthUtils(151, 151).width,
    marginLeft: 7,
  },
  linkContainer: {},
  contentWrapper: {
    width: "100%",
    height: 70,
    backgroundColor: "white",
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
    fontFamily: "Source Han Sans CN",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
    color: "#333333",
  },
  confirmButtonText: {
    fontFamily: "Source Han Sans CN",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
    color: "white",
  },
  imagePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  imagePickerContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  imagePickerOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  imagePickerText: {
    fontSize: fontSize(16),
    marginLeft: 12,
    color: "#333",
  },
  imagePickerDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 20,
  },
  imagePickerCancelButton: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  imagePickerCancelText: {
    fontSize: fontSize(16),
    color: "#999",
  },
  disabledButton: {
    opacity: 0.7,
  },
  loadingContainer: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#888",
    fontSize: 14,
  },
  noMoreText: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    margin: 16,
    borderRadius: 16,
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
  },
});
