import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import customRF from "../../../utils/customRF";
import { NotificationItem as NotificationItemType } from "../../../services/api/chat";
import useUserStore from "../../../store/user";

interface NotificationItemProps {
  item: NotificationItemType;
  onMarkAsRead: (messageId: number) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ 
  item, 
  onMarkAsRead 
}) => {
  const { user } = useUserStore();

  return (
    <TouchableOpacity
      style={styles.notificationItem}
      onPress={() => onMarkAsRead(item.notification_id)}
      disabled={!user.user_id}
    >
      <View
        style={[
          styles.notificationDot,
          item.is_read && styles.notificationDotRead,
        ]}
      />
      <View style={styles.notificationContent}>
        <View style={styles.notificationTitleContainer}>
          {item.icon && (
            <Image
              source={{ uri: item.icon }}
              style={styles.notificationIcon}
              resizeMode="cover"
              onError={() =>
                console.log("Failed to load notification icon:", item.icon)
              }
            />
          )}
          <Text style={styles.notificationItemTitle}>{item.title}</Text>
        </View>
        <Text style={styles.notificationItemDesc}>{item.content}</Text>
        <Text style={styles.notificationTime}>
          {new Date(item.sent_time).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  notificationItem: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notificationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ff0000",
    marginRight: 15,
    marginTop: 5,
  },
  notificationDotRead: {
    backgroundColor: "#007a6d",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  notificationIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: "#f0f0f0",
  },
  notificationItemTitle: {
    fontSize: customRF(16),
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  notificationItemDesc: {
    fontSize: customRF(14),
    color: "#666",
    lineHeight: 20,
    marginBottom: 5,
  },
  notificationTime: {
    fontSize: customRF(12),
    color: "#999",
    alignSelf: "flex-end",
  },
});