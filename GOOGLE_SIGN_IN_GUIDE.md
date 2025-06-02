# React Native (Expo) Google 登录集成流程

本文档将指导您如何在 React Native (Expo) 项目中集成 Google 登录功能，主要使用 `@react-native-google-signin/google-signin` 库。

## 目录
1.  [前提条件](#前提条件)
2.  [步骤 1: Firebase 项目设置](#步骤-1-firebase-项目设置)
3.  [步骤 2: Google Cloud Console 配置](#步骤-2-google-cloud-console-配置)
    *   [2.1 确认项目并启用 API](#21-确认项目并启用-api)
    *   [2.2 配置 OAuth 同意屏幕](#22-配置-oauth-同意屏幕)
    *   [2.3 创建/检查 OAuth 2.0 客户端 ID](#23-创建检查-oauth-20-客户端-id)
4.  [步骤 3: 安装依赖库](#步骤-3-安装依赖库)
5.  [步骤 4: Expo 项目配置 (app.json)](#步骤-4-expo-项目配置-appjson)
6.  [步骤 5: 编写登录代码](#步骤-5-编写登录代码)
7.  [步骤 6: 测试环境与构建](#步骤-6-测试环境与构建)
    *   [6.1 开发构建 (推荐)](#61-开发构建-推荐)
    *   [6.2 Expo Go (功能受限)](#62-expo-go-功能受限)
8.  [步骤 7: （可选）与 Firebase Authentication 集成](#步骤-7-可选-与-firebase-authentication-集成)
9.  [故障排查 (常见 DEVELOPER_ERROR)](#故障排查-常见-developer_error)

---

## 前提条件
*   已创建 React Native (Expo) 项目。
*   已安装 Node.js 和 npm/yarn。
*   已安装 Expo CLI (`npm install -g expo-cli` 或 `yarn global add expo-cli`)。
*   拥有一个 Google 账户。

---

## 步骤 1: Firebase 项目设置

1.  **创建 Firebase 项目**：
    *   访问 [Firebase 控制台](https://console.firebase.google.com/)。
    *   点击 "添加项目"，然后按照步骤创建一个新的 Firebase 项目，或者选择一个现有项目。
    *   在项目创建过程中或之后，系统可能会提示您关联到一个 Google Cloud 项目（通常会自动创建或关联）。

2.  **为您的 Firebase 项目添加 Android 应用**：
    *   在 Firebase 项目概览页面，点击 Android 图标 (或 "添加应用" 然后选择 Android)。
    *   **Android 软件包名称**: 输入您的应用包名 (例如，`com.brainnel.app`，与您 `app.json` 中的 `android.package` 一致)。
    *   **应用昵称**: 可选。
    *   **调试签名证书 SHA-1**: 这是一个非常关键的步骤。
        *   您需要获取用于调试构建的 `debug.keystore` 的 SHA-1 指纹。
        *   **如果您的 `debug.keystore` 位于项目内的 `android/app/debug.keystore` (通常在 prebuild 后或标准 RN 项目中)**:
            在项目根目录运行:
            ```bash
            keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
            ```
        *   **如果使用全局默认的 `~/.android/debug.keystore`**:
            ```bash
            keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
            ```
        *   从输出中复制 SHA-1 值 (例如 `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`) 并粘贴到 Firebase 控制台中。
    *   点击 "注册应用"。

3.  **下载 `google-services.json` 文件**：
    *   注册应用后，Firebase 会提示您下载 `google-services.json` 文件。
    *   下载此文件。

4.  **（可选）为您的 Firebase 项目添加 iOS 应用**：
    *   类似地，如果您计划支持 iOS，也添加 iOS 应用。
    *   **iOS Bundle ID**: 输入您 `app.json` 中的 `ios.bundleIdentifier` (例如 `com.brainnel.app`)。
    *   下载 `GoogleService-Info.plist` 文件。

---

## 步骤 2: Google Cloud Console 配置

通常，当您创建 Firebase 项目并添加应用时，相关的 Google Cloud 项目和 OAuth 客户端 ID 也会被自动创建或配置。但手动检查和完善是必要的。

### 2.1 确认项目并启用 API
1.  访问 [Google Cloud Console](https://console.cloud.google.com/)。
2.  在页面顶部的项目选择器中，确保选择了与您的 Firebase 项目关联的那个 Google Cloud 项目 (项目 ID 通常与 Firebase 项目 ID 一致或相关，例如 `brainnel-7eead`)。
3.  导航到 "API 和服务" -> "库"。
4.  搜索并确保以下两个 API 已启用：
    *   **Identity Toolkit API** (有时也叫 Google Identity Toolkit API)
    *   **Google People API**
    如果未启用，请启用它们。

### 2.2 配置 OAuth 同意屏幕
1.  在 Google Cloud Console 中，导航到 "API 和服务" -> "OAuth 同意屏幕"。
2.  **用户类型**: 通常选择 "外部"。
3.  **填写应用信息**:
    *   **应用名称**: 您的应用名称。
    *   **用户支持电子邮件**: 您的支持邮箱。
    *   **应用徽标**: 可选。
4.  **应用域**:
    *   **应用首页链接**: 例如 `http://www.brainnel.com/`。
    *   **应用隐私政策链接**: **必填！** 必须是一个有效的、公开可访问的 URL，指向您应用的隐私政策。例如 `https://shop.brainnel.com/#/pages/msg/notice_detail?type=ysxy`。
    *   **应用服务条款链接**: **必填 (或强烈推荐)!** 必须是一个有效的、公开可访问的 URL。
5.  **已获授权的网域**: 对于纯移动应用，这里通常不需要额外添加。
6.  **开发者联系信息**: **必填！** 填写您的电子邮件地址。
7.  **范围 (Scopes)**: 点击"添加或移除范围"。确保至少包含以下非敏感范围：
    *   `.../auth/userinfo.email` (或 `email`)
    *   `.../auth/userinfo.profile` (或 `profile`)
    *   `openid`
8.  **测试用户 (如果 OAuth 同意屏幕的发布状态是"测试")**:
    *   **非常重要！** 如果您的应用尚未发布为"正式版"，您必须在此处添加所有用于测试登录的 Google 账号的完整电子邮件地址。否则，这些未列出的账号在尝试登录时会遇到 `DEVELOPER_ERROR` 或类似错误。
9.  **保存并继续**。

### 2.3 创建/检查 OAuth 2.0 客户端 ID
1.  在 Google Cloud Console 中，导航到 "API 和服务" -> "凭据"。
2.  您应该在 "OAuth 2.0 客户端 ID" 部分看到至少两个客户端 ID（通常由 Firebase 自动创建）：
    *   一个**类型为 "Android"** 的客户端 ID：
        *   点击它进行检查。
        *   确保其**软件包名称**与您的应用 (`com.brainnel.app`) 一致。
        *   确保其**SHA-1 证书指纹**与您在 Firebase 中配置的以及您本地 `debug.keystore` 的指纹一致。
        *   记下这个 Android 客户端 ID (例如 `XXXX-android.apps.googleusercontent.com`)。
    *   一个**类型为 "Web 应用"** 的客户端 ID：
        *   点击它进行检查。
        *   通常不需要配置"已获授权的 JavaScript 来源"或"已获授权的重定向 URI"来进行纯移动端登录，但确保没有冲突的配置。
        *   记下这个 Web 应用客户端 ID (例如 `YYYY-web.apps.googleusercontent.com`)。这个 ID 将用作代码中的 `webClientId`。

---

## 步骤 3: 安装依赖库
在您的项目根目录运行：
```bash
npm install @react-native-google-signin/google-signin
# 或者
yarn add @react-native-google-signin/google-signin
```
**注意**: `@react-native-google-signin/google-signin` 包含原生代码，因此在 Expo Managed Workflow 中，您将需要使用开发构建 (Development Build) 或 EAS Build 来正确地测试和部署它。它无法在标准的 Expo Go 应用中直接工作。

---

## 步骤 4: Expo 项目配置 (app.json)
1.  将之前下载的 `google-services.json` 文件**放置在您 Expo 项目的根目录下**。
2.  修改您的 `app.json` (或 `app.config.js`/`app.config.ts`) 文件：
    ```json
    {
      "expo": {
        // ...其他配置...
        "android": {
          "package": "com.brainnel.app", // 确保与 Firebase 和 Google Cloud Console 中的包名一致
          "googleServicesFile": "./google-services.json" // 指向根目录下的文件
          // ...可能需要的其他 android 配置...
        },
        "ios": {
          "bundleIdentifier": "com.brainnel.app", // 确保与 Firebase 和 Google Cloud Console 中的 Bundle ID 一致
          "googleServicesFile": "./GoogleService-Info.plist" // (如果您也配置了iOS)
          // ...可能需要的其他 ios 配置，例如 infoPlist for URL schemes if using Firebase Auth
        }
        // ...其他配置...
      }
    }
    ```

---

## 步骤 5: 编写登录代码
在您的登录相关的 React Native 组件 (例如 `LoginScreen.tsx`) 中：

```typescript
import React from 'react';
import { Button, View, Text } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// 在组件外部或应用启动时尽早配置
try {
  GoogleSignin.configure({
    // webClientId 必须是您在 Google Cloud Console 中创建的 "Web 应用" 类型的 OAuth 2.0 客户端 ID
    webClientId: 'YOUR_WEB_APPLICATION_CLIENT_ID.apps.googleusercontent.com', 
    // iosClientId (可选, 如果您也支持 iOS, 这是 iOS 类型的 OAuth 2.0 客户端 ID)
    // iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com', 
    scopes: ['profile', 'email'], // 请求的权限
    // offlineAccess: false, // 通常客户端登录不需要 true，除非您有特殊后端需求
    // forceCodeForRefreshToken: false, // 同上
  });
} catch (error) {
  console.error("Google Signin Configure Error", error);
}


const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const userInfo = await GoogleSignin.signIn();
    console.log('User Info --> ', userInfo);
    // 在这里，您可以获取 userInfo.idToken 并将其发送到您的后端或 Firebase Authentication
    // 例如: const idToken = userInfo.idToken;
    // navigation.navigate('HomeScreen'); // 登录成功后导航
  } catch (error: any) {
    console.error('Google Sign In Error', error.code, error.message);
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      // 用户取消了登录流程
      console.log('User cancelled the login flow');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      // 操作 (例如登录) 已经在进行中
      console.log('Operation (e.g. sign in) is in progress already');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      // Google Play services 不可用或版本过旧
      console.log('Play services not available or outdated');
      // 可以提示用户更新 Google Play Services
    } else {
      // 发生了一些其他错误 (例如 DEVELOPER_ERROR)
      // 对于 DEVELOPER_ERROR，请仔细检查步骤 1, 2, 4 的所有配置
      console.log('Some other error happened', error);
    }
  }
};

const GoogleLoginScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Sign in with Google" onPress={signInWithGoogle} />
    </View>
  );
};

export default GoogleLoginScreen;
```
**请务必将 `YOUR_WEB_APPLICATION_CLIENT_ID.apps.googleusercontent.com` 替换为您在步骤 2.3 中记录的"Web 应用"类型的 OAuth 2.0 客户端 ID。**

---

## 步骤 6: 测试环境与构建

### 6.1 开发构建 (推荐)
由于 `@react-native-google-signin/google-signin` 包含原生代码，强烈建议使用 Expo 的开发构建进行测试：
1.  安装 EAS CLI: `npm install -g eas-cli` (如果尚未安装)。
2.  登录 EAS: `eas login`。
3.  创建 Android 开发构建:
    ```bash
    eas build -p android --profile development
    ```
4.  构建完成后，下载生成的 `.apk` 文件并将其安装到您的 Android 设备或模拟器上。
5.  使用开发客户端启动 Metro Bundler:
    ```bash
    npx expo start --dev-client --clear
    ```
6.  在您的开发构建应用中连接到 Metro Bundler 并测试 Google 登录。

### 6.2 Expo Go (功能受限)
直接在 Expo Go 应用中测试 `@react-native-google-signin/google-signin` 通常会失败或功能不完整，因为它无法加载自定义原生模块。不建议用于最终测试。

---

## 步骤 7: （可选）与 Firebase Authentication 集成
如果您希望使用 Firebase Authentication 管理用户：
1.  安装 Firebase Auth 库:
    ```bash
    npm install @react-native-firebase/app @react-native-firebase/auth
    # 或者
    yarn add @react-native-firebase/app @react-native-firebase/auth
    ```
    **注意**: `@react-native-firebase/auth` 也包含原生代码，同样需要开发构建。
2.  在 Firebase 控制台中，确保已启用 "Authentication" -> "登录方法" -> "Google"。
3.  修改您的 `signInWithGoogle` 函数：
    ```typescript
    // ... (顶部导入 @react-native-firebase/auth)
    // import auth from '@react-native-firebase/auth';

    // ... 在 `GoogleSignin.signIn()` 成功后 ...
    // const userInfo = await GoogleSignin.signIn();
    if (userInfo.idToken) {
      // 创建 Google 身份验证凭据
      // const googleCredential = auth.GoogleAuthProvider.credential(userInfo.idToken);
      // 使用凭据登录 Firebase
      // await auth().signInWithCredential(googleCredential);
      console.log('Firebase: Signed in with Google!');
    }
    ```
    *(请取消注释并确保 `auth` 已正确导入和配置)*

---

## 故障排查 (常见 DEVELOPER_ERROR)

`DEVELOPER_ERROR` (通常是 `error.code: 10`) 是一个非常常见的错误，通常表示以下一项或多项配置存在问题：

*   **SHA-1 指纹不匹配**：确保 Firebase 控制台中的 SHA-1 与您构建应用所用密钥库的 SHA-1 完全一致。
*   **包名不匹配**：确保 `app.json`、Firebase 控制台、Google Cloud Console 中的包名完全一致。
*   **Google Cloud Console OAuth 同意屏幕未正确配置**：
    *   **隐私政策链接**缺失或无效。
    *   **服务条款链接**缺失或无效。
    *   **开发者联系信息**缺失。
    *   如果 OAuth 同意屏幕发布状态为"**测试**"，则**测试用户列表**中必须包含您用于登录的 Google 账号。
*   **相关 API 未启用**：确保 "Identity Toolkit API" 和 "Google People API" 在 Google Cloud Console 中已启用。
*   **`webClientId` 配置错误**：`GoogleSignin.configure` 中的 `webClientId` 未正确设置为 Google Cloud Console 中"Web 应用"类型的 OAuth 2.0 客户端 ID。
*   **`google-services.json` 文件问题**：文件未放置在项目根目录，或 `app.json` 中 `android.googleServicesFile` 未正确配置，或文件内容与云端配置不一致（例如，您在云端修改了 OAuth 客户端 ID 但未重新下载/更新此文件）。
*   **Expo Go 环境限制**：在 Expo Go 中测试原生模块可能会导致此类错误。请使用开发构建。

在进行任何配置更改（尤其是在 Firebase 或 Google Cloud Console）后，请给几分钟时间让更改生效，并考虑清理项目缓存、重新构建应用（特别是开发构建）后再进行测试。 