# Google Play 签名配置指南

## 问题说明
当你上传 AAB 文件到 Google Play 时，Google Play 会使用自己的签名密钥重新签名你的应用。这导致最终用户设备上的应用 SHA 指纹与你本地的不同。

## 获取 Google Play 签名的 SHA 指纹

1. 登录 [Google Play Console](https://play.google.com/console)
2. 选择你的应用（Brainnel）
3. 在左侧菜单中，进入：**设置** → **应用完整性**
4. 找到 **"应用签名"** 部分
5. 你会看到两个证书：
   - **上传证书**：这是你上传的 AAB 文件的证书（你已经有了）
   - **应用签名证书**：这是 Google Play 用来签名的证书（你需要这个）

6. 从 **应用签名证书** 部分复制：
   - SHA-1 证书指纹
   - SHA-256 证书指纹

## 添加到 Firebase

1. 登录 [Firebase Console](https://console.firebase.google.com)
2. 选择你的项目
3. 在项目设置中，找到你的 Android 应用（uni.UNIC87CC93）
4. 点击"添加指纹"
5. 粘贴从 Google Play Console 获取的 SHA-1 和 SHA-256 指纹
6. 下载更新后的 `google-services.json` 文件
7. 替换项目中的旧文件

## 重要提示

- Google Play 的应用签名证书是永久的，一旦设置就不会改变
- 你需要同时保留你的上传证书指纹和 Google Play 签名证书指纹
- 这样可以确保：
  - 开发和测试时（使用你的证书）可以正常工作
  - 从 Google Play 下载的应用也可以正常工作

## 验证步骤

完成配置后，你可以：
1. 上传新的 AAB 到 Google Play 的内部测试轨道
2. 下载并安装应用
3. 测试 Google 登录功能是否正常工作