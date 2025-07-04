import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import customRF from "../../utils/customRF";
import useUserStore from "../../store/user";
import { t } from "../../i18n";
import BackIcon from "../../components/BackIcon";

import { TabType, RootStackParamList } from "./types";
import { useChat, useNotifications, useProductInquiries } from "./hooks";
import {
  TabBar,
  LoginOverlay,
  CustomerTab,
  ProductTab,
  NotificationTab,
  ChatInput,
} from "./components";

export const ChatScreen = () => {
  const [activeTab, setActiveTab] = useState<TabType>("customer");
  const { user } = useUserStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "ChatScreen">>();

  const {
    messages,
    inputText,
    setInputText,
    sendMessage,
    keyExtractor,
    flatListRef,
  } = useChat();

  const {
    notifications,
    unreadCount,
    markMessageAsRead,
    loadMoreNotifications,
    notificationLoading,
    notificationKeyExtractor,
  } = useNotifications(activeTab);

  const { productInquiries } = useProductInquiries(activeTab);

  const goToLogin = () => {
    navigation.navigate("Login");
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "customer":
        return (
          <CustomerTab
            messages={messages}
            keyExtractor={keyExtractor}
            flatListRef={flatListRef}
            userLoggedIn={!!user.user_id}
          />
        );
      case "product":
        return (
          <ProductTab
            productInquiries={productInquiries}
            userLoggedIn={!!user.user_id}
          />
        );
      case "notification":
        return (
          <NotificationTab
            notifications={notifications}
            notificationKeyExtractor={notificationKeyExtractor}
            onMarkAsRead={markMessageAsRead}
            onLoadMore={loadMoreNotifications}
            notificationLoading={notificationLoading}
            userLoggedIn={!!user.user_id}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.safeAreaContent}>
          <View style={styles.container}>
            <View style={styles.container}>
              <View style={styles.header}>
                <TouchableOpacity 
                  style={styles.backButton} 
                  onPress={() => navigation.goBack()}
                >
                  <BackIcon size={20} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t("chat.title", "聊天")}</Text>
                <View style={styles.headerRight} />
              </View>
              
              <TabBar
                activeTab={activeTab}
                onTabPress={setActiveTab}
                unreadCount={unreadCount}
                userLoggedIn={!!user.user_id}
              />
              
              {renderTabContent()}
              
              {activeTab === "customer" && (
                <ChatInput
                  inputText={inputText}
                  onTextChange={setInputText}
                  onSend={sendMessage}
                  userLoggedIn={!!user.user_id}
                />
              )}
            </View>

            {!user.user_id && <LoginOverlay onLoginPress={goToLogin} />}
          </View>
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
  safeAreaContent: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 0 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: customRF(18),
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  headerRight: {
    width: 36,
    height: 36,
  },
});