"use strict";

// use chrome-extension path for webpack chunks
__webpack_public_path__ = document.head.dataset.monacoItPublicPath;

export const extBaseUrl = document.head.dataset.monacoItPublicPath;

import $ from "jquery";

import { connectServer, getRootUri as getRootUri, updateFile } from "./client";
import {
  registerLanguages,
  registerCompletion,
  getRegistry,
  grammars,
} from "./languageLoader";
import { defaultOptions } from "./options";

import { loadWASM } from "onigasm";
import { wireTmGrammars } from "monaco-editor-textmate";

import "./monacoUtils";

const monaco = require("monaco-editor/esm/vs/editor/editor.api");

const options = JSON.parse(document.head.dataset.monacoItOptions);

// register Monaco languages
registerLanguages();

// load ace editor initial configs
let ace_editor_div = $(".ace_editor").get(0);
let ace_editor = ace.edit(ace_editor_div);
let ace_editor_session = ace_editor.getSession();

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
  return options.enableLanguageServer && !isReadOnly();
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

let rootUri = null;

(async () => {
  if (isEnableLanguageService())
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
        console.log(
          "[monaco-it inject] connect language serve failed:",
          response
        );
        initialize(ace_editor.getValue());
      }
    );
  else initialize(ace_editor.getValue());
})();

