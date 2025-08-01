import { NativeModules, Platform } from 'react-native';
import { devToolsConfig } from '../config/devToolsConfig';

/**
 * 禁用 React Native 开发工具
 * 包括底部的 Inspector 工具栏和开发者菜单
 */
export function disableDevTools() {
  if (!__DEV__) {
    return; // 生产环境不需要处理
  }

  try {
    const { DevSettings, DevMenu } = NativeModules;

    // 禁用远程调试
    if (DevSettings?.setIsDebuggingRemotely) {
      DevSettings.setIsDebuggingRemotely(false);
    }

    // 根据配置禁用热重载
    if (devToolsConfig.disableHotReload && DevSettings?.setHotLoadingEnabled) {
      DevSettings.setHotLoadingEnabled(false);
    }

    // 根据配置禁用实时重载
    if (devToolsConfig.disableLiveReload && DevSettings?.setLiveReloadEnabled) {
      DevSettings.setLiveReloadEnabled(false);
    }

    // 根据配置隐藏 Inspector
    if (devToolsConfig.disableInspector || devToolsConfig.autoHideInspectorOnStart) {
      // 使用 toggleInspector 强制隐藏
      toggleInspector(false);
      
      // 备用方案：直接调用 hide
      if (DevMenu?.hide) {
        DevMenu.hide();
      }
      
      // iOS 特定：尝试使用 DevSettings
      if (Platform.OS === 'ios' && DevSettings?.setIsDebuggingRemotely) {
        DevSettings.setIsDebuggingRemotely(false);
      }
    }

    // iOS 特定的处理
    if (Platform.OS === 'ios') {
      // 根据配置禁用摇动手势
      if (devToolsConfig.disableShakeGesture && DevSettings?.setIsShakeToShowDevMenuEnabled) {
        DevSettings.setIsShakeToShowDevMenuEnabled(false);
      }
    }

    console.log('[DevTools] 开发工具配置已应用:', devToolsConfig);
  } catch (error) {
    console.warn('[DevTools] 禁用开发工具时出错:', error);
  }
}

/**
 * 启用 React Native 开发工具
 */
export function enableDevTools() {
  if (!__DEV__) {
    return;
  }

  try {
    const { DevSettings } = NativeModules;

    // 启用摇动显示开发者菜单
    if (DevSettings?.setIsShakeToShowDevMenuEnabled) {
      DevSettings.setIsShakeToShowDevMenuEnabled(true);
    }

    console.log('[DevTools] 开发工具已启用');
  } catch (error) {
    console.warn('[DevTools] 启用开发工具时出错:', error);
  }
}

/**
 * 程序化地显示/隐藏 Inspector
 */
export function toggleInspector(show: boolean = false) {
  if (!__DEV__) {
    return;
  }

  try {
    const { DevMenu } = NativeModules;
    
    if (show && DevMenu?.show) {
      DevMenu.show();
    } else if (!show && DevMenu?.hide) {
      DevMenu.hide();
    }
  } catch (error) {
    console.warn('[DevTools] 切换 Inspector 时出错:', error);
  }
}