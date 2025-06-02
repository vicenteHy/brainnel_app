import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import fontSize from "../../utils/fontsizeUtils"; 

type PayErrorStackParamList = {
  MainTabs: { screen: string } | undefined;
  PayError: undefined;
  ConfirmOrder: undefined;
  OrderDetails: undefined;
};

export const PayError = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PayErrorStackParamList>>();

  // 处理系统返回，返回到首页
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.reset({
          index: 0,
          routes: [{ 
            name: 'MainTabs',
            params: { screen: 'Home' }
          }],
        });
        return true; // 阻止默认返回行为
      };

      // 监听硬件返回按钮（Android）
      const backHandler = BackHandler;
      const subscription = backHandler.addEventListener('hardwareBackPress', onBackPress);

      // 监听导航事件（iOS手势返回和导航栏返回按钮）
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        // 阻止默认行为
        e.preventDefault();
        
        // 执行自定义返回逻辑
        navigation.reset({
          index: 0,
          routes: [{ 
            name: 'MainTabs',
            params: { screen: 'Home' }
          }],
        });
      });

      return () => {
        subscription?.remove();
        unsubscribe();
      };
    }, [navigation])
  );

  const handleRetryPayment = () => {
    // 导航回支付页面或确认订单页面
    navigation.navigate("ConfirmOrder");
  };

  const viewOrderDetails = () => {
    // 可以查看订单详情
    navigation.navigate("OrderDetails");
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerError}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="close-circle" size={60} color="#E53935" />
          </View>
          <View style={styles.headerErrorText}>
            <Text style={styles.headerErrorTextTitle}>支付失败</Text>
          </View>
          <Text style={styles.errorMessage}>
            您的支付未能完成，请检查支付方式或网络连接后重试
          </Text>
        </View>

        <View style={styles.errorDetail}>
          <View style={styles.errorDetailItem}>
            <Text style={styles.errorDetailItemLabel}>订单号</Text>
            <Text style={styles.errorDetailItemValue}>ONL123456789</Text>
          </View>
          <View style={styles.errorDetailItem}>
            <Text style={styles.errorDetailItemLabel}>金额</Text>
            <Text style={styles.errorDetailItemValue}>73800 FCFA</Text>
          </View>
          <View style={styles.errorDetailItem}>
            <Text style={styles.errorDetailItemLabel}>失败原因</Text>
            <Text style={styles.errorDetailItemValue}>支付处理中断</Text>
          </View>
        </View>

        <View style={styles.supportInfo}>
          <Text style={styles.supportText}>
            如需帮助，请联系客服: support@example.com
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.retryButton]}
            onPress={handleRetryPayment}
          >
            <Text style={styles.buttonText}>重新支付</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.detailsButton]}
            onPress={viewOrderDetails}
          >
            <Text style={styles.buttonText}>订单详情</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={{ marginTop: 20, alignSelf: 'center', padding: 10, backgroundColor: '#0030a7', borderRadius: 8 }}
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{ 
                name: 'MainTabs',
                params: { screen: 'Home' }
              }],
            });
          }}
        >
          <Text style={{ color: 'white', fontSize: fontSize(16) }}>返回首页</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  header: {
    padding: 30,
    backgroundColor: "white",
    borderRadius: 10,
    margin: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerError: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  errorIconContainer: {
    marginBottom: 15,
  },
  headerErrorText: {
    marginBottom: 10,
  },
  headerErrorTextTitle: {
    fontSize: fontSize(22),
    color: "#E53935",
    fontWeight: "bold",
  },
  errorMessage: {
    fontSize: fontSize(14),
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 20,
  },
  errorDetail: {
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorDetailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FECACA",
  },
  errorDetailItemLabel: {
    fontSize: fontSize(14),
    color: "#666",
    fontWeight: "500",
  },
  errorDetailItemValue: {
    fontSize: fontSize(14),
    color: "#333",
    fontWeight: "500",
  },
  supportInfo: {
    marginBottom: 25,
    alignItems: "center",
  },
  supportText: {
    fontSize: fontSize(13),
    color: "#666",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    width: "47%",
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  retryButton: {
    backgroundColor: "#0030a7",
  },
  detailsButton: {
    backgroundColor: "#666",
  },
  buttonText: {
    fontSize: fontSize(16),
    color: "white",
    fontWeight: "500",
  },
});
