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
import CloseIcon from "../../components/CloseIcon";
import CheckIcon from "../../components/CheckIcon";
import PhoneNumberInputModal from "./PhoneNumberInputModal";
import useUserStore from "../../store/user";
// 添加导航相关导入
import { useNavigation, CommonActions } from "@react-navigation/native";
// 添加API服务
import {
  payApi,
  RechargeRecommendAmountResponse,
  PaymentMethod,
} from "../../services/api/payApi";
import { settingApi } from "../../services/api/setting";
import payMap from "../../utils/payMap";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CountryList } from "../../constants/countries";
import Toast from "react-native-toast-message";
import { PAYMENT_SUCCESS_EVENT, PAYMENT_FAILURE_EVENT } from "../../../App";

// 定义本地存储的国家数据类型
interface LocalCountryData {
  code: string;
  flag: string;
  name: string;
  phoneCode: string;
  userCount: number;
  valid_digits?: number[];
}

interface RechargeScreenProps {
  onClose: () => void;
}

const RechargeScreen = ({ onClose }: RechargeScreenProps) => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentParams, setPaymentParams] = useState<{
    originalAmount: number;
    amount: number;
    currency: string;
    payment_method: string;
    selectedPriceLabel: string;
    onCloses: () => void;
  } | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  // 添加PayPal展开视图的状态
  const [isPaypalExpanded, setIsPaypalExpanded] = useState(false);
  // 添加Wave展开视图的状态
  const [isWaveExpanded, setIsWaveExpanded] = useState(false);

  // 添加国家选择相关状态
  const [countryList, setCountryList] = useState<CountryList[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryList | null>(
    null
  );
  const [localSelectedCountry, setLocalSelectedCountry] =
    useState<LocalCountryData | null>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
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
      const currentCountryMethods = res.current_country_methods.filter(
        (method) => method.key !== "balance"
      );
      setPaymentMethods(currentCountryMethods);
    });
  }, []);

  // 获取国家列表
  const loadCountryList = async () => {
    setLoadingCountries(true);
    try {
      // 首先尝试读取本地存储的国家数据
      const savedLocalCountry = await AsyncStorage.getItem("@selected_country");
      if (savedLocalCountry) {
        try {
          const parsedLocalCountry: LocalCountryData =
            JSON.parse(savedLocalCountry);
          setLocalSelectedCountry(parsedLocalCountry);
          console.log("使用本地存储的国家:", parsedLocalCountry);
        } catch (e) {
          console.error("解析本地存储国家数据失败:", e);
        }
      }

      const response = await settingApi.getSendSmsCountryList();
      if (response && Array.isArray(response)) {
        setCountryList(response);

        // 如果没有本地存储的国家，则使用API返回的数据进行匹配
        if (!savedLocalCountry) {
          // 如果用户有国家信息，自动选择对应的国家
          if (user?.country_en) {
            const userCountry = response.find(
              (country: CountryList) =>
                country.name_en.toLowerCase() === user.country_en.toLowerCase()
            );
            if (userCountry) {
              setSelectedCountry(userCountry);
              // 设置选中国家的 valid_digits
              if (userCountry.valid_digits) {
                setValidDigits(userCountry.valid_digits);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("获取国家列表失败:", error);
    } finally {
      setLoadingCountries(false);
    }
  };

  // 格式化电话号码
  const formatPhoneNumber = (
    phone: string,
    localCountry: LocalCountryData | null,
    apiCountry: CountryList | null
  ): string => {
    if (!phone) return phone;

    // 移除电话号码中的空格、破折号等
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

    // 如果已经有+号开头，直接返回
    if (cleanPhone.startsWith("+")) {
      return cleanPhone;
    }

    // 优先使用本地存储的国家数据的 phoneCode
    let countryCode = "";
    if (localCountry?.phoneCode) {
      countryCode = localCountry.phoneCode;
    } else if (apiCountry?.country) {
      countryCode = `+${apiCountry.country}`;
    } else {
      return phone; // 如果都没有，返回原始电话号码
    }

    // 如果电话号码以0开头，移除0
    const phoneWithoutLeadingZero = cleanPhone.startsWith("0")
      ? cleanPhone.substring(1)
      : cleanPhone;

    return `${countryCode}${phoneWithoutLeadingZero}`;
  };

  // 获取显示的国家代码
  const getDisplayCountryCode = () => {
    if (loadingCountries) return "...";
    if (localSelectedCountry?.phoneCode) {
      return localSelectedCountry.phoneCode;
    }
    if (selectedCountry?.country) {
      return `+${selectedCountry.country}`;
    }
    // 默认返回刚果民主共和国的区号
    return "+243";
  };

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
    // 保留原有的逻辑
    else if (selectedOperator === "currency") {
      handleCurrencyConversion(price, currentCurrency);
    }
  };

  const handleOperatorSelect = (operator: string) => {
    // 如果选择的不是之前选中的支付方式，则重置展开状态
    if (operator !== selectedOperator) {
      setIsPaypalExpanded(false);
      setIsWaveExpanded(false);
    }

    setSelectedOperator(operator === selectedOperator ? null : operator);

    // 查找选中的支付方式
    const selectedMethod = paymentMethods.find(
      (method) => method.key === operator
    );

    if (selectedMethod) {
      // 如果是PayPal支付方式
      if (selectedMethod.key === "paypal" && operator !== selectedOperator) {
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
      else if (selectedMethod.key === "wave" && operator !== selectedOperator) {
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
      // 如果是mobile_money，先加载国家列表
      else if (selectedMethod.key === "mobile_money") {
        // 先加载国家列表
        loadCountryList();
      }
    } else if (operator === "currency" && operator !== selectedOperator) {
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

  const handleButtonClick = () => {
    if (selectedOperator) {
      // 准备支付参数，方便后续发送
      const params = {
        originalAmount: parseFloat(selectedPrice.replace(/,/g, "")),
        amount: parseFloat(selectedPrice.replace(/,/g, "")),
        currency: user?.currency,
        payment_method: "",
        selectedPriceLabel: selectedPrice + " " + user?.currency,
        onCloses: () => onClose(), // Close parent modal
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
        // 如果是mobile_money，先加载国家列表
        else if (selectedMethod.key === "mobile_money") {
          // 先加载国家列表
          loadCountryList();
        }
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

      console.log(params);

      setShowPhoneModal(true);
    }
  };

  // 提取一个专门用于货币转换的函数
  const handleCurrencyConversion = (price: string, currency: string) => {
    setIsConverting(true);

    // 格式化金额，去除逗号
    const amount = parseFloat(price.replace(/,/g, ""));

    // 如果金额为0或无效，则不进行转换
    if (!amount || isNaN(amount)) {
      console.warn("Invalid amount for currency conversion");
      setIsConverting(false);
      return;
    }

    // 如果源货币和目标货币相同，直接返回原金额
    if (user?.currency === currency) {
      console.log(`Same currency (${currency}), no conversion needed`);
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

    console.log(`Converting ${amount} ${user?.currency} to ${currency}...`);

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
          console.log("Conversion successful:", res.converted_amounts_list);
          setConvertedAmount(res.converted_amounts_list);
        } else {
          console.error("Conversion response invalid:", res);
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
        console.error("Currency conversion failed:", error);

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

  // 处理支付提交的函数，现在作为回调传递给PhoneNumberInputModal
  const handlePaySubmit = async (phoneNumber: string) => {
    if (!paymentParams) {
      return;
    }

    // 验证电话号码（添加更严格的验证）
    if (paymentParams.payment_method === "mobile_money") {
      // 检查电话号码是否为空
      if (!phoneNumber || phoneNumber.trim() === "") {
        Toast.show({
          type: "error",
          text1:
            t("balance.phone_modal.phone_required") ||
            "Phone number is required",
        });
        return;
      }

      // 获取当前使用的 validDigits
      const currentValidDigits = validDigits.length > 0 ? validDigits : [8]; // 如果没有设置，使用默认值 [8]

      // 验证电话号码位数
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, ""); // 移除所有非数字字符
      if (!currentValidDigits.includes(cleanPhoneNumber.length)) {
        Toast.show({
          type: "error",
          text1: `${
            t("order.error.invalid_phone") || "Invalid phone number"
          } (${
            t("order.error.requires_digits") || "Required digits"
          }: ${currentValidDigits.join(", ")})`,
        });
        return;
      }
    }

    // 显示提交中状态
    setIsSubmitting(true);

    try {
      // 格式化电话号码，添加国家前缀（仅对mobile_money支付）
      let formattedPhone = phoneNumber;
      if (paymentParams.payment_method === "mobile_money") {
        formattedPhone = formatPhoneNumber(
          phoneNumber,
          localSelectedCountry,
          selectedCountry
        );
        console.log("发送的电话号码:", formattedPhone);
      }

      // 准备请求数据
      const rechargeData: any = {
        amount: paymentParams.amount,
        currency: paymentParams.currency,
        payment_method: paymentParams.payment_method,
        type: "recharge",
      };

      // 如果是mobile_money支付，添加extra字段
      if (paymentParams.payment_method === "mobile_money") {
        // 格式化电话号码，确保包含国家区号
        const formattedPhone = formatPhoneNumber(
          phoneNumber,
          localSelectedCountry,
          selectedCountry
        );
        console.log("发送的电话号码:", formattedPhone);

        rechargeData.extra = {
          phone_number: formattedPhone,
        };
      }

      console.log("Submitting recharge request:", rechargeData);

      // 调用充值接口
      const response = await payApi.initiateRecharge(rechargeData);
      if (response && response.success) {
        const paymentInfo = response.payment;

        // 关闭模态框
        setShowPhoneModal(false);
        onClose();

        if (paymentParams.payment_method === "wave") {
          try {
            // 显示支付处理提示
            Toast.show({
              type: "info",
              text1: t("balance.recharge.opening_wave") || "Opening Wave app...",
              text2: t("balance.recharge.complete_payment_wave") || "Please complete the payment in Wave app",
              visibilityTime: 3000,
            });

            // 打开Wave应用
            await Linking.openURL(paymentInfo.payment_url);
            
            // 注意：不在这里处理支付结果，支付结果将通过深度链接处理
            console.log('Wave app opened successfully');
            
          } catch (error) {
            console.error("Error opening Wave app:", error);
            Toast.show({
              type: "error",
              text1: t("error") || "Error",
              text2: t("order.error.wave_app_open") || "Failed to open Wave app",
              visibilityTime: 4000,
            });
            
            // 重置提交状态
            setIsSubmitting(false);
          }
        }

        if (paymentParams.payment_method === "mobile_money") {
          if (response.success === true) {
            Toast.show({
              type: "success",
              text1: response.msg || "",
            });
            navigation.reset({
              index: 0,
              routes: [{ name: "MainTabs" }],
            });
            return;
          } else {
            Toast.show({
              type: "error",
              text1: response.msg || "",
            });
            // setLoading(false);
          }
        }

        if (paymentParams.payment_method === "paypal") {
          try {
            // 显示支付处理提示
            Toast.show({
              type: "info",
              text1: t("balance.recharge.opening_paypal") || "Opening PayPal...",
              text2: t("balance.recharge.complete_payment_paypal") || "Please complete the payment in PayPal",
              visibilityTime: 3000,
            });

            // 打开PayPal
            await Linking.openURL(paymentInfo.payment_url);
            
            // 注意：不在这里处理支付结果，支付结果将通过深度链接处理
            console.log('PayPal opened successfully');
            
          } catch (error) {
            console.error("Error opening PayPal:", error);
            Toast.show({
              type: "error",
              text1: t("error") || "Error",
              text2: t("order.error.paypal_app_open") || "Failed to open PayPal",
              visibilityTime: 4000,
            });
            
            // 重置提交状态
            setIsSubmitting(false);
          }
        }

        if (paymentParams.payment_method === "bank_card") {
          try {
            // 显示支付处理提示
            Toast.show({
              type: "info",
              text1: t("balance.recharge.opening_payment") || "Opening payment page...",
              text2: t("balance.recharge.complete_payment") || "Please complete the payment",
              visibilityTime: 3000,
            });

            // 打开银行卡支付页面
            await Linking.openURL(paymentInfo.payment_url);
            
            // 注意：不在这里处理支付结果，支付结果将通过深度链接处理
            console.log('Bank card payment opened successfully');
            
          } catch (error) {
            console.error("Error opening bank card payment:", error);
            Toast.show({
              type: "error",
              text1: t("error") || "Error",
              text2: t("order.error.payment_open") || "Failed to open payment page",
              visibilityTime: 4000,
            });
            
            // 重置提交状态
            setIsSubmitting(false);
          }
        }
      } else {
        // 处理失败情况，显示错误消息
        const errorMessage =
          response?.msg ||
          "Une erreur s'est produite lors du traitement de la recharge. Veuillez réessayer.";

        Alert.alert("Erreur", errorMessage);
      }
    } catch (error) {
      // 处理异常
      console.error("Recharge error:", error);

      let errorMessage =
        "Une erreur s'est produite lors du traitement de la recharge. Veuillez réessayer.";

      // 尝试从错误对象中提取更具体的错误信息
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }

      Alert.alert("Erreur", errorMessage);
    } finally {
      // 无论成功失败，都取消提交状态
      setIsSubmitting(false);
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

    // 其他情况下，启用按钮
    return false;
  };

  // 添加支付结果监听
  useEffect(() => {
    const handlePaymentSuccess = (data: any) => {
      console.log('Payment success received in RechargeScreen:', data);
      
      // 关闭支付模态框
      setShowPhoneModal(false);
      
      // 显示成功提示
      Toast.show({
        type: "success",
        text1: t("balance.recharge.payment_success") || "Payment successful!",
        text2: t("balance.recharge.payment_success_desc") || "Your account has been recharged",
        visibilityTime: 3000,
      });

      // 延迟关闭充值页面，让用户看到成功提示
      setTimeout(() => {
        onClose();
        // 导航到主页面或余额页面
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'MainTabs',
              state: {
                routes: [
                  { name: 'Home' },
                  { name: 'productCollection' },
                  { name: 'Chat' },
                  { name: 'Cart' },
                  { name: 'Profile' },
                ],
                index: 4, // Profile tab 的索引，显示余额
              },
            },
          ],
        });
      }, 2000);
    };

    const handlePaymentFailure = (data: any) => {
      console.log('Payment failure received in RechargeScreen:', data);
      
      // 关闭支付模态框
      setShowPhoneModal(false);
      
      // 显示失败提示
      Toast.show({
        type: "error",
        text1: t("balance.recharge.payment_failed") || "Payment failed",
        text2: data.error || t("balance.recharge.payment_failed_desc") || "Please try again",
        visibilityTime: 4000,
      });

      // 重置提交状态
      setIsSubmitting(false);
    };

    // 注册事件监听器
    global.EventEmitter.on(PAYMENT_SUCCESS_EVENT, handlePaymentSuccess);
    global.EventEmitter.on(PAYMENT_FAILURE_EVENT, handlePaymentFailure);

    // 清理函数
    return () => {
      global.EventEmitter.off(PAYMENT_SUCCESS_EVENT, handlePaymentSuccess);
      global.EventEmitter.off(PAYMENT_FAILURE_EVENT, handlePaymentFailure);
    };
  }, [onClose, navigation, t]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("balance.recharge.title")}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <CloseIcon size={fontSize(15)} />
          </TouchableOpacity>
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
                    placeholder={t("balance.recharge.choose_amount")}
                    placeholderTextColor="#999"
                    onSubmitEditing={handleCustomAmountSubmit}
                    onBlur={handleCustomAmountSubmit}
                    autoFocus
                  />
                  <Text style={styles.currencyLabel}>{user?.currency}</Text>
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
                          ]}
                          onPress={() => {
                            setCustomAmountDisplayText("");
                            handlePriceSelect(amount.toString());
                          }}
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
                  <View style={styles.row}>
                    {recommendedAmounts.amounts
                      .slice(3)
                      .map((amount, index) => {
                        // 如果有自定义金额，则不显示任何选中状态
                        const isSelected = customAmountDisplayText
                          ? false
                          : selectedPrice === amount.toString();

                        return (
                          <TouchableOpacity
                            key={index + 3}
                            style={[
                              styles.priceBoxWhite,
                              isSelected
                                ? styles.priceBoxSelected
                                : styles.priceBoxUnselected,
                            ]}
                            onPress={() => {
                              setCustomAmountDisplayText("");
                              handlePriceSelect(amount.toString());
                            }}
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
              onPress={() => setActiveTab(1)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 1 && styles.activeTabText,
                ]}
              >
                {t("balance.recharge.other")}
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
                            source={payMap(method.key) as any}
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
                            source={payMap(method.key) as any}
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
                                      source={payMap(item) as any}
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
                              ? "#007efa"
                              : undefined
                          }
                          fillColor={
                            selectedOperator === method.key
                              ? "#007efa"
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
                              <ActivityIndicator size="small" color="#007efa" />
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
                              <ActivityIndicator size="small" color="#007efa" />
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
                            selectedOperator === "mtn" ? "#007efa" : undefined
                          }
                          fillColor={
                            selectedOperator === "mtn" ? "#007efa" : undefined
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
                            selectedOperator === "mtn" ? "#007efa" : undefined
                          }
                          fillColor={
                            selectedOperator === "mtn" ? "#007efa" : undefined
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
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
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

      {/* Phone Number Input Modal */}
      <PhoneNumberInputModal
        isVisible={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        paymentParams={paymentParams}
        onSubmit={handlePaySubmit}
        onCloses={onClose}
        displayCountryCode={getDisplayCountryCode()}
        onCountrySelect={() => setShowCountryModal(true)}
        validDigits={validDigits}
      />

      {/* 国家选择模态框 */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择国家</Text>
              <TouchableOpacity
                onPress={() => setShowCountryModal(false)}
                style={styles.closeButtonContainer}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={countryList}
              keyExtractor={(item) => item.country.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    selectedCountry?.country === item.country &&
                      styles.currencyButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedCountry(item);
                    // 设置选中国家的 valid_digits
                    if (item.valid_digits) {
                      setValidDigits(item.valid_digits);
                    }
                    setShowCountryModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.countryItemText,
                      selectedCountry?.country === item.country &&
                        styles.currencyButtonTextActive,
                    ]}
                  >
                    {item.name_en} (+{item.country})
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.countryList}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    paddingBottom: 0,
    position: "relative",
    marginTop: 20,
    marginBottom: 20,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 0,
  },
  container: {
    padding: 24,
    backgroundColor: "#f0f0f0",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textTransform: "capitalize",
    color: "black",
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  },
  section: {
    marginTop: 44,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "black",
    textTransform: "capitalize",
    marginBottom: 12,
  },
  priceGroup: {
    marginTop: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 15,
  },
  priceBoxBlue: {
    width: "30%",
    backgroundColor: "#edf2fa",
    borderColor: "#002fa7",
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 9,
    paddingHorizontal: 22,
    alignItems: "center",
    marginRight: "5%",
  },
  priceBoxWhite: {
    width: "30%",
    backgroundColor: "white",
    borderRadius: 5,
    paddingVertical: 9,
    paddingHorizontal: 22,
    alignItems: "center",
    marginRight: "5%",
  },
  priceTextBlue: {
    fontSize: fontSize(16),
    fontWeight: "700",
    color: "#002fa7",
  },
  currencyTextBlue: {
    fontSize: fontSize(10),
    color: "#002fa7",
    marginTop: 1,
  },
  priceText: {
    fontSize: fontSize(16),
    fontWeight: "700",
    color: "#333",
  },
  currencyText: {
    fontSize: fontSize(10),
    color: "#7f7e7e",
    marginTop: 1,
  },
  operatorCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 5,
    marginTop: 18,
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
    backgroundColor: "#002fa7",
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
    paddingTop: 0,
    backgroundColor: "#f0f0f0",
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
    backgroundColor: "#002fa7",
    borderRadius: 25,
    width: widthUtils(50, 160).width,
    height: widthUtils(50, 160).height,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: "#b0bfdf",
    opacity: 0.7,
  },
  balanceInfoContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 5,
    paddingHorizontal: 16,
    height: 50,
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  leftInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  blueBox: {
    flexDirection: "row",
    backgroundColor: "#3955f6",
    paddingHorizontal: 7,
    paddingLeft: 6,
    alignItems: "center",
    borderRadius: 4,
  },
  saleText: {
    fontSize: 16,
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
    borderRadius: 5,
    paddingHorizontal: 16,
    marginTop: 15,
    paddingVertical: 10,
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
    backgroundColor: "#002fa7",
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
    backgroundColor: "#edf2fa",
    borderColor: "#002fa7",
    borderWidth: 1,
  },
  priceBoxUnselected: {
    backgroundColor: "white",
    borderColor: "#dddddd",
    borderWidth: 1,
  },
  priceTextSelected: {
    color: "#002fa7",
  },
  priceTextUnselected: {
    color: "#333",
  },
  currencyTextSelected: {
    color: "#002fa7",
  },
  currencyTextUnselected: {
    color: "#7f7e7e",
  },
  closeButton: {
    padding: 5,
    position: "absolute",
    right: 24,
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
    height: 60,
    backgroundColor: "white",
    borderRadius: 5,
  },
  rechargePromptTextStyle: {
    flex: 0,
    padding: 0,
    margin: 0,
    fontSize: 14,
    lineHeight: 14,
    color: "#747474",
    // Note: PingFang SC font might not be available by default in React Native
    // You may need to load custom fonts using expo-font or other methods
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 5,
    marginTop: 10,
    padding: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 5,
  },
  activeTab: {
    backgroundColor: "#002fa7",
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
    height: 50,
    paddingRight: 16,
    paddingLeft: 16,
    backgroundColor: "white",
    borderRadius: 5,
    marginTop: 18,
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
  backButton: {
    position: "absolute",
    left: 24,
    zIndex: 1,
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
    fontSize: 24,
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
      "linear-gradient(90deg, rgba(206, 229, 255, 1) 0%, rgba(238, 244, 255, 1) 100%",
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
    fontSize: 12,
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
    fontSize: 24,
    lineHeight: 22,
    color: "#161616",
    fontFamily: "Montserrat-Bold",
  },
  priceLabel: {
    padding: 0,
    paddingTop: 5,
    margin: 0,
    marginLeft: 3,
    fontSize: 12,
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
    fontSize: 14,
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
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 16,
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
    color: "#002fa7",
    textAlign: "center",
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
    color: "#002fa7",
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "black",
  },
  closeButtonContainer: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  countryList: {
    flex: 1,
  },
});

export default RechargeScreen;
