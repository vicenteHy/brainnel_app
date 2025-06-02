import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { VerificationCodeInput } from "./VerificationCodeInput";
import fontSize from "../../utils/fontsizeUtils";

type ForgotEmailPasswordProps = {
  visible?: boolean;
  onClose?: () => void;
  email?: string;
};

export const ForgotEmailPassword = ({ 
  visible = true, 
  onClose = () => {}, 
  email = ""
}: ForgotEmailPasswordProps) => {
  const { t } = useTranslation();
  
  // States
  const [userEmail, setUserEmail] = useState(email);
  const [emailError, setEmailError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  
  // Refs
  const emailInputRef = useRef<TextInput>(null);
  
  // Focus email input when modal opens
  useEffect(() => {
    if (visible && !email) {
      const timer = setTimeout(() => {
        if (emailInputRef.current) {
          emailInputRef.current.focus();
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [visible, email]);
  
  // Set initial email value if provided
  useEffect(() => {
    if (email) {
      setUserEmail(email);
    }
  }, [email]);
  
  // Validate email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Handle email change
  const handleEmailChange = (text: string) => {
    setUserEmail(text);
    if (text) {
      setEmailError(!validateEmail(text));
    } else {
      setEmailError(false);
    }
    setError(null);
  };
  
  // Handle submit
  const handleSubmit = async () => {
    if (!validateEmail(userEmail)) {
      setEmailError(true);
      return;
    }
    
    try {
      setLoading(true);
      // TODO: Replace with actual API call to send reset code
      // For example: await userApi.sendEmailPasswordResetCode({ email: userEmail });
      
      // Log reset method
      console.log("Password reset method: Email");
      try {
        // Store reset method in AsyncStorage or other storage
        await AsyncStorage.setItem("@password_reset_method", "email");
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
    // For example: return await userApi.verifyEmailPasswordResetCode({ 
    //   email: userEmail,
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
    // For example: await userApi.sendEmailPasswordResetCode({ 
    //   email: userEmail
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
    // For example: return await userApi.resetEmailPassword({ 
    //   email: userEmail,
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
              {t("login.forgotPassword.emailDescription")}
            </Text>

            <View style={styles.emailInputContainer}>
              <TextInput
                ref={emailInputRef}
                style={styles.emailInput}
                placeholder={t("email")}
                value={userEmail}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={!email}
              />
              
              {userEmail.length > 0 && (
                <TouchableOpacity
                  style={styles.emailClearButton}
                  onPress={() => {
                    setUserEmail("");
                    setEmailError(false);
                    setError(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emailClearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {emailError && (
              <Text style={styles.emailErrorText}>
                {t("login.forgotPassword.invalidEmail")}
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
                (!userEmail.trim() || emailError) && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={!userEmail.trim() || emailError || loading}
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
        
        {/* Verification Code Modal */}
        <VerificationCodeInput 
          visible={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          phoneNumber={userEmail} // We're using phoneNumber prop for email too
          onVerify={handleVerifyCode}
          onResend={handleResendCode}
          onResetPassword={handleResetPassword}
        />
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
  emailInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E1E1E1",
    borderRadius: 25,
    height: 50,
    marginBottom: 20,
    position: "relative",
  },
  emailInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    fontSize: fontSize(16),
    paddingRight: 36,
  },
  emailClearButton: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -12 }],
    height: 24,
    width: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  emailClearButtonText: {
    fontSize: fontSize(16),
    color: "#999",
    fontWeight: "500",
    textAlign: "center",
  },
  emailErrorText: {
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
}); 