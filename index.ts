import { registerRootComponent } from 'expo';

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