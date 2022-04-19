"use strict";

const { merge } = require("webpack-merge");
const webpack = require('webpack');
const common = require("./webpack.common.js");
const PATHS = require("./paths");
// const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const MonacoWebpackPlugin = require("monaco-editor-esm-webpack-plugin");

// Merge webpack configuration files
const config = (env, argv) =>
  merge(common, {
    output: {
      publicPath: PATHS.build,
    },
    entry: {
      contentScript: PATHS.src + "/contentScript.js",
      background: PATHS.src + "/background.js",
      inject: PATHS.src + "/inject.js",
    },
    devtool: argv.mode === "production" ? false : "source-map",
    module: {
      rules: [
        // {
        //   test: /\.m?js$/,
        //   exclude: /node_modules/,
        //   use: {
        //     loader: "babel-loader",
        //     options: {
        //       presets: ['@babel/preset-env']
        //     }
        //   }
        // },
        {
          test: /codicon\.ttf$/,
          use: [
            {
              loader: "file-loader",
              options: {
                outputPath: "images",
                name: "[name].[ext]",
                postTransformPublicPath: (p) => {
                  return `document.head.getAttribute('data-monaco-editor-public-path') + 'images/codicon.ttf'`;
                },
              },
            },
          ],
        },
        {
          test: /\.js/,
          enforce: "pre",
          include: /node_modules[\\\/]monaco-editor[\\\/]esm/,
          use: MonacoWebpackPlugin.loader,
        },
        {
          test: /\.js$/,
          loader: 'string-replace-loader',
          options: {
            search: /setImmediate *\( *(\(.*\) *=> *\{.*\}) *\)/i,
            replace(match, p1, offset, string) {
              console.log(`Replace "${match}" in file "${this.resource}, string: ${string}".`)
              return `setTimeout(${p1}, 0)`;
            },
          }
        }
      ],
    },
    plugins: [
      new MonacoWebpackPlugin({}),
      new webpack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"],
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser',
    }),
    ],
    resolve: {
      fallback: {
        path: require.resolve("path-browserify"),
        os: require.resolve("os-browserify/browser"),
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer/"),
        net: false,
      },
      alias: {
        '@Shared': require('path').resolve(__dirname, 'src/shared'),
        'vscode': require.resolve('monaco-languageclient/lib/vscode-compatibility')
      }
    },
    // externals: {
    //   vscode: "commonjs vscode",
    // },
  });

module.exports = config;
