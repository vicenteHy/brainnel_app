import React from "react";
import { View, Text, StyleSheet, Linking } from "react-native";
import customRF from "../../../utils/customRF";
import { Message } from "../types";
import { formatTime } from "../utils/formatters";

interface MessageItemProps {
  item: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ item }) => {
  // 将文本中的 URL 转成可点击链接
  const renderMessageText = (text: string) => {
    const parts = text.split(/(https?:\/\/[^\s]+)/g);
    return parts.map((part, idx) => {
      const isUrl = /^https?:\/\//.test(part);
      if (isUrl) {
        return (
          <Text
            key={idx}
            style={[styles.messageText, styles.linkText]}
            onPress={() => Linking.openURL(part)}
          >
            {part}
          </Text>
        );
      }
      return (
        <Text key={idx} style={styles.messageText}>
          {part}
        </Text>
      );
    });
  };

  return (
    <View
      style={[
        styles.messageContainer,
        item.isMe ? styles.myMessage : styles.theirMessage,
      ]}
    >
      <Text style={styles.messageText}>{renderMessageText(item.text)}</Text>
      <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#ffece0",
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "white",
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
    alignSelf: "flex-end",
    marginTop: 5,
  },
  linkText: {
    color: "#007AFF",
    textDecorationLine: "underline",
  },
});