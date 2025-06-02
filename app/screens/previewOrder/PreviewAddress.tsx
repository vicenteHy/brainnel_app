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
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
  StatusBar,
  SafeAreaView,
  ScrollView
} from "react-native";
import { useState } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import BackIcon from "../../components/BackIcon";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { AddressItem } from "../../services/api/addressApi";
import { useAddressStore } from "../../store/address";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { settingApi } from "../../services/api/setting";
import flagMap from "../../utils/flagMap";
import useCreateOrderStore  from "../../store/createOrder";
import { useTranslation } from "react-i18next";
import fontSize from "../../utils/fontsizeUtils";
import useBurialPointStore from "../../store/burialPoint";

type RootStackParamList = {
  AddRess: { address?: AddressItem; cart_item_id?: number | string; totalAmount?: number; isFei?: boolean };
  AddressList: undefined;
  ShippingFee: { cart_item_id: any; totalAmount?: number; isFei?: boolean };
};
type AddRessRouteProp = RouteProp<RootStackParamList, "AddRess">;

export const PreviewAddress = () => {
  const { t } = useTranslation();
  const {
    defaultAddress,
    fetchDefaultAddress,
    loading,
  } = useAddressStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<AddRessRouteProp>();
  const { setOrderData ,orderData} = useCreateOrderStore();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [items, setItems] = useState<{label: string; value: string}[]>([]);
  const [selectedCountryLabel, setSelectedCountryLabel] = useState<string>("");
  const [countryList, setCountryList] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    receiver_first_name: "",
    receiver_last_name: "",
    country: "",
    receiver_phone: "",
    receiver_phone_again: "",
    whatsapp_phone: "",
    is_default: false,
  });
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [copyPhoneToWhatsApp, setCopyPhoneToWhatsApp] = useState(false);
  const [phoneNumbersMatch, setPhoneNumbersMatch] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get selected country data
  const fetchSelectedCountry = async () => {
    try {
      const countryData = await AsyncStorage.getItem("@selected_country");
      if (countryData) {
        const parsedData = JSON.parse(countryData);
        setSelectedCountry(parsedData);
        setValue(parsedData.name);
      }
    } catch (error) {
      console.error("Error fetching selected country:", error);
    }
  };

  // Initialize loading
  React.useEffect(() => {
    fetchSelectedCountry();
    fetchDefaultAddress();

    // If there is an address in route params, use it first
    if (route.params?.address) {
      setFormData({
        ...route.params.address,
        receiver_phone_again: route.params.address.receiver_phone,
        is_default: Boolean(route.params.address.is_default),
      });
      // Set country dropdown default value to address country
      setValue(route.params.address.country || null);
    }
  }, []);

  // When countryList loaded, set selected country label
  React.useEffect(() => {
    if (countryList.length > 0) {
      // If there is an address in route params
      const addressFromRoute = route.params?.address;
      if (addressFromRoute && addressFromRoute.country) {
        const selectedCountry = countryList.find(item => 
          item.name_en === addressFromRoute.country || 
          item.value === addressFromRoute.country
        );
        if (selectedCountry) {
          setSelectedCountryLabel(selectedCountry.label);
          setValue(selectedCountry.value);
        }
      }
      // If no route params but there is default address
      else if (defaultAddress && defaultAddress.country && !route.params?.address) {
        const selectedCountry = countryList.find(item => 
          item.name_en === defaultAddress.country || 
          item.value === defaultAddress.country
        );
        if (selectedCountry) {
          setSelectedCountryLabel(selectedCountry.label);
          setValue(selectedCountry.value);
        }
      }
    }
  }, [countryList, route.params?.address, defaultAddress]);

  // Monitor phone number changes, if copy option is checked then automatically update WhatsApp number
  React.useEffect(() => {
    if (copyPhoneToWhatsApp) {
      setFormData((prev) => ({
        ...prev,
        whatsapp_phone: prev.receiver_phone,
      }));
    }
  }, [formData.receiver_phone, copyPhoneToWhatsApp]);

  // Monitor phone number changes, verify if two inputs match
  React.useEffect(() => {
    if (formData.receiver_phone && formData.receiver_phone_again) {
      setPhoneNumbersMatch(
        formData.receiver_phone === formData.receiver_phone_again
      );
    } else {
      setPhoneNumbersMatch(true);
    }
  }, [formData.receiver_phone, formData.receiver_phone_again]);

  // Monitor defaultAddress changes
  React.useEffect(() => {
    if (defaultAddress && !route.params?.address) {
      setFormData({
        receiver_first_name: defaultAddress.receiver_first_name || "",
        receiver_last_name: defaultAddress.receiver_last_name || "",
        country: defaultAddress.country || "",
        receiver_phone: defaultAddress.receiver_phone || "",
        receiver_phone_again: defaultAddress.receiver_phone || "",
        whatsapp_phone: defaultAddress.whatsapp_phone || "",
        is_default: Boolean(defaultAddress.is_default),
      });
      setValue(defaultAddress.country || null);
    }
  }, [defaultAddress, route.params?.address]);

  React.useEffect(() => {
    settingApi.getCountryList().then((res) => {
      const formattedCountries = res.map((item) => ({
        label: `${item.name_en} (${item.country})`,
        value: item.name.toString(),
        flag: flagMap.get(item.name_en),
        name_en: item.name_en,
        country: item.country
      }));
      setItems(formattedCountries);
      setCountryList(formattedCountries);
    });
  }, []);

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
      newErrors.receiver_phone_again = t("address.errors.confirm_phone_required");
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
      setOrderData({
        ...orderData,
        address_id: defaultAddress?.address_id,
      });

      // 准备埋点数据
      const logData = {
        last_name: formData.receiver_last_name,
        first_name: formData.receiver_first_name,
        country: formData.country,
        phone_number: Number(formData.receiver_phone),
        whatsApp_number: Number(formData.whatsapp_phone),
      }
      
      // 记录地址信息埋点事件
      const burialPointStore = useBurialPointStore.getState();
      burialPointStore.logAddressInfo(logData, "cart");
      
      console.log("地址信息埋点已记录:", logData);
      
      navigation.navigate("ShippingFee", {
        cart_item_id: route.params?.cart_item_id,
        totalAmount: route.params?.totalAmount,
        isFei: route.params?.isFei,
      });
    }
  };

  const handleCountrySelect = (item: any) => {
    setValue(item.value);
    setSelectedCountryLabel(item.label);
    setOpen(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.safeAreaContent}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#f77f3a" />
            </View>
          ) : (
            <View style={styles.recipientFormContainer3}>
              <View>
                <View style={styles.recipientFormContainer1}>
                  <View style={styles.recipientFormContainer2}>
                    <View style={styles.titleContainer}>
                      <View style={styles.backIconContainer}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                          <BackIcon size={fontSize(20)} />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.titleHeading}>{t("address.select_recipient")}</Text>
                    </View>
                    <View style={styles.recipientInfoForm}>
                      <View style={styles.recipientInfoHeadingContainer}>
                        <Text style={styles.recipientInfoHeading}>{t("address.preview.default_address")}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate("AddressList")}>
                          <Text style={styles.recipientInfoHeadingEmit}>{t("address.preview.choose_other")}</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.contactFormContainer}>
                        {/* First Name Field */}
                        <View style={styles.formFieldContainer}>
                          <View style={styles.flexRowCentered}>
                            <Text style={styles.elegantTextSnippet}>{t("address.first_name")}</Text>
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
                            editable={false}
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
                            <Text style={styles.elegantTextSnippet}>{t("address.last_name")}</Text>
                            <Text style={styles.redAsteriskTextStyle}>*</Text>
                          </View>
                          <TextInput
                            style={styles.pingFangText}
                            placeholder={t("address.placeholder.last_name")}
                            value={formData.receiver_last_name}
                            onChangeText={(text) =>
                              setFormData({ ...formData, receiver_last_name: text })
                            }
                            editable={false}
                          />
                          {errors.receiver_last_name && (
                            <Text style={styles.errorText}>
                              {errors.receiver_last_name}
                            </Text>
                          )}
                        </View>
                        {/* Country */}
                        <View style={styles.lastNameInputContainer}>
                          <View style={styles.flexRowCentered}>
                            <Text style={styles.elegantTextSnippet}>{t("address.country")}</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.countrySelectorButton}
                            onPress={() => setOpen(true)}
                            disabled={true}
                          >
                            {selectedCountryLabel ? (
                              <Text style={styles.selectedCountryText}>{selectedCountryLabel}</Text>
                            ) : (
                              <Text style={styles.placeholderStyle}>{t("address.placeholder.select_country")}</Text>
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
                                <Text style={styles.redAsteriskTextStyle}>*</Text>
                              </View>
                              <TextInput
                                style={styles.pingFangText1}
                                placeholder={t("address.placeholder.phone_number")}
                                value={formData.receiver_phone}
                                onChangeText={(text) =>
                                  setFormData({
                                    ...formData,
                                    receiver_phone: text,
                                  })
                                }
                                editable={false}
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
                                <Text style={styles.redAsteriskTextStyle}>*</Text>
                              </View>
                              <TextInput
                                style={styles.pingFangText1}
                                placeholder={t("address.placeholder.confirm_phone_number")}
                                value={formData.receiver_phone_again}
                                onChangeText={(text) =>
                                  setFormData({
                                    ...formData,
                                    receiver_phone_again: text,
                                  })
                                }
                                editable={false}
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
                            <Text style={styles.elegantTextSnippet}>{t("address.whatsapp")}</Text>
                            <Text style={styles.redTextHeading}>*</Text>
                          </View>
                          <TextInput
                            style={styles.pingFangText}
                            placeholder={t("address.placeholder.whatsapp")}
                            value={formData.whatsapp_phone}
                            onChangeText={(text) =>
                              setFormData({ ...formData, whatsapp_phone: text })
                            }
                            editable={false}
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
                        {/* <View style={styles.defaultSettingSection}>
                          <Text style={styles.defaultTextDisplayStyle}>
                            {t("address.set_default")}
                          </Text>
                          <Switch
                            value={formData.is_default}
                            onValueChange={() =>
                              setFormData({
                                ...formData,
                                is_default: !formData.is_default,
                              })
                            }
                            trackColor={{ false: "#767577", true: "#81b0ff" }}
                            thumbColor={formData.is_default ? "#002fa7" : "#f4f3f4"}
                            ios_backgroundColor="#3e3e3e"
                          />
                        </View> */}
                      </View>
                    </View>

                    {/* Submit Button */}
                    <View style={styles.submitButtonContainer}>
                      <TouchableOpacity
                        style={styles.primaryButtonStyle}
                        onPress={handleSubmit}
                      >
                        <Text style={styles.buttonText}>{t("address.submit")}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
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
                  <Text style={styles.modalTitle}>{t("address.select_country")}</Text>
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
                        <Image 
                          source={item.flag} 
                          style={styles.flagImage} 
                        />
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeAreaContent: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 0 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
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
  recipientInfoHeadingEmit:{
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
    fontSize: 12,
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
  selectedCountryText: {
    padding: 0,
    margin: 0,
    fontWeight: "500",
    fontSize: fontSize(16) ,
    lineHeight: 22,
    fontFamily: "PingFang SC",
    color: "#646472",
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
    height: Dimensions.get('window').height * 0.8,
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#dbdce0",
  },
  modalTitle: {
    fontWeight: "600",
    fontSize: fontSize(18),
    lineHeight: 22,
    fontFamily: "PingFang SC",
    color: "black",
  },
  closeButton: {
    fontWeight: "500",
    fontSize: fontSize(16),
    lineHeight: 22,
    fontFamily: "PingFang SC",
    color: "#ff731e",
    textDecorationLine: "underline",
  },
  countryItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#dbdce0",
    flexDirection: "row",
    alignItems: "center",
  },
  countryItemText: {
    fontSize: fontSize(16),
    color: "#333",
    flex: 1,
  },
  errorText: {
    color: "#fe1e00",
    fontSize: fontSize(12),
    marginTop: 4,
    fontFamily: "PingFang SC",
  },
  countrySelectorButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#dbdce0",
    borderRadius: 5,
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  placeholderStyle: {
    color: "#807e7e",
    fontSize: fontSize(16),
  },
  flagImage: {
    width: 24,
    height: 16,
    marginRight: 10,
  },
  dropdownArrow: {
    fontSize: fontSize(12),
    color: "#807e7e",
  },
  flatList: {
    flex: 1,
    height: "100%",
  },
  flatListContent: {
    flexGrow: 1,
  },
  checkIcon: {
    color: "#002fa7",
    fontSize: fontSize(18),
    fontWeight: "bold",
  },
});
