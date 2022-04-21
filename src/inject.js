"use strict";

// use chrome-extension path for webpack chunks
__webpack_public_path__ = document.head.dataset.monacoItPublicPath;

import { getMonacoEnvironment } from "./utils";
import { connectServer, getWorkspaceDirPath, updateFile } from "./client";
import { supportedLanguages, registerLanguages } from "./languageLoader";

import $ from "jquery";

import "./monacoUtils";

const monaco = require("monaco-editor/esm/vs/editor/editor.api");

// register Monaco languages
registerLanguages();

// load ace editor initial configs
let ace_editor_div = $(".ace_editor");
let ace_editor = ace.edit(ace_editor_div.get()[0]);
let ace_editor_session = ace_editor.getSession();

ace_editor.on("change", (ev) => {
  // console.log("[monaco-it inject] ace_editor change", { code: getCurrentCode(), ev });
  ace_editor_div.trigger("ace-editor-change");
});

let workspace_dir_path = null;

function getCurrentLanguage() {
  let lang = ace_editor_session.getMode().$id.replace("ace/mode/", "");
  if (lang == "c_cpp") lang = "cpp";
  return lang;
}

function getCurrentCode() {
  return ace_editor.getValue();
}

export function isEnableLanguageService() {
  let lang = getCurrentLanguage();
  return !!workspace_dir_path && supportedLanguages.includes(lang);
}

// initialize
console.log(
  "[monaco-it inject] start initialize, init language: ",
  getCurrentLanguage()
);

// try to connect language server, and get workspace_dir_path for rootUri
function fetchWorkspaceDirPath() {
  getWorkspaceDirPath(
    (response) => {
      workspace_dir_path = response.data;
      console.log(
        "[monaco-it inject] connect language serve success, workspace_dir_path:",
        workspace_dir_path
      );
      if (getCurrentLanguage() == "cpp")
        updateFile(getFileNameFromUrl(), getCurrentCode());
      initialize(ace_editor.getValue());
    },
    (response) => {
      workspace_dir_path = null;
      console.log(
        "[monaco-it inject] connect language serve failed:",
        response
      );
      initialize(ace_editor.getValue());
    }
  );
}
fetchWorkspaceDirPath();

function getFileNameFromUrl(lang) {
  if (!lang) lang = getCurrentLanguage();
  let ext = lang || "txt";
  if (ext == "python") ext = "py";
  else if (ext == "javascript") ext = "js";
  else if (ext == "golang") ext = "go";
  return (
    document.location.href
      .replace(/.*:\/\//i, "")
      .replace(/[:\/ \?<>\\\*\.]/g, "_")
      .replace(/_+/g, "_") +
    "." +
    ext
  );
}

function getUri(lang) {
  if (!lang) lang = getCurrentLanguage();
  if (lang == "cpp" && !!workspace_dir_path)
    return (
      "file://" +
      require("path").join(workspace_dir_path, getFileNameFromUrl(lang))
    );
  else return "inmemory://" + getFileNameFromUrl(lang);
}

function initialize() {
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

  console.log(
    "[monaco-it inject] create model",
    getUri(),
    getCurrentLanguage()
  );
  let monaco_model = createModel();
  let monaco_editor = createEditor(
    document.getElementById("monaco-it-editor"),
    monaco_model,
    ace_editor.getReadOnly()
  );
  monaco_editor.layout();
  console.log("[monaco-it] monaco editor created", monaco_editor, monaco_model);

  // hide ace editor
  ace_editor_div.hide();

  $(document).on("monaco-it-monaco-change", function (e) {
    ace_editor.setValue(e.detail);
  });

  // currently use websocket
  let webSocket = null;

  // sync language from ace to monaco
  ace_editor_session.on("changeMode", () => {
    console.log("[monaco-it inject] change language to", getCurrentLanguage());
    // recreate model
    // monaco_model.dispose();
    monaco_model = monaco.editor.getModel(monaco.Uri.parse(getUri()));
    if (!monaco_model) monaco_model = createModel();
    if (getCurrentLanguage() == "cpp")
      updateFile(getFileNameFromUrl(), getCurrentCode());
    monaco_editor.setModel(monaco_model);
    // workspace_dir_path = getWorkspaceDirPath();
    if (webSocket) webSocket.close();
    webSocket = connectServer(
      monaco,
      monaco_editor,
      monaco_model,
      getCurrentLanguage(),
      workspace_dir_path,
      getFileNameFromUrl()
    );
  });

  // connect to server
  webSocket = connectServer(
    monaco,
    monaco_editor,
    monaco_model,
    getCurrentLanguage(),
    workspace_dir_path,
    getFileNameFromUrl()
  );
}

const editorDefaultSettings = {
  automaticLayout: true,
  codeLens: false,
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
};

function createEditor(
  container,
  model,
  readOnly = false,
  settings = editorDefaultSettings
) {
  let editor = monaco.editor.create(container, {
    model,
    readOnly,
    ...settings,
  });
  // content height: min 400; disable inner scroll; grow with text
  const updateHeight = () => {
    let contentHeight = Math.min(1000, editor.getContentHeight());
    if (contentHeight < 400) contentHeight = 400;
    $(container).height(contentHeight);

    editor.layout();
  };
  editor.onDidContentSizeChange(updateHeight);
  updateHeight();
  return editor;
}

function createModel() {
  let code = getCurrentCode();
  let lang = getCurrentLanguage();
  let uri = monaco.Uri.parse(getUri());
  let model = monaco.editor.createModel(code, lang, uri);

  if (lang == "cpp") model.updateOptions({ tabSize: 4, indentSize: 4 });

  // sync code between monaco to ace
  let eventDisposable = null;
  let func = (event) => {
    // console.log("[monaco-it inject] sync monaco code to ace", event);
    // turn off event before setValue to avoid endless loop
    ace_editor_div.off("ace-editor-change");
    ace_editor.setValue(model.getValue());
    ace_editor_div.on("ace-editor-change", (e) => {
      // console.log("[monaco-it inject] sync ace code to monaco", event);
      eventDisposable.dispose();
      model.setValue(getCurrentCode());
      eventDisposable = model.onDidChangeContent(func);
    });
  };
  eventDisposable = model.onDidChangeContent(func);

  console.log("[monaco-it inject] create model", { code, lang, uri });
  return model;
}
