const path = require('path');
var webpack = require('webpack');
var TerserPlugin = require('terser-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin')

var pkg = require('../package.json');
var year = new Date().getFullYear();
module.exports = {
  entry: {
    Client: './demo/Client.ts',
    AllEnum: './demo/AllEnum.ts'
  },
  devtool: 'inline-source-map',
  mode: 'none',
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
    extensions: [ '.tsx', '.ts', '.js' ],
    extensionAlias: {
      '.js': ['.ts', '.js'],
      '.mjs': ['.mts', '.mjs'],
    }
  },
  output: {
    filename: '[name].js',
    globalObject: 'this',
    path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            ascii_only: true
          }
        }
      })
    ]
  },
  plugins: [
    new CircularDependencyPlugin({
      // exclude detection of files based on a RegExp
      exclude: /a\.js|node_modules/,
      // add errors to webpack instead of warnings
      failOnError: true,
      // set the current working directory for displaying module paths
      cwd: process.cwd(),
    })
  ]
};
