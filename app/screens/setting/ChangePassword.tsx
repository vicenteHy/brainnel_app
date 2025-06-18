import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../navigation/types";
import BackIcon from "../../components/BackIcon";
import Toast from "react-native-toast-message";
import { userApi } from "../../services/api/userApi";
import fontSize from "../../utils/fontsizeUtils";

export const ChangePassword = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  
  // 状态管理
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 错误状态
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // 验证输入
  const validateInputs = () => {
    let isValid = true;
    
    // 重置错误
    setCurrentPasswordError("");
    setNewPasswordError("");
    setConfirmPasswordError("");
    
    // 验证当前密码
    if (!currentPassword.trim()) {
      setCurrentPasswordError(t("settings.changePassword.currentPasswordRequired"));
      isValid = false;
    }
    
    // 验证新密码
    if (!newPassword.trim()) {
      setNewPasswordError(t("settings.changePassword.newPasswordRequired"));
      isValid = false;
    } else if (newPassword === currentPassword) {
      setNewPasswordError(t("settings.changePassword.samePassword"));
      isValid = false;
    }
    
    // 验证确认密码
    if (!confirmPassword.trim()) {
      setConfirmPasswordError(t("settings.changePassword.confirmPasswordRequired"));
      isValid = false;
    } else if (confirmPassword !== newPassword) {
      setConfirmPasswordError(t("settings.changePassword.passwordMismatch"));
      isValid = false;
    }
    
    return isValid;
  };

  // 处理密码修改
  const handleChangePassword = async () => {
    if (!validateInputs()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await userApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      
      // 成功提示
      Toast.show({
        type: 'success',
        text1: t("settings.changePassword.successTitle"),
        text2: t("settings.changePassword.successMessage"),
        visibilityTime: 3000,
      });
      
      // 清空输入框
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // 延迟返回上一页
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
      
    } catch (error: any) {
      console.error('修改密码失败:', error);
      
      // 错误提示
      let errorMessage = t("settings.changePassword.errorMessage");
      if (error?.response?.status === 400) {
        errorMessage = t("settings.changePassword.currentPasswordIncorrect");
        setCurrentPasswordError(t("settings.changePassword.currentPasswordIncorrect"));
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Toast.show({
        type: 'error',
        text1: t("settings.changePassword.errorTitle"),
        text2: errorMessage,
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // 检查表单是否有效
  const isFormValid = currentPassword.trim() && 
                     newPassword.trim() && 
                     confirmPassword.trim() && 
                     newPassword === confirmPassword &&
                     newPassword !== currentPassword;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* 标题栏 */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("settings.changePassword.title")}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 当前密码 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("settings.changePassword.currentPassword")}</Text>
            <View style={[styles.inputContainer, currentPasswordError ? styles.inputError : null]}>
              <TextInput
                style={styles.input}
                placeholder={t("settings.changePassword.currentPasswordPlaceholder")}
                placeholderTextColor="#999"
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                  setCurrentPasswordError("");
                }}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {currentPasswordError ? (
              <Text style={styles.errorText}>{currentPasswordError}</Text>
            ) : null}
          </View>

          {/* 新密码 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("settings.changePassword.newPassword")}</Text>
            <View style={[styles.inputContainer, newPasswordError ? styles.inputError : null]}>
              <TextInput
                style={styles.input}
                placeholder={t("settings.changePassword.newPasswordPlaceholder")}
                placeholderTextColor="#999"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  setNewPasswordError("");
                }}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {newPasswordError ? (
              <Text style={styles.errorText}>{newPasswordError}</Text>
            ) : null}
          </View>

          {/* 确认新密码 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("settings.changePassword.confirmPassword")}</Text>
            <View style={[styles.inputContainer, confirmPasswordError ? styles.inputError : null]}>
              <TextInput
                style={styles.input}
                placeholder={t("settings.changePassword.confirmPasswordPlaceholder")}
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setConfirmPasswordError("");
                }}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {confirmPasswordError ? (
              <Text style={styles.errorText}>{confirmPasswordError}</Text>
            ) : null}
          </View>

          {/* 确认按钮 */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isFormValid || loading) && styles.submitButtonDisabled
            ]}
            onPress={handleChangePassword}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>{t("settings.changePassword.submitButton")}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: fontSize(16),
    fontWeight: "500",
    color: "#333333",
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fafafa",
  },
  inputError: {
    borderColor: "#ff3b30",
    backgroundColor: "#fff5f5",
  },
  input: {
    height: 50,
    fontSize: fontSize(16),
    color: "#333333",
  },
  errorText: {
    fontSize: fontSize(14),
    color: "#ff3b30",
    marginTop: 6,
    marginLeft: 4,
  },
  submitButton: {
    height: 50,
    backgroundColor: "#FF5100",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 32,
  },
  submitButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  submitButtonText: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "#ffffff",
  },
});