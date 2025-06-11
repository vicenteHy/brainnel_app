import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
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
import { useTranslation } from "react-i18next";

export function MyAddress() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [addressList, setAddressList] = useState<AddressItem[]>();
  const [address, setAddress] = useState<number>();
  const [loading, setLoading] = useState(true);
  const getAddress = async () => {
    const response = await addressApi.getAddress();
    setAddressList(response.items);
    setLoading(false);
  };
  useEffect(() => {
    getAddress();
  }, []);
  const deleteAddress = async (address_id: number) => {
    setAddressList(
      addressList?.filter((item) => item.address_id !== address_id)
    );
    addressApi.deleteAddress(address_id);
  };
  useFocusEffect(
    useCallback(() => {
      getAddress();
    }, [])
  );

  const setAddressId = (address_id: number) => {
    setAddress(address_id);
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
          <Text style={styles.titles}>{t("settings.address_management")}</Text>
          <View style={styles.placeholder} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF5100" />
          </View>
        ) : (
          <Fragment>
            <ScrollView
              style={{ flex: 1, padding: 19 }}
              showsVerticalScrollIndicator={false}
            >
              {addressList?.map((item) => (
                <TouchableOpacity
                  key={item.address_id}
                  onPress={() => {
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
                          <Text>{t("settings.set_default")}</Text>
                          <TouchableOpacity
                            onPress={() => deleteAddress(item.address_id)}
                          >
                            <Text>{t("settings.delete")}</Text>
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
                        navigation.navigate("AddRess", {
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
            <View style={{ paddingLeft: 19, paddingRight: 19 }}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate("AddRess")}
              >
                <Text style={styles.addButtonText}>{t("settings.add_new_address")}</Text>
              </TouchableOpacity>
            </View>
          </Fragment>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  safeAreaContent: {
    flex: 1,
    paddingTop: 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    paddingInline: 19,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    width: "100%",
    paddingVertical: 15,
  },
  backButton: {
    width: widthUtils(24, 24).width,
  },
  titles: {
    fontSize: fontSize(20),
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: widthUtils(24, 24).width,
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
    borderColor: "#FF5100",
    borderWidth: 2,
  },
  addressItemNoSelected: {
    borderColor: "#d0d0d0",
    borderWidth: 2,
  },
  userCardContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
    paddingTop: 15,
    paddingRight: 10,
    paddingBottom: 10,
    paddingLeft: 11,
    backgroundColor: "white",
    borderRadius: 5,
    marginBottom: 10,
  },
  userInfoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    flex: 1,
    marginRight: 8,
  },
  userCardInfo2: {
    flex: 1,
    marginRight: 8,
  },
  userCardInfo: {
    fontSize: fontSize(18),
    lineHeight: 22,
    fontFamily: "PingFang SC",
    fontWeight: "500",
    color: "black",
    flex: 1,
  },
  userCardInfo1: {
    fontSize: fontSize(18),
    lineHeight: 22,
    fontFamily: "PingFang SC",
    fontWeight: "500",
    color: "#6b7280",
    marginTop: 10,
    flex: 1,
    width: "100%",
  },
  centeredBoxWithText: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    height: 26,
    paddingRight: 11,
    paddingLeft: 11,
    marginLeft: 8,
    backgroundColor: "#FFF5F0",
    borderRadius: 5,
  },
  blueHeadingTextStyle: {
    fontSize: fontSize(13),
    fontFamily: "PingFang SC",
    fontWeight: "500",
    color: "#FF5100",
  },
  svgContainer: {
    width: widthUtils(24, 24).width,
    height: widthUtils(24, 24).height,
    color: "#0051ff",
    marginLeft: "auto",
  },
  addressEmit: {
    paddingTop: 10,
    flexDirection: "row",
    gap: 10,
  },
  addButton: {
    width: "100%",
    height: widthUtils(60, 60).height,
    backgroundColor: "#FF5100",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    marginTop: 10,
  },
  addButtonText: {
    color: "white",
    fontSize: fontSize(16),
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
