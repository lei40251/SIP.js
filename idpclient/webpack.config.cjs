const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');

module.exports = {
  entry: {
    Client: {
      import: './Client.ts',
      library: {
        type: 'module'
      }
    }
  },
  devtool: 'source-map',
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
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      type: 'module'
    },
    globalObject: 'this',
    clean: true
  },
  experiments: {
    outputModule: true
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