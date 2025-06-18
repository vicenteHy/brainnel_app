// 支付组件
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  FlatList,
  Linking,
} from "react-native";
import fontSize from "../../utils/fontsizeUtils";
import widthUtils from "../../utils/widthUtils";
import CircleOutlineIcon from "../../components/CircleOutlineIcon";
import BackIcon from "../../components/BackIcon";
import CheckIcon from "../../components/CheckIcon";
import useUserStore from "../../store/user";
// 添加导航相关导入
import { useNavigation, CommonActions } from "@react-navigation/native";
// 添加API服务
import {
  payApi,
  RechargeRecommendAmountResponse,
  PaymentMethod,
} from "../../services/api/payApi";
import getPayMap from "../../utils/payMap";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";

interface RechargeScreenProps {
  // 可以添加其他 props，比如路由参数
}

const RechargeScreen = () => {
  const { t } = useTranslation();
  const [selectedPrice, setSelectedPrice] = useState<string>("");
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [recommendedAmounts, setRecommendedAmounts] =
    useState<RechargeRecommendAmountResponse>();
  const [showCustomAmountInput, setShowCustomAmountInput] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [customAmountDisplayText, setCustomAmountDisplayText] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const customAmountInputRef = useRef<TextInput>(null);
  // 添加货币转换相关状态
  const [isConverting, setIsConverting] = useState(false);
  const { user } = useUserStore();

  // 指定导航类型为any
  const navigation = useNavigation<any>();
  const [convertedAmount, setConvertedAmount] = useState<
    {
      converted_amount: number;
      item_key: string;
      original_amount: number;
    }[]
  >([]);
  const [currentCurrency, setCurrentCurrency] = useState("USD");
  const [paymentParams, setPaymentParams] = useState<{
    originalAmount: number;
    amount: number;
    currency: string;
    payment_method: string;
    selectedPriceLabel: string;
  } | null>(null);
  // 添加PayPal展开视图的状态
  const [isPaypalExpanded, setIsPaypalExpanded] = useState(false);
  // 添加Wave展开视图的状态
  const [isWaveExpanded, setIsWaveExpanded] = useState(false);
  // 添加信用卡展开视图的状态
  const [isBankCardExpanded, setIsBankCardExpanded] = useState(false);
  // 添加mobile money展开视图的状态
  const [isMobileMoneyExpanded, setIsMobileMoneyExpanded] = useState(false);

  // 添加国家选择相关状态
  const [validDigits, setValidDigits] = useState<number[]>([8]);

  useEffect(() => {
    payApi.getRechargeRecommendAmount().then((res) => {
      setRecommendedAmounts(res);
      // Set the first amount as the default selected price if available
      if (res && res.amounts && res.amounts.length > 0) {
        setSelectedPrice(res.amounts[0].toString());
      }
    });

    payApi.getCountryPaymentMethods().then((res) => {
      let currentCountryMethods = res.current_country_methods.filter(
        (method) => method.key !== "balance"
      );
      
      // Wave支付只在科特迪瓦显示
      const isIvoryCoast = user?.country_en === "Ivory Coast" || 
                          user?.country_en === "Côte d'Ivoire" || 
                          user?.country === "科特迪瓦" ||
                          user?.country_code === 225;
      
      if (!isIvoryCoast) {
        currentCountryMethods = currentCountryMethods.filter(
          (method) => method.key !== "wave"
        );
      }
      
      setPaymentMethods(currentCountryMethods);
    });
  }, [user]);



  const handlePriceSelect = (price: string) => {
    setSelectedPrice(price);
    setShowCustomAmountInput(false);
    setCustomAmountDisplayText("");

    // 如果当前已选择了Paypal支付方式，则重新计算转换后的金额
    if (selectedOperator === "paypal") {
      handleCurrencyConversion(price, currentCurrency);
    }
    // 如果当前已选择了Wave支付方式，则重新计算转换后的FCFA金额
    else if (selectedOperator === "wave") {
      handleCurrencyConversion(price, "FCFA");
    }
    // 如果当前已选择了信用卡支付方式，则重新计算转换后的金额
    else if (selectedOperator === "bank_card") {
      handleCurrencyConversion(price, currentCurrency);
    }
    // 如果当前已选择了mobile money支付方式，则重新计算转换后的本地货币金额
    else if (selectedOperator === "mobile_money") {
      handleCurrencyConversion(price, currentCurrency);
    }
    // 保留原有的逻辑
    else if (selectedOperator === "currency") {
      handleCurrencyConversion(price, currentCurrency);
    }
  };

  const handleOperatorSelect = (operator: string) => {
    // 保存当前选中的操作符以便后续比较
    const previousOperator = selectedOperator;
    
    // 如果选择的不是之前选中的支付方式，则重置展开状态
    if (operator !== previousOperator) {
      setIsPaypalExpanded(false);
      setIsWaveExpanded(false);
      setIsBankCardExpanded(false);
      setIsMobileMoneyExpanded(false);
    }

    setSelectedOperator(operator === previousOperator ? null : operator);

    // 查找选中的支付方式
    const selectedMethod = paymentMethods.find(
      (method) => method.key === operator
    );

    if (selectedMethod) {
      // 如果是PayPal支付方式
      if (selectedMethod.key === "paypal" && operator !== previousOperator) {
        setIsPaypalExpanded(true);

        // 无条件触发货币转换，使用默认的USD
        let amountToConvert = selectedPrice;

        // 如果用户还没有选择金额，使用推荐金额中的第一个
        if (
          !amountToConvert &&
          recommendedAmounts &&
          recommendedAmounts.amounts &&
          recommendedAmounts.amounts.length > 0
        ) {
          amountToConvert = recommendedAmounts.amounts[0].toString();
          setSelectedPrice(amountToConvert);
        }

        if (amountToConvert) {
          setCurrentCurrency("USD");
          setIsConverting(true);
          handleCurrencyConversion(amountToConvert, "USD");
        }
      }
      // 如果是Wave支付方式
      else if (selectedMethod.key === "wave" && operator !== previousOperator) {
        setIsWaveExpanded(true);

        // 无条件触发货币转换，使用FCFA
        let amountToConvert = selectedPrice;

        // 如果用户还没有选择金额，使用推荐金额中的第一个
        if (
          !amountToConvert &&
          recommendedAmounts &&
          recommendedAmounts.amounts &&
          recommendedAmounts.amounts.length > 0
        ) {
          amountToConvert = recommendedAmounts.amounts[0].toString();
          setSelectedPrice(amountToConvert);
        }

        if (amountToConvert) {
          setCurrentCurrency("FCFA");
          setIsConverting(true);
          handleCurrencyConversion(amountToConvert, "FCFA");
        }
      }
      // 如果是信用卡支付方式
      else if (selectedMethod.key === "bank_card" && operator !== previousOperator) {
        setIsBankCardExpanded(true);

        // 无条件触发货币转换，使用默认的USD
        let amountToConvert = selectedPrice;

        // 如果用户还没有选择金额，使用推荐金额中的第一个
        if (
          !amountToConvert &&
          recommendedAmounts &&
          recommendedAmounts.amounts &&
          recommendedAmounts.amounts.length > 0
        ) {
          amountToConvert = recommendedAmounts.amounts[0].toString();
          setSelectedPrice(amountToConvert);
        }

        if (amountToConvert) {
          setCurrentCurrency("USD");
          setIsConverting(true);
          handleCurrencyConversion(amountToConvert, "USD");
        }
      }
      // 如果是mobile money支付方式
      else if (selectedMethod.key === "mobile_money" && operator !== previousOperator) {
        setIsMobileMoneyExpanded(true);
        
        // mobile money只支持本地货币，需要转换为当前国家对应的货币
        let localCurrency = "FCFA"; // 默认为FCFA
        
        // 根据用户当前国家确定本地货币
        // 这里可以根据实际的国家货币映射来设置
        // 暂时使用FCFA作为默认本地货币
        
        // 无条件触发货币转换，使用本地货币
        let amountToConvert = selectedPrice;

        // 如果用户还没有选择金额，使用推荐金额中的第一个
        if (
          !amountToConvert &&
          recommendedAmounts &&
          recommendedAmounts.amounts &&
          recommendedAmounts.amounts.length > 0
        ) {
          amountToConvert = recommendedAmounts.amounts[0].toString();
          setSelectedPrice(amountToConvert);
        }

        if (amountToConvert) {
          setCurrentCurrency(localCurrency);
          setIsConverting(true);
          handleCurrencyConversion(amountToConvert, localCurrency);
        }
      }
      // mobile_money 的其他处理现在在 PhoneNumberInputModal 内部进行
    } else if (operator === "currency" && operator !== previousOperator) {
      // 旧的逻辑保留作为备用
      handleCurrencySelect("USD");
    }
  };

  const handleCustomAmountChange = (text: string) => {
    // Remove commas and non-numeric characters except for the first decimal point
    const formattedText = text.replace(/,/g, "").replace(/[^0-9.]/g, "");
    setCustomAmount(formattedText);
  };

  const handleCustomAmountSubmit = () => {
    if (customAmount && customAmount.trim() !== "") {
      // Format the custom amount with commas
      const numericAmount = parseFloat(customAmount);
      if (!isNaN(numericAmount) && numericAmount > 0) {
        const formattedAmount = numericAmount.toLocaleString();

        // 设置自定义金额作为显示文本
        setCustomAmountDisplayText(formattedAmount);

        // 设置充值金额为用户输入的金额，但不选中任何预设金额按钮
        setSelectedPrice(formattedAmount);

        // 如果当前已选择了Paypal支付方式，则重新计算转换后的金额
        if (selectedOperator === "paypal") {
          handleCurrencyConversion(formattedAmount, currentCurrency);
        }
        // 如果当前已选择了Wave支付方式，则重新计算转换后的FCFA金额
        else if (selectedOperator === "wave") {
          handleCurrencyConversion(formattedAmount, "FCFA");
        }
        // 如果当前已选择了信用卡支付方式，则重新计算转换后的金额
        else if (selectedOperator === "bank_card") {
          handleCurrencyConversion(formattedAmount, currentCurrency);
        }
        // 如果当前已选择了mobile money支付方式，则重新计算转换后的本地货币金额
        else if (selectedOperator === "mobile_money") {
          handleCurrencyConversion(formattedAmount, currentCurrency);
        }
        // 保留原有的逻辑
        else if (selectedOperator === "currency") {
          handleCurrencyConversion(formattedAmount, currentCurrency);
        }
      }
    }
    setShowCustomAmountInput(false);
  };

  const toggleCustomAmountInput = () => {
    setShowCustomAmountInput(!showCustomAmountInput);
    // If opening the input, clear previous value and focus
    if (!showCustomAmountInput) {
      setCustomAmount("");
      // Focus the input after a short delay to ensure it's visible
      setTimeout(() => {
        customAmountInputRef.current?.focus();
      }, 100);
    } else {
      // 如果关闭输入框，则保存当前输入的金额
      handleCustomAmountSubmit();
    }
  };

  const handleButtonClick = async () => {
    if (selectedOperator) {
      // 准备支付参数，方便后续发送
      const params = {
        originalAmount: parseFloat(selectedPrice.replace(/,/g, "")),
        amount: parseFloat(selectedPrice.replace(/,/g, "")),
        currency: user?.currency,
        payment_method: "",
        selectedPriceLabel: selectedPrice + " " + user?.currency,
      };

      // 根据selectedOperator确定支付方式
      // 查找选中的支付方式
      const selectedMethod = paymentMethods.find(
        (method) => method.key === selectedOperator
      );
      if (selectedMethod) {
        // 使用key作为支付方式标识
        params.payment_method = selectedMethod.key;

        // 如果是paypal，设置货币转换相关参数
        if (selectedMethod.key === "paypal") {
          params.currency = currentCurrency;

          // 使用转换后的金额，如果有
          if (convertedAmount.length > 0) {
            const convertedTotal = convertedAmount.find(
              (item) => item.item_key === "total_amount"
            );
            if (convertedTotal) {
              params.amount = convertedTotal.converted_amount;
            }
          }
        }
        // 如果是wave，固定使用FCFA
        else if (selectedMethod.key === "wave") {
          params.currency = "FCFA";
          // 使用转换后的FCFA金额，如果有
          if (convertedAmount.length > 0) {
            const convertedTotal = convertedAmount.find(
              (item) => item.item_key === "total_amount"
            );
            if (convertedTotal) {
              params.amount = convertedTotal.converted_amount;
            }
          } else {
            // 如果没有转换结果，使用原始金额作为备用
            params.amount = parseFloat(selectedPrice.replace(/,/g, ""));
          }
          // selectedPriceLabel 保持显示原始美元金额
          // params.selectedPriceLabel 已经在上面设置为原始金额，不需要修改
        }
        // 如果是信用卡，设置货币转换相关参数
        else if (selectedMethod.key === "bank_card") {
          params.currency = currentCurrency;

          // 使用转换后的金额，如果有
          if (convertedAmount.length > 0) {
            const convertedTotal = convertedAmount.find(
              (item) => item.item_key === "total_amount"
            );
            if (convertedTotal) {
              params.amount = convertedTotal.converted_amount;
            }
          }
        }
        // 如果是mobile money，使用转换后的本地货币
        else if (selectedMethod.key === "mobile_money") {
          params.currency = currentCurrency; // 使用当前选择的本地货币

          // 使用转换后的本地货币金额，如果有
          if (convertedAmount.length > 0) {
            const convertedTotal = convertedAmount.find(
              (item) => item.item_key === "total_amount"
            );
            if (convertedTotal) {
              params.amount = convertedTotal.converted_amount;
            }
          } else {
            // 如果没有转换结果，使用原始金额作为备用
            params.amount = parseFloat(selectedPrice.replace(/,/g, ""));
          }
        }
        // mobile_money 的其他处理现在在 PhoneNumberInputModal 内部进行
      } else if (selectedOperator === "balance") {
        params.payment_method = "Balance";
      } else if (selectedOperator === "currency") {
        // 当选择了货币转换时（这是旧的处理逻辑，保留作为备用）
        params.payment_method = "paypal";
        params.currency = currentCurrency; // 使用选择的货币

        // 使用转换后的金额，如果有
        if (convertedAmount.length > 0) {
          const convertedTotal = convertedAmount.find(
            (item) => item.item_key === "total_amount"
          );
          if (convertedTotal) {
            params.amount = convertedTotal.converted_amount;
          }
        }
      }

      // 保存支付参数
      setPaymentParams(params);


      // 导航到充值摘要页面而不是显示模态框
      navigation.navigate("RechargeSummary", {
        paymentParams: params,
        validDigits: validDigits,
      });
    }
  };

  // 提取一个专门用于货币转换的函数
  const handleCurrencyConversion = (price: string, currency: string) => {
    setIsConverting(true);

    // 格式化金额，去除逗号
    const amount = parseFloat(price.replace(/,/g, ""));

    // 如果金额为0或无效，则不进行转换
    if (!amount || isNaN(amount)) {
      setIsConverting(false);
      return;
    }

    // 如果源货币和目标货币相同，直接返回原金额
    if (user?.currency === currency) {
      setConvertedAmount([
        {
          converted_amount: amount,
          item_key: "total_amount",
          original_amount: amount,
        },
      ]);
      setIsConverting(false);
      return;
    }


    // 调用货币转换API
    const data = {
      from_currency: user?.currency,
      to_currency: currency,
      amounts: {
        total_amount: amount,
        domestic_shipping_fee: 0,
        shipping_fee: 0,
      },
    };

    payApi
      .convertCurrency(data)
      .then((res) => {
        if (
          res &&
          res.converted_amounts_list &&
          res.converted_amounts_list.length > 0
        ) {
          setConvertedAmount(res.converted_amounts_list);
        } else {
          // 使用近似汇率作为备用
          const fallbackRate = currency === "USD" ? 580.0 : 655.96; // 1 USD = 580 FCFA, 1 EUR = 655.96 FCFA
          const convertedValue = amount / fallbackRate;

          setConvertedAmount([
            {
              converted_amount: convertedValue,
              item_key: "total_amount",
              original_amount: amount,
            },
          ]);
        }
      })
      .catch((error) => {

        // 使用近似汇率作为备用
        const fallbackRate = currency === "USD" ? 580.0 : 655.96;
        const convertedValue = amount / fallbackRate;

        setConvertedAmount([
          {
            converted_amount: convertedValue,
            item_key: "total_amount",
            original_amount: amount,
          },
        ]);
      })
      .finally(() => {
        setIsConverting(false);
      });
  };

  // 修改货币选择函数，调用通用的转换函数
  const handleCurrencySelect = (currency: string) => {
    // 如果货币没有变化，则不重新计算
    if (currency === currentCurrency) {
      return;
    }

    setCurrentCurrency(currency);

    // 确保我们有选定的金额可以转换
    if (selectedPrice) {
      // 显示转换中状态
      setIsConverting(true);
      handleCurrencyConversion(selectedPrice, currency);
    }
  };


  // 添加一个函数来判断确认按钮是否应该被禁用
  const isConfirmButtonDisabled = () => {
    // 如果没有选择支付方式，禁用按钮
    if (!selectedOperator) {
      return true;
    }

    // 如果没有选择金额，禁用按钮
    if (!selectedPrice) {
      return true;
    }

    // 如果正在进行货币转换，禁用按钮
    if (isConverting) {
      return true;
    }

    // 如果选择了Paypal支付方式，但还没有转换结果，禁用按钮
    if (
      selectedOperator === "paypal" &&
      (convertedAmount.length === 0 ||
        !convertedAmount.find((item) => item.item_key === "total_amount"))
    ) {
      return true;
    }

    // 如果选择了Wave支付方式，但还没有转换结果，禁用按钮
    if (
      selectedOperator === "wave" &&
      (convertedAmount.length === 0 ||
        !convertedAmount.find((item) => item.item_key === "total_amount"))
    ) {
      return true;
    }

    // 如果选择了信用卡支付方式，但还没有转换结果，禁用按钮
    if (
      selectedOperator === "bank_card" &&
      (convertedAmount.length === 0 ||
        !convertedAmount.find((item) => item.item_key === "total_amount"))
    ) {
      return true;
    }

    // 如果选择了mobile money支付方式，但还没有转换结果，禁用按钮
    if (
      selectedOperator === "mobile_money" &&
      (convertedAmount.length === 0 ||
        !convertedAmount.find((item) => item.item_key === "total_amount"))
    ) {
      return true;
    }

    // 其他情况下，启用按钮
    return false;
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon size={fontSize(18)} />
          </TouchableOpacity>
          <Text style={styles.title}>{t("balance.recharge.title")}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.container2}>
            <TouchableOpacity
              style={styles.amountRechargeContainer}
              onPress={toggleCustomAmountInput}
            >
              {showCustomAmountInput ? (
                <View style={styles.customAmountInputContainer}>
                  <TextInput
                    ref={customAmountInputRef}
                    style={styles.customAmountInput}
                    value={customAmount}
                    onChangeText={handleCustomAmountChange}
                    keyboardType="numeric"
                    returnKeyType="done"
                    placeholder={t("balance.recharge.choose_amount")}
                    placeholderTextColor="#999"
                    onSubmitEditing={handleCustomAmountSubmit}
                    onBlur={handleCustomAmountSubmit}
                    autoFocus
                  />
                  <Text style={styles.currencyLabel}>{user?.currency}</Text>
                  <TouchableOpacity 
                    style={styles.customAmountConfirmButton}
                    onPress={handleCustomAmountSubmit}
                  >
                    <Text style={styles.customAmountConfirmButtonText}>✓</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text
                  style={
                    customAmountDisplayText
                      ? styles.customAmountText
                      : styles.rechargePromptTextStyle
                  }
                >
                  {customAmountDisplayText ||
                    t("balance.recharge.choose_amount")}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 金额选择 */}
          <View style={styles.priceGroup}>
            {recommendedAmounts && recommendedAmounts.amounts && (
              <>
                <View style={styles.row}>
                  {recommendedAmounts.amounts
                    .slice(0, 3)
                    .map((amount, index) => {
                      // 如果有自定义金额，则不显示任何选中状态
                      const isSelected = customAmountDisplayText
                        ? false
                        : selectedPrice === amount.toString();
                      
                      // 检查是否为第一行的最后一个元素
                      const isLastInFirstRow = index === Math.min(recommendedAmounts.amounts.length, 3) - 1;

                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            index === 0
                              ? styles.priceBoxBlue
                              : styles.priceBoxWhite,
                            isSelected
                              ? styles.priceBoxSelected
                              : styles.priceBoxUnselected,
                            isLastInFirstRow && styles.priceBoxLast,
                          ]}
                          onPress={() => {
                            setCustomAmountDisplayText("");
                            handlePriceSelect(amount.toString());
                          }}
                          activeOpacity={1}
                        >
                          <Text
                            style={[
                              index === 0
                                ? styles.priceTextBlue
                                : styles.priceText,
                              isSelected
                                ? styles.priceTextSelected
                                : styles.priceTextUnselected,
                            ]}
                          >
                            {amount.toLocaleString()}
                          </Text>
                          <Text
                            style={[
                              index === 0
                                ? styles.currencyTextBlue
                                : styles.currencyText,
                              isSelected
                                ? styles.currencyTextSelected
                                : styles.currencyTextUnselected,
                            ]}
                          >
                            {recommendedAmounts.currency || "FCFA"}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>
                {recommendedAmounts.amounts.length > 3 && (
                  <View style={[styles.row, styles.secondRow]}>
                    {recommendedAmounts.amounts
                      .slice(3)
                      .map((amount, index) => {
                        // 如果有自定义金额，则不显示任何选中状态
                        const isSelected = customAmountDisplayText
                          ? false
                          : selectedPrice === amount.toString();
                        
                        // 检查是否为第二行的最后一个元素
                        const secondRowItems = recommendedAmounts.amounts.slice(3);
                        const isLastInSecondRow = index === secondRowItems.length - 1;

                        return (
                          <TouchableOpacity
                            key={index + 3}
                            style={[
                              styles.priceBoxWhite,
                              isSelected
                                ? styles.priceBoxSelected
                                : styles.priceBoxUnselected,
                              isLastInSecondRow && styles.priceBoxLast,
                            ]}
                            onPress={() => {
                              setCustomAmountDisplayText("");
                              handlePriceSelect(amount.toString());
                            }}
                            activeOpacity={1}
                          >
                            <Text
                              style={[
                                styles.priceText,
                                isSelected
                                  ? styles.priceTextSelected
                                  : styles.priceTextUnselected,
                              ]}
                            >
                              {amount.toLocaleString()}
                            </Text>
                            <Text
                              style={[
                                styles.currencyText,
                                isSelected
                                  ? styles.currencyTextSelected
                                  : styles.currencyTextUnselected,
                              ]}
                            >
                              {recommendedAmounts.currency || "FCFA"}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                  </View>
                )}
              </>
            )}
          </View>

          {/* 支付方式标题 */}
          <View style={styles.section}>
            <Text style={styles.subtitle}>
              {t("balance.recharge.payment_method")}
            </Text>
          </View>

          {/* Tab Bar */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 0 && styles.activeTab]}
              onPress={() => setActiveTab(0)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 0 && styles.activeTabText,
                ]}
              >
                {t("balance.recharge.payment_mode")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 1 && styles.activeTab]}
              onPress={() => navigation.navigate("OfflinePayment")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 1 && styles.activeTabText,
                ]}
              >
                {t("balance.recharge.offline_payment")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 0 ? (
            <>
              {/* 显示所有在线支付方式 */}
              {paymentMethods.map((method, index) => (
                <View key={index}>
                  <View
                    style={
                      method.key === "balance"
                        ? styles.balanceInfoContainer
                        : styles.cardContainer
                    }
                  >
                    {method.key === "balance" ? (
                      // 余额支付特殊显示
                      <View style={styles.leftInfo}>
                        <View style={styles.blueBox}>
                          <Image
                            source={getPayMap(method.key) as any}
                            style={styles.operatorImage}
                          />
                        </View>
                        <Text style={styles.balanceText}>
                          {t("balance.recharge.balance_remaining")}
                          {"\n"}
                          {user.balance}
                          {user.currency}
                        </Text>
                      </View>
                    ) : (
                      // 普通支付方式
                      <View style={styles.iconRow}>
                        <View style={styles.imageContainer}>
                          <Image
                            source={getPayMap(method.key) as any}
                            style={styles.operatorImage}
                          />
                          <View style={styles.mobileMoneyTextContainer}>
                            {method.key === "mobile_money" &&
                              (Array.isArray(method.value) ? (
                                method.value.map((item, index) => (
                                  <View
                                    style={styles.mobileMoneyImgContainer}
                                    key={index}
                                  >
                                    <Image
                                      key={index}
                                      source={getPayMap(item) as any}
                                      style={styles.mobileMoneyImg}
                                    />
                                  </View>
                                ))
                              ) : (
                                <Text style={styles.mobileMoneyText}>1234</Text>
                              ))}
                          </View>
                        </View>
                      </View>
                    )}

                    {/* 右侧圆圈图标 */}
                    <TouchableOpacity
                      onPress={() => handleOperatorSelect(method.key)}
                    >
                      <View style={styles.checkboxContainer}>
                        <CircleOutlineIcon
                          size={fontSize(24)}
                          strokeColor={
                            selectedOperator === method.key
                              ? "#FF5100"
                              : undefined
                          }
                          fillColor={
                            selectedOperator === method.key
                              ? "#FF5100"
                              : undefined
                          }
                        />
                        {selectedOperator === method.key && (
                          <View style={styles.checkmarkContainer}>
                            <CheckIcon size={fontSize(12)} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* PayPal展开视图 */}
                  {method.key === "paypal" &&
                    selectedOperator === "paypal" &&
                    isPaypalExpanded && (
                      <View style={styles.paypalExpandedContainer}>
                        <View style={styles.paypalCurrencyContainer}>
                          <Text style={styles.currencyTitle}>
                            {t("balance.recharge.currency_title")}
                          </Text>
                          <View style={styles.currencyButtonsContainer}>
                            <TouchableOpacity
                              style={[
                                styles.currencyButton,
                                currentCurrency === "USD" &&
                                  styles.currencyButtonActive,
                              ]}
                              onPress={() => handleCurrencySelect("USD")}
                            >
                              <Text
                                style={[
                                  styles.currencyButtonText,
                                  currentCurrency === "USD" &&
                                    styles.currencyButtonTextActive,
                                ]}
                              >
                                USD
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.currencyButton,
                                currentCurrency === "EUR" &&
                                  styles.currencyButtonActive,
                              ]}
                              onPress={() => handleCurrencySelect("EUR")}
                            >
                              <Text
                                style={[
                                  styles.currencyButtonText,
                                  currentCurrency === "EUR" &&
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
                              <ActivityIndicator size="small" color="#FF5100" />
                              <Text style={styles.convertingText}>
                                {t("balance.recharge.converting")}
                              </Text>
                            </View>
                          ) : convertedAmount.length > 0 ? (
                            <View style={styles.convertedAmountContainer}>
                              <Text style={styles.convertedAmountLabel}>
                                {t("balance.recharge.equivalent_amount")}
                              </Text>
                              <Text style={styles.convertedAmountValue}>
                                {convertedAmount
                                  .find(
                                    (item) => item.item_key === "total_amount"
                                  )
                                  ?.converted_amount.toFixed(2)}{" "}
                                {currentCurrency}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    )}

                  {/* Wave展开视图 */}
                  {method.key === "wave" &&
                    selectedOperator === "wave" &&
                    isWaveExpanded && (
                      <View style={styles.paypalExpandedContainer}>
                        <View style={styles.paypalCurrencyContainer}>
                          <Text style={styles.currencyTitle}>
                            {t("balance.recharge.currency_title")}
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
                              <ActivityIndicator size="small" color="#FF5100" />
                              <Text style={styles.convertingText}>
                                {t("balance.recharge.converting")}
                              </Text>
                            </View>
                          ) : convertedAmount.length > 0 ? (
                            <View style={styles.convertedAmountContainer}>
                              <Text style={styles.convertedAmountLabel}>
                                {t("balance.recharge.equivalent_amount")}
                              </Text>
                              <Text style={styles.convertedAmountValue}>
                                {convertedAmount
                                  .find(
                                    (item) => item.item_key === "total_amount"
                                  )
                                  ?.converted_amount.toFixed(2)}{" "}
                                {currentCurrency}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    )}

                  {/* 信用卡展开视图 */}
                  {method.key === "bank_card" &&
                    selectedOperator === "bank_card" &&
                    isBankCardExpanded && (
                      <View style={styles.paypalExpandedContainer}>
                        <View style={styles.paypalCurrencyContainer}>
                          <Text style={styles.currencyTitle}>
                            {t("balance.recharge.currency_title")}
                          </Text>
                          <View style={styles.currencyButtonsContainer}>
                            <TouchableOpacity
                              style={[
                                styles.currencyButton,
                                currentCurrency === "USD" &&
                                  styles.currencyButtonActive,
                              ]}
                              onPress={() => handleCurrencySelect("USD")}
                            >
                              <Text
                                style={[
                                  styles.currencyButtonText,
                                  currentCurrency === "USD" &&
                                    styles.currencyButtonTextActive,
                                ]}
                              >
                                USD
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.currencyButton,
                                currentCurrency === "EUR" &&
                                  styles.currencyButtonActive,
                              ]}
                              onPress={() => handleCurrencySelect("EUR")}
                            >
                              <Text
                                style={[
                                  styles.currencyButtonText,
                                  currentCurrency === "EUR" &&
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
                              <ActivityIndicator size="small" color="#FF5100" />
                              <Text style={styles.convertingText}>
                                {t("balance.recharge.converting")}
                              </Text>
                            </View>
                          ) : convertedAmount.length > 0 ? (
                            <View style={styles.convertedAmountContainer}>
                              <Text style={styles.convertedAmountLabel}>
                                {t("balance.recharge.equivalent_amount")}
                              </Text>
                              <Text style={styles.convertedAmountValue}>
                                {convertedAmount
                                  .find(
                                    (item) => item.item_key === "total_amount"
                                  )
                                  ?.converted_amount.toFixed(2)}{" "}
                                {currentCurrency}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    )}

                  {/* Mobile Money展开视图 */}
                  {method.key === "mobile_money" &&
                    selectedOperator === "mobile_money" &&
                    isMobileMoneyExpanded && (
                      <View style={styles.paypalExpandedContainer}>
                        <View style={styles.paypalCurrencyContainer}>
                          <Text style={styles.currencyTitle}>
                            {t("balance.recharge.currency_title")}
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
                                {currentCurrency}
                              </Text>
                            </View>
                          </View>

                          {/* 显示转换后的金额 */}
                          {isConverting ? (
                            <View style={styles.convertingContainer}>
                              <ActivityIndicator size="small" color="#FF5100" />
                              <Text style={styles.convertingText}>
                                {t("balance.recharge.converting")}
                              </Text>
                            </View>
                          ) : convertedAmount.length > 0 ? (
                            <View style={styles.convertedAmountContainer}>
                              <Text style={styles.convertedAmountLabel}>
                                {t("balance.recharge.equivalent_amount")}
                              </Text>
                              <Text style={styles.convertedAmountValue}>
                                {convertedAmount
                                  .find(
                                    (item) => item.item_key === "total_amount"
                                  )
                                  ?.converted_amount.toFixed(2)}{" "}
                                {currentCurrency}
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
              <View style={styles.flexContainer}>
                <View style={styles.imageContainer}>
                  <Image
                    source={require("../../../assets/img/image_c6aa9539.png")}
                    style={styles.imageStyle}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.verticalAlignEndContent}>
                  <View style={styles.svgContainer}>
                    <TouchableOpacity
                      onPress={() => handleOperatorSelect("mtn")}
                    >
                      <View style={styles.checkboxContainer}>
                        <CircleOutlineIcon
                          size={fontSize(24)}
                          strokeColor={
                            selectedOperator === "mtn" ? "#FF5100" : undefined
                          }
                          fillColor={
                            selectedOperator === "mtn" ? "#FF5100" : undefined
                          }
                        />
                        {selectedOperator === "mtn" && (
                          <View style={styles.checkmarkContainer}>
                            <CheckIcon size={fontSize(12)} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.flexContainer}>
                <View style={styles.imageContainer}>
                  <Image
                    source={require("../../../assets/img/Global 1.png")}
                    style={styles.imageStyle}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.verticalAlignEndContent}>
                  <View style={styles.svgContainer}>
                    <TouchableOpacity
                      onPress={() => handleOperatorSelect("mtn")}
                    >
                      <View style={styles.checkboxContainer}>
                        <CircleOutlineIcon
                          size={fontSize(24)}
                          strokeColor={
                            selectedOperator === "mtn" ? "#FF5100" : undefined
                          }
                          fillColor={
                            selectedOperator === "mtn" ? "#FF5100" : undefined
                          }
                        />
                        {selectedOperator === "mtn" && (
                          <View style={styles.checkmarkContainer}>
                            <CheckIcon size={fontSize(12)} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* 操作按钮 - 固定在底部 */}
        <View style={styles.actionButtonsContainer}>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
              <Text style={styles.buttonTextDark}>
                {t("balance.recharge.cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                isConfirmButtonDisabled() && styles.confirmButtonDisabled,
              ]}
              onPress={handleButtonClick}
              disabled={isConfirmButtonDisabled()}
            >
              <Text style={styles.buttonTextWhite}>
                {isConverting
                  ? t("balance.recharge.converting")
                  : t("balance.recharge.confirm")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>


    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    paddingBottom: 16,
    position: "relative",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#ff6f301a",
  },
  scrollContent: {
    padding: 24,
    paddingTop: 20,
    backgroundColor: "#f8f9fa",
    paddingBottom: 100, // 为底部按钮留出空间
  },
  container: {
    padding: 24,
    backgroundColor: "#f8f9fa",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: fontSize(22),
    fontWeight: "700",
    color: "#333333",
    flex: 1,
    textAlign: "center",
    letterSpacing: 0.5,
    marginRight: 48, // 为了平衡左侧的返回按钮，右侧也留出相同的空间
  },
  section: {
    marginTop: 44,
  },
  subtitle: {
    fontSize: fontSize(18),
    fontWeight: "600",
    color: "#333333",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  priceGroup: {
    marginTop: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingHorizontal: 2,
  },
  secondRow: {
    marginTop: 20,
  },
  priceBoxBlue: {
    flex: 1,
    minWidth: 90,
    height: 60,
    backgroundColor: "#FFF4F0",
    borderColor: "#FF5100",
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: "3%",
    elevation: 2,
    shadowColor: "#FF5100",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priceBoxWhite: {
    flex: 1,
    minWidth: 90,
    height: 60,
    backgroundColor: "white",
    borderColor: "#e0e0e0",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: "3%",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  priceBoxLast: {
    marginRight: 0,
  },
  priceTextBlue: {
    fontSize: fontSize(14),
    fontWeight: "700",
    color: "#FF5100",
    textAlign: "center",
  },
  currencyTextBlue: {
    fontSize: fontSize(11),
    color: "#FF5100",
    marginTop: 2,
    fontWeight: "500",
  },
  priceText: {
    fontSize: fontSize(14),
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },
  currencyText: {
    fontSize: fontSize(11),
    color: "#666666",
    marginTop: 2,
    fontWeight: "500",
  },
  operatorCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  operatorImage: {
    width: 80,
    height: 30,
    resizeMode: "contain",
  },
  operatorImage1: {
    width: 228,
    height: 30,
    resizeMode: "contain",
  },
  orangeText: {
    color: "#ff5100",
    fontSize: fontSize(12),
    fontWeight: "500",
    marginLeft: 12,
  },
  iconRow: {
    flexDirection: "row",
    gap: 10,
  },
  operatorIcon: {
    width: 60,
    height: 22,
    resizeMode: "contain",
  },
  currencyContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 5,
  },
  currencyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 6,
  },
  currencyImage: {
    width: 80,
    height: 30,
    resizeMode: "contain",
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  currencyButtonActive: {
    backgroundColor: "#FF5100",
    elevation: 2,
    shadowColor: "#FF5100",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  currencyButtonInactive: {
    backgroundColor: "#eeeeee",
    borderRadius: 18,
    width: widthUtils(36, 100).width,
    height: widthUtils(36, 100).height,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  buttonTextWhite: {
    color: "white",
    fontWeight: "600",
  },
  buttonTextDark: {
    color: "black",
    fontWeight: "500",
  },
  totalText: {
    marginTop: 16,
    fontWeight: "900",
    fontSize: fontSize(16),
    color: "#ff5100",
  },
  actionButtonsContainer: {
    padding: 24,
    paddingTop: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#ff6f301a",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
  },
  cancelButton: {
    backgroundColor: "white",
    borderRadius: 25,
    width: widthUtils(50, 160).width,
    height: widthUtils(50, 160).height,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
  },
  confirmButton: {
    backgroundColor: "#FF5100",
    borderRadius: 25,
    width: widthUtils(50, 160).width,
    height: widthUtils(50, 160).height,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#FF5100",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  confirmButtonDisabled: {
    backgroundColor: "#cccccc",
    opacity: 0.7,
    elevation: 0,
    shadowOpacity: 0,
  },
  balanceInfoContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 60,
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  leftInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  blueBox: {
    flexDirection: "row",
    backgroundColor: "#FF5100",
    paddingHorizontal: 7,
    paddingLeft: 6,
    alignItems: "center",
    borderRadius: 8,
  },
  saleText: {
    fontSize: fontSize(16),
    fontFamily: "Timmana",
    color: "white",
    marginLeft: 4,
  },
  balanceText: {
    marginLeft: 17,
    fontSize: fontSize(11),
    lineHeight: 14,
    fontWeight: "500",
    color: "#333333",
  },
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  imageSmall: {
    width: widthUtils(30, 24).width,
    height: widthUtils(30, 24).height,
    resizeMode: "contain",
  },
  imageLarge: {
    width: widthUtils(26, 44).width,
    height: widthUtils(26, 44).height,
    resizeMode: "contain",
  },
  emptyBox: {
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  container1: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginTop: 10,
  },
  button: {
    width: widthUtils(36, 190).width,
    height: widthUtils(36, 190).height,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonActive: {
    backgroundColor: "#FF5100",
    elevation: 2,
    shadowColor: "#FF5100",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonInactive: {
    backgroundColor: "#fdfefe",
  },
  textActive: {
    color: "white",
    fontWeight: "600",
    fontSize: fontSize(15),
  },
  textInactive: {
    color: "black",
    fontSize: fontSize(15),
  },
  priceBoxSelected: {
    backgroundColor: "#FFF4F0",
    borderColor: "#FF5100",
    borderWidth: 2,
    elevation: 3,
    shadowColor: "#FF5100",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  priceBoxUnselected: {
    backgroundColor: "white",
    borderColor: "#e0e0e0",
    borderWidth: 1,
  },
  priceTextSelected: {
    color: "#FF5100",
    fontSize: fontSize(14),
    fontWeight: "700",
    textAlign: "center",
  },
  priceTextUnselected: {
    color: "#333",
    fontSize: fontSize(14),
    fontWeight: "700",
    textAlign: "center",
  },
  currencyTextSelected: {
    color: "#FF5100",
  },
  currencyTextUnselected: {
    color: "#666666",
  },
  backButton: {
    padding: 5,
    position: "absolute",
    left: 24,
    zIndex: 1,
  },
  checkboxContainer: {
    position: "relative",
    width: fontSize(24),
    height: fontSize(24),
  },
  checkmarkContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  container2: {
    width: "100%",
    marginTop: 20,
  },
  amountRechargeContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: 60,
    backgroundColor: "white",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  rechargePromptTextStyle: {
    flex: 0,
    padding: 0,
    margin: 0,
    fontSize: fontSize(14),
    lineHeight: 14,
    color: "#747474",
    // Note: PingFang SC font might not be available by default in React Native
    // You may need to load custom fonts using expo-font or other methods
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    marginTop: 16,
    padding: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#FF5100",
    elevation: 2,
    shadowColor: "#FF5100",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: fontSize(14),
    color: "#333",
    fontWeight: "500",
  },
  activeTabText: {
    color: "white",
    fontWeight: "600",
  },
  emptyTab: {
    backgroundColor: "white",
    borderRadius: 5,
    padding: 20,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    height: 200,
  },
  emptyTabText: {
    color: "#666",
    fontSize: fontSize(14),
  },
  outerContainer: {
    width: "100%",
  },
  flexContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: 60,
    paddingRight: 16,
    paddingLeft: 16,
    backgroundColor: "white",
    borderRadius: 12,
    marginTop: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  imageContainer: {
    flexDirection: "column",
  },
  mobileMoneyTextContainer: {
    width: "100%",
    marginTop: 3,
    alignItems: "flex-start",
    flexDirection: "row",
  },
  mobileMoneyImgContainer: {
    width: 60,
    height: 22,
    borderWidth: 0,
    marginRight: 5,
  },
  mobileMoneyImg: {
    width: 60,
    height: 22,
    borderWidth: 0,
  },
  imageStyle: {
    width: 80,
    height: 30,
    borderWidth: 0,
  },
  verticalAlignEndContent: {
    flexDirection: "column",
    alignItems: "flex-end",
    width: "73.46%",
  },
  svgContainer: {
    width: 24,
    height: 24,
  },
  backButtonText: {
    fontSize: fontSize(14),
    color: "#007AFF",
    fontWeight: "500",
  },
  blankPage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  blankPageText: {
    fontSize: fontSize(16),
    color: "#666",
  },
  paymentSection2: {
    paddingTop: 24,
    paddingRight: 20,
    paddingBottom: 333,
    paddingLeft: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  paymentSectionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
  },
  paymentSection: {
    width: "8.48%",
    paddingRight: 15,
  },
  svgContainer1: {
    width: 18,
    height: 18,
  },
  paymentSection1: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "91.52%",
    paddingRight: 33,
  },
  paymentHeadingStyle: {
    padding: 0,
    margin: 0,
    fontSize: fontSize(24),
    lineHeight: 22,
    color: "black",
    textTransform: "capitalize",
    fontFamily: "Montserrat-Bold",
  },
  transactionSummaryContainer1: {
    width: "100%",
  },
  transactionSummaryContainer: {
    width: "100%",
    paddingRight: 15,
    paddingLeft: 15,
    backgroundColor:
      "linear-gradient(90deg, #cee5ff 0%, #eef4ff 100%)",
    borderRadius: 5,
  },
  flexContainerWithImages: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  imageContainerStyled: {
    width: 99,
    height: 36,
    borderWidth: 0,
  },
  imageContainerWithBorder: {
    width: 135,
    height: 140,
    marginLeft: 141,
    borderWidth: 0,
  },
  amountContainer: {
    width: "100%",
    paddingTop: 8,
    paddingRight: 11,
    paddingBottom: 10,
    paddingLeft: 11,
    marginTop: -83,
    backgroundColor: "white",
    borderWidth: 1,
    borderRadius: 5,
  },
  amountLabel: {
    padding: 0,
    margin: 0,
    fontSize: fontSize(12),
    color: "#7f7e7e",
    fontFamily: "PingFangSC-Medium",
  },
  amountContainer1: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    marginTop: 1,
  },
  priceHeading: {
    padding: 0,
    paddingBottom: 5,
    margin: 0,
    fontSize: fontSize(24),
    lineHeight: 22,
    color: "#161616",
    fontFamily: "Montserrat-Bold",
  },
  priceLabel: {
    padding: 0,
    paddingTop: 5,
    margin: 0,
    marginLeft: 3,
    fontSize: fontSize(12),
    color: "#7f7e7e",
    fontFamily: "PingFangSC-Medium",
  },
  mobileInfoSection: {
    width: "100%",
    marginTop: 30,
  },
  mobileNumberSection: {
    width: "100%",
  },
  mobileNumberLabel: {
    padding: 0,
    margin: 0,
    fontSize: fontSize(14),
    lineHeight: 18,
    color: "black",
    fontFamily: "PingFangSC-Regular",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    height: 50,
    paddingRight: 12,
    paddingLeft: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#d8d8d8",
    borderRadius: 25,
  },
  flexRowWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  maskedImageWithText: {
    width: 20,
    height: 12,
    borderWidth: 0,
  },
  highlightText: {
    padding: 0,
    margin: 0,
    marginLeft: 3,
    fontSize: fontSize(16),
    lineHeight: 22,
    color: "#1c284e",
    fontFamily: "PingFangSC-Semibold",
  },
  svgContainer2: {
    width: 12,
    height: 12,
    marginLeft: 12,
  },
  verticalDivider: {
    width: 1,
    height: 30,
    marginLeft: 8.5,
    borderLeftWidth: 1,
    borderColor: "#b1b1b1",
  },
  statisticText: {
    padding: 0,
    margin: 0,
    marginLeft: 19.5,
    fontSize: fontSize(16),
    lineHeight: 22,
    color: "#1c284e",
    fontFamily: "PingFangSC-Semibold",
  },
  mobileOperatorsContainer: {
    width: "100%",
    marginTop: 20,
  },
  operatorSupportContainer: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 12,
  },
  imageContainerWithBorder1: {
    width: 70,
    height: 26,
    borderWidth: 0,
  },
  blueBoxContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    marginTop: 50,
    backgroundColor: "#002fa7",
    borderRadius: 25,
  },
  paymentNotice1: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  paymentNotice: {
    padding: 0,
    margin: 0,
    fontSize: fontSize(16),
    color: "white",
    fontFamily: "Montserrat-Bold",
  },
  paymentConfirmContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  paymentSummaryCard: {
    backgroundColor: "#f5f9ff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  paymentSummaryTitle: {
    fontSize: fontSize(18),
    fontWeight: "700",
    marginBottom: 15,
    color: "#333",
  },
  paymentSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  paymentSummaryLabel: {
    fontSize: fontSize(14),
    color: "#666",
  },
  paymentSummaryValue: {
    fontSize: fontSize(14),
    fontWeight: "500",
    color: "#333",
  },
  paymentSummaryValueHighlight: {
    fontSize: fontSize(14),
    fontWeight: "600",
    color: "#ff5100",
  },
  phoneInputContainer: {
    marginBottom: 20,
  },
  phoneInputLabel: {
    fontSize: fontSize(16),
    fontWeight: "500",
    marginBottom: 10,
    color: "#333",
  },
  phoneInputWrapper: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 25,
    overflow: "hidden",
  },
  countryCodeContainer: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 15,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#ddd",
  },
  countryCodeText: {
    fontSize: fontSize(16),
    color: "#333",
  },
  phoneInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: fontSize(16),
    color: "#333",
    backgroundColor: "transparent",
  },
  supportedOperatorsContainer: {
    marginBottom: 30,
  },
  supportedOperatorsTitle: {
    fontSize: fontSize(16),
    fontWeight: "500",
    marginBottom: 10,
    color: "#333",
  },
  operatorsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  operatorSmallIcon: {
    width: 70,
    height: 26,
    resizeMode: "contain",
    marginRight: 15,
  },
  payButton: {
    backgroundColor: "#002fa7",
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  payButtonDisabled: {
    backgroundColor: "#8da0d4",
    opacity: 0.7,
  },
  payButtonText: {
    color: "white",
    fontSize: fontSize(16),
    fontWeight: "700",
  },
  customAmountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  customAmountInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    fontSize: fontSize(16),
    color: "#333",
    backgroundColor: "transparent",
  },
  currencyLabel: {
    fontSize: fontSize(14),
    color: "#7f7e7e",
    marginLeft: 10,
    marginRight: 10,
  },
  customAmountText: {
    fontSize: fontSize(16),
    fontWeight: "600",
    color: "#FF5100",
    textAlign: "center",
  },
  customAmountConfirmButton: {
    backgroundColor: "#FF5100",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  customAmountConfirmButtonText: {
    color: "white",
    fontSize: fontSize(18),
    fontWeight: "bold",
  },
  paypalExpandedContainer: {
    backgroundColor: "#f9f9f9",
    marginTop: 0,
    marginBottom: 15,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    padding: 15,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#ddd",
  },
  paypalCurrencyContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 5,
  },
  currencyTitle: {
    fontSize: fontSize(14),
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  currencyButtonsContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  currencyButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginRight: 10,
  },
  currencyButtonText: {
    fontSize: fontSize(14),
    fontWeight: "500",
    color: "#333",
  },
  currencyButtonTextActive: {
    color: "white",
  },
  convertingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  convertingText: {
    marginLeft: 10,
    fontSize: fontSize(14),
    color: "#333",
  },
  convertedAmountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  convertedAmountLabel: {
    fontSize: fontSize(14),
    color: "#666",
  },
  convertedAmountValue: {
    fontSize: fontSize(16),
    fontWeight: "700",
    color: "#FF5100",
  },
  mobileMoneyText: {
    fontSize: fontSize(12),
    color: "#7f7e7e",
    marginTop: 5,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "#00000080",
    zIndex: 9999,
    elevation: 9999,
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    width: "100%",
    maxHeight: "85%",
    minHeight: 400,
    height: "85%",
    zIndex: 10000,
    elevation: 10000,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: fontSize(18),
    fontWeight: "700",
    color: "black",
  },
  closeButtonContainer: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: fontSize(16),
    fontWeight: "700",
    color: "#007AFF",
  },
  countryItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
  },
  countryItemText: {
    fontSize: fontSize(16),
    fontWeight: "500",
    color: "#333",
  },
  countryList: {
    flex: 1,
  },
});

export default RechargeScreen;
