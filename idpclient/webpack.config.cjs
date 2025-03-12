const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin'); // 添加这行

// 创建基础配置
const baseConfig = {
  context: __dirname,
  // devtool: 'source-map',
  mode: 'production',
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
            inline: 2
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
};

// UMD 配置
const umdConfig = {
  ...baseConfig,
  plugins: [
    new CleanWebpackPlugin(),  // 只在 UMD 配置中清理
    ...baseConfig.plugins
  ],
  entry: {
    Client: {
      import: './Client.ts',
      library: {
        type: 'umd',
        name: 'Client'
      }
    }
  },
  output: {
    filename: '[name].umd.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      type: 'umd',
      name: 'Client'
    },
    globalObject: 'this',
  }
};

// ESM 配置
const esmConfig = {
  ...baseConfig,
  entry: {
    Client: {
      import: './Client.ts',
      library: {
        type: 'module'
      }
    }
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      type: 'module'
    },
  },
  experiments: {
    outputModule: true
  }
};

// 导出配置数组
module.exports = [umdConfig, esmConfig];