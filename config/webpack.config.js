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
      worker: PATHS.src + "/worker.js",
      editor_popup: PATHS.src + "/editor_popup.js",
    },
    devtool: argv.mode === "production" ? false : "source-map",
    module: {
      rules: [
        {
          test: /\.ttf$/,
          use: ["file-loader"],
        },
        {
          loader: require.resolve("chrome-url-loader"),
          test: /(node_modules_monaco_.*\.js|\.ttf)$/,
          options: {
            publicDir: "build/lib",
            baseDir: PATHS.src,
          },
        },
      ],
    },
    plugins: [
      new MonacoWebpackPlugin({
        languages: ["typescript", "javascript", "css"],
        publicPath: "",
      }),
    ],
  });

module.exports = config;
