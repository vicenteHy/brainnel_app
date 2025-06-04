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
        activeOpacity={1}
      >
        <SendIcon />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    paddingTop: 16,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 16 : 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  sendButton: {
    backgroundColor: "#ff6b35",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ff6b35",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledInput: {
    opacity: 0.6,
  },
  disabledButton: {
    opacity: 0.6,
  },
});