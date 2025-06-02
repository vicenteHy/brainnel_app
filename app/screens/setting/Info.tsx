import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Platform,
} from "react-native";
import useUserStore from "../../store/user";
import { t } from "../../i18n";
import BackIcon from "../../components/BackIcon";
import { useNavigation } from "@react-navigation/native";
import userApi from "../../services/api/userApi";

export const Info = () => {
  const { user } = useUserStore();
  const navigation = useNavigation();

  // 删除账号确认对话框
  const handleDeleteAccount = () => {
    Alert.alert(
      t("profile.delete_account"),
      t("profile.delete_account_warning"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.confirm"),
          style: "destructive",
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  // 确认删除账号
  const confirmDeleteAccount = () => {
    // TODO: 实现删除账号的逻辑
    userApi.deleteAccount();
    Alert.alert(
      t("profile.account_deleted"),
      t("profile.account_deleted_message"),
      [
        {
          text: t("common.ok"),
          onPress: () => {
            // 清除用户数据并返回登录页面
            // userStore.logout();
            // navigation.navigate('Login');
          },
        },
      ]
    );
  };

  // 如果用户未登录
  if (!user?.user_id) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* 头部导航栏 */}
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <BackIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t("settings.profile")}</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.notLoggedInContainer}>
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View
                style={[styles.avatarPlaceholder, { backgroundColor: "white" }]}
              ></View>
            )}
            <Text style={styles.notLoggedInText}>
              {t("profile.not_logged_in")}
            </Text>
            <Text style={styles.loginPrompt}>{t("profile.login_prompt")}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return t("profile.unknown");
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // 格式化VIP等级显示
  const getVipLevelText = (level: number) => {
    if (level === 0) return t("profile.regular_user");
    return `VIP ${level}`;
  };

  // 格式化余额显示
  const formatBalance = (balance: number, currency: string) => {
    if (!balance) return "0";
    return `${balance.toFixed(2)} ${currency || ""}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 头部导航栏 */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("settings.profile")}</Text>
        </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 头像和基本信息 */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {user.username?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.username}>
            {user.username || t("profile.not_set")}
          </Text>
          <Text style={styles.userId}>ID: {user.user_id}</Text>
          <View style={styles.vipBadge}>
            <Text style={styles.vipText}>
              {getVipLevelText(user.vip_level)}
            </Text>
          </View>
        </View>

        {/* 账户信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profile.account_info")}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("profile.email")}</Text>
            <Text style={styles.infoValue}>
              {user.email || t("profile.not_set")}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("profile.phone")}</Text>
            <Text style={styles.infoValue}>
              {user.phone
                ? `+${user.country_code || ""} ${user.phone}`
                : t("profile.not_set")}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("profile.country_region")}</Text>
            <Text style={styles.infoValue}>
              {user.country || user.country_en || t("profile.not_set")}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("profile.language")}</Text>
            <Text style={styles.infoValue}>
              {user.language || t("profile.not_set")}
            </Text>
          </View>
        </View>

        {/* 会员信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profile.vip_info")}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("profile.vip_level")}</Text>
            <Text style={styles.infoValue}>
              {getVipLevelText(user.vip_level)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("profile.vip_discount")}</Text>
            <Text style={styles.infoValue}>
              {user.vip_discount
                ? `${(user.vip_discount * 100).toFixed(1)}%`
                : t("profile.no_discount")}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("profile.points")}</Text>
            <Text style={styles.infoValue}>{user.points || 0}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {t("profile.next_level_points")}
            </Text>
            <Text style={styles.infoValue}>
              {user.next_level_points_threshold || t("profile.next_level_max")}
            </Text>
          </View>
        </View>

        {/* 财务信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("profile.account_balance")}
          </Text>

          <View style={styles.balanceContainer}>
            <Text style={styles.balanceAmount}>
              {formatBalance(user.balance, user.balance_currency)}
            </Text>
            <Text style={styles.balanceLabel}>
              {t("profile.available_balance")}
            </Text>
          </View>
        </View>

        {/* 时间信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profile.time_info")}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("profile.register_time")}</Text>
            <Text style={styles.infoValue}>{formatDate(user.create_time)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("profile.last_login")}</Text>
            <Text style={styles.infoValue}>{formatDate(user.last_login)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("profile.info_updated")}</Text>
            <Text style={styles.infoValue}>{formatDate(user.update_time)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.deleteButton, { alignItems: "center" }]}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteButtonText}>
            {t("profile.delete_account")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerContainer: {
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? 0 : 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    flex: 1,
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 10,
    textAlign: "center",
  },
  deleteButtonText: {
    fontSize: 14,
    color: "#ff4444",
    fontWeight: "500",
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  header: {
    backgroundColor: "#fff",
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 10,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholderText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#666",
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  userId: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  vipBadge: {
    backgroundColor: "#ff6b6b",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  notLoggedInText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 10,
    marginTop: 20,
  },
  loginPrompt: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  section: {
    backgroundColor: "#fff",
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f8f8",
  },
  infoLabel: {
    fontSize: 16,
    color: "#666",
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    flex: 2,
    textAlign: "right",
  },
  balanceContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 5,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#666",
  },
});
