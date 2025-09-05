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
  SafeAreaView,
  ScrollView
} from "react-native";
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { useState } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import BackIcon from "../../components/BackIcon";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { AddressItem } from "../../services/api/addressApi";
import { useAddressStore } from "../../store/address";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { settingApi } from "../../services/api/setting";
import flagMap from "../../utils/flagMap";
import { useTranslation } from "react-i18next";
import fontSize from "../../utils/fontsizeUtils";
import { RootStackParamList } from "../../navigation/types";

type LocalAddressFormRouteProp = RouteProp<RootStackParamList, "LocalAddressForm">;

type NavigationParams = {
  LocalProductList: undefined;
  AddressList: undefined;
  PickUp: undefined;
};

export const LocalAddressForm = () => {
  const { t } = useTranslation();
  const {
    defaultAddress,
    fetchDefaultAddress,
    loading,
    addAddress,
    addresses,
    fetchAddresses,
  } = useAddressStore();
  const navigation = useNavigation<NativeStackNavigationProp<NavigationParams>>();
  const route = useRoute<LocalAddressFormRouteProp>();
  
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [items, setItems] = useState<{label: string; value: string}[]>([]);
  const [selectedCountryLabel, setSelectedCountryLabel] = useState<string>("");
  const [countryList, setCountryList] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    receiver_first_name: "",
    receiver_last_name: "",
    country_code: "225", // 默认科特迪瓦区号
    receiver_phone: "",
    receiver_phone_again: "",
    whatsapp_phone: "",
    is_default: false,
  });
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState(true);
  const [phoneNumbersMatch, setPhoneNumbersMatch] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 当前选中国家（用于展示国旗）
  const currentSelectedCountry = countryList.find(item => item.country === formData.country_code);

  // Get selected country data and set country code
  const fetchSelectedCountry = async () => {
    try {
      setSelectedCountry({ name: "Côte d'Ivoire", country_code: "225" });
      setValue("Côte d'Ivoire");
      setFormData(prev => ({
        ...prev,
        country_code: "225"
      }));
    } catch (error) {
    }
  };

  // Initialize loading
  React.useEffect(() => {
    const initializeData = async () => {
      await fetchSelectedCountry();
      await fetchDefaultAddress();
      await fetchAddresses(); // 加载地址列表用于重复检查

      // If there is an address in route params, use it first
      if (route.params?.address) {
        const address = route.params.address;
        const phoneNumber = address.receiver_phone || "";
        const whatsappPhone = address.whatsapp_phone || "";
        
        // 本地货盘仅支持科特迪瓦
        const countryCode = "225";
        
        // Check if WhatsApp is same as phone with country code
        const fullPhoneNumber = `${countryCode}${phoneNumber}`;
        const isWhatsappSameAsPhone = whatsappPhone === fullPhoneNumber || whatsappPhone === phoneNumber;
        
        setFormData({
          receiver_first_name: address.receiver_first_name || "",
          receiver_last_name: address.receiver_last_name || "",
          country_code: countryCode,
          receiver_phone: phoneNumber,
          receiver_phone_again: phoneNumber,
          whatsapp_phone: whatsappPhone,
          is_default: Boolean(address.is_default),
        });
        
        setWhatsappSameAsPhone(isWhatsappSameAsPhone);
      }
    };
    
    initializeData();
  }, []);

  // When countryList loaded, set selected country label
  React.useEffect(() => {
    if (countryList.length > 0) {
      const addressToUse = defaultAddress || (addresses && addresses.length > 0 ? addresses[0] : null);
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
      else if (addressToUse && addressToUse.country && !route.params?.address) {
        const selectedCountry = countryList.find(item => 
          item.name_en === addressToUse.country || 
          item.value === addressToUse.country
        );
        if (selectedCountry) {
          setSelectedCountryLabel(selectedCountry.label);
          setValue(selectedCountry.value);
        }
      }
    }
  }, [countryList, route.params?.address, defaultAddress, addresses]);

  // Monitor phone number changes, if whatsapp same as phone option is checked then automatically update WhatsApp number
  React.useEffect(() => {
    if (whatsappSameAsPhone && formData.receiver_phone) {
      const fullPhoneNumber = `${formData.country_code}${formData.receiver_phone}`;
      setFormData((prev) => ({
        ...prev,
        whatsapp_phone: fullPhoneNumber,
      }));
    } else if (!whatsappSameAsPhone) {
      // When unchecked, clear WhatsApp field so user can input different number
      setFormData((prev) => ({
        ...prev,
        whatsapp_phone: "",
      }));
    }
  }, [formData.receiver_phone, formData.country_code, whatsappSameAsPhone]);

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
    const updateDefaultAddress = async () => {
      const addressToUse = defaultAddress || (addresses && addresses.length > 0 ? addresses[0] : null);

      if (addressToUse && !route.params?.address) {
        const phoneNumber = addressToUse.receiver_phone || "";
        const whatsappPhone = addressToUse.whatsapp_phone || "";
        
        // 本地货盘仅支持科特迪瓦
        const countryCode = "225";
        
        // Check if WhatsApp is same as phone with country code
        const fullPhoneNumber = `${countryCode}${phoneNumber}`;
        const isWhatsappSameAsPhone = whatsappPhone === fullPhoneNumber || whatsappPhone === phoneNumber;
        
        setFormData({
          receiver_first_name: addressToUse.receiver_first_name || "",
          receiver_last_name: addressToUse.receiver_last_name || "",
          country_code: countryCode,
          receiver_phone: phoneNumber,
          receiver_phone_again: phoneNumber,
          whatsapp_phone: whatsappPhone,
          is_default: Boolean(addressToUse.is_default),
        });
        
        setWhatsappSameAsPhone(isWhatsappSameAsPhone);
      }
    };
    
    updateDefaultAddress();
  }, [defaultAddress, addresses, route.params?.address]);

  React.useEffect(() => {
    const initializeCountryList = async () => {
      try {
        const res = await settingApi.getCountryList();
        const formattedCountries = res.map((item) => ({
          label: `${item.name_en} (${item.country})`,
          value: item.name.toString(),
          flag: flagMap.get(item.name_en),
          name_en: item.name_en,
          country: item.country
        }));
        setItems(formattedCountries);
        setCountryList(formattedCountries);
        
        // 强制设置为科特迪瓦
        setFormData(prev => ({
          ...prev,
          country_code: "225"
        }));
      } catch (error) {
        console.error('Error fetching country list:', error);
      }
    };
    
    initializeCountryList();
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
    // 校验手机号为8或10位数字（不包含区号）
    const isValidLocalPhone = (p: string) => /^\d{8}$|^\d{10}$/.test(p);
    if (formData.receiver_phone && !isValidLocalPhone(formData.receiver_phone)) {
      newErrors.receiver_phone = "Le numéro doit contenir 8 ou 10 chiffres";
    }
    if (!formData.receiver_phone_again) {
      newErrors.receiver_phone_again = t("address.errors.confirm_phone_required");
    }
    if (formData.receiver_phone_again && !isValidLocalPhone(formData.receiver_phone_again)) {
      newErrors.receiver_phone_again = "Le numéro doit contenir 8 ou 10 chiffres";
    }
    // 不在此处添加“号码不一致”的字段错误，避免与实时提示重复显示
    const isMismatch =
      !!formData.receiver_phone &&
      !!formData.receiver_phone_again &&
      formData.receiver_phone !== formData.receiver_phone_again;

    if (!whatsappSameAsPhone && !formData.whatsapp_phone) {
      newErrors.whatsapp_phone = t("address.errors.whatsapp_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && !isMismatch;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        // 准备地址数据
        const whatsappNumber = whatsappSameAsPhone 
          ? `${formData.country_code}${formData.receiver_phone}` 
          : formData.whatsapp_phone;

        // 获取选中的国家信息
        const selectedCountryInfo = countryList.find(item => 
          item.country === formData.country_code
        );

        // 如果用户没有地址，新地址应该设置为默认地址
        const shouldBeDefault = addresses.length === 0 || formData.is_default;
        
        const addressData = {
          receiver_first_name: formData.receiver_first_name,
          receiver_last_name: formData.receiver_last_name,
          country: selectedCountryInfo?.name_en || "",
          receiver_phone: formData.receiver_phone, // 不拼接区号，只保存本地号码
          whatsapp_phone: whatsappNumber,
          province: "",
          city: "",
          district: "",
          detail_address: "",
          is_default: shouldBeDefault ? 1 : 0,
        };
        

        // 检查是否已存在相同地址，避免重复保存
        const isDuplicateAddress = addresses.some(addr => 
          addr.receiver_first_name === addressData.receiver_first_name &&
          addr.receiver_last_name === addressData.receiver_last_name &&
          addr.receiver_phone === addressData.receiver_phone &&
          addr.whatsapp_phone === addressData.whatsapp_phone
        );

        if (!isDuplicateAddress) {
          // 保存地址到用户地址列表
          await addAddress(addressData);
          
          // 重新获取地址列表
          await fetchAddresses();
          await fetchDefaultAddress();
        }

        // 跳转到取货点页面
        navigation.navigate("PickUp");
      } catch (error) {
        console.error('Error saving address:', error);
        // 即使保存地址失败，也跳转到取货点页面
        navigation.navigate("PickUp");
      }
    }
  };

  const handleCountrySelect = (item: any) => {
    setFormData(prev => ({
      ...prev,
      country_code: item.country,
    }));
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <BackIcon size={fontSize(20)} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("address.select_recipient")}</Text>
        <View style={{ width: 20 }} />
      </View>

      <KeyboardAvoidingView 
        behavior="padding"
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#f77f3a" />
            </View>
          ) : (
            <View style={styles.recipientFormContainer3}>
              <View>
                <View style={styles.recipientFormContainer1}>
                  <View style={styles.recipientFormContainer2}>
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
                            <Text style={styles.elegantTextSnippet}>*{t("address.first_name")}:</Text>
                          </View>
                          <TextInput
                            style={styles.pingFangText}
                            placeholder={t("address.placeholder.first_name")}
                            placeholderTextColor="#9CA3AF"
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
                        <View style={styles.formFieldContainer}>
                          <View style={styles.flexRowCentered}>
                            <Text style={styles.elegantTextSnippet}>*{t("address.last_name")}:</Text>
                          </View>
                          <TextInput
                            style={styles.pingFangText}
                            placeholder={t("address.placeholder.last_name")}
                            placeholderTextColor="#9CA3AF"
                            value={formData.receiver_last_name}
                            onChangeText={(text) =>
                              setFormData({ ...formData, receiver_last_name: text })
                            }
                          />
                          {errors.receiver_last_name && (
                            <Text style={styles.errorText}>
                              {errors.receiver_last_name}
                            </Text>
                          )}
                        </View>


                        {/* Phone Number Section */}
                        <View style={styles.formFieldContainer}>
                          <View style={styles.flexRowCentered}>
                            <Text style={styles.elegantTextSnippet}>
                              *{t("address.phone_number")}:
                            </Text>
                          </View>
                          <View style={styles.phoneInputContainer}>
                            <View
                              style={styles.countryCodeSelector}
                            >
                              <Image 
                                source={flagMap.get("Côte d'Ivoire")} 
                                style={styles.flagIcon}
                              />
                              <Text style={styles.countryCodeText}>+225</Text>
                          </View>
                            <TextInput
                              style={styles.phoneInput}
                              placeholder={t("address.placeholder.phone_number")}
                              placeholderTextColor="#9CA3AF"
                              value={formData.receiver_phone}
                              onChangeText={(text) =>
                                setFormData({
                                  ...formData,
                                  receiver_phone: text.replace(/\D/g, ""),
                                 })
                              }
                              keyboardType="numeric"
                            />
                          </View>
                          {errors.receiver_phone && (
                            <Text style={styles.errorText}>
                              {errors.receiver_phone}
                            </Text>
                          )}
                        </View>
                        
                        <View style={styles.formFieldContainer}>
                          <View style={styles.flexRowCentered}>
                            <Text style={styles.elegantTextSnippet}>
                              *{t("address.confirm_phone_number")}:
                            </Text>
                          </View>
                          <View style={styles.phoneInputContainer}>
                            <View style={styles.countryCodeDisplay}>
                              <Image 
                                source={flagMap.get("Côte d'Ivoire")} 
                                style={styles.flagIcon}
                              />
                              <Text style={styles.countryCodeText}>+225</Text>
                            </View>
                            <TextInput
                              style={styles.phoneInput}
                              placeholder={t("address.placeholder.confirm_phone_number")}
                              placeholderTextColor="#9CA3AF"
                              value={formData.receiver_phone_again}
                              onChangeText={(text) =>
                                setFormData({
                                  ...formData,
                                  receiver_phone_again: text.replace(/\D/g, ""),
                                 })
                              }
                              keyboardType="numeric"
                            />
                          </View>
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

                        {/* WhatsApp Section */}
                        <View style={styles.whatsappSection}>
                          <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={() =>
                              setWhatsappSameAsPhone(!whatsappSameAsPhone)
                            }
                          >
                            <View
                              style={[
                                styles.checkbox,
                                whatsappSameAsPhone && styles.checked,
                              ]}
                            >
                              {whatsappSameAsPhone && (
                                <Text style={styles.checkmark}>✓</Text>
                              )}
                            </View>
                            <Text style={styles.checkboxLabel}>
                              {t("address.whatsapp_same_as_phone")}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* WhatsApp Input Field - Only show when different from phone */}
                        {!whatsappSameAsPhone && (
                          <View style={styles.formFieldContainer}>
                            <View style={styles.flexRowCentered}>
                              <Text style={styles.elegantTextSnippet}>*{t("address.whatsapp")}:</Text>
                            </View>
                            <TextInput
                              style={styles.pingFangText}
                              placeholder={t("address.placeholder.whatsapp")}
                              placeholderTextColor="#9CA3AF"
                              value={formData.whatsapp_phone}
                              onChangeText={(text) =>
                                setFormData({ ...formData, whatsapp_phone: text })
                              }
                              keyboardType="numeric"
                            />
                            {errors.whatsapp_phone && (
                              <Text style={styles.errorText}>
                                {errors.whatsapp_phone}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Submit Button */}
                    <View style={styles.submitButtonContainer}>
                      <TouchableOpacity
                        style={styles.primaryButtonStyle}
                        onPress={handleSubmit}
                      >
                        <Text style={styles.buttonText}>Étape suivante</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
          {false && (
            <Modal
              visible={open}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setOpen(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Sélectionner l'indicatif du pays</Text>
                    <TouchableOpacity onPress={() => setOpen(false)}>
                      <Text style={styles.closeButton}>Fermer</Text>
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={countryList}
                    keyExtractor={(item) => `${item.value}-${item.country}`}
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
                        <Text style={styles.countryItemText}>{item.name_en} (+{item.country})</Text>
                        {formData.country_code === item.country && (
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
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 44 : Constants.statusBarHeight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    zIndex: 5,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: fontSize(20),
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    flex: 1,
    letterSpacing: 0.3,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
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
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 0,
  },

  recipientFormContainer2: {
    width: "100%",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  recipientInfoForm: {
    marginTop: 30,
  },
  recipientInfoHeadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  recipientInfoHeading: {
    padding: 0,
    margin: 0,
    fontWeight: "600",
    fontSize: fontSize(18),
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    color: "#1a1a1a",
    letterSpacing: 0.2,
  },
  recipientInfoHeadingEmit:{
    padding: 0,
    margin: 0,
    fontWeight: "500",
    fontSize: fontSize(14),
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    color: "#FF5100",
    textDecorationLine: "underline",
  },
  contactFormContainer: {
    width: "100%",
    marginTop: 8,
  },
  formFieldContainer: {
    width: "100%",
    marginBottom: 16,
  },
  flexRowCentered: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 8,
  },
  elegantTextSnippet: {
    padding: 0,
    margin: 0,
    fontWeight: "500",
    fontSize: fontSize(14),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    color: "#333333",
    letterSpacing: 0.1,
  },
  pingFangText: {
    padding: 12,
    margin: 0,
    fontWeight: "400",
    fontSize: fontSize(16),
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    color: "#333333",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    backgroundColor: "#FAFAFA",
  },
  whatsappSection: {
    marginTop: 8,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderRadius: 4,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checked: {
    backgroundColor: "#FF5100",
    borderColor: "#FF5100",
  },
  checkmark: {
    color: "white",
    fontSize: fontSize(14),
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: fontSize(14),
    color: "#666666",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.1,
  },
  submitButtonContainer: {
    marginTop: 40,
  },
  primaryButtonStyle: {
    width: "100%",
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FF5100",
    borderWidth: 0,
    borderRadius: 28,
    shadowColor: "#FF5100",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: fontSize(16),
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.3,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "#00000080",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: "100%",
    height: Dimensions.get('window').height * 0.8,
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  modalTitle: {
    fontWeight: "600",
    fontSize: fontSize(18),
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    color: "#1a1a1a",
    letterSpacing: 0.2,
  },
  closeButton: {
    fontWeight: "500",
    fontSize: fontSize(16),
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    color: "#FF5100",
  },
  countryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    flexDirection: "row",
    alignItems: "center",
  },
  countryItemText: {
    fontSize: fontSize(16),
    color: "#333333",
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  errorText: {
    color: "#ff4444",
    fontSize: fontSize(12),
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: "400",
  },
  flagImage: {
    width: 24,
    height: 16,
    marginRight: 12,
  },
  dropdownArrow: {
    fontSize: fontSize(12),
    color: "#666666",
    marginLeft: 4,
  },
  flatList: {
    flex: 1,
    height: "100%",
  },
  flatListContent: {
    flexGrow: 1,
  },
  checkIcon: {
    color: "#FF5100",
    fontSize: fontSize(18),
    fontWeight: "bold",
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  countryCodeSelector: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 110,
  },
  countryCodeDisplay: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 110,
  },
  countryCodeText: {
    fontSize: fontSize(16),
    fontWeight: "500",
    color: "#333333",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: fontSize(16),
    color: "#333333",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    backgroundColor: "#FAFAFA",
  },
  flagIcon: {
    width: 20,
    height: 14,
    marginRight: 8,
  },
});