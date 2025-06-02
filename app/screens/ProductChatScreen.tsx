import React, { useState, useEffect, useRef } from "react";
import customRF from "../utils/customRF";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  ImageBackground,
  StatusBar,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { chatService } from "../services/api/chat";
import useUserStore from "../store/user";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { t } from "../i18n";
import BackIcon from "../components/BackIcon";

interface Message {
  id?: string;
  mimetype: string;
  userWs: string;
  app_id: string;
  country: number;
  body: string;
  text: string;
  type: string;
  isMe?: boolean;
  timestamp?: Date;
}

interface ProductInfo {
  product_image_urls?: string[];
  subject_trans?: string;
  min_price?: number;
  offer_id?: string;
  default_message?: string;
}

type RootStackParamList = {
  ProductChatScreen: ProductInfo;
  Login: undefined;
};

export const ProductChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const { user } = useUserStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "ProductChatScreen">>();
  const flatListRef = useRef<FlatList>(null);

  const productInfo = route.params;

  // 自动滚动到底部
  useEffect(() => {
    if (messages.length > 0 && user.user_id) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // 设置默认消息
  useEffect(() => {
    if (productInfo?.default_message) {
      setInputText(productInfo.default_message);
    }
  }, [productInfo]);

  // 保存产品咨询历史到本地存储
  const saveProductInquiry = async (productInfo: ProductInfo) => {
    try {
      const key = "@product_inquiries";
      const existingInquiries = await AsyncStorage.getItem(key);
      let inquiries = existingInquiries ? JSON.parse(existingInquiries) : [];
      
      // 检查是否已存在相同的产品
      const existingIndex = inquiries.findIndex((item: ProductInfo) => 
        item.offer_id === productInfo.offer_id
      );
      
      const inquiryWithTimestamp = {
        ...productInfo,
        lastInquiryTime: Date.now(),
      };
      
      if (existingIndex >= 0) {
        // 更新现有记录
        inquiries[existingIndex] = inquiryWithTimestamp;
      } else {
        // 添加新记录
        inquiries.unshift(inquiryWithTimestamp);
      }
      
      // 只保留最近20个咨询记录
      inquiries = inquiries.slice(0, 20);
      
      await AsyncStorage.setItem(key, JSON.stringify(inquiries));
    } catch (error) {
      console.error("Error saving product inquiry:", error);
    }
  };

  const sendMessage = async () => {
    if (!user.user_id || inputText.trim() === "" || sending) return;
    
    setSending(true);
    
    const newMessage: Message = {
      mimetype: "text/plain",
      userWs: "unknown",
      app_id: user.user_id.toString(),
      country: user.country_code || 0,
      body: "",
      text: inputText,
      type: "product_support",
      isMe: true,
      timestamp: new Date(),
      id: Date.now().toString(),
    };

    const productSupportMessage = {
      type: 'text',
      mimetype: 'text/plain',
      app_id: newMessage.app_id,
      country: user.country_code?.toString() || '0',
      body: 'text',
      text: newMessage.text,
      product_id: productInfo.offer_id?.toString() || "general_support",
    };

    // 添加用户消息
    setMessages(prev => [...prev, newMessage]);
    setInputText("");

    // 保存产品咨询历史
    await saveProductInquiry(productInfo);

    try {
      const response = await chatService.sendProductSupportMessage(productSupportMessage);
      const replyText = response?.reply || t("chat.product_default_response", "产品支持团队会尽快回复您");
      
      const replyMessage: Message = {
        mimetype: "text/plain",
        userWs: "system",
        app_id: "system",
        country: user.country_code || 0,
        body: "",
        text: replyText,
        type: "product_support",
        isMe: false,
        timestamp: new Date(),
        id: `product-reply-${Date.now()}`,
      };
      
      setMessages(prev => [...prev, replyMessage]);
    } catch (error) {
      const errorMessage: Message = {
        mimetype: "text/plain",
        userWs: "system",
        app_id: "system",
        country: user.country_code || 0,
        body: "",
        text: t("chat.product_error_response", "产品支持API暂未实现，请联系开发团队"),
        type: "product_support",
        isMe: false,
        timestamp: new Date(),
        id: `product-error-${Date.now()}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const formatTime = (timestamp?: Date) => {
      if (!timestamp) return "";
      try {
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        if (isNaN(date.getTime())) return "";
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (error) {
        return "";
      }
    };

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

  // 产品信息卡片
  const renderProductInfo = () => (
    <View style={styles.productInfoCard}>
      <View style={styles.productInfoHeader}>
        <Text style={styles.productInfoTitle}>
          {t("chat.product_inquiry", "商品咨询")}
        </Text>
      </View>
      <View style={styles.productInfoContent}>
        {productInfo.product_image_urls && productInfo.product_image_urls[0] && (
          <Image
            source={{ uri: productInfo.product_image_urls[0] }}
            style={styles.productInfoImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.productInfoDetails}>
          <Text style={styles.productInfoName} numberOfLines={2}>
            {productInfo.subject_trans || t("chat.product_name_unavailable", "商品名称不可用")}
          </Text>
          {productInfo.min_price && (
            <Text style={styles.productInfoPrice}>
              {productInfo.min_price} {user.currency || "FCFA"}
            </Text>
          )}
          {productInfo.offer_id && (
            <Text style={styles.productInfoId}>
              ID: {productInfo.offer_id}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  if (!user.user_id) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loginPromptContainer}>
          <Text style={styles.loginPromptTitle}>请先登录</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginButtonText}>立即登录</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.container}>
          <ImageBackground
            source={require("../../assets/img/DefaultWallpaper.png")}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => navigation.goBack()}
              >
                <BackIcon size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {t("chat.product_inquiry", "商品咨询")}
              </Text>
              <View style={styles.headerRight} />
            </View>

            {/* 产品信息卡片 */}
            {renderProductInfo()}

            {/* 聊天记录 */}
            <View style={styles.chatContainer}>
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item, index) => item.id || index.toString()}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              />
            </View>

            {/* 输入框 */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder={t("chat.input_product_message", "请描述您关于此商品的问题...")}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, sending && styles.disabledButton]}
                onPress={sendMessage}
                disabled={sending}
              >
                <Text style={styles.sendButtonText}>
                  {sending ? t("chat.sending", "发送中...") : t("chat.send", "发送")}
                </Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#007a6c",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  headerTitle: {
    fontSize: customRF(18),
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  headerRight: {
    width: 36,
    height: 36,
  },
  productInfoCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productInfoHeader: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  productInfoTitle: {
    fontSize: customRF(18),
    fontWeight: "700",
    color: "#007a6c",
  },
  productInfoContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  productInfoImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: "#f5f5f5",
  },
  productInfoDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  productInfoName: {
    fontSize: customRF(16),
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    lineHeight: 22,
  },
  productInfoPrice: {
    fontSize: customRF(18),
    fontWeight: "700",
    color: "#ff5217",
    marginBottom: 5,
  },
  productInfoId: {
    fontSize: customRF(12),
    color: "#999",
  },
  chatContainer: {
    flex: 1,
  },
  messageList: {
    padding: 10,
  },
  messageContainer: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#dcf8c6",
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
    backgroundColor: "#128C7E",
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  sendButtonText: {
    color: "white",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginPromptContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loginPromptTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: "#007a6c",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
});