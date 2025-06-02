import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { styles } from "../styles";
import { t } from "../../../i18n";

interface LoginOverlayProps {
  user_id: string | null;
  onGoToLogin: () => void;
}

export const LoginOverlay: React.FC<LoginOverlayProps> = ({
  user_id,
  onGoToLogin,
}) => {
  if (user_id) return null;

  return (
    <View style={styles.loginOverlay}>
      <View style={styles.blurContainer}>
        <View style={styles.loginPromptContainer}>
          <View style={styles.loginIcon}>
            <Text style={styles.loginIconText}>🔒</Text>
          </View>
          <Text style={styles.loginPromptTitle}>
            {t("cart.login_required_title", "请先登录")}
          </Text>
          <Text style={styles.loginPromptSubtitle}>
            {t(
              "cart.login_required_subtitle",
              "登录后即可使用购物车功能"
            )}
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={onGoToLogin}
          >
            <Text style={styles.loginButtonText}>
              {t("cart.login_now", "立即登录")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};