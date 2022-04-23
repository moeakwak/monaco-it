"use strict";

import $ from "jquery";

let ace_editor_div = $(".ace_editor");

if (ace_editor_div.length) {
  console.log(
    "[monaco-it cs] ace detected! id:",
    ace_editor_div,
    chrome.runtime.getURL("")
  );

  chrome.storage.local.get(
    ["enableLanguageServer", "languageServerUrl", "editorOptions"],
    (items) => {
      document.head.dataset.monacoIdServerAddress = items.languageServerUrl;
      document.head.dataset.monacoEnableLanguageServer =
        items.enableLanguageServer ? "yes" : "no";
      if (items["editorOptions"] != undefined)
        document.head.dataset.monacoItEditorOptions = JSON.stringify(
          items.editorOptions
        );
      document.head.dataset.monacoItPublicPath = chrome.runtime.getURL("");
      $("head").attr(
        "data-monaco-editor-public-path",
        chrome.runtime.getURL("")
      );
      chrome.runtime.sendMessage("inject-script");
      console.log("[monaco-it cs] inject script, options:", items);
    }
  );
}
