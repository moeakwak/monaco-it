"use strict";

// use chrome-extension path for webpack chunks
__webpack_public_path__ = document.head.dataset.monacoItPublicPath;

import $ from "jquery";

// localize zh-CN
import { setLocaleData } from "monaco-editor-nls";
import zh_CN from "monaco-editor-nls/locale/zh-hans";
setLocaleData(zh_CN);
const monaco = require("monaco-editor");

import "monaco-editor/esm/vs/editor/standalone/browser/accessibilityHelp/accessibilityHelp.js";
import "monaco-editor/esm/vs/editor/standalone/browser/inspectTokens/inspectTokens.js";
import "monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js";
import "monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess.js";
import "monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess.js";
import "monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess.js";
import "monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.js";
// import "monaco-editor/esm/vs/editor/standalone/browser/quickInput/standaloneQuickInputService.js";
import "monaco-editor/esm/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch.js";
import "monaco-editor/esm/vs/editor/standalone/browser/toggleHighContrast/toggleHighContrast.js";

import { getMonacoEnvironment } from "./utils";
import { connectServer } from "./client";
import { registerLanguages } from "./language_loader";

let enableLanguageService = false;

// register Monaco languages
registerLanguages(monaco);

// load ace editor initial configs
let ace_editor_div = $(".ace_editor");
let ace_editor = ace.edit(ace_editor_div.get()[0]);
let ace_editor_session = ace_editor.getSession();
let readOnly = ace_editor.getReadOnly();

let current_language = get_ace_language(ace_editor);
console.log("init language:", current_language);

if (current_language == "cpp" || current_language == "python")
  enableLanguageService = true;

function get_ace_language() {
  let lang = ace_editor_session.getMode().$id.replace("ace/mode/", "");
  if (lang == "c_cpp") lang = "cpp";
  return lang;
}

// currently use websocket
let webSocket = null;

// initialize
console.log("initialize", ace_editor.getValue());
initialize(ace_editor.getValue());

function initialize(init_code) {
  // avoid CROS
  let baseUrl = $("head").attr("data-monaco-editor-public-path");
  self.MonacoEnvironment = getMonacoEnvironment(baseUrl);

  // create monaco editor
  ace_editor_div.after(
    `<div id="monaco-it-editor"
          style="position: relative; height: 100%; width: 100%; border: 1px solid #c2c7d0">
      </div>`
  );
  let monaco_div = $("#monaco-it-editor");
  let monaco_model = monaco.editor.createModel(
    init_code,
    current_language,
    monaco.Uri.parse("inmemory://model.json")
  );
  let monaco_editor = monaco.editor.create(
    document.getElementById("monaco-it-editor"),
    {
      model: monaco_model,
      readOnly,
      automaticLayout: true,
      fontSize: 14,
      minimap: false,
      theme: "vs", // or vs-dark
      scrollBeyondLastLine: false,
      wordWrap: "on",
      wrappingStrategy: "advanced",
      minimap: {
        enabled: false,
      },
      scrollbar: {
        alwaysConsumeMouseWheel: false,
      },
      overviewRulerLanes: 0,
    }
  );
  monaco_editor.layout();
  console.log("[monaco-it] monaco editor created", monaco_editor, monaco_model);

  // hide ace editor
  ace_editor_div.hide();

  // sync code from monaco to ace
  // notice: to avoid endless call, only sync from monaco to ace after initialized
  monaco_model.onDidChangeContent((event) => {
    document.dispatchEvent(
      new CustomEvent("monaco-it-monaco-change", {
        detail: monaco_model.getValue(),
      })
    );
  });
  document.addEventListener("monaco-it-monaco-change", function (e) {
    ace_editor.setValue(e.detail);
  });

  // content height: min 400; disable inner scroll; grow with text
  let ignoreEvent = false;
  const updateHeight = () => {
    let contentHeight = Math.min(1000, monaco_editor.getContentHeight());
    if (contentHeight < 400) contentHeight = 400;
    monaco_div.height(contentHeight);
    try {
      ignoreEvent = true;
      monaco_editor.layout();
    } finally {
      ignoreEvent = false;
    }
  };
  monaco_editor.onDidContentSizeChange(updateHeight);
  updateHeight();

  // sync language from ace to monaco
  ace_editor_session.on("changeMode", () => {
    current_language = get_ace_language();
    console.log("change language to", current_language);
    monaco.editor.setModelLanguage(monaco_model, current_language);
    if (current_language == "cpp" || current_language == "python")
      enableLanguageService = true;
    if (webSocket) webSocket.close();
    if (enableLanguageService)
      webSocket = connectServer(monaco, monaco_editor, current_language);
  });

  // connect to server
  if (enableLanguageService)
    webSocket = connectServer(monaco, monaco_editor, current_language);
}
