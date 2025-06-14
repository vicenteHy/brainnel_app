import { useState, useEffect } from "react";
import { settingApi } from "../../../../services/api/setting";
import { CountryList } from "../../../../constants/countries";

export const useShippingCalculator = () => {
  const [shippingMethod, setShippingMethod] = useState<"maritime" | "airway">("maritime");
  const [isLoading, setIsLoading] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countries, setCountries] = useState<CountryList[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryList | null>(null);
  const [parcelVolume, setParcelVolume] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [shippingFee, setShippingFee] = useState<number | null>(null);
  const [shippingCurrency, setShippingCurrency] = useState<string>("");

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await settingApi.getCountryList();
        setCountries(response);
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };

    fetchCountries();
  }, []);

  const handleShippingMethodChange = (method: "maritime" | "airway") => {
    setShippingMethod(method);
  };

  const handleCountrySelect = (country: CountryList) => {
    setSelectedCountry(country);
    setShowCountryModal(false);
  };

  const handleParcelVolumeChange = (text: string) => {
    // 只允许输入数字和小数点
    const numericValue = text.replace(/[^0-9.]/g, "");
    // 确保只有一个小数点
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      setParcelVolume(parts[0] + "." + parts.slice(1).join(""));
    } else {
      setParcelVolume(numericValue);
    }
  };

  const handleCalculateShipping = async () => {
    if (!selectedCountry || !parcelVolume) {
      // TODO: Show error message
      return;
    }

    setIsCalculating(true);
    try {
      const volume = parseFloat(parcelVolume);
      if (isNaN(volume)) {
        // TODO: Show error message for invalid input
        return;
      }

      const shippingData = {
        weight_kg: shippingMethod === "airway" ? volume : 0,
        volume_m3: shippingMethod === "maritime" ? volume : 0,
        country_code: selectedCountry.country,
      };

      const response = await settingApi.getShippingFee(shippingData);
      const fee =
        shippingMethod === "maritime"
          ? response.estimated_shipping_fee_sea
          : response.estimated_shipping_fee_air;
      setShippingFee(fee);
      setShippingCurrency(response.currency);
      setShowResultModal(true);
    } catch (error) {
      console.error("Error calculating shipping fee:", error);
      // TODO: Show error message
    } finally {
      setIsCalculating(false);
    }
  };

  return {
    shippingMethod,
    isLoading,
    showCountryModal,
    countries,
    selectedCountry,
    parcelVolume,
    isCalculating,
    showResultModal,
    shippingFee,
    shippingCurrency,
    setShowCountryModal,
    setShowResultModal,
    handleShippingMethodChange,
    handleCountrySelect,
    handleParcelVolumeChange,
    handleCalculateShipping,
  };
};