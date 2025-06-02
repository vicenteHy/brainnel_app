import AsyncStorage from "@react-native-async-storage/async-storage";
import { Message, ProductInquiry } from "../types";

export const saveChatMessages = async (
  messages: Message[],
  type: "customer" | "product"
): Promise<void> => {
  try {
    if (type === "product") {
      return;
    }
    
    const latestMessages = messages.slice(-10);
    const key = "@customer_chat_messages";
    await AsyncStorage.setItem(key, JSON.stringify(latestMessages));
  } catch (error) {
    console.error(`Error saving ${type} chat messages:`, error);
  }
};

export const loadChatMessages = async (type: "customer" | "product"): Promise<Message[]> => {
  try {
    if (type === "product") {
      return [];
    }
    
    const key = "@customer_chat_messages";
    const savedMessages = await AsyncStorage.getItem(key);
    if (savedMessages) {
      const messages = JSON.parse(savedMessages);
      return messages.map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      }));
    }
    return [];
  } catch (error) {
    console.error(`Error loading ${type} chat messages:`, error);
    return [];
  }
};

export const loadProductInquiries = async (): Promise<ProductInquiry[]> => {
  try {
    const key = "@product_inquiries";
    const savedInquiries = await AsyncStorage.getItem(key);
    if (savedInquiries) {
      return JSON.parse(savedInquiries);
    }
    return [];
  } catch (error) {
    console.error("Error loading product inquiries:", error);
    return [];
  }
};

export const getCountryFromStorage = async (): Promise<string> => {
  try {
    const selectedCountry = await AsyncStorage.getItem("@selected_country");
    if (selectedCountry) {
      const countryData = JSON.parse(selectedCountry);
      return countryData.name_en || "";
    }
    return "";
  } catch (error) {
    console.error("Error getting country data:", error);
    return "";
  }
};