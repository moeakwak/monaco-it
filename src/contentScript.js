"use strict";

import $ from "jquery";

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
