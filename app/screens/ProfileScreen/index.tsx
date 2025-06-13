import React, { useState } from "react";
import {
  ScrollView,
  StatusBar,
  SafeAreaView,
  StyleSheet,
  View,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import useUserStore from "../../store/user";
import { LinearGradient } from 'expo-linear-gradient';
import { LoggedOutView } from "./LoggedOutView";
import { OrderSection, ToolSection } from "./Sections";
import { ProfileHeader } from "./ProfileHeader";
import { VipCard } from "./VipCard";
import { BalanceCard } from "./BalanceCard";
import RechargeScreen from "../BalanceScreen/RechargeScreen";

type RootStackParamList = {
  SettingList: undefined;
  Home: undefined;
  MyAccount: undefined;
  Login: undefined;
  Status: { status: number | null };
  BrowseHistoryScreen: undefined;
  AddressList: undefined;
  Collection: undefined;
  Balance: undefined;
  MemberIntroduction: undefined;
};

export const ProfileScreen = () => {
  const { user, setUser } = useUserStore();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [showRechargeModal, setShowRechargeModal] = useState(false);

  const handleLogin = () => {
    navigation.navigate("Login");
  };

  const handleRechargePress = () => {
    setShowRechargeModal(true);
  };

  const handleCloseRecharge = () => {
    setShowRechargeModal(false);
  };
  
  return (
    <LinearGradient
      colors={['#FF5100', '#f5f5f5']}
      locations={[0.3,0.5]}
      style={componentStyles.gradientContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#FF5100" translucent={false} />
      <SafeAreaView style={componentStyles.safeArea}>
        <ScrollView 
          style={componentStyles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={componentStyles.scrollContent}
        >
          <View style={componentStyles.headerSection}>
            {user.user_id ? (
              <>
                <ProfileHeader 
                  user={user}
                  navigation={navigation}
                />
                <VipCard user={user} />
                <BalanceCard 
                  balance={String(user.balance)} 
                  currency={user.currency} 
                  onRechargePress={handleRechargePress}
                />
              </>
            ) : (
              <LoggedOutView t={t} navigation={navigation} handleLogin={handleLogin} />
            )}
          </View>
          <View style={componentStyles.contentSection}>
            <OrderSection t={t} navigation={navigation} />
            <ToolSection t={t} navigation={navigation} />
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Recharge Modal */}
      <Modal
        visible={showRechargeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseRecharge}
      >
        <RechargeScreen onClose={handleCloseRecharge} />
      </Modal>
    </LinearGradient>
  );
};

const componentStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerSection: {
    backgroundColor: 'transparent',
    minHeight: 'auto',
  },
  contentSection: {
    backgroundColor: '#f5f5f5',
    flex: 1,
  },
});
