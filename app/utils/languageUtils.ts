import { getCurrentLanguage } from "../i18n";

// 在模块加载时记录当前语言设置
console.log('🔍 [LanguageUtils-Init] 语言工具模块初始化，当前语言:', getCurrentLanguage());

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
  
  // 调试日志：记录翻译函数的输入和处理过程
  console.log('🔍 [LanguageUtils-AttrTrans] 属性翻译函数调用:', {
    currentLang,
    input_data: {
      value_trans: data.value_trans,
      value_trans_en: data.value_trans_en,
      value_trans_ar: data.value_trans_ar,
      attribute_value: data.attribute_value,
      attribute_value_en: data.attribute_value_en,
      attribute_name: data.attribute_name,
      attribute_name_trans: data.attribute_name_trans,
      attribute_name_trans_en: data.attribute_name_trans_en,
      attribute_name_trans_ar: data.attribute_name_trans_ar
    }
  });
  
  let result = "";
  
  if (currentLang === "fr") {
    result = data.value_trans || data.attribute_value || "";
    console.log('🔍 [LanguageUtils-AttrTrans] 法语模式结果:', {
      result,
      used_field: data.value_trans ? 'value_trans' : (data.attribute_value ? 'attribute_value' : 'none')
    });
  } else {
    result = data.value_trans_en || data.attribute_value_en || data.value_trans || data.attribute_value || "";
    console.log('🔍 [LanguageUtils-AttrTrans] 英语模式结果:', {
      result,
      used_field: data.value_trans_en ? 'value_trans_en' : 
                  (data.attribute_value_en ? 'attribute_value_en' : 
                   (data.value_trans ? 'value_trans' : 
                    (data.attribute_value ? 'attribute_value' : 'none')))
    });
  }
  
  console.log('🔍 [LanguageUtils-AttrTrans] 最终返回值:', result);
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

  console.log('🔍 [OrderTransLanguage] 订单商品翻译函数调用:', {
    currentLang,
    translationFields,
    input_data: {
      product_name: data.product_name,
      product_name_en: data.product_name_en,
      product_name_fr: data.product_name_fr,
      product_name_ar: data.product_name_ar
    }
  });

  // 查找匹配的字段
  const matchedField = translationFields.find((field) => {
    // 从字段名中提取语言代码
    const langCode = field.replace("product_name_", "");

    // 如果没有后缀(即product_name)，则为法语
    return langCode === "" ? currentLang === "fr" : langCode === currentLang;
  });

  console.log('🔍 [OrderTransLanguage] 匹配字段:', {
    matchedField,
    fallbackField: "product_name_fr"
  });

  // 返回匹配的翻译值，如果没有匹配则返回法语
  const result = (data[matchedField || "product_name_fr"] as string) || "";
  
  console.log('🔍 [OrderTransLanguage] 最终返回值:', result);
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