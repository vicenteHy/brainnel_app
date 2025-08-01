import Expo
import FirebaseCore
import React
import ReactAppDependencyProvider

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    
    print("[AppDelegate] ========== 应用启动 ==========")
    print("[AppDelegate] Bundle ID: \(Bundle.main.bundleIdentifier ?? "unknown")")
    print("[AppDelegate] 版本: \(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown")")
    print("[AppDelegate] Build: \(Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "unknown")")
    
// @generated begin @react-native-firebase/app-didFinishLaunchingWithOptions - expo prebuild (DO NOT MODIFY) sync-10e8520570672fd76b2403b7e1e27f5198a6349a
FirebaseApp.configure()
// @generated end @react-native-firebase/app-didFinishLaunchingWithOptions
    
    print("[AppDelegate] Firebase 已配置")
    print("[AppDelegate] ========== 启动完成 ==========")
    
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
  
  // Push Notifications - 注册成功
  public override func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    print("[APNs] ✅ 成功注册远程通知")
    print("[APNs] Device Token 长度: \(deviceToken.count) bytes")
    let tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
    print("[APNs] Device Token (hex): \(tokenString)")
    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }
  
  // Push Notifications - 注册失败
  public override func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    print("[APNs] ❌ 注册远程通知失败")
    print("[APNs] 错误类型: \(type(of: error))")
    print("[APNs] 错误描述: \(error.localizedDescription)")
    print("[APNs] 完整错误: \(error)")
    
    if let nsError = error as NSError? {
      print("[APNs] 错误代码: \(nsError.code)")
      print("[APNs] 错误域: \(nsError.domain)")
      print("[APNs] 用户信息: \(nsError.userInfo)")
    }
    
    super.application(application, didFailToRegisterForRemoteNotificationsWithError: error)
  }
  
  // Push Notifications - 接收远程通知
  public override func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable : Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    super.application(application, didReceiveRemoteNotification: userInfo, fetchCompletionHandler: completionHandler)
    completionHandler(.newData)
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
