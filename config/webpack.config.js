"use strict";

const { merge } = require("webpack-merge");

const common = require("./webpack.common.js");
const PATHS = require("./paths");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
// const MonacoWebpackPlugin = require("monaco-editor-esm-webpack-plugin");

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
      ],
    },
    plugins: [
      new MonacoWebpackPlugin({
        // languages: [
        //   "typescript",
        //   "javascript",
        //   "css",
        //   "c++",
        //   "c",
        //   "java",
        //   "go",
        //   "python",
        // ],
      }),
    ],
    resolve: {
      fallback: {
        path: require.resolve("path-browserify"),
      },
    },
  });

module.exports = config;
