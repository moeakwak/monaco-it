"use strict";

// use chrome-extension path for webpack chunks
__webpack_public_path__ = document.head.dataset.monacoItPublicPath;

import { getMonacoEnvironment } from "./utils";
import { connectServer, getRootUri as getRootUri, updateFile } from "./client";
import { registerLanguages, registerCompletion } from "./languageLoader";
import { defaultOptions } from "./options";

import $ from "jquery";

import "./monacoUtils";

const monaco = require("monaco-editor/esm/vs/editor/editor.api");

const options = JSON.parse(document.head.dataset.monacoItOptions);

// register Monaco languages
registerLanguages();

// load ace editor initial configs
let ace_editor_div = $(".ace_editor");
let ace_editor = ace.edit(ace_editor_div.get()[0]);
let ace_editor_session = ace_editor.getSession();

ace_editor.on("change", (ev) => {
  // console.log("[monaco-it inject] ace_editor change", { code: getAceContent(), ev });
  ace_editor_div.trigger("ace-editor-change");
});

let rootUri = null;
let languageWebSocket = null;

function getCurrentLanguage() {
  let lang = ace_editor_session.getMode().$id.replace("ace/mode/", "");
  if (lang == "c_cpp") lang = "cpp";
  return lang;
}

function getAceContent() {
  return ace_editor.getValue();
}

function isReadOnly() {
  return ace_editor.getReadOnly();
}

export function isEnableLanguageService() {
  return (
    options.enableLanguageServer == "yes" && !isReadOnly()
  );
}

function getFileNameFromUrl(lang) {
  if (!lang) lang = getCurrentLanguage();
  let ext = lang || "txt";
  if (ext == "python") ext = "py";
  else if (ext == "javascript") ext = "js";
  else if (ext == "golang") ext = "go";

  let filename =
    document.location.href
      .replace(/.*:\/\//i, "")
      .replace(/[:\/ \?<>\\\*\.]/g, "_")
      .replace(/_+/g, "_") +
    new Date().toISOString() +
    "." +
    ext;

  return filename;
}

function getUri(lang) {
  if (!lang) lang = getCurrentLanguage();
  if (lang == "cpp" && !!rootUri)
    return "file://" + require("path").join(rootUri, getFileNameFromUrl(lang));
  else return "inmemory://" + getFileNameFromUrl(lang);
}

getRootUri(
  (response) => {
    rootUri = response.data;
    console.log(
      "[monaco-it inject] connect language serve success, rootUri:",
      rootUri
    );
    if (getCurrentLanguage() == "cpp")
      updateFile(getFileNameFromUrl(), getAceContent());
    initialize(ace_editor.getValue());
  },
  (response) => {
    rootUri = null;
    console.log("[monaco-it inject] connect language serve failed:", response);
    initialize(ace_editor.getValue());
  }
);

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
  let editorOptions = options.editorOptions;
  let monaco_editor = createEditor(
    document.getElementById("monaco-it-editor"),
    monaco_model,
    isReadOnly(),
    editorOptions
  );
  monaco_editor.layout();
  console.log("[monaco-it] monaco editor created", monaco_editor, monaco_model);

  // hide ace editor
  ace_editor_div.hide();

  // first time set code syncronizer between ace and monaco
  let disposeSync = setCodeSyncHandler(monaco_editor);

  // sync language from ace to monaco
  ace_editor_session.on("changeMode", () => {
    console.log(
      "[monaco-it inject] change language to",
      getCurrentLanguage(),
      debugContent(monaco_editor)
    );
    monaco_model = monaco.editor.getModel(monaco.Uri.parse(getUri()));
    if (!monaco_model) monaco_model = createModel();
    if (getCurrentLanguage() == "cpp")
      updateFile(getFileNameFromUrl(), getAceContent());
    if (disposeSync != null) disposeSync();
    monaco_editor.setModel(monaco_model);
    disposeSync = setCodeSyncHandler(monaco_editor);
    if (languageWebSocket) languageWebSocket.close();
    tryConnectServer(monaco_editor, monaco_model);
  });

  tryConnectServer(monaco_editor, monaco_model);
}

function tryConnectServer(editor, model) {
  if (!isEnableLanguageService() || !rootUri) {
    registerCompletion(editor, getCurrentLanguage(), false);
    return;
  }
  if (getCurrentLanguage() == "cpp")
    updateFile(getFileNameFromUrl(), getAceContent());
  languageWebSocket = connectServer(
    monaco,
    editor,
    model,
    getCurrentLanguage(),
    rootUri,
    getFileNameFromUrl()
  );
  registerCompletion(editor, getCurrentLanguage(), true);
}

function createEditor(container, model, readOnly = false, settings) {
  let editor = monaco.editor.create(container, {
    model,
    readOnly,
    ...(settings || defaultOptions.editorOptions),
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

  // sync code between monaco and ace
  // every time content changes: cancel event listener, apply change, add event listener

  return editor;
}

function debugContent(editor) {
  return {
    monaco_content: editor.getModel().getValue(),
    ace_content: ace_editor.getValue(),
  };
}

function setCodeSyncHandler(editor) {
  let disposable = null;
  // console.log("   ** setCodeSyncHandler", debugContent(editor));
  let func = (event) => {
    // monaco -> ace
    ace_editor_div.off("ace-editor-change");
    ace_editor.setValue(editor.getModel().getValue());
    // console.log("   sync monaco code to ace", event, debugContent(editor));
    // ace -> monaco
    ace_editor_div.on("ace-editor-change", (e) => {
      if (getAceContent().length != 0) {
        disposable.dispose();
        editor.setValue(getAceContent());
        disposable = editor.onDidChangeModelContent(func);
        // console.log("   sync ace code to monaco", event, debugContent(editor));
      } else {
        // console.log(
        //   "   sync ace code to monaco: do not clear op",
        //   event,
        //   debugContent(editor)
        // );
      }
    });
  };

  disposable = editor.onDidChangeModelContent(func);

  // return dispoable
  return () => {
    if (disposable) disposable.dispose();
    ace_editor_div.off("ace-editor-change");
  };
}

function createModel() {
  let code = getAceContent();
  let lang = getCurrentLanguage();
  let uri = monaco.Uri.parse(getUri());
  let model = monaco.editor.createModel(code, lang, uri);

  if (lang == "cpp") model.updateOptions({ tabSize: 4, indentSize: 4 });

  console.log("[monaco-it inject] create model", { code, lang, uri });
  return model;
}
