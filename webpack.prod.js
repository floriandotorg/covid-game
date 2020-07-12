const webpack = require('webpack')
const merge = require('webpack-merge')
const common = require('./webpack.common.js')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = merge(common, {
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: ['lodash'],
            presets: [['@babel/preset-env', { modules: false }]]
          }
        }
      }
    ]
  },
  plugins: [
    //new BundleAnalyzerPlugin(),
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        'src/sim*js',
        'src/*.wasm',
        'src/*.mp3'
      ]
    }),
    new webpack.optimize.ModuleConcatenationPlugin()
  ]
})
