// 调试脚本 - 查看聊天记录存储
import AsyncStorage from '@react-native-async-storage/async-storage';

// 查看所有存储的键
const getAllKeys = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('所有存储的键:', keys);
    
    // 筛选聊天记录相关的键
    const chatKeys = keys.filter(key => 
      key.includes('product_chat_messages') || 
      key.includes('product_inquiries')
    );
    console.log('聊天相关的键:', chatKeys);
    
    return chatKeys;
  } catch (error) {
    console.error('获取存储键失败:', error);
  }
};

// 查看特定产品的聊天记录
const getProductChatHistory = async (productId) => {
  try {
    const key = `@product_chat_messages_${productId}`;
    const data = await AsyncStorage.getItem(key);
    if (data) {
      const messages = JSON.parse(data);
      console.log(`产品 ${productId} 的聊天记录:`, messages);
      return messages;
    } else {
      console.log(`产品 ${productId} 暂无聊天记录`);
    }
  } catch (error) {
    console.error(`获取产品 ${productId} 聊天记录失败:`, error);
  }
};

// 查看产品咨询列表
const getProductInquiries = async () => {
  try {
    const data = await AsyncStorage.getItem('@product_inquiries');
    if (data) {
      const inquiries = JSON.parse(data);
      console.log('产品咨询列表:', inquiries);
      return inquiries;
    }
  } catch (error) {
    console.error('获取产品咨询列表失败:', error);
  }
};

// 清除特定产品的聊天记录
const clearProductChatHistory = async (productId) => {
  try {
    const key = `@product_chat_messages_${productId}`;
    await AsyncStorage.removeItem(key);
    console.log(`已清除产品 ${productId} 的聊天记录`);
  } catch (error) {
    console.error(`清除产品 ${productId} 聊天记录失败:`, error);
  }
};

export {
  getAllKeys,
  getProductChatHistory,
  getProductInquiries,
  clearProductChatHistory
};