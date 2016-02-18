module.exports = {
  entry: './index.js',
  output: {
    path: __dirname,
    filename: 'bin/webby.js'
  },
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
  },
  node: {
    fs: 'empty',
    readline: 'empty'
  }
};
