"use strict";

// use chrome-extension path for webpack chunks
__webpack_public_path__ = document.head.dataset.monacoItPublicPath;

import $ from "jquery";
// import * as monaco from "monaco-editor";
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

// lang server
import { listen, MessageConnection } from "vscode-ws-jsonrpc";
const {
  MonacoLanguageClient,
  CloseAction,
  ErrorAction,
  MonacoServices,
  createConnection,
} = require("monaco-languageclient");
import ReconnectingWebSocket from "reconnecting-websocket";

// register Monaco languages
monaco.languages.register({
  id: "python",
  extensions: [".python", ".py", ".pyd"],
  aliases: ["Python", "python"],
  mimetypes: ["application/json"],
});

// load ace editor initial configs
let ace_editor_div = $(".ace_editor");
let ace_editor = ace.edit(ace_editor_div.get()[0]);
let ace_editor_session = ace_editor.getSession();
let readOnly = ace_editor.getReadOnly();

let init_language = get_ace_language(ace_editor);
console.log("init_language", init_language);

function get_ace_language() {
  let lang = ace_editor_session.getMode().$id.replace("ace/mode/", "");
  if (lang == "c_cpp") lang = "cpp";
  return lang;
}

// change ace editor code when monaco editor change
document.addEventListener("monaco-it-monaco-change", function (e) {
  var code = e.detail;
  ace_editor.setValue(code);
});

// initialize
console.log("initialize", ace_editor.getValue());
initialize(ace_editor.getValue());

function initialize(init_code) {
  // avoid CROS
  function workerCros(url) {
    const iss = "importScripts('" + url + "');";
    return new Worker(URL.createObjectURL(new Blob([iss])));
  }
  let baseUrl = $("head").attr("data-monaco-editor-public-path");
  self.MonacoEnvironment = {
    baseUrl,
    getWorker: function (moduleId, label) {
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

  // create monaco editor
  ace_editor_div.after(
    `
      <div id="monaco-it-editor"
          style="position: relative; height: 100%; width: 100%; border: 1px solid #c2c7d0">
      </div>
    `
  );
  let monaco_div = $("#monaco-it-editor");
  let monaco_model = monaco.editor.createModel(init_code, init_language);
  let monaco_editor = monaco.editor.create(
    document.getElementById("monaco-it-editor"),
    {
      model: monaco_model,
      readOnly,
      automaticLayout: true,
      fontSize: 16,
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
  monaco_editor.layout({});
  console.log("[monaco-it] cs: monaco created", monaco_editor, monaco_model);

  // hide ace editor
  ace_editor_div.hide();

  // send code on change
  monaco_model.onDidChangeContent((event) => {
    document.dispatchEvent(
      new CustomEvent("monaco-it-monaco-change", {
        detail: monaco_model.getValue(),
      })
    );
    // console.log("[monaco-it] cs: send monaco code change", monaco_model);
  });

  // listen for ace editor change
  document.addEventListener("monaco-it-ace-change", function (e) {
    var code = e.detail;
    monaco_model.setValue(code);
    // console.log("[monaco-it] cs: receive ace code change", monaco_model);
  });

  // language change
  ace_editor_session.on("changeMode", () => {
    console.log("change language to", get_ace_language());
    monaco.editor.setModelLanguage(monaco_model, get_ace_language());
  });

  // handle with content height change
  let ignoreEvent = false;
  const updateHeight = () => {
    let contentHeight = Math.min(1000, monaco_editor.getContentHeight());
    if (contentHeight < 400) contentHeight = 400;
    // container.style.height = `${contentHeight}px`;
    monaco_div.height(contentHeight);
    try {
      ignoreEvent = true;
      // monaco_editor.layout({ height: contentHeight });
      monaco_editor.layout();
    } finally {
      ignoreEvent = false;
    }
  };

  monaco_editor.onDidContentSizeChange(updateHeight);
  updateHeight();

  // install Monaco language client services
  MonacoServices.install(monaco);

  // create the web socket
  // const url = createUrl("/python");
  const url = "ws://localhost:3000/" + monaco_model.getLanguageId();
  const webSocket = createWebSocket(url);
  // const webSocket = new WebSocket(url);
  
  // listen when the web socket is opened
  listen({
    webSocket,
    onConnection: (connection) => {
      // create and start the language client
      const languageClient = createLanguageClient(connection);
      const disposable = languageClient.start();
      connection.onClose(() => disposable.dispose());
      console.log(`Connected to "${url}" and started the language client.`);
    },
  });
}
function createLanguageClient(connection) {
  return new MonacoLanguageClient({
    name: "Monaco Language Client",
    clientOptions: {
      // use a language id as a document selector
      documentSelector: ["python"],
      // disable the default error handler
      errorHandler: {
        error: () => ErrorAction.Continue,
        closed: () => CloseAction.DoNotRestart,
      },
    },
    // create a language client connection from the JSON RPC connection on demand
    connectionProvider: {
      get: (errorHandler, closeHandler) => {
        return Promise.resolve(
          createConnection(connection, errorHandler, closeHandler)
        );
      },
    },
  });
}

function createWebSocket(url) {
  const socketOptions = {
    maxReconnectionDelay: 10000,
    minReconnectionDelay: 1000,
    reconnectionDelayGrowFactor: 1.3,
    connectionTimeout: 10000,
    maxRetries: Infinity,
    debug: false,
  };
  return new ReconnectingWebSocket(url, [], socketOptions);
}
