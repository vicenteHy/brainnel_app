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
import useAnalyticsStore from "../../store/analytics";
import { RootStackParamList } from "../../navigation/types";

type ShippingFeeNavParams = {
  cart_item_id: any; 
  totalAmount?: number; 
  isCOD?: boolean; 
  isToc?: number;
};

type PreviewAddressRouteProp = RouteProp<RootStackParamList, "PreviewAddress">;

type NavigationParams = {
  ShippingFee: ShippingFeeNavParams;
  AddressList: undefined;
};

export const PreviewAddress = () => {
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
  const route = useRoute<PreviewAddressRouteProp>();
  
  console.log('📍 [COD-DEBUG] PreviewAddress接收到的路由参数:', route.params);
  console.log('📍 [COD-DEBUG] isCOD:', route.params?.isCOD);
  console.log('📍 [COD-DEBUG] isToc:', route.params?.isToc);
  const { setOrderData ,orderData} = useCreateOrderStore();
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
    fetchAddresses(); // 加载地址列表用于重复检查

    // If there is an address in route params, use it first
    if (route.params?.address) {
      const address = route.params.address;
      const phoneNumber = address.receiver_phone || "";
      const whatsappPhone = address.whatsapp_phone || "";
      
      // Check if WhatsApp is same as phone with country code
      const fullPhoneNumber = `225${phoneNumber}`;
      const isWhatsappSameAsPhone = whatsappPhone === fullPhoneNumber || whatsappPhone === phoneNumber;
      
      setFormData({
        receiver_first_name: address.receiver_first_name || "",
        receiver_last_name: address.receiver_last_name || "",
        country_code: "225", // 默认科特迪瓦区号
        receiver_phone: phoneNumber,
        receiver_phone_again: phoneNumber,
        whatsapp_phone: whatsappPhone,
        is_default: Boolean(address.is_default),
      });
      
      setWhatsappSameAsPhone(isWhatsappSameAsPhone);
    }
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
    const addressToUse = defaultAddress || (addresses && addresses.length > 0 ? addresses[0] : null);

    if (addressToUse && !route.params?.address) {
      const phoneNumber = addressToUse.receiver_phone || "";
      const whatsappPhone = addressToUse.whatsapp_phone || "";
      
      // Check if WhatsApp is same as phone with country code
      const fullPhoneNumber = `225${phoneNumber}`;
      const isWhatsappSameAsPhone = whatsappPhone === fullPhoneNumber || whatsappPhone === phoneNumber;
      
      setFormData({
        receiver_first_name: addressToUse.receiver_first_name || "",
        receiver_last_name: addressToUse.receiver_last_name || "",
        country_code: "225", // 默认科特迪瓦区号
        receiver_phone: phoneNumber,
        receiver_phone_again: phoneNumber,
        whatsapp_phone: whatsappPhone,
        is_default: Boolean(addressToUse.is_default),
      });
      
      setWhatsappSameAsPhone(isWhatsappSameAsPhone);
    }
  }, [defaultAddress, addresses, route.params?.address]);

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
    if (!whatsappSameAsPhone && !formData.whatsapp_phone) {
      newErrors.whatsapp_phone = t("address.errors.whatsapp_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
          receiver_phone: formData.receiver_phone,
          whatsapp_phone: whatsappNumber,
          province: "",
          city: "",
          district: "",
          detail_address: "",
          is_default: shouldBeDefault ? 1 : 0,
        };
        
        console.log("地址数据:", addressData);

        // 检查是否已存在相同地址，避免重复保存
        const isDuplicateAddress = addresses.some(addr => 
          addr.receiver_first_name === addressData.receiver_first_name &&
          addr.receiver_last_name === addressData.receiver_last_name &&
          addr.receiver_phone === addressData.receiver_phone &&
          addr.whatsapp_phone === addressData.whatsapp_phone
        );

        let newAddressId: number | undefined;

        if (!isDuplicateAddress) {
          // 保存地址到用户地址列表
          await addAddress(addressData);
          console.log("地址已保存到用户地址列表");
          
          // 重新获取地址列表以获取新创建的地址ID
          await fetchAddresses();
          await fetchDefaultAddress();
          
          // 获取最新的地址状态
          const currentState = useAddressStore.getState();
          
          // 如果是新用户第一次创建地址，这个地址会成为默认地址
          if (currentState.defaultAddress) {
            newAddressId = currentState.defaultAddress.address_id;
          } else if (currentState.addresses.length > 0) {
            // 如果没有默认地址，使用最新创建的地址
            newAddressId = currentState.addresses[currentState.addresses.length - 1].address_id;
          }
        } else {
          console.log("地址已存在，跳过保存");
          // 如果地址已存在，找到匹配的地址ID
          const existingAddress = addresses.find(addr => 
            addr.receiver_first_name === addressData.receiver_first_name &&
            addr.receiver_last_name === addressData.receiver_last_name &&
            addr.receiver_phone === addressData.receiver_phone &&
            addr.whatsapp_phone === addressData.whatsapp_phone
          );
          newAddressId = existingAddress?.address_id || defaultAddress?.address_id;
        }

        console.log("设置地址ID:", newAddressId);
        
        setOrderData({
          ...orderData,
          address_id: newAddressId || 0,
        });

        // 准备埋点数据
        const logData = {
          last_name: formData.receiver_last_name,
          first_name: formData.receiver_first_name,
          country: formData.country_code,
          phone_number: Number(formData.receiver_phone),
          whatsApp_number: Number(whatsappNumber),
        }
        
        // 记录地址信息埋点事件
        const analyticsStore = useAnalyticsStore.getState();
        analyticsStore.logAddressInfo(logData, "cart");
        
        console.log("地址信息埋点已记录:", logData);
        
        navigation.navigate("ShippingFee", {
          cart_item_id: route.params?.cart_item_id,
          totalAmount: route.params?.totalAmount,
          isCOD: route.params?.isCOD,
          isToc: route.params?.isToc,
        });
      } catch (error) {
        console.error("保存地址失败:", error);
        // 即使保存地址失败，也继续进行下一步流程
        const fallbackAddressId = defaultAddress?.address_id || 
          (addresses.length > 0 ? addresses[0].address_id : 0);
        
        console.log("使用回退地址ID:", fallbackAddressId);
        
        setOrderData({
          ...orderData,
          address_id: fallbackAddressId,
        });
        
        navigation.navigate("ShippingFee", {
          cart_item_id: route.params?.cart_item_id,
          totalAmount: route.params?.totalAmount,
          isCOD: route.params?.isCOD,
          isToc: route.params?.isToc,
        });
      }
    }
  };

  const handleCountrySelect = (item: any) => {
    setFormData(prev => ({
      ...prev,
      country_code: item.country
    }));
    setOpen(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView 
        behavior="padding"
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
                          />
                          {errors.receiver_last_name && (
                            <Text style={styles.errorText}>
                              {errors.receiver_last_name}
                            </Text>
                          )}
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
                              <View style={styles.phoneInputContainer}>
                                <TouchableOpacity
                                  style={styles.countryCodeSelector}
                                  onPress={() => setOpen(true)}
                                >
                                  <Text style={styles.countryCodeText}>+{formData.country_code}</Text>
                                  <Text style={styles.dropdownArrow}>▼</Text>
                                </TouchableOpacity>
                                <TextInput
                                  style={styles.phoneInput}
                                  placeholder={t("address.placeholder.phone_number")}
                                  value={formData.receiver_phone}
                                  onChangeText={(text) =>
                                    setFormData({
                                      ...formData,
                                      receiver_phone: text,
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
                            <View style={styles.lastNameInputContainer1}>
                              <View style={styles.flexRowCentered}>
                                <Text style={styles.elegantTextSnippet}>
                                  {t("address.confirm_phone_number")}
                                </Text>
                                <Text style={styles.redAsteriskTextStyle}>*</Text>
                              </View>
                              <View style={styles.phoneInputContainer}>
                                <View style={styles.countryCodeDisplay}>
                                  <Text style={styles.countryCodeText}>+{formData.country_code}</Text>
                                </View>
                                <TextInput
                                  style={styles.phoneInput}
                                  placeholder={t("address.placeholder.confirm_phone_number")}
                                  value={formData.receiver_phone_again}
                                  onChangeText={(text) =>
                                    setFormData({
                                      ...formData,
                                      receiver_phone_again: text,
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
                          </View>
                        </View>

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
                              keyboardType="numeric"
                            />
                            {errors.whatsapp_phone && (
                              <Text style={styles.errorText}>
                                {errors.whatsapp_phone}
                              </Text>
                            )}
                          </View>
                        )}

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
                  <Text style={styles.modalTitle}>{t("address.select_country_code")}</Text>
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
    paddingTop: 0,
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
    padding: 20,
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
    paddingVertical: 10,
  },
  backIconContainer: {
    position: "absolute",
    left: 0,
  },
  titleHeading: {
    fontWeight: "600",
    fontSize: 20,
    lineHeight: 28,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    color: "#1a1a1a",
    letterSpacing: 0.3,
  },
  recipientInfoForm: {
    marginTop: 30,
  },
  recipientInfoHeadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  recipientInfoHeading: {
    padding: 0,
    margin: 0,
    fontWeight: "600",
    fontSize: 18,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    color: "#1a1a1a",
    letterSpacing: 0.2,
  },
  recipientInfoHeadingEmit:{
    padding: 0,
    margin: 0,
    fontWeight: "500",
    fontSize: 16,
    lineHeight: 22,
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
    padding: 16,
    paddingBottom: 12,
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    color: "#666666",
    letterSpacing: 0.1,
  },
  redTextHeading: {
    padding: 0,
    margin: 0,
    marginLeft: 2,
    fontWeight: "500",
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    color: "#ff4444",
  },
  pingFangText: {
    padding: 0,
    margin: 0,
    marginTop: 8,
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    color: "#333333",
  },
  pingFangText1: {
    padding: 0,
    margin: 0,
    marginTop: 8,
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    color: "#333333",
  },
  copyContainer: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  whatsappSection: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: "#e8e8e8",
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
    fontSize: 12,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#666666",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.1,
  },
  lastNameInputContainer: {
    width: "100%",
    padding: 16,
    paddingBottom: 12,
    marginBottom: 12,
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  lastNameInputContainer1: {
    width: "100%",
    padding: 16,
    paddingBottom: 12,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderColor: "#e8e8e8",
  },

  redAsteriskTextStyle: {
    padding: 0,
    margin: 0,
    marginLeft: 2,
    fontWeight: "500",
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    color: "#ff4444",
  },
  formContainer: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    width: "100%",
    marginBottom: 12,
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionListDropdown: {},
  verticalCenteredColumn: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
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
    borderColor: "#e8e8e8",
  },
  mobilePhoneNumberLabel: {
    padding: 0,
    margin: 0,
    fontWeight: "400",
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    color: "#666666",
  },
  mobilePhoneNumberLabel1: {
    padding: 0,
    margin: 0,
    fontWeight: "400",
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    color: "#666666",
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
    borderColor: "#e8e8e8",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  defaultSettingSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
    gap: 8,
  },
  defaultTextDisplayStyle: {
    padding: 0,
    margin: 0,
    fontWeight: "500",
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    color: "#1a1a1a",
    letterSpacing: 0.1,
  },
  submitButtonContainer: {
    paddingHorizontal: 20,
    marginTop: 40,
  },
  primaryButtonStyle: {
    width: "100%",
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FF5100",
    borderWidth: 0,
    borderRadius: 16,
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
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.3,
  },
  selectedCountryText: {
    padding: 0,
    margin: 0,
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    color: "#333333",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
    fontSize: 18,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    color: "#1a1a1a",
    letterSpacing: 0.2,
  },
  closeButton: {
    fontWeight: "500",
    fontSize: 16,
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
    fontSize: 16,
    color: "#333333",
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: "400",
  },
  countrySelectorButton: {
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    borderRadius: 12,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fafafa",
  },
  placeholderStyle: {
    color: "#999999",
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  flagImage: {
    width: 24,
    height: 16,
    marginRight: 12,
  },
  dropdownArrow: {
    fontSize: 14,
    color: "#666666",
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
    fontSize: 18,
    fontWeight: "bold",
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  countryCodeSelector: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 80,
    justifyContent: "space-between",
  },
  countryCodeDisplay: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 8,
    minWidth: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333333",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});
