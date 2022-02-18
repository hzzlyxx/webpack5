const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const SpritesmithPlugin = require('webpack-spritesmith');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WebpackBar = require('webpackbar');

const isDev = process.env.NODE_ENV === 'development';
const resolve = (str) => path.resolve(__dirname, str);

const entry = {};
const pages = [
  { name: 'index', },
];

const genHtmlPluginConfig = (options) => {
  return options.map((option) => {
    entry[option.name] = path.resolve(__dirname, `../src/${option.name}.tsx`);
    return new HtmlWebpackPlugin({
      filename: `${option.name}.html`,
      title: option.title,
      template: path.resolve(__dirname, `../public/${option.template || 'index'}.html`),
      inject: true,
      minify: false,
      chunks: [`${option.name}`],
      cache: true,
    });
  });
};

const htmlPluginConfigs = genHtmlPluginConfig(pages);

module.exports = {
  entry,
  output: {
    path: resolve('../release'),
    filename: 'js/[name].js',
    publicPath: isDev ? '/' : './',
  },
  module: {
    rules: [
      {
        test: /\.ts[x]?$/,
        exclude: /node_modules/,
        use: [
          { loader: 'cache-loader' },
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
            },
          },
        ],
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: [
          { loader: 'cache-loader' },
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
            },
          },
        ],
      },
      {
        test: /\.(sc|sa|c)ss$/,
        use: [
          {
            loader: isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          },
          { loader: 'cache-loader' },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
            },
          },
          {
            loader: 'postcss-loader',
          },
          {
            loader: 'sass-loader',
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        type: 'asset',
        generator: {
          // [ext] 自带 "."
          filename: "images/[name][hash:7][ext]"
        },
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024
          }
        },
      },
      {
        test: /\.svg$/,
        type: 'asset/source',
      }
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': resolve('../src'),
    },
    modules: ['node_modules', resolve('../src')],
  },
  plugins: [
    ...htmlPluginConfigs,
    new WebpackBar(),
    new SpritesmithPlugin({
      src: {
        cwd: resolve('../src/assets/images'), // 图片根路径
        glob: '*.png', // 图片类型
      },
      target: {
        image: resolve('../src/images/sprite.png'), // 生成雪碧图的名称和路径
        css: [
          [
            resolve('../src/scss/sprite.scss'),
            {
              // 生成CSS文件的名称和路径
              format: 'function_based_template', // 模板配置，注意在customTemplates中配置对应名称的属性名
            },
          ],
        ],
      },
      customTemplates: {
        function_based_template: spriteTemplateFunc, // 上一项使用到的模板变量
      },
      apiOptions: {
        cssImageRef: '../images/sprite.png', // 生成的CSS中引用的雪碧图路径
      },
      spritesmithOptions: {
        padding: 6, // 图标的间隔
      },
    }),
  ],
  infrastructureLogging: {
    level: 'error',
  },
  stats: 'errors-only',
};

function spriteTemplateFunc(data) {
  if (data.sprites.length === 0) return '';
  const imageName = data.spritesheet.image.match(/[^/\\]+$/)[0].replace(/\.\w+$/, '');
  const fn = '@use "sass:math"; $base: 40; @function rem( $px ){@return math.div($px, 60)*1rem;}';
  const file = data.sprites[0].image.split('/');
  const filename = file[file.length - 1];
  const shared = `%${imageName} {
  background-image: url(~@/images/${filename}});
  background-repeat: no-repeat;
  background-size: rem(${data.spritesheet.width}) rem(${data.spritesheet.height});
}`;

  const perSprite = data.sprites
    .map((sprite) => {
      const pX = sprite.offset_x
        ? `${(sprite.offset_x / (sprite.width - sprite.total_width)) * 100}%`
        : 0;
      const pY = sprite.offset_y
        ? `${(sprite.offset_y / (sprite.height - sprite.total_height)) * 100}%`
        : 0;
      return '@mixin N { width: rem(W); height: rem(H); background-position: X Y; }'
        .replace('N', sprite.name)
        .replace('W', sprite.width)
        .replace('H', sprite.height)
        .replace('X', pX)
        .replace('Y', pY);
    })
    .join('\n');

  return `${fn}\n${shared}\n${perSprite}`;
}
