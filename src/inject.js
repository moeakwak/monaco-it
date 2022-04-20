"use strict";

// use chrome-extension path for webpack chunks
__webpack_public_path__ = document.head.dataset.monacoItPublicPath;

import { getMonacoEnvironment } from "./utils";
import { connectServer, getWorkspaceDirPath, updateFile } from "./client";
import { supportedLanguages, registerLanguages } from "./languageLoader";

import $ from "jquery";

// localize zh-CN
import { setLocaleData } from "monaco-editor-nls";
import zh_CN from "monaco-editor-nls/locale/zh-hans";
setLocaleData(zh_CN);
const monaco = require("monaco-editor");

// enable features in monacoUtils.js
import "./monacoUtils";

// register Monaco languages
registerLanguages();

// load ace editor initial configs
let ace_editor_div = $(".ace_editor");
let ace_editor = ace.edit(ace_editor_div.get()[0]);
let ace_editor_session = ace_editor.getSession();
let readOnly = ace_editor.getReadOnly();

let current_language = get_ace_language(ace_editor);
let init_code = ace_editor.getValue();

function get_ace_language() {
  let lang = ace_editor_session.getMode().$id.replace("ace/mode/", "");
  if (lang == "c_cpp") lang = "cpp";
  return lang;
}

// initialize
console.log(
  "[monaco-it inject] start initialize, init language: ",
  current_language
);

let workspace_dir_path = null;
let enableLanguageService = false;

// try to connect language server, and get workspace_dir_path for rootUri
getWorkspaceDirPath(
  (response) => {
    enableLanguageService = true;
    workspace_dir_path = response.data;
    console.log(
      "[monaco-it inject] connect language serve success, workspace_dir_path:",
      workspace_dir_path
    );
    updateFile(urlToFileName(), init_code);
    initialize(ace_editor.getValue());
  },
  (response) => {
    enableLanguageService = false;
    console.log("[monaco-it inject] connect language serve failed:", response);
    initialize(ace_editor.getValue());
  }
);

function urlToFileName(lang) {
  let ext = lang;
  if (ext == "python") ext = "py";
  return (
    document.location.href
      .replace(/.*:\/\//i, "")
      .replace(/[:\/ \?<>\\\*\.]/g, "_")
      .replace(/_+/g, "_") + ext
  );
}

function getFileUri(lang) {
  if (lang == "cpp" && workspace_dir_path)
    return "file://" + require("path").join(workspace_dir_path, urlToFileName(lang));
  else
    return  "inmemory://" + urlToFileName(lang);
}

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
  let uri = getFileUri(current_language);
  console.log("[monaco-it inject] use uri", uri);
  let monaco_model = monaco.editor.createModel(
    init_code,
    current_language,
    monaco.Uri.parse(uri)
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

  // update file in language server when changed
  monaco_editor.onDidChangeModelContent((e) => {});

  // currently use websocket
  let webSocket = null;
  enableLanguageService =
    enableLanguageService && supportedLanguages.includes(current_language);

  // sync language from ace to monaco
  ace_editor_session.on("changeMode", () => {
    current_language = get_ace_language();
    console.log("change language to", current_language);
    monaco.editor.setModelLanguage(monaco_model, current_language);
    if (webSocket) webSocket.close();
    webSocket = connectServer(
      monaco_editor,
      monaco_model,
      current_language,
      workspace_dir_path,
      urlToFileName(current_language)
    );
  });

  // connect to server
  webSocket = connectServer(
    monaco_editor,
    monaco_model,
    current_language,
    workspace_dir_path,
    urlToFileName(current_language)
  );
}
