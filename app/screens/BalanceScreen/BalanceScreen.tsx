// 余额管理

import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import fontSize from "../../utils/fontsizeUtils";
import widthUtils from "../../utils/widthUtils";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import BackIcon from "../../components/BackIcon";
import useUserStore from "../../store/user";
import { Transaction, payApi } from "../../services/api/payApi";
import { useTranslation } from "react-i18next";
import { userApi } from "../../services";

type BalanceScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Balance"
>;

export const BalanceScreen = () => {
  const { t } = useTranslation();
  const { user, setUser } = useUserStore();
  const navigation = useNavigation<BalanceScreenNavigationProp>();
  const [rechargeHistory, setRechargeHistory] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  const handleOpenModal = () => {
    navigation.navigate("Recharge");
  };

  const fetchRechargeHistory = async (page: number, refresh = false) => {
    if (loading || (!hasMore && !refresh)) return;

    try {
      setLoading(true);
      const response = await payApi.getTransactionHistory(page, pageSize);

      if (response.items.length < pageSize) {
        setHasMore(false);
      }

      if (refresh) {
        setRechargeHistory(response.items);
      } else {
        setRechargeHistory((prev) => [...prev, ...response.items]);
      }

      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to fetch transaction history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchRechargeHistory(currentPage + 1);
    }
  };

  useFocusEffect(
    useCallback(() => {
      userApi.getProfile().then((res) => {
        setUser(res);
      });
      fetchRechargeHistory(1, true);
    }, [])
  );

  const getTransactionTypeText = (type: string) => {
    return t(`balance.transaction_types.${type}`, type);
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionHistoryList} key={item.transaction_id}>
      <View style={styles.transactionDetailsPanel}>
        <View style={styles.transactionDetailsRow}>
          <Text style={styles.transactionDescriptionBold}>{getTransactionTypeText(item.type)}</Text>
          <Text
            style={[
              styles.transactionAmountDisplay,
              {
                color: Number(item.amount) < 0 ? "#0035a4" : "#FF5100",
              },
            ]}
          >
            {item.amount} {item.currency}
          </Text>
        </View>
        <View style={styles.transactionInfoRow}>
          <Text style={styles.transactionDate}>{item.timestamp}</Text>
          <Text style={styles.shipmentReference}>{getTransactionTypeText(item.type)}</Text>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#FF8000" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <BackIcon size={fontSize(22)} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("balance.screen.title")}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.container}>
          <FlatList
            data={rechargeHistory}
            renderItem={renderTransactionItem}
            keyExtractor={(item, index) =>
              item.transaction_id.toString() + index
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListHeaderComponent={() => (
              <View style={styles.balanceCard}>
                <View style={styles.sunriseGradientContainer}>
                  <View style={styles.timeContainer}>
                    <View style={styles.timeContainer2}></View>
                  </View>
                  <View style={styles.balanceWidget}>
                    <Text style={styles.balanceText}>
                      {t("balance.screen.balance_card")}
                    </Text>
                    <Image
                      source={require("../../../assets/img/image_11d1b9c.png")}
                      style={styles.balanceImage}
                    />
                  </View>
                </View>
                <View style={styles.balanceDetailsContainer}>
                  <View style={styles.totalBalanceCard}>
                    <View style={styles.cardContainer}>
                      <View style={styles.financialInfoContainer}>
                        <Text style={styles.largeBlackText}>
                          {user?.balance}
                        </Text>
                        <View style={styles.svgContainer}></View>
                      </View>
                      <View style={styles.totalSoldInfoContainer}>
                        <Text style={styles.totalSoldeText}>
                          {t("balance.screen.total_balance")} ({user?.currency})
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.buttonContainer,
                        { backgroundColor: "#FF8000", alignSelf: "center" },
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.button}
                        onPress={handleOpenModal}
                      >
                        <Text style={styles.buttonText}>
                          {t("balance.screen.recharge_now")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.transactionDetailsContainer}>
                    <View style={styles.balanceDetailContainer}>
                      <Text style={styles.balanceDetailTitle}>
                        {t("balance.screen.balance_detail")}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          />
        </View>

      </View>
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
    paddingTop: 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: fontSize(18),
    fontWeight: "600",
    textAlign: "center",
  },
  placeholder: {
    width: widthUtils(24, 24).width,
  },
  balanceCard: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    backgroundColor: "#f0f0f0",
  },
  sunriseGradientContainer: {
    backgroundColor:
      "linear-gradient(180deg, rgba(255, 119, 0, 1) 0%, rgba(255, 77, 0, 1) 100%)",
    flexDirection: "column",
    alignItems: "stretch",
  },
  timeContainer: {
    height: widthUtils(43, 43).height,
    paddingTop: 21,
  },
  timeContainer2: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeContainer1: {
    flexDirection: "row",
    justifyContent: "center",
  },
  timeDisplay: {
    fontSize: fontSize(17),
    fontWeight: "bold",
    color: "white",
  },
  timeIndicatorContainer: {
    width: widthUtils(10, 124).width,
    height: widthUtils(10, 124).height,
  },
  timeDisplayContainer: {
    width: widthUtils(13, 153).width,
    height: widthUtils(13, 153).height,
  },
  balanceWidget: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 9,
  },
  balanceText: {
    fontSize: fontSize(32),
    fontWeight: "bold",
    color: "white",
  },
  balanceImage: {
    width: widthUtils(139, 139).width,
    height: widthUtils(139, 139).height,
  },
  balanceDetailsContainer: {
    marginTop: -53,
    flexDirection: "column",
  },
  totalBalanceCard: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 20,
  },
  cardContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#bababa40",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.7,
  },
  financialInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  largeBlackText: {
    fontSize: fontSize(36),
    fontWeight: "bold",
    color: "black",
  },
  svgContainer: {
    width: widthUtils(24, 24).width,
    height: widthUtils(24, 24).height,
    color: "#019847",
  },
  totalSoldInfoContainer: {
    marginTop: 7,
  },
  totalSoldeText: {
    fontSize: fontSize(14),
    color: "#7c7c7c",
  },
  totalBalanceInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
  },
  verticalCenteredTextBox: {
    flexDirection: "column",
    justifyContent: "center",
    width: "54.21%",
  },
  highlightedText: {
    fontSize: fontSize(20),
    fontWeight: "bold",
    color: "#fe1e00",
  },
  expirationInfo: {
    fontSize: fontSize(14),
    color: "#7c7c7c",
  },
  deadlineInfoContainer: {
    flexDirection: "column",
    justifyContent: "center",
    width: "45.79%",
  },
  deadlineText: {
    fontSize: fontSize(20),
    fontWeight: "bold",
    color: "black",
  },
  transactionDetailsContainer: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 20,
  },
  balanceDetailContainer: {
    marginTop: 37,
  },
  balanceDetailTitle: {
    fontSize: fontSize(20),
    fontWeight: "bold",
    color: "black",
    marginBottom: 10,
  },
  transactionDetailsContainer1: {
    flexDirection: "column",
  },
  transactionHistoryList: {
    flexDirection: "column",
  },
  transactionDetailsPanel: {
    flexDirection: "column",
    padding: 15.5,
    borderBottomWidth: 1,
    borderBottomColor: "#dddddd",
    borderStyle: "dashed",
    backgroundColor: "#FFFFFF",
  },
  transactionDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  transactionDescriptionBold: {
    fontSize: fontSize(15),
    fontWeight: "bold",
    color: "black",
  },
  transactionAmountDisplay: {
    fontSize: fontSize(24),
    fontWeight: "bold",
  },
  transactionInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
  },
  transactionDate: {
    fontSize: fontSize(13),
    color: "#7f7e7e",
  },
  shipmentReference: {
    fontSize: fontSize(13),
    color: "#353029",
  },
  buttonContainer: {
    borderRadius: 25,
    width: widthUtils(50, 300).width,
    height: widthUtils(50, 300).height,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },
  button: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
  },
  buttonText: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
  loaderContainer: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
