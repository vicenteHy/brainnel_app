import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import fontSize from "../../../utils/fontsizeUtils";
import useUserStore from "../../../store/user";
import CircleOutlineIcon from "../../../components/CircleOutlineIcon";
import CheckIcon from "../../../components/CheckIcon";
import payMap from "../../../utils/payMap";
import { PaymentMethodItemProps } from "./types";
import { styles } from "./styles";

export const PaymentMethodItem: React.FC<PaymentMethodItemProps> = ({
  option,
  isSelected,
  onSelect,
  selectedCurrency,
  onSelectCurrency,
  exchangeRates,
  convertedAmount,
  isConverting,
  isPaypalExpanded,
  isCreditCardExpanded,
  isCOD,
  userLocalCurrency,
}) => {
  const { t } = useTranslation();
  const { user } = useUserStore();
  
  // Helper function to get converted total amount for calculation (excluding shipping fee if isCOD is 1)
  const getConvertedTotalForCalculation = () => {
    if (!convertedAmount || convertedAmount.length === 0) return 0;
    
    if (isCOD === 1) {
      // If isCOD is 1, subtract the shipping fee from the total converted amount
      const totalConverted = convertedAmount.reduce((acc, item) => acc + item.converted_amount, 0);
      const shippingFeeConverted = convertedAmount.find((item) => item.item_key === "shipping_fee")?.converted_amount || 0;
      return totalConverted - shippingFeeConverted;
    }
    return convertedAmount.reduce((acc, item) => acc + item.converted_amount, 0);
  };
  
  return (
    <View>
      <TouchableOpacity style={styles.cardContainer} onPress={onSelect}>
        {option.key === "balance" ? (
          <View style={styles.leftInfo}>
            <View style={styles.blueBox}>
              <Image
                source={payMap(option.key) as any}
                style={styles.operatorImage}
              />
            </View>
            <Text style={styles.balanceText}>
              {t("balance.recharge.balance_remaining") || "Balance remaining"}
              {"\n"}
              {isSelected && convertedAmount && convertedAmount.length > 0 && userLocalCurrency ? (
                // 如果选择了余额支付且有货币转换，计算转换后的余额
                (() => {
                  // 获取转换比例（使用商品总价的转换比例）
                  const totalConverted = convertedAmount.find((conv) => conv.item_key === "total_amount")?.converted_amount || 0;
                  const totalOriginal = convertedAmount.find((conv) => conv.item_key === "total_amount")?.original_amount || 0;
                  
                  if (totalOriginal > 0) {
                    const conversionRate = totalConverted / totalOriginal;
                    const convertedBalance = (user.balance * conversionRate).toFixed(2);
                    return `${convertedBalance}${userLocalCurrency}`;
                  }
                  return `${user.balance}${user.currency}`;
                })()
              ) : (
                `${user.balance}${user.currency}`
              )}
            </Text>
          </View>
        ) : (
          <View style={styles.iconRow}>
            <View style={styles.imageContainer}>
              <Image
                source={payMap(option.key || option.id) as any}
                style={styles.operatorImage}
              />
              {option.key === "mobile_money" && option.value && (
                <View style={styles.mobileMoneyTextContainer}>
                  {Array.isArray(option.value) ? (
                    option.value.map((item, index) => (
                      <View key={index} style={styles.mobileMoneyImgContainer}>
                        <Image
                          source={payMap(item) as any}
                          style={styles.mobileMoneyImg}
                        />
                      </View>
                    ))
                  ) : (
                    <Text style={styles.mobileMoneyText}>{option.value}</Text>
                  )}
                </View>
              )}
            </View>
          </View>
        )}
        <View style={styles.checkboxContainer}>
          <CircleOutlineIcon
            size={fontSize(24)}
            strokeColor={isSelected ? "#007efa" : "#C6C6C6"}
            fillColor={isSelected ? "#007efa" : "transparent"}
          />
          {isSelected && (
            <View style={styles.checkmarkContainer}>
              <CheckIcon size={fontSize(12)} color="#FFFFFF" />
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Show currency selector directly under PayPal when selected and expanded */}
      {isSelected &&
        option.key === "paypal" &&
        isPaypalExpanded &&
        selectedCurrency &&
        onSelectCurrency &&
        exchangeRates && (
          <View style={styles.paypalExpandedContainer}>
            <View style={styles.paypalCurrencyContainer}>
              <Text style={styles.currencyTitle}>
                {t("order.select_currency") || "Select Currency"}
              </Text>
              <View style={styles.currencyButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.currencyButton,
                    selectedCurrency === "USD" && styles.currencyButtonActive,
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
                    selectedCurrency === "EUR" && styles.currencyButtonActive,
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

              {/* Display converted amount */}
              {isConverting ? (
                <View style={styles.convertingContainer}>
                  <ActivityIndicator size="small" color="#007efa" />
                  <Text style={styles.convertingText}>
                    {t("order.converting") || "Converting..."}
                  </Text>
                </View>
              ) : convertedAmount && convertedAmount.length > 0 ? (
                <View style={styles.convertedAmountContainer}>
                  <Text style={styles.convertedAmountLabel}>
                    {t("order.equivalent_amount") || "Equivalent Amount:"}
                  </Text>
                  <Text style={styles.convertedAmountValue}>
                    {getConvertedTotalForCalculation().toFixed(2)}{" "}
                    {selectedCurrency}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

      {/* Show currency selector for Credit Card when selected and expanded */}
      {isSelected &&
        (option.key === "bank_card" || option.id === "bank_card") &&
        isCreditCardExpanded &&
        selectedCurrency &&
        onSelectCurrency &&
        exchangeRates && (
          <View style={styles.paypalExpandedContainer}>
            <View style={styles.paypalCurrencyContainer}>
              <Text style={styles.currencyTitle}>
                {t("order.select_currency") || "Select Currency"}
              </Text>
              <View style={styles.currencyButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.currencyButton,
                    selectedCurrency === "USD" && styles.currencyButtonActive,
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
                    selectedCurrency === "EUR" && styles.currencyButtonActive,
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

              {/* Display converted amount */}
              {isConverting ? (
                <View style={styles.convertingContainer}>
                  <ActivityIndicator size="small" color="#007efa" />
                  <Text style={styles.convertingText}>
                    {t("order.converting") || "Converting..."}
                  </Text>
                </View>
              ) : convertedAmount && convertedAmount.length > 0 ? (
                <View style={styles.convertedAmountContainer}>
                  <Text style={styles.convertedAmountLabel}>
                    {t("order.equivalent_amount") || "Equivalent Amount:"}
                  </Text>
                  <Text style={styles.convertedAmountValue}>
                    {getConvertedTotalForCalculation().toFixed(2)}{" "}
                    {selectedCurrency}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

    </View>
  );
};