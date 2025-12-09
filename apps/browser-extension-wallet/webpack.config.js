import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default (_env, argv) => ({
  entry: {
    popup: './src/popup/index.tsx',
    background: './src/background/index.ts',
    content: './src/content/index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.wasm$/,
        type: 'webassembly/async',
      },
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.wasm'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      crypto: false,
    },
    fallback: {
      assert: 'assert/',
      buffer: 'buffer/',
      process: 'process/browser.js',
      stream: 'stream-browserify',
      vm: 'vm-browserify',
    },
    fullySpecified: false,
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser.js',
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(argv.mode || 'development'),
      'process.env.NETWORK_ID': JSON.stringify(process.env.NETWORK_ID || ''),
      'process.env.INDEXER_HTTP': JSON.stringify(process.env.INDEXER_HTTP || ''),
      'process.env.INDEXER_WS': JSON.stringify(process.env.INDEXER_WS || ''),
      'process.env.PROOF_SERVER': JSON.stringify(process.env.PROOF_SERVER || ''),
      'process.env.NODE_URL': JSON.stringify(process.env.NODE_URL || ''),
    }),
    new HtmlWebpackPlugin({
      template: './src/popup/popup.html',
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'public/icons', to: 'icons' },
      ],
    }),
    new MiniCssExtractPlugin({ filename: '[name].css' }),
  ],
  optimization: {
    splitChunks: false,
  },
  devtool: argv.mode === 'development' ? 'cheap-module-source-map' : false,
  experiments: {
    asyncWebAssembly: true,
  },
});
