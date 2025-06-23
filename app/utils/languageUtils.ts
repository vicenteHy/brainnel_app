import { getCurrentLanguage } from "../i18n";


export const getSubjectTransLanguage = <T extends Record<string, any>>(
  data: T
): string => {
  // 获取当前i18n语言
  const currentLang = getCurrentLanguage();

  // 获取所有subject_trans开头的字段
  const translationFields = Object.keys(data).filter((key) =>
    key.startsWith("subject_trans")
  );

  // 查找匹配的字段
  const matchedField = translationFields.find((field) => {
    // 从字段名中提取语言代码
    const langCode = field.replace("subject_trans_", "");
    // 如果没有后缀，则为法语
    return langCode === "" ? currentLang === "fr" : langCode === currentLang;
  });

  // 先尝试获取目标语言的翻译
  let result = "";
  if (matchedField && data[matchedField]) {
    result = data[matchedField] as string;
  }
  
  // 如果目标语言为空，fallback到法语版本
  if (!result && data.subject_trans) {
    result = data.subject_trans as string;
  }
  
  return result || "";
};

export const getAttributeTransLanguage = <T extends Record<string, any>>(
  data: T
): string => {
  // 获取当前i18n语言
  const currentLang = getCurrentLanguage();
  
  let result = "";
  
  if (currentLang === "fr") {
    result = data.attribute_value_trans || data.value_trans || data.attribute_value || "";
  } else {
    result = data.attribute_value_trans_en || data.value_trans_en || data.attribute_value_en || data.attribute_value_trans || data.value_trans || data.attribute_value || "";
  }
  
  return result;
};

export const getAttributeNameTransLanguage = <T extends Record<string, any>>(
  data: T
): string => {
  // 获取当前i18n语言
  const currentLang = getCurrentLanguage();

  if (currentLang === "fr") {
    return data.attribute_name_trans || data.attribute_name || "";
  } else {
    return data.attribute_name_trans_en || data.attribute_name_trans || data.attribute_name || "";
  }
};

export const getSkuNameTransLanguage = <T extends Record<string, any>>(
  data: T
): string => {
  // 获取当前i18n语言
  const currentLang = getCurrentLanguage();

  if (currentLang === "fr") {
    return data.value_trans || data.value || "";
  } else {
    return data.value_trans_en || data.value_trans || data.value || "";
  }
};

export const getSkuTransLanguage = <T extends Record<string, any>>(
  data: T
): string => {
  // 获取当前i18n语言
  const currentLang = getCurrentLanguage();

  // 获取所有value_trans开头的字段
  const translationFields = Object.keys(data).filter((key) =>
    key.startsWith("value_trans")
  );

  // 查找匹配的字段
  const matchedField = translationFields.find((field) => {
    // 从字段名中提取语言代码
    const langCode = field.replace("value_trans_", "");
    // 如果没有后缀，则为法语
    return langCode === "" ? currentLang === "fr" : langCode === currentLang;
  });

  // 返回匹配的翻译值，如果没有匹配则返回法语
  return (data[matchedField || "value_trans"] as string) || "";
};

export const getOrderTransLanguage = <T extends Record<string, any>>(
  data: T
): string => {
  // 获取当前i18n语言
  const currentLang = getCurrentLanguage();

  // 获取所有product_name开头的字段
  const translationFields = Object.keys(data).filter((key) =>
    key.startsWith("product_name")
  );


  // 查找匹配的字段
  const matchedField = translationFields.find((field) => {
    // 从字段名中提取语言代码
    const langCode = field.replace("product_name_", "");

    // 如果没有后缀(即product_name)，则为法语
    return langCode === "" ? currentLang === "fr" : langCode === currentLang;
  });


  // 返回匹配的翻译值，如果没有匹配则返回法语
  const result = (data[matchedField || "product_name_fr"] as string) || "";
  
  return result;
};

// 国家的字段
export const getCountryTransLanguage = <T extends Record<string, any>>(
  data: T
): string => {
  const currentLang = getCurrentLanguage();  
  if (currentLang === "fr") {
    return data.name as string;
  } else {
    return data.name_en as string;
  }
};

// 二级分类
export const getSubCategoryTransLanguage = <T extends Record<string, any>>(
  data: T
): string => {
  const currentLang = getCurrentLanguage();
  if (currentLang === "fr") {
    return data.name as string;
  } else {
    return data.name_en as string;
  }
};

// 类目
export const getCategoryTransLanguage = <T extends Record<string, any>>(
  data: T
): string => {
  const currentLang = getCurrentLanguage();
  if (currentLang === "fr") {
    return data.name as string;
  } else {
    return data.name_en as string;
  }
};