async function initialize() {
  // avoid CROS
  let baseUrl = $("head").attr("data-monaco-editor-public-path");
  self.MonacoEnvironment = getMonacoEnvironment(baseUrl);

  // create monaco editor
  $(ace_editor_div).after(
    `<div id="monaco-it-wrapper">
      <div id="monaco-it-editor" style="height: 100%; width: 100%; border: 1px solid #c2c7d0"></div>
    </div>`
  );

  let monaco_div = document.getElementById("monaco-it-editor");
  let monaco_model = createModel();
  let editorOptions = options.editorOptions;
  let monaco_editor = await createEditor(
    monaco_div,
    monaco_model,
    isReadOnly(),
    editorOptions
  );
  console.log("[monaco-it inject] create", getUri(), getCurrentLanguage());

  // substitution policy
  // hide: height fit to content; update width on resize; hide ace editor
  // overlay: monaco overlay ace editor; height and width same as ace editor
  let updateSize = null;
  if (options.editorSubstitutionPolicy == 'hide') {
    let ace_width = ace_editor_div.offsetWidth;
    $(ace_editor_div).hide();
    // monaco_div.style.overflow = "hidden";
    updateSize = () => {
      const minHeight = options.editorMinHeight < 0
        ? ace_layout.height
        : options.editorMinHeight;
      const contentHeight = Math.max(minHeight, monaco_editor.getContentHeight());
      monaco_div.style.width = `${ace_width}px`;
      monaco_div.style.height = `${contentHeight}px`;
      monaco_editor.layout({ width: ace_width, height: contentHeight });
      // console.log("[monaco-it inject] (hide) update size", ace_layout, contentHeight);
    }
    updateSize();
    monaco_editor.onDidContentSizeChange(updateSize);
    window.addEventListener("resize", () => {
      $(ace_editor_div).show();
      ace_width = ace_editor_div.offsetWidth;
      $(ace_editor_div).hide();
      updateSize();
    });
  } else {
    // move ace editor into wrapper
    $(ace_editor_div).prependTo($("#monaco-it-wrapper"));
    $("#monaco-it-wrapper").css("position", "relative");
    $(ace_editor_div).css("position", "absolute");
    $(ace_editor_div).css("top", 0);
    $(ace_editor_div).css("left", 0);
    $(monaco_div).css("position", "absolute");
    $(monaco_div).css("top", 0);
    $(monaco_div).css("left", 0);
    let zindex = $(ace_editor_div).css("z-index");
    if (isNaN(zindex)) zindex = 0;
    zindex = Math.max(zindex, 5);
    $(monaco_div).css("z-index", parseInt(zindex) + 1);
    updateSize = () => {
      let width = ace_editor_div.offsetWidth;
      let height = ace_editor_div.offsetHeight;
      $(monaco_div).width(width);
      $(monaco_div).height(height);
      monaco_editor.layout({ width, height });
      // console.log("[monaco-it inject] (overlay) update size", width, height);
    }
    updateSize();
    window.addEventListener("resize", updateSize);
  }

  ace_editor.on("change", (ev) => {
    console.log("[monaco-it inject] ace_editor change", { code: getAceContent(), ev });
    $(ace_editor_div).trigger("ace-editor-change");
    if (options.editorSubstitutionPolicy == 'overlay') {
      updateSize();
    }
  });

  console.log("[monaco-it] monaco editor created", { monaco_editor, monaco_model });

  // first time set code syncronizer between ace and monaco
  let disposeSync = setCodeSyncHandler(monaco_editor);

  // sync language from ace to monaco
  ace_editor_session.on("changeMode", () => {
    console.log("[monaco-it inject] change language to", getCurrentLanguage(), debugContent(monaco_editor));
    if (disposeSync != null) disposeSync();
    monaco_model = monaco.editor.getModel(monaco.Uri.parse(getUri()));
    if (!monaco_model) monaco_model = createModel();
    setTimeout(() => {
      // if (getCurrentLanguage() == "cpp")
      //   updateFile(getFileNameFromUrl(), getAceContent());
      monaco_model.setValue(getAceContent());
      monaco_editor.setModel(monaco_model);
      disposeSync = setCodeSyncHandler(monaco_editor);
      if (languageWebSocket) languageWebSocket.close();
      tryConnectServer(monaco_editor, monaco_model);
    }, 100);
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

async function createEditor(container, model, readOnly = false, settings) {
  // load wasm
  (async () => {
    await loadWASM(require("path").join(extBaseUrl, "/onigasm/onigasm.wasm"));
  })();

  // Load themes
  const themeData = {
    light_plus: await (
      await fetch(require("path").join(extBaseUrl, "themes/light.json"))
    ).json(),
    dark_plus: await (
      await fetch(require("path").join(extBaseUrl, "themes/dark.json"))
    ).json(),
  };

  monaco.editor.defineTheme("light-plus", themeData.light_plus);
  monaco.editor.defineTheme("dark-plus", themeData.dark_plus);

  let editor = monaco.editor.create(container, {
    model,
    readOnly,
    ...(settings || defaultOptions.editorOptions),
  });

  // wait for workers
  let loop = () => {
    if (hasGetWorker) {
      console.log("[monaco-it inject] hasGetWorker");
      Promise.resolve().then(async () => {
        await wireTmGrammars(monaco, getRegistry(), grammars, editor);
      });
    } else {
      setTimeout(() => {
        loop();
      }, 100);
    }
  };
  loop();

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
  let syncToMonaco = (event) => {
    disposable.dispose();
    editor.setValue(getAceContent());
    disposable = editor.onDidChangeModelContent(syncToAce);
    console.log("   sync ace code to monaco", event, debugContent(editor));
  };
  let syncToAce = (event) => {
    $(ace_editor_div).off("ace-editor-change");
    ace_editor.setValue(editor.getModel().getValue());
    // console.log("   sync monaco code to ace", event, debugContent(editor));
    $(ace_editor_div).on("ace-editor-change", syncToMonaco);
  };
  disposable = editor.onDidChangeModelContent(syncToAce);
  $(ace_editor_div).on("ace-editor-change", syncToMonaco);

  return () => {
    if (disposable) disposable.dispose();
    $(ace_editor_div).off("ace-editor-change");
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

let hasGetWorker = false;
function getMonacoEnvironment(baseUrl) {
  function workerCros(url) {
    const iss = "importScripts('" + url + "');";
    return new Worker(URL.createObjectURL(new Blob([iss])));
  }
  return {
    baseUrl,
    getWorker: function (moduleId, label) {
      hasGetWorker = true;
      if (label === "json") {
        return workerCros(baseUrl + "json.worker.js");
      }
      if (label === "css") {
        return workerCros(baseUrl + "css.worker.js");
      }
      if (label === "html") {
        return workerCros(baseUrl + "html.worker.js");
      }
      if (label === "typescript" || label === "javascript") {
        return workerCros(baseUrl + "ts.worker.js");
      }
      return workerCros(baseUrl + "editor.worker.js");
    },
  };
}
