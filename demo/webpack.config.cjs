const path = require('path')
var webpack = require('webpack')
var TerserPlugin = require('terser-webpack-plugin')
const CircularDependencyPlugin = require('circular-dependency-plugin')

var pkg = require('../package.json')
var year = new Date().getFullYear()
module.exports = {
  entry: {
    Client: {
      import: './demo/Client.ts',
      library: { type: 'assign', name: '[name]' }
    },
    AllEnum: {
      import: './demo/AllEnum.ts',
      library: { type: 'assign', name: '[name]' }
    },
    demoUtils: {
      import: './demo/demo-utils.ts',
      filename: 'demo-utils.js'
    }
  },
  devtool: 'source-map', // 生产环境使用source-map，体积较小但仍可调试
  mode: 'production', // 启用所有内置优化
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    extensionAlias: {
      '.js': ['.ts', '.js'],
      '.mjs': ['.mts', '.mjs'],
    }
  },
  output: {
    filename: '[name].js',
    chunkFilename: '[name].chunk.js', // 使用更简单的chunk文件命名方式
    globalObject: 'window',
    libraryTarget: 'window',
    path: path.resolve(__dirname, 'dist'),
  },
  experiments: {
    outputModule: false
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          ecma: 2017,
          parse: {
            ecma: 2017
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log']
          },
          mangle: {
            safari10: true,
            keep_classnames: true,
            keep_fnames: true
          },
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true
          }
        },
        extractComments: false
      })
    ],
    splitChunks: false,
    runtimeChunk: false,
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
    usedExports: true,
    concatenateModules: true
  },
  plugins: [
    new CircularDependencyPlugin({
      exclude: /a\.js|node_modules/,
      failOnError: true,
      cwd: process.cwd()
    })
  ]
}
