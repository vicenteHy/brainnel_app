#!/bin/bash

echo "🧹 开始清理项目缓存和构建文件..."

# 清理 watchman 缓存
echo "清理 Watchman 缓存..."
watchman watch-del-all 2>/dev/null || echo "Watchman 未安装或无需清理"

# 清理 Metro 缓存
echo "清理 Metro 缓存..."
rm -rf $TMPDIR/metro-* 2>/dev/null
rm -rf $TMPDIR/haste-map-* 2>/dev/null

# 清理 React Native 缓存
echo "清理 React Native 缓存..."
rm -rf $TMPDIR/react-* 2>/dev/null

# 清理 node_modules 和重新安装
echo "删除 node_modules..."
rm -rf node_modules

echo "删除 package-lock.json..."
rm -f package-lock.json

echo "删除 yarn.lock..."
rm -f yarn.lock

# 清理 Android 构建
echo "清理 Android 构建..."
cd android
./gradlew clean 2>/dev/null || echo "Gradle 清理失败，可能需要手动清理"
cd ..

# 清理 Android 构建缓存
echo "清理 Android 构建缓存..."
rm -rf android/.gradle
rm -rf android/app/build
rm -rf android/build

# 清理 iOS 构建（如果存在）
if [ -d "ios" ]; then
    echo "清理 iOS 构建..."
    cd ios
    rm -rf build
    rm -rf Pods
    rm -rf Podfile.lock
    cd ..
fi

# 重新安装依赖
echo "重新安装依赖..."
npm install

# 重置 Metro 缓存
echo "重置 Metro 缓存..."
npx react-native start --reset-cache &
METRO_PID=$!
sleep 5
kill $METRO_PID 2>/dev/null

echo "✅ 清理完成！"
echo ""
echo "接下来请运行以下命令："
echo "1. cd android"
echo "2. ./gradlew assembleDebug"
echo ""
echo "或者使用 Expo："
echo "npx expo run:android"