var path = require('path');
var fs = require('fs');
var nodeModules = {};
fs.readdirSync('node_modules')
    .filter(function(x) {
        return ['.bin'].indexOf(x) === -1;
    })
    .forEach(function(mod) {
        nodeModules[mod] = 'commonjs ' + mod;
    });

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
  externals: nodeModules,
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel-loader',
      query: {
        presets: ['es2015']
      }
    }]
  },
  resolve: {
    extensions: ['', '.js', '.json']
  }
};
