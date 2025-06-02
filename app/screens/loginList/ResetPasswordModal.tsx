import React, { useState } from "react";
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
} from "react-native";
import { useTranslation } from "react-i18next";
import fontSize from "../../utils/fontsizeUtils";

type ResetPasswordModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (password: string) => Promise<boolean>;
};

export const ResetPasswordModal = ({
  visible,
  onClose,
  onSubmit,
}: ResetPasswordModalProps) => {
  const { t } = useTranslation();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [loading, setLoading] = useState(false);

  const validatePassword = () => {
    let isValid = true;
    
    // Reset errors
    setPasswordError("");
    setConfirmError("");
    
    // Validate password
    if (!password) {
      setPasswordError(t("login.resetPassword.required"));
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError(t("login.resetPassword.minLength"));
      isValid = false;
    }
    
    // Validate password confirmation
    if (!confirmPassword) {
      setConfirmError(t("login.resetPassword.confirmRequired"));
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmError(t("login.resetPassword.mismatch"));
      isValid = false;
    }
    
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validatePassword()) {
      return;
    }
    
    setLoading(true);
    try {
      const success = await onSubmit(password);
      if (success) {
        // Password was reset successfully
        setPassword("");
        setConfirmPassword("");
        onClose();
      } else {
        // Handle failed submission
        setPasswordError(t("login.resetPassword.failed"));
      }
    } catch (error) {
      setPasswordError(t("login.resetPassword.error"));
    } finally {
      setLoading(false);
    }
  };

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
        <View style={styles.passwordContainer}>
          <View style={styles.passwordHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t("login.resetPassword.title")}</Text>
          </View>

          <View style={styles.passwordContent}>
            {/* Password input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, passwordError ? styles.inputError : null]}
                placeholder={t("login.resetPassword.enterPassword")}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError("");
                }}
                secureTextEntry={true}
                autoCapitalize="none"
              />
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
            </View>

            {/* Confirm password input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, confirmError ? styles.inputError : null]}
                placeholder={t("login.resetPassword.confirmPassword")}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (confirmError) setConfirmError("");
                }}
                secureTextEntry={true}
                autoCapitalize="none"
              />
              {confirmError ? (
                <Text style={styles.errorText}>{confirmError}</Text>
              ) : null}
            </View>

            {/* Submit button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>{t("login.resetPassword.submit")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
  passwordContainer: {
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
  passwordHeader: {
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
  passwordContent: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: Platform.OS === "ios" ? 50 : 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    borderRadius: 25,
    paddingHorizontal: 16,
    fontSize: fontSize(16),
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: fontSize(14),
    marginTop: 5,
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
  submitButtonText: {
    color: "#fff",
    fontSize: fontSize(16),
    fontWeight: "600",
  },
}); 