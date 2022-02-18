const { merge } = require('webpack-merge');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const common = require('./webpack.common.js');

const port = 8080;

module.exports = merge(common, {
  mode: 'development',
  devServer: {
    port,
    // open: true,
    hot: true,
    liveReload: false,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      reconnect: false,
      progress: true,
    },
    proxy: {
      // '/': {
      //   target: 'http://xxxxxxxx',
      //   changeOrigin: true,
      //   // pathRewrite: { '^/api': '' },
      // },
    },
  },
  plugins: [
    new FriendlyErrorsWebpackPlugin({
      compilationSuccessInfo: {
        messages: [`You application is running here http://localhost:${port}`],
      },
    }),
    new ESLintPlugin({
      extensions: ['js', 'jsx', 'ts', 'tsx'],
    }),
  ],
  optimization: {
    runtimeChunk: 'single'
  },
});
