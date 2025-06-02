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
} from "react-native";
import { useState } from "react";
import DropDownPicker from "react-native-dropdown-picker";
import { Country, countries } from "../../constants/countries";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { addressApi } from "../../services/api/addressApi";
import BackIcon from "../../components/BackIcon";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { eventBus } from "../../utils/eventBus";
import { AddressItem } from "../../services/api/addressApi";

type RootStackParamList = {
  AddRess: { address?: AddressItem };
};
type AddRessRouteProp = RouteProp<RootStackParamList, "AddRess">;

export const AddRess = () => {
  const navigation = useNavigation();
  const route = useRoute<AddRessRouteProp>();
  
  // 添加打印语句
  console.log('Address.tsx 接收到的数据:', route.params);
  
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState(
    countries.map((country) => ({
      label: `${country.flag} ${country.name} (${country.phoneCode})`,
      value: country.name,
    }))
  );

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
  const [isDefault, setIsDefault] = useState(false);
  const [copyPhoneToWhatsApp, setCopyPhoneToWhatsApp] = useState(false);
  const [phoneNumbersMatch, setPhoneNumbersMatch] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 获取选中的国家数据
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

  // 在组件加载时获取数据
  React.useEffect(() => {
    fetchSelectedCountry();
    if (route.params?.address) {      
      setFormData({
        ...route.params.address,
        receiver_phone_again: route.params.address.receiver_phone,
        is_default: Boolean(route.params.address.is_default),
      });
    }
  }, []);

  // 监听手机号码变化，如果勾选了复制选项则自动更新 WhatsApp 号码
  React.useEffect(() => {
    if (copyPhoneToWhatsApp) {
      setFormData((prev) => ({
        ...prev,
        whatsapp_phone: prev.receiver_phone,
      }));
    }
  }, [formData.receiver_phone, copyPhoneToWhatsApp]);

  // 监听手机号码变化，验证两次输入是否一致
  React.useEffect(() => {
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
      newErrors.receiver_first_name = "请输入名";
    }
    if (!formData.receiver_last_name) {
      newErrors.receiver_last_name = "请输入姓";
    }

    if (!formData.receiver_phone) {
      newErrors.receiver_phone = "请输入手机号码";
    }
    if (!formData.receiver_phone_again) {
      newErrors.receiver_phone_again = "请再次输入手机号码";
    }
    if (formData.receiver_phone !== formData.receiver_phone_again) {
      newErrors.receiver_phone_again = "两次输入的手机号码不一致";
    }
    if (!formData.whatsapp_phone) {
      newErrors.whatsapp_phone = "请输入WhatsApp号码";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      formData.country = selectedCountry.name;
       const data = {
        ...formData,
        country: value || '',
      }
      if (route.params?.address) {
        eventBus.emit("address-added", {
          ...formData,
          country: value || '',
          type: "edit",
        });
        navigation.goBack();
        await addressApi.updateAddress(data);
      } else {
        eventBus.emit("address-added", {
          ...formData,
          country: value || '',
          type: "add",
        });
        navigation.goBack();        
        await addressApi.postAddress(data);
      }
    }
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
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

                <Text style={styles.titleHeading}>新增收件人</Text>
              </View>
              <View style={styles.recipientInfoForm}>
                <Text style={styles.recipientInfoHeading}>
                  请输入收件人信息
                </Text>
                <View style={styles.contactFormContainer}>
                  {/* First Name Field */}
                  <View style={styles.formFieldContainer}>
                    <View style={styles.flexRowCentered}>
                      <Text style={styles.elegantTextSnippet}>名</Text>
                      <Text style={styles.redTextHeading}>*</Text>
                    </View>
                    <TextInput
                      style={styles.pingFangText}
                      placeholder="请输入名"
                      value={formData.receiver_first_name}
                      onChangeText={(text) =>
                        setFormData({ ...formData, receiver_first_name: text })
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
                      <Text style={styles.elegantTextSnippet}>姓</Text>
                      <Text style={styles.redAsteriskTextStyle}>*</Text>
                    </View>
                    <TextInput
                      style={styles.pingFangText}
                      placeholder="请输入姓"
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
                  {/* 国家 */}
                  <View style={styles.lastNameInputContainer}>
                    <View style={styles.flexRowCentered}>
                      <Text style={styles.elegantTextSnippet}>国家</Text>
                    </View>
                    <DropDownPicker
                      open={open}
                      value={value}
                      items={items}
                      setOpen={setOpen}
                      setValue={setValue}
                      setItems={setItems}
                      placeholder="请选择国家"
                      style={styles.dropdown}
                      dropDownContainerStyle={styles.dropdownContainer}
                      textStyle={styles.dropdownText}
                      labelStyle={styles.dropdownLabel}
                      maxHeight={300}
                      showArrowIcon={true}
                      arrowIconStyle={styles.arrowIcon}
                      placeholderStyle={styles.placeholderStyle}
                    />
                  </View>

                  {/* Phone Number Section */}
                  <View style={styles.formContainer}>
                    <View style={styles.verticalCenteredColumn}>
                      <View style={styles.lastNameInputContainer1}>
                        <View style={styles.flexRowCentered}>
                          <Text style={styles.elegantTextSnippet}>
                            手机号码
                          </Text>
                          <Text style={styles.redAsteriskTextStyle}>*</Text>
                        </View>
                        <TextInput
                          style={styles.pingFangText1}
                          placeholder="请输入手机号码"
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
                            再次输入手机号码
                          </Text>
                          <Text style={styles.redAsteriskTextStyle}>*</Text>
                        </View>
                        <TextInput
                          style={styles.pingFangText1}
                          placeholder="请再次输入手机号码"
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
                          两次输入的手机号码不一致
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* WhatsApp Field */}
                  <View style={styles.lastNameInputContainer}>
                    <View style={styles.flexRowCentered}>
                      <Text style={styles.elegantTextSnippet}>WhatsApp</Text>
                      <Text style={styles.redTextHeading}>*</Text>
                    </View>
                    <TextInput
                      style={styles.pingFangText}
                      placeholder="请输入WhatsApp号码"
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
                        复制手机号码到WhatsApp号码
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Default Setting Section */}
                  <View style={styles.defaultSettingSection}>
                    <Text style={styles.defaultTextDisplayStyle}>
                      设为默认
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
                  </View>
                </View>
              </View>

              {/* Submit Button */}
              <View style={styles.submitButtonContainer}>
                <TouchableOpacity
                  style={styles.primaryButtonStyle}
                  onPress={handleSubmit}
                >
                  <Text style={styles.buttonText}>提交</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContainer: {
    width: "100%",
  },
  recipientFormContainer3: {
    flex: 1,
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
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
    fontSize: 20,
    lineHeight: 22,
    fontFamily: "PingFang SC",
    color: "black",
  },
  recipientInfoForm: {
    marginTop: 35,
  },
  recipientInfoHeading: {
    padding: 0,
    margin: 0,
    fontWeight: "500",
    fontSize: 18,
    lineHeight: 22,
    fontFamily: "PingFang SC",
    color: "black",
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
    fontSize: 12,
    fontFamily: "PingFang SC",
    color: "#646472",
  },
  redTextHeading: {
    padding: 0,
    margin: 0,
    marginLeft: 1,
    fontWeight: "500",
    fontSize: 18,
    lineHeight: 22,
    fontFamily: "PingFang SC",
    color: "#fe1e00",
  },
  pingFangText: {
    padding: 0,
    margin: 0,
    marginTop: -2,
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 22,
    fontFamily: "PingFang SC",
    color: "#807e7e",
  },
  pingFangText1: {
    padding: 0,
    margin: 0,
    marginTop: -2,
    fontWeight: "400",
    fontSize: 16,
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
    fontSize: 14,
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
    fontSize: 18,
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
    fontSize: 14,
    fontFamily: "PingFang SC",
    color: "#807e7e",
  },
  mobilePhoneNumberLabel1: {
    padding: 0,
    margin: 0,
    fontWeight: "500",
    fontSize: 14,
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
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 16,
    color: "#333",
  },
  dropdownLabel: {
    fontSize: 16,
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
    fontSize: 16,
  },
  phoneNumberError: {
    borderColor: "#fe1e00",
  },
  errorText: {
    color: "#fe1e00",
    fontSize: 12,
    marginTop: 4,
    fontFamily: "PingFang SC",
  },
});
