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
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  SafeAreaView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { ResetPasswordModal } from "./ResetPasswordModal";
import fontSize from "../../utils/fontsizeUtils";

type VerificationCodeInputProps = {
  visible: boolean;
  onClose: () => void;
  phoneNumber?: string;
  onVerify: (code: string) => Promise<boolean>;
  onResend: () => Promise<void>;
  onResetPassword?: (password: string) => Promise<boolean>;
};

export const VerificationCodeInput = ({
  visible,
  onClose,
  phoneNumber = "",
  onVerify,
  onResend,
  onResetPassword = async () => true,
}: VerificationCodeInputProps) => {
  const { t } = useTranslation();
  
  // Single string to store the entire verification code
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeError, setIsCodeError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [resendActive, setResendActive] = useState(false);
  // New state for password reset modal
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  // Reference to the hidden input that will handle all keystrokes
  const hiddenInputRef = useRef<TextInput>(null);

  // Focus the hidden input whenever the component is visible
  useEffect(() => {
    if (visible) {
      startCountdown();
      setTimeout(() => {
        hiddenInputRef.current?.focus();
      }, 300);
    }
    return () => {
      // Reset states when component unmounts
      setVerificationCode("");
      setIsCodeError(false);
      setCountdown(60);
      setResendActive(false);
      setShowPasswordReset(false);
    };
  }, [visible]);

  // Function to focus the hidden input
  const focusInput = () => {
    hiddenInputRef.current?.focus();
  };

  // Function to start countdown
  const startCountdown = () => {
    setResendActive(false);
    setCountdown(60);
    
    const timer = setInterval(() => {
      setCountdown((prevCount) => {
        if (prevCount <= 1) {
          clearInterval(timer);
          setResendActive(true);
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  };

  // Handle code input change
  const handleCodeChange = (text: string) => {
    if (isCodeError) setIsCodeError(false);
    
    // Only accept digits and limit to 6 characters
    const cleanedText = text.replace(/[^0-9]/g, '').substring(0, 6);
    setVerificationCode(cleanedText);

    // Auto-submit if all 6 digits are entered
    if (cleanedText.length === 6) {
      Keyboard.dismiss();
      handleVerifyCode(cleanedText);
    }
  };

  // Handle verify code submission
  const handleVerifyCode = async (code: string) => {
    setLoading(true);
    try {
      const success = await onVerify(code);
      if (!success) {
        setIsCodeError(true);
      } else {
        // Instead of closing, show password reset modal
        setShowPasswordReset(true);
      }
    } catch (error) {
      setIsCodeError(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle resend code
  const handleResend = async () => {
    if (!resendActive) return;
    
    setIsResending(true);
    try {
      await onResend();
      startCountdown();
    } catch (error) {
      console.error("Failed to resend code:", error);
    } finally {
      setIsResending(false);
    }
  };

  // Handle password reset submission
  const handlePasswordReset = async (password: string) => {
    try {
      const success = await onResetPassword(password);
      if (success) {
        // Password reset was successful
        // The parent component already handles closing all modals
        setShowPasswordReset(false);
        // Note: Don't call onClose() here as the parent already does that
      }
      return success;
    } catch (error) {
      console.error("Failed to reset password:", error);
      return false;
    }
  };

  // Create an array representation of the code for display
  const codeArray = verificationCode.split('');
  while (codeArray.length < 6) {
    codeArray.push('');
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <View style={styles.modalContainer}>
        <View style={styles.verificationContainer}>
          <View style={styles.verificationHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t("login.verification.title")}</Text>
          </View>

          <View style={styles.verificationContent}>
            <Text style={styles.description}>
              {t("login.verification.description")} {phoneNumber}. {t("login.verification.expiration")}
            </Text>

            {/* Hidden input that captures all key presses */}
            <TextInput
              ref={hiddenInputRef}
              value={verificationCode}
              onChangeText={handleCodeChange}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.hiddenInput}
              caretHidden={true}
              autoFocus={visible}
            />

            {/* Touchable area to focus input when touched */}
            <TouchableWithoutFeedback onPress={focusInput}>
              <View style={styles.codeInputContainer}>
                {codeArray.map((digit, index) => (
                  <View
                    key={`code-box-${index}`}
                    style={[
                      styles.codeInput,
                      isCodeError && styles.codeInputError,
                      digit ? styles.codeInputFilled : {}
                    ]}
                  >
                    <Text style={styles.codeInputText}>{digit}</Text>
                  </View>
                ))}
              </View>
            </TouchableWithoutFeedback>

            {/* Error message */}
            {isCodeError && (
              <View style={styles.errorContainer}>
                <View style={styles.errorIconContainer}>
                  <Text style={styles.errorIcon}>!</Text>
                </View>
                <Text style={styles.errorText}>{t("login.verification.incorrect")}</Text>
              </View>
            )}

            {/* Resend button */}
            <View style={styles.resendContainer}>
              {isResending ? (
                <ActivityIndicator size="small" color="#0066FF" />
              ) : (
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={!resendActive}
                  style={[
                    styles.resendButton,
                    !resendActive && styles.resendButtonDisabled
                  ]}
                >
                  <Text style={[
                    styles.resendText,
                    !resendActive && styles.resendTextDisabled
                  ]}>
                    {resendActive
                      ? t("login.verification.resend")
                      : `${t("login.verification.resend")} (${countdown}s)`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Help section */}
            <View style={styles.helpContainer}>
              <Text style={styles.helpTitle}>{t("login.verification.didntReceive")}</Text>
              <View style={styles.helpItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.helpText}>
                  {t("login.verification.helpPoint1")}
                </Text>
              </View>
              <View style={styles.helpItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.helpText}>
                  {t("login.verification.helpPoint2")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Password Reset Modal */}
        <ResetPasswordModal
          visible={showPasswordReset}
          onClose={() => setShowPasswordReset(false)}
          onSubmit={handlePasswordReset}
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
  verificationContainer: {
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
  verificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  closeButton: {
    padding: 8,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: fontSize(18),
    color: "#000",
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginRight: 36,
  },
  verificationContent: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 50 : 30,
  },
  description: {
    fontSize: fontSize(14),
    color: "#333",
    marginBottom: 20,
    lineHeight: 20,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  codeInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    width: "100%",
  },
  codeInput: {
    width: '14%',
    height: 60,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeInputText: {
    fontSize: fontSize(24),
    fontWeight: "500",
  },
  codeInputError: {
    borderColor: "#FF3B30",
  },
  codeInputFilled: {
    borderColor: "#0066FF",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  errorIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  errorIcon: {
    color: "white",
    fontSize: fontSize(14),
    fontWeight: "bold",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: fontSize(14),
  },
  resendContainer: {
    alignItems: "flex-end",
    marginBottom: 30,
  },
  resendButton: {
    padding: 5,
  },
  resendButtonDisabled: {
    opacity: 0.7,
  },
  resendText: {
    color: "#0066FF",
    fontSize: fontSize(14),
    fontWeight: "500",
  },
  resendTextDisabled: {
    color: "#999",
  },
  helpContainer: {
    backgroundColor: "#F8F8F8",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  helpTitle: {
    fontSize: fontSize(16),
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  helpItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF9500",
    marginRight: 10,
  },
  helpText: {
    fontSize: fontSize(14),
    color: "#333",
    flex: 1,
  },
}); 