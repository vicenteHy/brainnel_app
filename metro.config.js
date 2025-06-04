const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 确保资源文件扩展名被正确处理
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'svg'
];

// 添加资源目录到解析路径
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;