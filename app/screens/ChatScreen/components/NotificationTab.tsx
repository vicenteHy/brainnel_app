import React, { useCallback } from "react";
import { View, FlatList, Text, StyleSheet, ActivityIndicator } from "react-native";
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
  // 渲染单个通知项
  const renderNotificationItem = useCallback(({ item }: { item: NotificationItemType }) => (
    <NotificationItem item={item} onMarkAsRead={onMarkAsRead} />
  ), [onMarkAsRead]);

  // 渲染加载更多指示器
  const renderFooter = useCallback(() => {
    if (!notificationLoading) {
      return null;
    }
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#ff5100" />
        <Text style={styles.loadingText}>
          {t("common.loading_more", "加载更多...")}
        </Text>
      </View>
    );
  }, [notificationLoading]);

  // 渲染空状态
  const renderEmptyComponent = useCallback(() => {
    if (notificationLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#ff5100" />
          <Text style={styles.emptyText}>
            {t("common.loading", "加载中...")}
          </Text>
        </View>
      );
    }
    
    if (!userLoggedIn) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {t("chat.login_required_title", "请先登录")}
          </Text>
          <Text style={styles.emptySubtext}>
            {t("chat.login_required_subtitle", "登录后查看通知")}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {t("chat.no_notifications", "暂无通知")}
        </Text>
        <Text style={styles.emptySubtext}>
          {t("chat.no_notifications_hint", "当有新通知时会显示在这里")}
        </Text>
      </View>
    );
  }, [notificationLoading, userLoggedIn]);

  // 处理加载更多
  const handleEndReached = useCallback(() => {
    if (userLoggedIn && !notificationLoading && notifications.length > 0) {
      onLoadMore();
    }
  }, [userLoggedIn, notificationLoading, notifications.length, onLoadMore]);

  return (
    <View style={styles.tabContent}>
      <View style={styles.notificationContainer}>
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={notificationKeyExtractor}
          contentContainerStyle={[
            styles.notificationList,
            notifications.length === 0 && styles.emptyContentContainer
          ]}
          showsVerticalScrollIndicator={true}
          scrollEnabled={userLoggedIn}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyComponent}
          style={styles.notificationFlatList}
          // 移除 inverted 属性，按正常顺序显示
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={15}
          getItemLayout={undefined}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    flexGrow: 1,
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  loadingText: {
    fontSize: customRF(14),
    color: "#666",
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: customRF(16),
    color: "#999",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: customRF(14),
    color: "#ccc",
    textAlign: "center",
    lineHeight: 20,
  },
  notificationFlatList: {
    flex: 1,
  },
});