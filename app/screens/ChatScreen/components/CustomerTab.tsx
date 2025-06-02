import React from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { MessageItem } from "./MessageItem";
import { Message } from "../types";

interface CustomerTabProps {
  messages: Message[];
  keyExtractor: (item: Message, index: number) => string;
  flatListRef: React.RefObject<FlatList>;
  userLoggedIn: boolean;
}

export const CustomerTab: React.FC<CustomerTabProps> = ({
  messages,
  keyExtractor,
  flatListRef,
  userLoggedIn,
}) => {
  return (
    <View style={styles.tabContent}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => <MessageItem item={item} />}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        scrollEnabled={userLoggedIn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
  },
  messageList: {
    padding: 10,
  },
});