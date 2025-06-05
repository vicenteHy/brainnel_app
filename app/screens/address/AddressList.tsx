import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StatusBar,
  Alert,
} from "react-native";
import React, { Fragment } from "react";
import BackIcon from "../../components/BackIcon";
import FileEditIcon from "../../components/FileEditIcon";
import { useNavigation } from "@react-navigation/native";
import { addressApi, AddressItem } from "../../services/api/addressApi";
import { useState, useEffect, useCallback } from "react";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import fontSize from "../../utils/fontsizeUtils";
import widthUtils from "../../utils/widthUtils";
import { useAddressStore } from "../../store/address";
import { useTranslation } from "react-i18next";
import useUserStore from "../../store/user";
export function AddressList() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { addresses, fetchAddresses, loading, setDefaultAddressStatic } =
    useAddressStore();
  const [addressList, setAddressList] = useState<AddressItem[]>();
  const [address, setAddress] = useState<number>();
  const { t } = useTranslation();
  const { user } = useUserStore();
  const getAddress = async () => {
    await fetchAddresses();
  };
  useEffect(() => {
    getAddress();
  }, []);
  React.useEffect(() => {
    setAddressList(addresses);
  }, [addresses]);
  const deleteAddress = async (address_id: number) => {
    setAddressList(
      addressList?.filter((item) => item.address_id !== address_id)
    );
    addressApi.deleteAddress(address_id);
  };
  const confirmDeleteAddress = (address_id: number) => {
    Alert.alert(
      t("cart.delete_item"),
      t("cart.delete_item_message"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.confirm"),
          style: "destructive",
          onPress: () => deleteAddress(address_id),
        },
      ]
    );
  };
  useFocusEffect(
    useCallback(() => {
      getAddress();
    }, [])
  );
  const setAddressId = (address_id: number) => {
    setDefaultAddressStatic(address_id);
    navigation.goBack();
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <BackIcon size={fontSize(22)} />
          </TouchableOpacity>
          <Text style={styles.titles}>{t("address.management")}</Text>
          <View style={styles.placeholder} />
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#f77f3a" />
          </View>
        ) : (
          <Fragment>
            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {addressList?.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    const prevRoute =
                      navigation.getState().routes[
                        navigation.getState().routes.length - 2
                      ];
                    if (prevRoute?.name === "MainTabs") {
                      return; // Do not execute if coming from ProfileScreen
                    }
                    setAddressId(item.address_id);
                  }}
                >
                  <View
                    style={[
                      styles.userCardContainer,
                      item.address_id === address
                        ? styles.addressItemSelected
                        : styles.addressItemNoSelected,
                    ]}
                  >
                    <View style={styles.userInfoCard}>
                      <View style={styles.userCardInfo2}>
                        <Text
                          style={styles.userCardInfo}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item.receiver_first_name} . {item.receiver_last_name}
                        </Text>
                        <Text
                          style={styles.userCardInfo1}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item.receiver_phone}
                        </Text>
                        <View style={styles.addressEmit}>
                          {/* <Text>{t("address.set_default")}</Text> */}
                          <TouchableOpacity
                            onPress={() => confirmDeleteAddress(item.address_id)}
                          >
                            <Text>{t("address.delete")}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {item.is_default === 1 && (
                        <View style={styles.centeredBoxWithText}>
                          <Text style={styles.blueHeadingTextStyle}>{t("address.default")}</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate("EditAddress", {
                          address: item,
                        });
                      }}
                    >
                      <View style={styles.svgContainer}>
                        <FileEditIcon size={24} />
                      </View>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {user.user_id && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate("AddAddress")}
              >
                  <Text style={styles.addButtonText}>{t("address.add_new")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </Fragment>
        )}
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeAreaContent: {
    flex: 1,
    paddingTop: 0,
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    width: "100%",
    paddingVertical: 16,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  titles: {
    fontSize: fontSize(20),
    fontWeight: "600",
    color: "#1a1a1a",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.3,
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: fontSize(20),
    fontWeight: "600",
    textAlign: "center",
    position: "absolute",
    width: "100%",
    left: 0,
  },
  userCardContainer1: {
    marginTop: 20,
  },
  addressItemSelected: {
    borderColor: "#ff6b35",
    borderWidth: 2,
    shadowColor: "#ff6b35",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addressItemNoSelected: {
    borderColor: "#e8e8e8",
    borderWidth: 1.5,
  },
  userCardContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userInfoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    flex: 1,
    marginRight: 12,
  },
  userCardInfo2: {
    flex: 1,
    marginRight: 8,
  },
  userCardInfo: {
    fontSize: fontSize(16),
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: "600",
    color: "#1a1a1a",
    letterSpacing: 0.2,
  },
  userCardInfo1: {
    fontSize: fontSize(14),
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: "400",
    color: "#666666",
    marginTop: 4,
    letterSpacing: 0.1,
  },
  centeredBoxWithText: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 28,
    paddingHorizontal: 12,
    marginLeft: 8,
    backgroundColor: "#fff4f0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ff6b35",
  },
  blueHeadingTextStyle: {
    fontSize: fontSize(12),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: "600",
    color: "#ff6b35",
    letterSpacing: 0.2,
  },
  svgContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  addressEmit: {
    paddingTop: 12,
    flexDirection: "row",
    gap: 16,
  },
  addButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#ff6b35",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    marginTop: 20,
    shadowColor: "#ff6b35",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: "white",
    fontSize: fontSize(16),
    fontWeight: "600",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flex: 1,
    paddingTop: 20,
  },
  buttonContainer: {
    paddingBottom: 20,
  },
});