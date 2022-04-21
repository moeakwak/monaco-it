const monaco = require("monaco-editor");
const {
  MonacoLanguageClient,
  CloseAction,
  ErrorAction,
  MonacoServices,
  createConnection,
} = require("monaco-languageclient");

import ReconnectingWebSocket from "reconnecting-websocket";
import { listen } from "@codingame/monaco-jsonrpc";
import { supportedLanguages, registerCompletion } from "./languageLoader";


const serverHost = "localhost:3000";

let languageWebSocket = null;
let fileWebSocket = null;

export function connectServer(
  monaco_editor,
  monaco_model,
  lang,
  workspace_dir_path,
  filename
) {
  if (!supportedLanguages.includes(lang) || !workspace_dir_path) {
    return null;
  }

  if (lang == "cpp")
    MonacoServices.install(monaco, {
      rootUri: workspace_dir_path,
    });
  else
    MonacoServices.install(monaco);

  // create the web socket
  let url = "ws://" + serverHost + "/" + lang;
  console.log("[monaco-it client] try to connect language server at", url);
  languageWebSocket = createWebSocket(url);

  languageWebSocket.onclose = () => {
    console.log(
      "[monaco-it client] client languageWebSocket closed, re-registerCompletion"
    );
    registerCompletion(monaco_editor, lang, false);
  };

  // listen when the web socket is opened
  listen({
    webSocket: languageWebSocket,
    onConnection: (connection) => {
      // create and start the language client
      const languageClient = createLanguageClient(connection, lang);
      const disposable = languageClient.start();
      connection.onClose(() => {
        disposable.dispose();
        console.log(
          "[monaco-it client] languageWebSocket closed, re-registerCompletion"
        );
        registerCompletion(monaco_editor, lang, false);
      });
      console.log(
        `[monaco-it client] connected to "${url}" and started the language client for ${lang}.`
      );
      registerCompletion(monaco_editor, lang, true);
      monaco_model.onDidChangeContent((e) => {
        if (lang == "cpp" && languageWebSocket.readyState === WebSocket.OPEN) {
          console.log("[monaco-it client] try to update file");
          updateFile(filename, monaco_model.getValue());
        }
      });
    },
  });

  return languageWebSocket;
}

export function getWorkspaceDirPath(success_cb, error_cb) {
  let url = "ws://" + serverHost + "/file";
  let webSocket = new WebSocket(url);
  let closed = false;
  webSocket.onopen = () => {
    webSocket.send(JSON.stringify({ type: "get_workspace_dir_path" }));
  };
  webSocket.onclose = (ev) => {
    if (!closed) error_cb(ev);
  };
  webSocket.onmessage = (ev) => {
    let message = JSON.parse(ev.data);
    if (message.result == "ok") {
      success_cb(message);
    } else {
      if (!closed) error_cb(ev);
    }
    closed = true;
    webSocket.close();
  };
}

export function updateFile(filename, code) {
  let url = "ws://" + serverHost + "/file";
  if (!!fileWebSocket && fileWebSocket.readyState == fileWebSocket.OPEN) {
    // reuse opening fileWebSocket
    fileWebSocket.send(JSON.stringify({ type: "update", filename, code }));
  } else {
    fileWebSocket = new WebSocket(url);
    fileWebSocket.onopen = (ev) => {
      fileWebSocket.send(JSON.stringify({ type: "update", filename, code }));
    };
    fileWebSocket.onclose = (ev) => {
      console.warn("[monaco-it client] fileWebSocket closed:", filename, ev);
    };
    fileWebSocket.onmessage = (ev) => {
      let message = JSON.parse(ev.data);
      if (message.result == "ok") {
        console.log("[monaco-it client] update file success:", filename);
      } else {
        console.warn("[monaco-it client] update file failed:", ev);
      }
    };
  }
}

function createLanguageClient(connection, lang) {
  return new MonacoLanguageClient({
    name: "Monaco Language Client",
    clientOptions: {
      // use a language id as a document selector
      documentSelector: [lang],
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
    maxRetries: 0,
    debug: false,
  };
  return new ReconnectingWebSocket(url, [], socketOptions);
}
