import React from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import DropDownPicker from "react-native-dropdown-picker";
import { countries } from "../../constants/countries";
import BackIcon from "../../components/BackIcon";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { AddressItem } from "../../services/api/addressApi";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAddressStore } from "../../store/address";
import { settingApi } from "../../services/api/setting";
import flagMap from "../../utils/flagMap";
import { useTranslation } from "react-i18next";
import fontSize from "../../utils/fontsizeUtils";
import { getCountryTransLanguage } from "../../utils/languageUtils";
type RootStackParamList = {
  AddRess: { address?: AddressItem };
  AddressList: undefined;
};
type AddRessRouteProp = RouteProp<RootStackParamList, "AddRess">;
// Define a custom item type for the dropdown
type CountryItemType = {
  label: string;
  value: string;
  flag?: any;
  name_en: string;
  country: string;
};
export const EditAddress = () => {
  const { setLoading, updateAddress, loading } = useAddressStore();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<AddRessRouteProp>();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [items, setItems] = useState<{ label: string; value: string }[]>([]);
  const [selectedCountryLabel, setSelectedCountryLabel] = useState<string>("");
  const [countryList, setCountryList] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    receiver_first_name: "",
    receiver_last_name: "",
    country: "",
    receiver_phone: "",
    receiver_phone_again: "",
    whatsapp_phone: "",
    is_default: 0,
    province: "",
    city: "",
    district: "",
    detail_address: "",
  });
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [copyPhoneToWhatsApp, setCopyPhoneToWhatsApp] = useState(false);
  const [phoneNumbersMatch, setPhoneNumbersMatch] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // 初始化加载
  useEffect(() => {
    // 如果有路由参数中的地址，优先使用它
    if (route.params?.address) {
      setFormData({
        ...route.params.address,
        receiver_phone_again: route.params.address.receiver_phone,
        is_default: route.params.address.is_default,
      });
    }
  }, []);
  // 加载国家列表
  useEffect(() => {
    settingApi.getCountryList().then((res) => {
      const formattedCountries = res.map((item) => ({
        label: `${getCountryTransLanguage(item)} (${item.country})`,
        value: item.name.toString(),
        flag: flagMap.get(item.name_en),
        name_en: getCountryTransLanguage(item),
        country: item.country,
      }));
      setItems(formattedCountries);
      setCountryList(formattedCountries);
    });
  }, []);
  // 当countryList加载完成后，设置选中的国家标签
  useEffect(() => {
    if (countryList.length > 0) {
      // 如果有路由参数中的地址
      const addressFromRoute = route.params?.address;
      if (addressFromRoute && addressFromRoute.country) {
        const selectedCountry = countryList.find(
          (item) =>
            item.name_en === addressFromRoute.country ||
            item.value === addressFromRoute.country
        );
        if (selectedCountry) {
          setSelectedCountryLabel(selectedCountry.label);
          setValue(selectedCountry.value);
        }
      }
    }
  }, [countryList, route.params?.address]);
  // 监听手机号码变化，如果勾选了复制选项则自动更新 WhatsApp 号码
  useEffect(() => {
    if (copyPhoneToWhatsApp) {
      setFormData((prev) => ({
        ...prev,
        whatsapp_phone: prev.receiver_phone,
      }));
    }
  }, [formData.receiver_phone, copyPhoneToWhatsApp]);
  // 监听手机号码变化，验证两次输入是否一致
  useEffect(() => {
    if (formData.receiver_phone && formData.receiver_phone_again) {
      setPhoneNumbersMatch(
        formData.receiver_phone === formData.receiver_phone_again
      );
    } else {
      setPhoneNumbersMatch(true);
    }
  }, [formData.receiver_phone, formData.receiver_phone_again]);
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.receiver_first_name) {
      newErrors.receiver_first_name = t("address.errors.first_name_required");
    }
    if (!formData.receiver_last_name) {
      newErrors.receiver_last_name = t("address.errors.last_name_required");
    }
    if (!formData.receiver_phone) {
      newErrors.receiver_phone = t("address.errors.phone_required");
    }
    if (!formData.receiver_phone_again) {
      newErrors.receiver_phone_again = t(
        "address.errors.confirm_phone_required"
      );
    }
    if (formData.receiver_phone !== formData.receiver_phone_again) {
      newErrors.receiver_phone_again = t("address.errors.phone_mismatch");
    }
    if (!formData.whatsapp_phone) {
      newErrors.whatsapp_phone = t("address.errors.whatsapp_required");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async () => {
    if (validateForm()) {
      const selectedCountryObj = countryList.find(
        (item) => item.value === value
      );
      const submitData = {
        ...formData,
        country: selectedCountryObj ? selectedCountryObj.name_en : "",
        receiver_phone_again: undefined,
        is_default: formData.is_default ? 1 : 0,
      };
      delete submitData.receiver_phone_again;
      setLoading(true);
      if (route.params?.address?.address_id) {
        await updateAddress(route.params.address.address_id, submitData);
      }
      setLoading(false);
      navigation.goBack();
    }
  };
  const handleCountrySelect = (item: any) => {
    setValue(item.value);
    setSelectedCountryLabel(item.label);
    setOpen(false);
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#f77f3a" />
            </View>
          ) : (
            <ScrollView 
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.recipientFormContainer3}>
                <View>
                  <View style={styles.recipientFormContainer1}>
                    <View style={styles.recipientFormContainer2}>
                      <View style={styles.titleContainer}>
                        <View style={styles.backIconContainer}>
                          <TouchableOpacity onPress={() => navigation.goBack()}>
                            <BackIcon size={20} />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.titleHeading}>
                          {t("address.select_recipient")}
                        </Text>
                      </View>
                      <View style={styles.recipientInfoForm}>
                        <View style={styles.contactFormContainer}>
                          {/* First Name Field */}
                          <View style={styles.formFieldContainer}>
                            <View style={styles.flexRowCentered}>
                              <Text style={styles.elegantTextSnippet}>
                                {t("address.first_name")}
                              </Text>
                              <Text style={styles.redTextHeading}>*</Text>
                            </View>
                            <TextInput
                              style={styles.pingFangText}
                              placeholder={t("address.placeholder.first_name")}
                              value={formData.receiver_first_name}
                              onChangeText={(text) =>
                                setFormData({
                                  ...formData,
                                  receiver_first_name: text,
                                })
                              }
                            />
                            {errors.receiver_first_name && (
                              <Text style={styles.errorText}>
                                {errors.receiver_first_name}
                              </Text>
                            )}
                          </View>
                          {/* Last Name Field */}
                          <View style={styles.lastNameInputContainer}>
                            <View style={styles.flexRowCentered}>
                              <Text style={styles.elegantTextSnippet}>
                                {t("address.last_name")}
                              </Text>
                              <Text style={styles.redAsteriskTextStyle}>*</Text>
                            </View>
                            <TextInput
                              style={styles.pingFangText}
                              placeholder={t("address.placeholder.last_name")}
                              value={formData.receiver_last_name}
                              onChangeText={(text) =>
                                setFormData({
                                  ...formData,
                                  receiver_last_name: text,
                                })
                              }
                            />
                            {errors.receiver_last_name && (
                              <Text style={styles.errorText}>
                                {errors.receiver_last_name}
                              </Text>
                            )}
                          </View>
                          {/* 国家 */}
                          <View style={styles.lastNameInputContainer}>
                            <View style={styles.flexRowCentered}>
                              <Text style={styles.elegantTextSnippet}>
                                {t("address.country")}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.countrySelectorButton}
                              onPress={() => setOpen(true)}
                            >
                              {selectedCountryLabel ? (
                                <Text style={styles.selectedCountryText}>
                                  {selectedCountryLabel}
                                </Text>
                              ) : (
                                <Text style={styles.placeholderStyle}>
                                  {t("address.placeholder.select_country")}
                                </Text>
                              )}
                              <Text style={styles.dropdownArrow}>▼</Text>
                            </TouchableOpacity>
                          </View>
                          {/* Phone Number Section */}
                          <View style={styles.formContainer}>
                            <View style={styles.verticalCenteredColumn}>
                              <View style={styles.lastNameInputContainer1}>
                                <View style={styles.flexRowCentered}>
                                  <Text style={styles.elegantTextSnippet}>
                                    {t("address.phone_number")}
                                  </Text>
                                  <Text style={styles.redAsteriskTextStyle}>
                                    *
                                  </Text>
                                </View>
                                <TextInput
                                  style={styles.pingFangText1}
                                  placeholder={t(
                                    "address.placeholder.phone_number"
                                  )}
                                  value={formData.receiver_phone}
                                  onChangeText={(text) =>
                                    setFormData({
                                      ...formData,
                                      receiver_phone: text,
                                    })
                                  }
                                />
                                {errors.receiver_phone && (
                                  <Text style={styles.errorText}>
                                    {errors.receiver_phone}
                                  </Text>
                                )}
                              </View>
                              <View style={styles.lastNameInputContainer1}>
                                <View style={styles.flexRowCentered}>
                                  <Text style={styles.elegantTextSnippet}>
                                    {t("address.confirm_phone_number")}
                                  </Text>
                                  <Text style={styles.redAsteriskTextStyle}>
                                    *
                                  </Text>
                                </View>
                                <TextInput
                                  style={styles.pingFangText1}
                                  placeholder={t(
                                    "address.placeholder.confirm_phone_number"
                                  )}
                                  value={formData.receiver_phone_again}
                                  onChangeText={(text) =>
                                    setFormData({
                                      ...formData,
                                      receiver_phone_again: text,
                                    })
                                  }
                                />
                                {errors.receiver_phone_again && (
                                  <Text style={styles.errorText}>
                                    {errors.receiver_phone_again}
                                  </Text>
                                )}
                              </View>
                              {!phoneNumbersMatch && (
                                <Text style={styles.errorText}>
                                  {t("address.errors.phone_mismatch")}
                                </Text>
                              )}
                            </View>
                          </View>
                          {/* WhatsApp Field */}
                          <View style={styles.lastNameInputContainer}>
                            <View style={styles.flexRowCentered}>
                              <Text style={styles.elegantTextSnippet}>
                                {t("address.whatsapp")}
                              </Text>
                              <Text style={styles.redTextHeading}>*</Text>
                            </View>
                            <TextInput
                              style={styles.pingFangText}
                              placeholder={t("address.placeholder.whatsapp")}
                              value={formData.whatsapp_phone}
                              onChangeText={(text) =>
                                setFormData({ ...formData, whatsapp_phone: text })
                              }
                            />
                            {errors.whatsapp_phone && (
                              <Text style={styles.errorText}>
                                {errors.whatsapp_phone}
                              </Text>
                            )}
                          </View>
                          <View style={styles.copyContainer}>
                            <TouchableOpacity
                              style={styles.checkboxContainer}
                              onPress={() =>
                                setCopyPhoneToWhatsApp(!copyPhoneToWhatsApp)
                              }
                            >
                              <View
                                style={[
                                  styles.checkbox,
                                  copyPhoneToWhatsApp && styles.checked,
                                ]}
                              >
                                {copyPhoneToWhatsApp && (
                                  <Text style={styles.checkmark}>✓</Text>
                                )}
                              </View>
                              <Text style={styles.checkboxLabel}>
                                {t("address.copy_phone_to_whatsapp")}
                              </Text>
                            </TouchableOpacity>
                          </View>
                          {/* Default Setting Section */}
                          <View style={styles.defaultSettingSection}>
                            <Text style={styles.defaultTextDisplayStyle}>
                              {t("address.set_default")}
                            </Text>
                            <Switch
                              value={!!formData.is_default}
                              onValueChange={() =>
                                setFormData({
                                  ...formData,
                                  is_default: formData.is_default ? 0 : 1,
                                })
                              }
                              trackColor={{ false: "#767577", true: "#81b0ff" }}
                              thumbColor={
                                formData.is_default ? "#002fa7" : "#f4f3f4"
                              }
                              ios_backgroundColor="#3e3e3e"
                            />
                          </View>
                        </View>
                      </View>
                      {/* Submit Button */}
                      <View style={styles.submitButtonContainer}>
                        <TouchableOpacity
                          style={styles.primaryButtonStyle}
                          onPress={handleSubmit}
                        >
                          <Text style={styles.buttonText}>
                            {t("address.submit")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
          <Modal
            visible={open}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setOpen(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {t("address.select_country")}
                  </Text>
                  <TouchableOpacity onPress={() => setOpen(false)}>
                    <Text style={styles.closeButton}>{t("address.close")}</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={countryList}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.countryItem}
                      onPress={() => handleCountrySelect(item)}
                    >
                      {item.flag && (
                        <Image source={item.flag} style={styles.flagImage} />
                      )}
                      <Text style={styles.countryItemText}>{item.label}</Text>
                      {value === item.value && (
                        <Text style={styles.checkIcon}>✓</Text>
                      )}
                    </TouchableOpacity>
                  )}
                  style={styles.flatList}
                  contentContainerStyle={styles.flatListContent}
                />
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
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
    paddingTop: 0,
  },
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  recipientFormContainer3: {
    flex: 1,
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  recipientFormContainer1: {
    width: "100%",
    padding: 15,
    paddingBottom: 32,
  },
  recipientFormContainer2: {
    width: "100%",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  titleContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  backIconContainer: {
    position: "absolute",
    left: 0,
  },
  titleHeading: {
    fontWeight: "600",
    fontSize: fontSize(20),
    lineHeight: 22,
    fontFamily: "PingFang SC",
    color: "black",
  },
  recipientInfoForm: {
    marginTop: 35,
  },
  recipientInfoHeadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recipientInfoHeading: {
    padding: 0,
    margin: 0,
    fontWeight: "500",
    fontSize: fontSize(18),
    lineHeight: 22,
    fontFamily: "PingFang SC",
    color: "black",
  },
  recipientInfoHeadingEmit: {
    padding: 0,
    margin: 0,
    fontWeight: "500",
    fontSize: fontSize(18),
    lineHeight: 22,
    fontFamily: "PingFang SC",
    color: "#ff731e",
    textDecorationLine: "underline",
  },
  contactFormContainer: {
    width: "100%",
    marginTop: 9,
  },
  formFieldContainer: {
    width: "100%",
    padding: 6,
    paddingLeft: 8,
    paddingBottom: 10,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#dbdce0",
    borderRadius: 5,
  },
  flexRowCentered: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  elegantTextSnippet: {
    padding: 0,
    margin: 0,
    fontWeight: "500",
    fontSize: fontSize(12),
    fontFamily: "PingFang SC",
    color: "#646472",
  },
  redTextHeading: {
    padding: 0,
    margin: 0,
    marginLeft: 1,
    fontWeight: "500",
    fontSize: fontSize(18),
    lineHeight: 22,
    fontFamily: "PingFang SC",
    color: "#fe1e00",
  },
  pingFangText: {
    padding: 0,
    margin: 0,
    marginTop: -2,
    fontWeight: "400",
    fontSize: fontSize(16),
    lineHeight: 22,
    fontFamily: "PingFang SC",
    color: "#807e7e",
  },
  pingFangText1: {
    padding: 0,
    margin: 0,
    marginTop: -2,
    fontWeight: "400",
    fontSize: fontSize(16),
    lineHeight: 22,
    fontFamily: "PingFang SC",
    color: "#807e7e",
  },
  copyContainer: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 15,
    height: 15,
    borderWidth: 1,
    borderColor: "#dbdce0",
    borderRadius: 4,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checked: {
    backgroundColor: "#002fa7",
    borderColor: "#002fa7",
  },
  checkmark: {
    color: "white",
    fontSize: fontSize(12),
  },
  checkboxLabel: {
    fontSize: fontSize(14),
    color: "#646472",
    fontFamily: "PingFang SC",
  },
  lastNameInputContainer: {
    width: "100%",
    padding: 6,
    paddingLeft: 8,
    paddingBottom: 10,
    marginTop: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#dbdce0",
    borderRadius: 5,
  },
  lastNameInputContainer1: {
    width: "100%",
    padding: 6,
    paddingLeft: 8,
    paddingBottom: 10,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderColor: "#dbdce0",
  },
  redAsteriskTextStyle: {
    padding: 0,
    margin: 0,
    marginLeft: 1,
    fontWeight: "500",
    fontSize: fontSize(18),
    lineHeight: 22,
    fontFamily: "PingFang SC",
    color: "#fe1e00",
  },
  formContainer: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    width: "100%",
    marginTop: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#dbdce0",
  },
  optionListDropdown: {},
  verticalCenteredColumn: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    marginTop: -1,
  },
  phoneNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    height: 60,
    paddingRight: 8,
    paddingLeft: 8,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#dbdce0",
  },
  mobilePhoneNumberLabel: {
    padding: 0,
    margin: 0,
    fontWeight: "500",
    fontSize: fontSize(14),
    fontFamily: "PingFang SC",
    color: "#807e7e",
  },
  mobilePhoneNumberLabel1: {
    padding: 0,
    margin: 0,
    fontWeight: "500",
    fontSize: fontSize(14),
    fontFamily: "PingFang SC",
    color: "#807e7e",
  },
  phoneNumberPromptContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    height: 60,
    paddingRight: 8,
    paddingLeft: 8,
    marginTop: -1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#dbdce0",
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  defaultSettingSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 15.5,
    gap: 8,
  },
  defaultTextDisplayStyle: {
    padding: 0,
    margin: 0,
    fontWeight: "500",
    fontSize: fontSize(16),
    lineHeight: 22,
    fontFamily: "PingFang SC",
    color: "black",
  },
  submitButtonContainer: {
    paddingRight: 11,
    paddingLeft: 11,
    marginTop: 60,
  },
  primaryButtonStyle: {
    width: "100%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "600",
    fontSize: fontSize(16),
    lineHeight: 22,
    fontFamily: "PingFang SC",
    color: "white",
    backgroundColor: "#002fa7",
    borderWidth: 0,
    borderRadius: 25,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: fontSize(16),
    lineHeight: 22,
    fontFamily: "PingFang SC",
  },
  dropdown: {
    borderColor: "#dbdce0",
    borderWidth: 1,
    borderRadius: 5,
    marginTop: 8,
    backgroundColor: "white",
    minHeight: 40,
    paddingHorizontal: 10,
  },
  dropdownContainer: {
    borderColor: "#dbdce0",
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: "white",
    marginTop: 2,
  },
  dropdownText: {
    fontSize: fontSize(16),
    color: "#333",
  },
  dropdownLabel: {
    fontSize: fontSize(16),
    color: "#333",
  },
  arrowIcon: {
    width: 20,
    height: 20,
  },
  placeholderStyle: {
    color: "#999",
  },
  searchContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#dbdce0",
    padding: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#dbdce0",
    borderRadius: 5,
    padding: 8,
    fontSize: fontSize(16),
  },
  phoneNumberError: {
    borderColor: "#fe1e00",
  },
  errorText: {
    color: "#fe1e00",
    fontSize: fontSize(12),
    marginTop: 4,
    fontFamily: "PingFang SC",
  },
  countrySelectorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderWidth: 1,
    borderColor: "#dbdce0",
    borderRadius: 5,
  },
  selectedCountryText: {
    fontSize: fontSize(16),
    color: "#333",
    fontFamily: "PingFang SC",
  },
  dropdownArrow: {
    fontSize: fontSize(12),
    color: "#646472",
    fontFamily: "PingFang SC",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: "100%",
    height: Dimensions.get("window").height * 0.8,
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    padding: 15,
  },
  modalTitle: {
    fontSize: fontSize(18),
    fontWeight: "bold",
  },
  closeButton: {
    fontSize: fontSize(16),
    fontWeight: "bold",
    color: "#002fa7",
  },
  countryItem: {
    width: "100%",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#dbdce0",
  },
  flagImage: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  countryItemText: {
    fontSize: fontSize(16),
    fontWeight: "500",
  },
  checkIcon: {
    fontSize: fontSize(16),
    fontWeight: "bold",
    color: "#002fa7",
    marginLeft: "auto",
  },
  flatList: {
    width: "100%",
  },
  flatListContent: {
    padding: 10,
  },
});