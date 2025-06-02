# 📱 Android APK 打包完整流程文档

## 🔧 **前置条件检查**

### 1. 项目信息
- **项目路径**: `/Library/code/app`
- **项目类型**: Expo + React Native 0.76.9
- **原NDK版本**: 25.2.9519653 (不兼容)
- **目标NDK版本**: 26.1.10909125 (兼容RN 0.76)

---

## 📋 **完整操作流程**

### **步骤1: 安装正确的NDK版本**
```bash
# 在项目根目录执行
cd /Library/code/app

# 安装NDK 26.1.10909125
sudo /Users/mac/Library/Android/sdk/cmdline-tools/19.0/bin/sdkmanager "ndk;26.1.10909125"
```

### **步骤2: 更新EAS配置**
**文件路径**: `/Library/code/app/eas.json`

**修改内容**:
```json
{
  "cli": {
    "version": ">= 16.4.1",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "ndk": "26.1.10909125"
      }
    },
    "preview": {
      "distribution": "internal", 
      "android": {
        "buildType": "apk",
        "ndk": "26.1.10909125"
      },
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle",
        "ndk": "26.1.10909125"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### **步骤3: 重新生成Android项目**
```bash
# 删除旧的Android目录
rm -rf android

# 重新生成Android项目
npx expo prebuild --platform android
```

### **步骤4: 创建网络安全配置文件**
**创建目录**:
```bash
mkdir -p android/app/src/main/res/xml
```

**文件路径**: `/Library/code/app/android/app/src/main/res/xml/network_security_config.xml`

**新建文件，内容**:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- 允许开发环境的HTTP连接 -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">127.0.0.1</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">10.0.3.2</domain>
    </domain-config>
    
    <!-- 生产环境HTTPS域名配置 -->
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">api.brainnel.com</domain>
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </domain-config>
    
    <!-- 基础配置 -->
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </base-config>
</network-security-config>
```

### **步骤5: 更新AndroidManifest.xml**
**文件路径**: `/Library/code/app/android/app/src/main/AndroidManifest.xml`

**修改内容**:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools">
  <!-- 添加网络权限 -->
  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
  <uses-permission android:name="android.permission.ACCESS_WIFI_STATE"/>
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
  <uses-permission android:name="android.permission.RECORD_AUDIO"/>
  <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
  <uses-permission android:name="android.permission.VIBRATE"/>
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
  
  <queries>
    <intent>
      <action android:name="android.intent.action.VIEW"/>
      <category android:name="android.intent.category.BROWSABLE"/>
      <data android:scheme="https"/>
    </intent>
  </queries>
  
  <!-- 在application标签中添加网络安全配置引用 -->
  <application android:name=".MainApplication" 
               android:label="@string/app_name" 
               android:icon="@mipmap/ic_launcher" 
               android:roundIcon="@mipmap/ic_launcher_round" 
               android:allowBackup="true" 
               android:theme="@style/AppTheme" 
               android:supportsRtl="true" 
               android:usesCleartextTraffic="true" 
               android:networkSecurityConfig="@xml/network_security_config">
    <!-- 其他配置保持不变 -->
  </application>
</manifest>
```

**关键修改点**:
1. 添加 `ACCESS_NETWORK_STATE` 和 `ACCESS_WIFI_STATE` 权限
2. 在 `application` 标签中添加 `android:networkSecurityConfig="@xml/network_security_config"`

### **步骤6: 构建APK**
```bash
# 进入Android目录
cd android

# 构建Debug版本（需要Metro服务器）
./gradlew assembleDebug

# 构建Release版本（独立运行，推荐）
./gradlew assembleRelease
```

---

## 📁 **生成的文件位置**

### **Debug APK**
- **路径**: `/Library/code/app/android/app/build/outputs/apk/debug/app-debug.apk`
- **大小**: 228MB
- **特点**: 需要Metro开发服务器

### **Release APK** ⭐
- **路径**: `/Library/code/app/android/app/build/outputs/apk/release/app-release.apk`
- **大小**: 107MB  
- **特点**: 独立运行，生产就绪

---

## 🔧 **修改的文件汇总**

| 文件路径 | 操作类型 | 修改内容 |
|---------|---------|---------|
| `eas.json` | 修改 | 更新NDK版本为26.1.10909125 |
| `android/app/src/main/res/xml/network_security_config.xml` | 新建 | 网络安全配置 |
| `android/app/src/main/AndroidManifest.xml` | 修改 | 添加网络权限和安全配置引用 |

---

## ⚠️ **重要注意事项**

1. **NDK版本兼容性**: React Native 0.76+ 需要NDK 26+
2. **网络配置**: 解决APK网络访问问题的关键
3. **构建选择**: 推荐使用Release版本进行测试和发布
4. **权限设置**: 确保所有必要的网络权限已添加

---

## 🚀 **快速重现命令**

如果需要重新构建，执行以下命令序列：

```bash
# 1. 进入项目目录
cd /Library/code/app

# 2. 重新生成Android项目（如果需要）
rm -rf android && npx expo prebuild --platform android

# 3. 创建网络配置（如果文件不存在）
mkdir -p android/app/src/main/res/xml
# 然后手动添加network_security_config.xml文件

# 4. 构建Release APK
cd android && ./gradlew assembleRelease
```

**最终APK位置**: `/Library/code/app/android/app/build/outputs/apk/release/app-release.apk`

---

## ✅ **验证步骤**

1. **检查APK大小**: Release版本约107MB
2. **安装测试**: 在Android设备上安装APK
3. **网络测试**: 验证应用能正常访问网络API
4. **功能测试**: 确认所有功能正常工作

---

## 🔄 **Google 登录配置**

### **当前状态**
- ✅ **Android CLIENT_ID**: 已配置
- 🔄 **iOS CLIENT_ID**: 需要提供
- ✅ **原生登录**: 已配置，无需浏览器

### **文件位置**
`/Library/code/app/app/screens/loginList/index.tsx`

```javascript
// 配置 Google 登录
GoogleSignin.configure({
  iosClientId: "YOUR_IOS_CLIENT_ID_HERE.apps.googleusercontent.com", // 需要替换
  webClientId: "529750832779-d0jpf2493plgm8eutkmk9e9t3rhkta8b.apps.googleusercontent.com", // Android CLIENT_ID
  scopes: ['profile', 'email'],
  offlineAccess: true,
});
```

---

## 📝 **构建记录**

- **构建日期**: 2024年5月23日
- **构建时间**: Debug 17分钟，Release 25分钟  
- **NDK版本**: 26.1.10909125
- **React Native版本**: 0.76.9
- **构建结果**: ✅ 成功

---

**此文档记录了完整的Android APK打包流程，可作为后续开发和部署的参考。**

## ❗ **未解决问题**

- 您的 `release` 构建类型目前配置为使用 `debug` 签名信息。这需要修正才能正确发布应用。

--- 