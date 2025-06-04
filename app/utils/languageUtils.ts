import { getCurrentLanguage } from "../i18n";

export const getSubjectTransLanguage = <T extends Record<string, any>>(
  data: T
): string => {
  // 获取当前i18n语言
  const currentLang = getCurrentLanguage();

  // 特殊处理中文
  if (currentLang === "zh" && "subject" in data) {
    return data.subject as string;
  }

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

  // 返回匹配的翻译值，如果没有匹配则返回法语
  return (data[matchedField || "subject_trans"] as string) || "";
};

export const getAttributeTransLanguage = <T extends Record<string, any>>(
  data: T
): string => {
  // 获取当前i18n语言
  const currentLang = getCurrentLanguage();
  
  if (currentLang === "fr") {
    return data.subject_trans as string;
  } else {
    return data.subject_trans_en as string;
  }
  // 特殊处理中文
 
};

export const getAttributeNameTransLanguage = <T extends Record<string, any>>(
  data: T
): string => {
  // 获取当前i18n语言
  const currentLang = getCurrentLanguage();

  // 特殊处理中文
  if(currentLang === "zh" && "attribute_name" in data){
    return data.attribute_name as string;
  }else{
    return data.attribute_name_en as string;
  }
};

export const getSkuNameTransLanguage = <T extends Record<string, any>>(
  data: T
): string => {
  // 获取当前i18n语言
  const currentLang = getCurrentLanguage();

  // 特殊处理中文
  if(currentLang === "zh" && "value_trans" in data){
    return data.value_trans as string;
  }else{
    return data.value_trans_en as string;
  }
};



export const getSkuTransLanguage = <T extends Record<string, any>>(
  data: T
): string => {
  // 获取当前i18n语言
  const currentLang = getCurrentLanguage();

  // 特殊处理中文
  if (currentLang === "zh" && "value" in data) {
    return data.value as string;
  }

  // 获取所有subject_trans开头的字段
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

  // 特殊处理中文
  if (currentLang === "zh" && "value" in data) {
    return data.value as string;
  }

  // 获取所有subject_trans开头的字段
  const translationFields = Object.keys(data).filter((key) =>
    key.startsWith("product_name")
  );

  // 查找匹配的字段
  const matchedField = translationFields.find((field) => {
    // 从字段名中提取语言代码
    const langCode = field.replace("product_name_", "");

    // 如果没有后缀，则为法语
    return langCode === "" ? currentLang === "fr" : langCode === currentLang;
  });

  // 返回匹配的翻译值，如果没有匹配则返回法语
  return (data[matchedField || "product_name_fr"] as string) || "";
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