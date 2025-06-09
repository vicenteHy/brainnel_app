import React, { useState, useRef } from "react";
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
import PagerView from 'react-native-pager-view';
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
  const pagerRef = useRef<PagerView>(null);
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

  // 获取页面索引
  const getPageIndex = (tab: TabType): number => {
    switch (tab) {
      case "customer": return 0;
      case "product": return 1;
      case "notification": return 2;
      default: return 0;
    }
  };

  // 获取标签名称
  const getTabFromIndex = (index: number): TabType => {
    switch (index) {
      case 0: return "customer";
      case 1: return "product";
      case 2: return "notification";
      default: return "customer";
    }
  };

  // 处理标签点击
  const handleTabPress = (tab: TabType) => {
    if (!user.user_id) return;
    
    setActiveTab(tab);
    const pageIndex = getPageIndex(tab);
    pagerRef.current?.setPage(pageIndex);
  };

  // 处理页面滑动
  const handlePageSelected = (e: any) => {
    const position = e.nativeEvent.position;
    const newTab = getTabFromIndex(position);
    setActiveTab(newTab);
  };

  // 处理页面滑动中
  const handlePageScroll = (e: any) => {
    // 可以在这里添加滑动中的效果
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
                  <BackIcon size={20} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t("chat.title")}</Text>
                <View style={styles.headerRight} />
              </View>
              
              <TabBar
                activeTab={activeTab}
                onTabPress={handleTabPress}
                unreadCount={unreadCount}
                userLoggedIn={!!user.user_id}
              />
              
              <PagerView
                ref={pagerRef}
                style={styles.pagerView}
                initialPage={0}
                onPageSelected={handlePageSelected}
                onPageScroll={handlePageScroll}
                scrollEnabled={!!user.user_id}
                orientation="horizontal"
              >
                <View key="customer" style={styles.pageContainer}>
                  <CustomerTab
                    messages={messages}
                    keyExtractor={keyExtractor}
                    flatListRef={flatListRef}
                    userLoggedIn={!!user.user_id}
                  />
                </View>
                <View key="product" style={styles.pageContainer}>
                  <ProductTab
                    productInquiries={productInquiries}
                    userLoggedIn={!!user.user_id}
                  />
                </View>
                <View key="notification" style={styles.pageContainer}>
                  <NotificationTab
                    notifications={notifications}
                    notificationKeyExtractor={notificationKeyExtractor}
                    onMarkAsRead={markMessageAsRead}
                    onLoadMore={loadMoreNotifications}
                    notificationLoading={notificationLoading}
                    userLoggedIn={!!user.user_id}
                  />
                </View>
              </PagerView>
              
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
    backgroundColor: "#f5f5f5",
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
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  headerTitle: {
    fontSize: customRF(20),
    fontWeight: "700",
    color: "#333",
    marginLeft: 12,
    flex: 1,
  },
  headerRight: {
    width: 44,
    height: 44,
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
});