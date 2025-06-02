import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { SendIcon } from "./SendIcon";
import { t } from "../../../i18n";

interface ChatInputProps {
  inputText: string;
  onTextChange: (text: string) => void;
  onSend: () => void;
  userLoggedIn: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  onTextChange,
  onSend,
  userLoggedIn,
}) => {
  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={[styles.input, !userLoggedIn && styles.disabledInput]}
        value={inputText}
        onChangeText={userLoggedIn ? onTextChange : undefined}
        placeholder={t("chat.input_message")}
        multiline
        editable={userLoggedIn}
      />
      <TouchableOpacity
        style={[styles.sendButton, !userLoggedIn && styles.disabledButton]}
        onPress={userLoggedIn ? onSend : undefined}
        disabled={!userLoggedIn}
      >
        <SendIcon />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  disabledInput: {
    opacity: 0.6,
  },
  disabledButton: {
    opacity: 0.6,
  },
});