import { useState, useEffect, useRef } from "react";
import { FlatList } from "react-native";
import { chatService } from "../../../services/api/chat";
import useUserStore from "../../../store/user";
import { Message } from "../types";
import { saveChatMessages, loadChatMessages, getCountryFromStorage } from "../utils/storage";
import { t } from "../../../i18n";

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [country, setCountry] = useState<string>("");
  const { user } = useUserStore();
  const flatListRef = useRef<FlatList<any>>(null);

  useEffect(() => {
    if (messages.length > 0 && user.user_id) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    const getCountry = async () => {
      if (user.user_id) {
        const countryName = await getCountryFromStorage();
        setCountry(countryName);
      }
    };
    getCountry();
  }, [user.user_id]);

  useEffect(() => {
    if (user.user_id) {
      const loadMessages = async () => {
        const savedMessages = await loadChatMessages("customer");
        setMessages(savedMessages);
      };
      loadMessages();
    }
  }, [user.user_id]);

  useEffect(() => {
    if (user.user_id && messages.length > 0) {
      saveChatMessages(messages, "customer");
    }
  }, [messages, user.user_id]);

  const sendMessage = () => {
    if (!user.user_id || inputText.trim() === "") return;

    const newMessage: Message = {
      mimetype: "text/plain",
      userWs: "unknown",
      app_id: user.user_id ? user.user_id.toString() : "",
      country: user.country_code || 0,
      body: "",
      text: inputText,
      type: "text",
      isMe: true,
      timestamp: new Date(),
      id: Date.now().toString(),
    };

    const chatServiceMessage = {
      type: newMessage.type,
      mimetype: newMessage.mimetype,
      userWs: newMessage.userWs,
      app_id: newMessage.app_id,
      country: (user.country_code || 0).toString(),
      body: newMessage.body,
      text: newMessage.text,
    };

    setMessages((prevMessages) => {
      const newMessages = [...prevMessages, newMessage];
      return newMessages.slice(-10);
    });
    setInputText("");

    const data = {
      newMessage: chatServiceMessage,
    };

    chatService
      .sendMessage(data)
      .then((response) => {
        const realResponse: Message = {
          mimetype: "text/plain",
          userWs: "system",
          app_id: "system",
          country: user.country_code || 0,
          body: "",
          text: response?.reply || t("chat.default_response"),
          type: "chat",
          isMe: false,
          timestamp: new Date(),
          id: `real-${Date.now()}`,
        };

        setMessages((prevMessages) => {
          const newMessages = [...prevMessages, realResponse];
          return newMessages.slice(-10);
        });
      })
      .catch((error) => {
        console.error("Chat API error:", error);
        const errorResponse: Message = {
          mimetype: "text/plain",
          userWs: "system",
          app_id: "system",
          country: user.country_code || 0,
          body: "",
          text: t("chat.error_response"),
          type: "chat",
          isMe: false,
          timestamp: new Date(),
          id: `error-${Date.now()}`,
        };

        setMessages((prevMessages) => {
          return [...prevMessages, errorResponse];
        });
      });
  };

  const keyExtractor = (item: Message, index: number): string => {
    return item.id || index.toString();
  };

  return {
    messages,
    inputText,
    setInputText,
    country,
    sendMessage,
    keyExtractor,
    flatListRef,
  };
};