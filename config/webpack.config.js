"use strict";

const { merge } = require("webpack-merge");

const common = require("./webpack.common.js");
const PATHS = require("./paths");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

// Merge webpack configuration files
const config = (env, argv) =>
  merge(common, {
    entry: {
      contentScript: PATHS.src + "/contentScript.js",
      background: PATHS.src + "/background.js",
      worker: PATHS.src + "/worker.js",
    },
    devtool: argv.mode === "production" ? false : "source-map",
    plugins: [
      // new MonacoWebpackPlugin({
      //   // publicPath: "",
      // }),
    ],
  });

module.exports = config;
