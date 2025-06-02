import React from "react";
import { View, FlatList, Text, StyleSheet } from "react-native";
import customRF from "../../../utils/customRF";
import { NotificationItem } from "./NotificationItem";
import { NotificationItem as NotificationItemType } from "../../../services/api/chat";
import { t } from "../../../i18n";

interface NotificationTabProps {
  notifications: NotificationItemType[];
  notificationKeyExtractor: (item: NotificationItemType, index: number) => string;
  onMarkAsRead: (messageId: number) => void;
  onLoadMore: () => void;
  notificationLoading: boolean;
  userLoggedIn: boolean;
}

export const NotificationTab: React.FC<NotificationTabProps> = ({
  notifications,
  notificationKeyExtractor,
  onMarkAsRead,
  onLoadMore,
  notificationLoading,
  userLoggedIn,
}) => {
  const renderNotificationHeader = () => {
    if (notificationLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {t("common.loading_more", "加载更多...")}
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.tabContent}>
      <View style={styles.notificationContainer}>
        <FlatList
          data={notifications}
          renderItem={({ item }) => (
            <NotificationItem item={item} onMarkAsRead={onMarkAsRead} />
          )}
          keyExtractor={notificationKeyExtractor}
          contentContainerStyle={styles.notificationList}
          showsVerticalScrollIndicator={true}
          scrollEnabled={userLoggedIn}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={renderNotificationHeader}
          style={styles.notificationFlatList}
          inverted={true}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
  },
  notificationContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  notificationList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: customRF(14),
    color: "#666",
  },
  notificationFlatList: {
    flex: 1,
  },
});