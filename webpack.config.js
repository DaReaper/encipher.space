var path = require('path')
var webpack = require('webpack')
var CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: '/dist/',
    filename: 'build.js'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
            // Since sass-loader (weirdly) has SCSS as its default parse mode, we map
            // the "scss" and "sass" values for the lang attribute to the right configs here.
            // other preprocessors should work out of the box, no loader config like this necessary.
            'scss': 'vue-style-loader!css-loader!sass-loader',
            'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax'
          }
          // other vue-loader options go here
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js'
    }
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true
  },
  performance: {
    hints: false
  },
  devtool: '#eval-source-map'
}

if (process.env.NODE_ENV === 'production') {
  module.exports.devtool = '#source-map'
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    new CopyWebpackPlugin([
      {from: 'index.html'},
      {from: 'manifest.json'},
      {from: 'logo.png'},

      {from: 'node_modules/msgpack-lite/dist/msgpack.min.js', to: 'node_modules/msgpack-lite/dist/'},
      {from: 'node_modules/tweetnacl/nacl-fast.min.js', to: 'node_modules/tweetnacl/'},
      {from: 'node_modules/chunked-dc/dist/chunked-dc.es5.min.js', to: 'node_modules/chunked-dc/dist/'},
      {from: 'node_modules/@saltyrtc/client/dist/saltyrtc-client.es5.js', to: 'node_modules/@saltyrtc/client/dist/'},
      {from: 'node_modules/saltyrtc-task-webrtc/dist/saltyrtc-task-webrtc.es5.js', to: 'node_modules/saltyrtc-task-webrtc/dist/'}
    ]),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false
      }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ])
}
