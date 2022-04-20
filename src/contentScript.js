"use strict";

import $ from "jquery";

let ace_editor_div = $(".ace_editor");

if (ace_editor_div.length) {
  console.log(
    "[monaco-it cs] ace detected! id:",
    ace_editor_div,
    chrome.runtime.getURL("")
  );
  document.head.dataset.monacoItPublicPath = chrome.runtime.getURL("");
  $("head").attr("data-monaco-editor-public-path", chrome.runtime.getURL(""));
  chrome.runtime.sendMessage("inject-script");
}
