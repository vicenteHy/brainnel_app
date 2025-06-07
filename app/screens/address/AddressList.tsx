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
  Modal,
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
  const { addresses, fetchAddresses, loading, setDefaultAddressStatic, updateAddress } =
    useAddressStore();
  const [address, setAddress] = useState<number>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAddressId, setDeleteAddressId] = useState<number | null>(null);
  const { t } = useTranslation();
  const { user } = useUserStore();
  const getAddress = async () => {
    await fetchAddresses();
  };
  useEffect(() => {
    getAddress();
  }, []);
  const deleteAddress = async (address_id: number) => {
    // 使用 store 的 deleteAddress 方法
    await useAddressStore.getState().deleteAddress(address_id);
    setShowDeleteModal(false);
    setDeleteAddressId(null);
  };
  
  const confirmDeleteAddress = (address_id: number) => {
    setDeleteAddressId(address_id);
    setShowDeleteModal(true);
  };
  
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteAddressId(null);
  };
  
  const handleConfirmDelete = () => {
    if (deleteAddressId) {
      deleteAddress(deleteAddressId);
    }
  };
  // 移除 useFocusEffect，避免自动刷新覆盖用户操作
  // useFocusEffect(
  //   useCallback(() => {
  //     getAddress();
  //   }, [])
  // );
  const setAddressId = (address_id: number) => {
    setDefaultAddressStatic(address_id);
    navigation.goBack();
  };

  const handleSetDefault = (address_id: number, currentIsDefault: number) => {
    // 如果当前已经是默认地址，不执行任何操作
    if (currentIsDefault === 1) {
      return;
    }

    // 立即更新 UI 状态，确保只有一个地址为默认
    const currentAddresses = addresses || [];
    const updatedAddresses = currentAddresses.map(addr => ({
      ...addr,
      is_default: addr.address_id === address_id ? 1 : 0
    }));
    
    // 立即更新本地状态实现即时 UI 响应
    useAddressStore.setState({ addresses: updatedAddresses });
    
    // 异步调用 API 更新服务器
    addressApi.updateAddress({
      address_id: address_id,
      is_default: 1
    }).catch(error => {
      console.error("设置默认地址API调用失败:", error);
    });
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={1}
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
              {addresses?.map((item, index) => (
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
                  activeOpacity={1}
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
                        <View style={styles.addressActions}>
                          <TouchableOpacity 
                            style={styles.defaultCheckbox}
                            onPress={() => handleSetDefault(item.address_id, item.is_default)}
                            activeOpacity={1}
                          >
                            <View style={[styles.checkbox, item.is_default === 1 && styles.checkedBox]}>
                              {item.is_default === 1 && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={styles.defaultLabel}>{t("address.set_default")}</Text>
                          </TouchableOpacity>
                          
                          <View style={styles.actionButtons}>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => confirmDeleteAddress(item.address_id)}
                              activeOpacity={1}
                            >
                              <Text style={styles.actionButtonText}>{t("address.delete")}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => {
                                navigation.navigate("EditAddress", {
                                  address: item,
                                });
                              }}
                              activeOpacity={1}
                            >
                              <Text style={styles.actionButtonText}>{t("address.edit")}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {user.user_id && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate("AddAddress")}
                activeOpacity={1}
              >
                  <Text style={styles.addButtonText}>{t("address.add_new")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </Fragment>
        )}
      </View>
      
      {/* 删除确认弹窗 */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            <Text style={styles.deleteModalTitle}>
              {t("cart.delete_item")}
            </Text>
            <Text style={styles.deleteModalMessage}>
              {t("cart.delete_item_message")}
            </Text>
            
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton]}
                onPress={handleCancelDelete}
                activeOpacity={1}
              >
                <Text style={styles.cancelButtonText}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmButton]}
                onPress={handleConfirmDelete}
                activeOpacity={1}
              >
                <Text style={styles.confirmButtonText}>
                  {t("common.confirm")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderColor: "#FF6F30",
    borderWidth: 2,
    shadowColor: "#FF6F30",
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
    flexDirection: "column",
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
    width: "100%",
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
    fontWeight: "400",
    color: "#666666",
    marginTop: 4,
    letterSpacing: 0.1,
  },
  addressActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  defaultCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  checkedBox: {
    backgroundColor: "#666",
    borderColor: "#666",
  },
  checkmark: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  defaultLabel: {
    fontSize: fontSize(14),
    color: "#666",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: "#f5f5f5",
  },
  actionButtonText: {
    fontSize: fontSize(13),
    color: "#666",
  },


  addButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#FF6F30",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    marginTop: 20,
    shadowColor: "#FF6F30",
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
  
  // 删除确认弹窗样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    width: '85%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#f3f4f8',
  },
  deleteModalTitle: {
    fontSize: fontSize(18),
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: fontSize(22),
  },
  deleteModalMessage: {
    fontSize: fontSize(14),
    fontWeight: '400',
    color: '#666',
    textAlign: 'center',
    lineHeight: fontSize(20),
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderWidth: 1,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderColor: '#f3f4f8',
  },
  confirmButton: {
    backgroundColor: '#FF6F30',
    borderColor: '#FF6F30',
    shadowColor: '#FF6F30',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  cancelButtonText: {
    fontSize: fontSize(16),
    fontWeight: '500',
    color: '#666',
    lineHeight: fontSize(16),
  },
  confirmButtonText: {
    fontSize: fontSize(16),
    fontWeight: '600',
    color: '#fff',
    lineHeight: fontSize(16),
  },

});