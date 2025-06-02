import React from "react";
import { View, Text, StyleSheet } from "react-native";
import customRF from "../../../utils/customRF";
import { Message } from "../types";
import { formatTime } from "../utils/formatters";

interface MessageItemProps {
  item: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ item }) => {
  return (
    <View
      style={[
        styles.messageContainer,
        item.isMe ? styles.myMessage : styles.theirMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
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
});