import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
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
        style={styles.tab}
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
        {activeTab === "customer" && <View style={styles.underline} />}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.tab}
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
        {activeTab === "product" && <View style={styles.underline} />}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.tab}
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
        {activeTab === "notification" && <View style={styles.underline} />}
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
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: "transparent",
    flex: 1,
    position: "relative",
  },
  tabText: {
    fontSize: Platform.OS === 'android' ? customRF(11 * 1.2) : customRF(11),
    color: "#666666",
    fontWeight: "400",
    textAlign: "center",
  },
  activeTabText: {
    color: "#000000",
    fontWeight: "700",
  },
  underline: {
    position: "absolute",
    bottom: 0,
    left: "20%",
    right: "20%",
    height: 2,
    backgroundColor: "#000000",
    borderRadius: 1,
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