import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import customRF from "../../../utils/customRF";
import { TabType } from "../types";
import { t } from "../../../i18n";

interface TabBarProps {
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
  unreadCount: number;
  userLoggedIn: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onTabPress,
  unreadCount,
  userLoggedIn,
}) => {
  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === "customer" && styles.activeTab,
        ]}
        onPress={() => userLoggedIn && onTabPress("customer")}
        disabled={!userLoggedIn}
        activeOpacity={1}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "customer" && styles.activeTabText,
          ]}
          numberOfLines={1}
        >
          {t("chat.customer_service")}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === "product" && styles.activeTab,
        ]}
        onPress={() => userLoggedIn && onTabPress("product")}
        disabled={!userLoggedIn}
        activeOpacity={1}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "product" && styles.activeTabText,
          ]}
          numberOfLines={1}
        >
          {t("chat.product_support")}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === "notification" && styles.activeTab,
        ]}
        onPress={() => userLoggedIn && onTabPress("notification")}
        disabled={!userLoggedIn}
        activeOpacity={1}
      >
        <View style={styles.tabWithBadge}>
          <Text
            style={[
              styles.tabText,
              activeTab === "notification" && styles.activeTabText,
            ]}
            numberOfLines={1}
          >
            {t("chat.notifications")}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    justifyContent: "space-around",
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "transparent",
    flex: 1,
    marginHorizontal: -4,
  },
  activeTab: {
    backgroundColor: "#ff6b35",
    borderWidth: 1,
    borderColor: "#ff6b35",
    borderRadius: 16,
  },
  tabText: {
    fontSize: customRF(13),
    color: "black",
    fontWeight: "400",
    textAlign: "center",
  },
  activeTabText: {
    color: "white",
    fontWeight: "600",
  },
  tabWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadge: {
    backgroundColor: "#ff4757",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
    minWidth: 18,
    alignItems: "center",
  },
  unreadBadgeText: {
    color: "white",
    fontSize: customRF(10),
    fontWeight: "600",
  },
});