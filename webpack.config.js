var nodeExternals = require('webpack-node-externals');

module.exports = {
  name: 'server',
  target: 'node',
  entry: './index.js',
  output: {
    path: __dirname,
    filename: 'bin/index.js',
    library: 'webby',
    libraryTarget: 'commonjs2'
  },
  externals: [nodeExternals()],
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel-loader',
      query: {
        presets: ['es2015']
      }
    }, {
      test: /\.json$/,
      loader: 'json-loader',
    }]
  },
  resolve: {
    extensions: ['', '.js', '.json']
  }
};
