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
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#eef0f1",
    paddingHorizontal: 10,
    borderRadius: 25,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 25,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "transparent",
  },
  activeTab: {
    backgroundColor: "#fff1ea",
  },
  tabText: {
    fontSize: customRF(14),
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
  },
  activeTabText: {
    color: "#ff5217",
    fontWeight: "600",
  },
  tabWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  unreadBadge: {
    backgroundColor: "#ff0000",
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 5,
  },
  unreadBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});