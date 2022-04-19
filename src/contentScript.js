"use strict";

import $ from "jquery";
//  from "monaco-editor";
// const monaco = require("monaco-editor");

// import { setLocaleData } from "monaco-editor-nls";
// import zh_CN from "monaco-editor-nls/locale/zh-hans";

// setLocaleData(zh_CN);

let ace_editor = $(".ace_editor");

if (ace_editor) {
  console.log(
    "ace detected! id:",
    ace_editor.attr("id"),
    chrome.runtime.getURL("")
  );
  document.head.dataset.monacoItPublicPath = chrome.runtime.getURL("");
  $("head").attr("data-monaco-editor-public-path", chrome.runtime.getURL(""));
  chrome.runtime.sendMessage("inject-script");
}
