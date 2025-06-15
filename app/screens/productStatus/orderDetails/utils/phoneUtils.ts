import { LocalCountryData } from "../types";
import { CountryList } from "../../../../constants/countries";

// 格式化电话号码
export const formatPhoneNumber = (
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
    // 确保phoneCode包含+号
    countryCode = localCountry.phoneCode.startsWith("+")
      ? localCountry.phoneCode
      : `+${localCountry.phoneCode}`;
  } else if (localCountry?.country) {
    // 如果phoneCode不存在，使用country字段
    countryCode = `+${localCountry.country}`;
  } else if (apiCountry?.country) {
    countryCode = `+${apiCountry.country}`;
  } else {
    // 如果都没有，使用默认的刚果民主共和国代码
    countryCode = "+243";
  }

  // 如果电话号码以0开头，移除0
  const phoneWithoutLeadingZero = cleanPhone.startsWith("0")
    ? cleanPhone.substring(1)
    : cleanPhone;

  const finalPhone = `${countryCode}${phoneWithoutLeadingZero}`;

  return finalPhone;

};

// 获取显示的国家代码
export const getDisplayCountryCode = (
  loadingCountries: boolean,
  localSelectedCountry: LocalCountryData | null,
  selectedCountry: CountryList | null
): string => {
  if (loadingCountries) return "...";
  if (localSelectedCountry?.phoneCode) {
    // 优先使用phoneCode，确保包含+号
    return localSelectedCountry.phoneCode.startsWith("+")
      ? localSelectedCountry.phoneCode
      : `+${localSelectedCountry.phoneCode}`;
  }
  if (localSelectedCountry?.country) {
    return `+${localSelectedCountry.country}`;
  }
  if (selectedCountry?.country) {
    return `+${selectedCountry.country}`;
  }
  return "+243"; // 默认值，刚果民主共和国
}; 