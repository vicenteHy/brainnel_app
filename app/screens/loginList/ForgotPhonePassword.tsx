import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CountryList } from "../../constants/countries";
import { settingApi } from "../../services/api/setting";
import fontSize from "../../utils/fontsizeUtils";
import { getCountryTransLanguage } from "../../utils/languageUtils";

type ForgotPhonePasswordProps = {
  visible?: boolean;
  onClose?: () => void;
  selectedCountry?: CountryList;
  phoneNumber?: string;
};

export const ForgotPhonePassword = ({ 
  visible = true, 
  onClose = () => {}, 
  selectedCountry,
  phoneNumber = ""
}: ForgotPhonePasswordProps) => {
  const { t } = useTranslation();
  
  // States
  const [phoneNum, setPhoneNum] = useState(phoneNumber);
  const [phoneNumberError, setPhoneNumberError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryList, setCountryList] = useState<CountryList[]>([]);
  const [currentCountry, setCurrentCountry] = useState<CountryList | undefined>(selectedCountry);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCountryList, setFilteredCountryList] = useState<CountryList[]>([]);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Refs
  const phoneInputRef = useRef<TextInput>(null);
  const searchInputRef = useRef<TextInput>(null);

  // Load country data if not provided
  useEffect(() => {
    if (visible && !currentCountry) {
      loadCountryData();
    }
    
    if (visible && selectedCountry) {
      setCurrentCountry(selectedCountry);
    }
  }, [visible, selectedCountry]);

  // Focus phone input when modal opens
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        if (phoneInputRef.current) {
          phoneInputRef.current.focus();
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // Load country data
  const loadCountryData = async () => {
    try {
      const res = await settingApi.getSendSmsCountryList();
      setCountryList(res);
      setFilteredCountryList(res);
      
      const savedCountry = await AsyncStorage.getItem("@selected_country");
      if (savedCountry) {
        try {
          const parsedCountry = JSON.parse(savedCountry);
          const item = res.find(item => item.country === parsedCountry.country);
          if (item) {
            setCurrentCountry(item);
          } else if (res.length > 0) {
            setCurrentCountry(res[0]);
          }
        } catch (e) {
          console.error("Error parsing stored country", e);
          if (res.length > 0) {
            setCurrentCountry(res[0]);
          }
        }
      } else if (res.length > 0) {
        setCurrentCountry(res[0]);
      }
    } catch (error) {
      console.error("Failed to load country data", error);
    }
  };

  // Filter countries based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCountryList(countryList);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = countryList.filter(
        country => 
          country.name_en.toLowerCase().includes(query) ||
          country.country.toString().includes(query)
      );
      setFilteredCountryList(filtered);
    }
  }, [searchQuery, countryList]);

  // Focus search input when country modal opens
  useEffect(() => {
    if (showCountryModal && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [showCountryModal]);

  // Clear search when modal closes
  useEffect(() => {
    if (!showCountryModal) {
      setSearchQuery("");
    }
  }, [showCountryModal]);

  // Set initial phone number value if provided
  useEffect(() => {
    if (phoneNumber) {
      setPhoneNum(phoneNumber);
    }
  }, [phoneNumber]);

  // Handle country selection
  const handleCountrySelect = (country: CountryList) => {
    setCurrentCountry(country);
    setShowCountryModal(false);
    
    // Save selected country to AsyncStorage
    AsyncStorage.setItem("@selected_country", JSON.stringify(country));
    
    // Reset validation errors when country changes
    if (phoneNum) {
      setPhoneNumberError(!validatePhoneNumber(phoneNum, country));
    }
  };

  // Render country list item - with performance optimization
  const renderCountryItem = useCallback(
    ({ item }: { item: CountryList }) => (
      <TouchableOpacity
        style={styles.countryItem}
        onPress={() => handleCountrySelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.countryItemContent}>
          <Text style={styles.countryCode}>+{item.country}</Text>
          <Text style={[styles.countryName]}>{getCountryTransLanguage(item)}</Text>
        </View>
        {/* Add checkmark for selected country */}
        {currentCountry && currentCountry.country === item.country && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </TouchableOpacity>
    ),
    [currentCountry]
  );

  // Validate phone number
  const validatePhoneNumber = (phoneNum: string, country = currentCountry) => {
    if (!country || !country.valid_digits || country.valid_digits.length === 0) {
      return true; // No validation if no valid_digits available
    }
    
    return country.valid_digits.includes(phoneNum.length);
  };
  
  // Handle phone number change
  const handlePhoneNumberChange = (text: string) => {
    setPhoneNum(text);
    if (text.length > 0) {
      setPhoneNumberError(!validatePhoneNumber(text));
    } else {
      setPhoneNumberError(false);
    }
    setError(null);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validatePhoneNumber(phoneNum)) {
      setPhoneNumberError(true);
      return;
    }
    
    try {
      setLoading(true);
      // TODO: Replace with actual API call to send reset code
      // For example: await userApi.sendPhonePasswordResetCode({ phone: phoneNum, country: currentCountry?.country });
      
      // Log reset method
      console.log("Password reset method: Phone");
      try {
        // Store reset method in AsyncStorage or other storage
        await AsyncStorage.setItem("@password_reset_method", "phone");
      } catch (storageError) {
        console.error("Failed to store reset method:", storageError);
      }
      
      // Simulate API call success
      setTimeout(() => {
        setLoading(false);
        setShowVerificationModal(true);
      }, 1500);
    } catch (error) {
      setLoading(false);
      setError('Failed to send reset code. Please try again.');
    }
  };

  // Handle verification code submission
  const handleVerifyCode = async (code: string): Promise<boolean> => {
    // TODO: Replace with actual API call to verify code
    // For example: return await userApi.verifyPhonePasswordResetCode({ 
    //   phone: phoneNum, 
    //   country: currentCountry?.country,
    //   code: code 
    // });
    
    // Simulate verification for demo
    return new Promise((resolve) => {
      setTimeout(() => {
        // For demo: code "123456" is valid, others are invalid
        resolve(code === "123456");
      }, 1500);
    });
  };
  
  // Handle resend code
  const handleResendCode = async (): Promise<void> => {
    // TODO: Replace with actual API call to resend code
    // For example: await userApi.sendPhonePasswordResetCode({ 
    //   phone: phoneNum, 
    //   country: currentCountry?.country 
    // });
    
    // Simulate resend for demo
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1500);
    });
  };

  // Handle reset password
  const handleResetPassword = async (password: string): Promise<boolean> => {
    // TODO: Replace with actual API call to reset password
    // For example: return await userApi.resetPhonePassword({ 
    //   phone: phoneNum, 
    //   country: currentCountry?.country,
    //   password: password 
    // });
    
    // Simulate API call for demo
    return new Promise((resolve) => {
      setTimeout(() => {
        // On success, close this modal too
        if (onClose) onClose();
        resolve(true); // Always succeed for demo
      }, 1500);
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.forgotPasswordContainer}>
          <View style={styles.forgotPasswordHeader}>
            <TouchableOpacity
              style={styles.forgotPasswordCloseButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordCloseButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.forgotPasswordTitle}>{t("login.forgotPassword.title")}</Text>
          </View>

          <View style={styles.forgotPasswordContent}>
            <Text style={styles.forgotPasswordDescription}>
              {t("login.forgotPassword.phoneDescription")}
            </Text>

            <View style={styles.phoneInputContainer}>
              <TouchableOpacity
                style={styles.countryCodeButton}
                onPress={() => setShowCountryModal(true)}
              >
                <Text style={styles.countryCodeText}>
                  +{currentCountry?.country || ''}
                </Text>
                <Text style={styles.countryCodeArrow}>▼</Text>
              </TouchableOpacity>
              
              <View style={styles.phoneInputDivider} />
              
              <TextInput
                ref={phoneInputRef}
                style={styles.phoneInput}
                placeholder={t("phoneNumber")}
                value={phoneNum}
                onChangeText={handlePhoneNumberChange}
                keyboardType="phone-pad"
                autoFocus
                maxLength={15}
              />
              
              {phoneNum.length > 0 && (
                <TouchableOpacity
                  style={styles.phoneClearButton}
                  onPress={() => {
                    setPhoneNum("");
                    setPhoneNumberError(false);
                    setError(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.phoneClearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {phoneNumberError && (
              <Text style={styles.phoneNumberErrorText}>
                {t("login.forgotPassword.invalidPhone")} 
                {currentCountry?.valid_digits && 
                  `(${t("login.forgotPassword.requiresDigits")}: ${currentCountry.valid_digits.join(', ')})`}
              </Text>
            )}

            {error && (
              <Text style={styles.errorText}>
                {error}
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!phoneNum.trim() || phoneNumberError) && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={!phoneNum.trim() || phoneNumberError || loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {t("login.forgotPassword.submit")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Country selection modal */}
        <Modal
          visible={showCountryModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCountryModal(false)}
          hardwareAccelerated={true}
          statusBarTranslucent={true}
          presentationStyle="overFullScreen"
        >
          <View style={styles.countryModalContainer}>
            <TouchableOpacity
              style={styles.countryModalOverlay}
              activeOpacity={1}
              onPress={() => setShowCountryModal(false)}
            />
            <View style={styles.countryModalContent}>
              <View style={styles.modalHandleContainer}>
                <View style={styles.modalHandle} />
              </View>
              <View style={styles.countryModalHeader}>
                <TouchableOpacity
                  style={styles.countryModalCloseButton}
                  onPress={() => setShowCountryModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.countryModalCloseButtonText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.countryModalTitle}>
                  {t("selectCountry")}
                </Text>
              </View>
              
              {/* Country search input */}
              <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    ref={searchInputRef}
                    style={styles.searchInput}
                    placeholder={t("searchCountry")}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    clearButtonMode="while-editing"
                    autoCapitalize="none"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      style={styles.searchClearButton}
                      onPress={() => setSearchQuery("")}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.searchClearButtonText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <FlatList
                data={filteredCountryList}
                renderItem={renderCountryItem}
                keyExtractor={(item) => item.country.toString()}
                style={styles.countryList}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={10}
                getItemLayout={(data, index) => ({
                  length: 69,
                  offset: 69 * index,
                  index,
                })}
                ListEmptyComponent={() => (
                  <View style={styles.emptyResultContainer}>
                    <Text style={styles.emptyResultText}>{t("noCountriesFound")}</Text>
                  </View>
                )}
              />
            </View>
          </View>
        </Modal>
        
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    zIndex: 9999,
  },
  forgotPasswordContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  forgotPasswordHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  forgotPasswordCloseButton: {
    padding: 8,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  forgotPasswordCloseButtonText: {
    fontSize: fontSize(18),
    color: "#000",
  },
  forgotPasswordTitle: {
    flex: 1,
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginRight: 36,
  },
  forgotPasswordContent: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 50 : 30,
  },
  forgotPasswordDescription: {
    fontSize: fontSize(14),
    color: "#333",
    marginBottom: 20,
    lineHeight: 20,
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E1E1E1",
    borderRadius: 25,
    height: 50,
    marginBottom: 20,
    position: "relative",
  },
  countryCodeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: "100%",
    minWidth: 80,
    justifyContent: "space-between",
  },
  countryCodeText: {
    fontSize: fontSize(15),
    color: "#333",
  },
  countryCodeArrow: {
    fontSize: fontSize(10),
    color: "#666",
    marginLeft: 4,
  },
  phoneInputDivider: {
    width: 1,
    height: "60%",
    backgroundColor: "#E1E1E1",
  },
  phoneInput: {
    flex: 1,
    height: "100%",
    paddingLeft: 10,
    paddingRight: 36,
    fontSize: fontSize(16),
  },
  phoneClearButton: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -12 }],
    height: 24,
    width: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  phoneClearButtonText: {
    fontSize: fontSize(16),
    color: "#999",
    fontWeight: "500",
    textAlign: "center",
  },
  phoneNumberErrorText: {
    color: "#FF3B30",
    fontSize: fontSize(14),
    marginTop: -12,
    marginBottom: 16,
    paddingHorizontal: 5,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: fontSize(14),
    marginTop: -12,
    marginBottom: 16,
    paddingHorizontal: 5,
  },
  submitButton: {
    height: 50,
    backgroundColor: "#0039CB",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: fontSize(16),
    fontWeight: "600",
  },
  // Country modal styles
  countryModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    zIndex: 999,
  },
  countryModalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  countryModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "80%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  modalHandleContainer: {
    width: "100%",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  countryModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  countryModalCloseButton: {
    padding: 4,
  },
  countryModalCloseButtonText: {
    fontSize: fontSize(18),
    color: "#999",
  },
  countryModalTitle: {
    flex: 1,
    fontSize: fontSize(18),
    fontWeight: "600",
    textAlign: "center",
    marginRight: 24,
  },
  countryList: {
    padding: 8,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  countryItemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  countryName: {
    fontSize: fontSize(16),
    color: "#333",
    marginLeft: 10,
  },
  countryCode: {
    fontSize: fontSize(15),
    color: "#666",
    width: 40,
    textAlign: "center",
  },
  checkmark: {
    fontSize: fontSize(20),
    color: "#0066FF",
    fontWeight: "bold",
    marginRight: 10,
  },
  // Search styles
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    position: "relative",
  },
  searchIcon: {
    fontSize: fontSize(16),
    marginRight: 8,
    color: "#999",
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: fontSize(15),
    color: "#333",
    paddingRight: 30,
  },
  searchClearButton: {
    position: "absolute",
    right: 12,
    height: 20,
    width: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  searchClearButtonText: {
    fontSize: fontSize(14),
    color: "#999",
    fontWeight: "500",
  },
  emptyResultContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyResultText: {
    fontSize: fontSize(16),
    color: "#999",
    textAlign: "center",
  },
});
