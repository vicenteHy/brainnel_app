import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { useTranslation } from "react-i18next";

import { PaymentMethod } from "../../../../services/api/payApi";
import useUserStore from "../../../../store/user";
import CircleOutlineIcon from "../../../../components/CircleOutlineIcon";
import CheckIcon from "../../../../components/CheckIcon";
import payMap from "../../../../utils/payMap";
import fontSize from "../../../../utils/fontsizeUtils";
import { TabType } from "../types";
import { styles } from "../styles";

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  tabs: TabType[];
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  selectedPayment: string | null;
  onSelectPayment: (paymentId: string) => void;
  paymentMethods: PaymentMethod[];
  selectedCurrency: string;
  onSelectCurrency: (currency: string) => void;
  convertedAmount: any[];
  isConverting: boolean;
  isPaypalExpanded: boolean;
  isWaveExpanded: boolean;
  onConfirm: () => void;
  isPaymentLoading: boolean;
  isConfirmButtonDisabled: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onClose,
  tabs,
  currentTab,
  setCurrentTab,
  selectedPayment,
  onSelectPayment,
  paymentMethods,
  selectedCurrency,
  onSelectCurrency,
  convertedAmount,
  isConverting,
  isPaypalExpanded,
  isWaveExpanded,
  onConfirm,
  isPaymentLoading,
  isConfirmButtonDisabled,
}) => {
  const { t } = useTranslation();
  const { user } = useUserStore();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("order.select_payment")}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={styles.tab}
                onPress={() => setCurrentTab(tab.id)}
              >
                <Text
                  style={[
                    styles.tabText,
                    currentTab === tab.id && styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
                {currentTab === tab.id && <View style={styles.underline} />}
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.paymentOptions}
          >
            {currentTab === "online" ? (
              <>
                {tabs
                  .find((tab) => tab.id === "online")
                  ?.options.map((option) => (
                    <View key={option.id}>
                      <View style={styles.cardContainer}>
                        <View style={styles.iconRow}>
                          <View style={styles.imageContainer}>
                            {option.key === "balance" ? (
                              <View style={styles.leftInfo}>
                                <View style={styles.blueBox}>
                                  <Image
                                    source={payMap(option.key) as any}
                                    style={{
                                      width: 80,
                                      height: 30,
                                      resizeMode: "contain",
                                      marginRight: 10,
                                    }}
                                  />
                                </View>
                                <Text style={styles.balanceText}>
                                  {t("order.balance_remaining")}
                                  {"\n"}
                                  {user.balance}
                                  {user.currency}
                                </Text>
                              </View>
                            ) : (
                              <View>
                                <Image
                                  source={payMap(option.key) as any}
                                  style={{
                                    width: 80,
                                    height: 30,
                                    resizeMode: "contain",
                                    marginRight: 10,
                                  }}
                                />
                                {option.key === "mobile_money" && (
                                  <View style={styles.mobileMoneyTextContainer}>
                                    {paymentMethods.find(
                                      (method) => method.key === option.key
                                    )?.value &&
                                    Array.isArray(
                                      paymentMethods.find(
                                        (method) => method.key === option.key
                                      )?.value
                                    ) ? (
                                      (
                                        paymentMethods.find(
                                          (method) => method.key === option.key
                                        )?.value as string[]
                                      ).map((item, index) => (
                                        <View
                                          key={index}
                                          style={styles.mobileMoneyImgContainer}
                                        >
                                          <Image
                                            source={payMap(item) as any}
                                            style={styles.mobileMoneyImg}
                                          />
                                        </View>
                                      ))
                                    ) : (
                                      <Text style={styles.mobileMoneyText}>
                                        {
                                          paymentMethods.find(
                                            (method) => method.key === option.key
                                          )?.value as string
                                        }
                                      </Text>
                                    )}
                                  </View>
                                )}
                              </View>
                            )}
                          </View>
                        </View>
                        <TouchableOpacity onPress={() => onSelectPayment(option.id)}>
                          <View style={styles.checkboxContainer}>
                            <CircleOutlineIcon
                              size={fontSize(24)}
                              strokeColor={
                                selectedPayment === option.id ? "#007efa" : "#C6C6C6"
                              }
                              fillColor={
                                selectedPayment === option.id ? "#007efa" : "transparent"
                              }
                            />
                            {selectedPayment === option.id && (
                              <View style={styles.checkmarkContainer}>
                                <CheckIcon size={fontSize(12)} color="#FFFFFF" />
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      </View>

                      {/* PayPal Currency Selection */}
                      {selectedPayment === "paypal" &&
                        option.id === "paypal" &&
                        isPaypalExpanded && (
                          <View style={styles.paypalExpandedContainer}>
                            <View style={styles.paypalCurrencyContainer}>
                              <Text style={styles.currencyTitle}>
                                {t("order.select_currency")}
                              </Text>
                              <View style={styles.currencyButtonsContainer}>
                                <TouchableOpacity
                                  style={[
                                    styles.currencyButton,
                                    selectedCurrency === "USD" &&
                                      styles.currencyButtonActive,
                                  ]}
                                  onPress={() => onSelectCurrency("USD")}
                                >
                                  <Text
                                    style={[
                                      styles.currencyButtonText,
                                      selectedCurrency === "USD" &&
                                        styles.currencyButtonTextActive,
                                    ]}
                                  >
                                    USD
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[
                                    styles.currencyButton,
                                    selectedCurrency === "EUR" &&
                                      styles.currencyButtonActive,
                                  ]}
                                  onPress={() => onSelectCurrency("EUR")}
                                >
                                  <Text
                                    style={[
                                      styles.currencyButtonText,
                                      selectedCurrency === "EUR" &&
                                        styles.currencyButtonTextActive,
                                    ]}
                                  >
                                    EUR
                                  </Text>
                                </TouchableOpacity>
                              </View>

                              {/* 显示转换后的金额 */}
                              {isConverting ? (
                                <View style={styles.convertingContainer}>
                                  <ActivityIndicator size="small" color="#007efa" />
                                  <Text style={styles.convertingText}>
                                    {t("order.converting")}
                                  </Text>
                                </View>
                              ) : convertedAmount.length > 0 ? (
                                <View style={styles.convertedAmountContainer}>
                                  <Text style={styles.convertedAmountLabel}>
                                    {t("order.equivalent_amount")}
                                  </Text>
                                  <Text style={styles.convertedAmountValue}>
                                    {convertedAmount
                                      .find((item) => item.item_key === "total_amount")
                                      ?.converted_amount.toFixed(2)}{" "}
                                    {selectedCurrency}
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          </View>
                        )}

                      {/* Wave Currency Selection */}
                      {selectedPayment === "wave" &&
                        option.id === "wave" &&
                        isWaveExpanded && (
                          <View style={styles.paypalExpandedContainer}>
                            <View style={styles.paypalCurrencyContainer}>
                              <Text style={styles.currencyTitle}>
                                {t("order.select_currency")}
                              </Text>
                              <View style={styles.currencyButtonsContainer}>
                                <View
                                  style={[
                                    styles.currencyButton,
                                    styles.currencyButtonActive,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.currencyButtonText,
                                      styles.currencyButtonTextActive,
                                    ]}
                                  >
                                    FCFA
                                  </Text>
                                </View>
                              </View>

                              {/* 显示转换后的金额 */}
                              {isConverting ? (
                                <View style={styles.convertingContainer}>
                                  <ActivityIndicator size="small" color="#007efa" />
                                  <Text style={styles.convertingText}>
                                    {t("order.converting")}
                                  </Text>
                                </View>
                              ) : convertedAmount.length > 0 ? (
                                <View style={styles.convertedAmountContainer}>
                                  <Text style={styles.convertedAmountLabel}>
                                    {t("order.equivalent_amount")}
                                  </Text>
                                  <Text style={styles.convertedAmountValue}>
                                    {convertedAmount
                                      .find((item) => item.item_key === "total_amount")
                                      ?.converted_amount.toFixed(2)}{" "}
                                    FCFA
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          </View>
                        )}
                    </View>
                  ))}
              </>
            ) : (
              <View style={styles.outerContainer}>
                {tabs
                  .find((tab) => tab.id === "offline")
                  ?.options.map((option, index) => (
                    <View key={option.id} style={styles.flexContainer}>
                      <View style={styles.imageContainer}>
                        {option.id === "cash" ? (
                          <Image
                            source={require("../../../../../assets/img/image_c6aa9539.png")}
                            style={{
                              width: 60,
                              height: 22,
                              resizeMode: "cover",
                            }}
                          />
                        ) : (
                          <Image
                            source={require("../../../../../assets/img/Global 1.png")}
                            style={{
                              width: 60,
                              height: 22,
                              resizeMode: "cover",
                            }}
                          />
                        )}
                      </View>
                      <View style={styles.verticalAlignEndContent}>
                        <View style={styles.svgContainer}>
                          <TouchableOpacity onPress={() => onSelectPayment(option.id)}>
                            <View style={styles.checkboxContainer}>
                              <CircleOutlineIcon
                                size={fontSize(24)}
                                strokeColor={
                                  selectedPayment === option.id ? "#007efa" : undefined
                                }
                                fillColor={
                                  selectedPayment === option.id
                                    ? "#007efa"
                                    : undefined
                                }
                              />
                              {selectedPayment === option.id && (
                                <View style={styles.checkmarkContainer}>
                                  <CheckIcon size={fontSize(12)} color="#FFFFFF" />
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.actionButtonsContainer}>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.buttonTextDark}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (isConfirmButtonDisabled || isPaymentLoading) &&
                    styles.confirmButtonDisabled,
                ]}
                onPress={onConfirm}
                disabled={isConfirmButtonDisabled || isPaymentLoading}
              >
                {isPaymentLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonTextWhite}>
                    {isConverting
                      ? t("order.converting") || "Converting..."
                      : t("order.confirm_payment")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}; 