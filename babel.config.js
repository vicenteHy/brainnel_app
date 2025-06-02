module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@hancleee/babel-plugin-react-native-pxtodp',
        {
          designWidth: 430, // 设计稿宽度
          designHeight: 932, // 设计稿高度
          exclude: /node_modules/, // 排除 node_modules 目录
          include: /src|app/, // 只处理 src 和 app 目录
        },
      ],
      'react-native-reanimated/plugin', // 👈 一定放在最后！

    ],
  };
}; 