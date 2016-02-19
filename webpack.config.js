module.exports = {
  entry: './index.js',
  output: {
    path: __dirname,
    filename: 'bin/webby.js'
  },
  target: 'node',
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
