import { registerRootComponent } from 'expo';
import messaging from '@react-native-firebase/messaging';

// 注册后台消息处理器
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('后台收到消息:', remoteMessage);
  
  // 在这里处理后台消息
  // 注意：这个处理器在后台运行，不能访问 React 组件或状态
  // 你可以使用本地通知库来显示通知
});

// 添加 polyfill 来解决 NativeModule undefined 问题
if (typeof global !== 'undefined') {
  // 确保 global.__fbBatchedBridge 存在
  if (!global.__fbBatchedBridge) {
    global.__fbBatchedBridge = {
      callFunctionReturnFlushedQueue: () => [],
      invokeCallbackAndReturnFlushedQueue: () => [],
      flushedQueue: () => [],
      callFunctionReturnResultAndFlushedQueue: () => [],
    };
  }
  
  // 确保 global.nativeExtensions 存在
  if (!global.nativeExtensions) {
    global.nativeExtensions = {};
  }
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);