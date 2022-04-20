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

let webSocket = null;

export function connectServer(
  monaco_editor,
  lang,
  workspace_dir_path,
  filename
) {
  if (!supportedLanguages.includes(lang)) {
    return null;
  }

  MonacoServices.install(monaco_editor, {
    rootUri: workspace_dir_path,
  });

  // create the web socket
  let url = "ws://" + serverHost + "/" + lang;
  console.log("[monaco-it client] try to connect language server at", url);
  webSocket = createWebSocket(url);

  webSocket.onclose = () => {
    console.log(
      "[monaco-it client] client webSocket closed, re-registerCompletion"
    );
    registerCompletion(monaco_editor, lang, false);
  };

  // listen when the web socket is opened
  listen({
    webSocket,
    onConnection: (connection) => {
      // create and start the language client
      const languageClient = createLanguageClient(connection);
      const disposable = languageClient.start();
      connection.onClose(() => {
        disposable.dispose();
        console.log(
          "[monaco-it client] webSocket closed, re-registerCompletion"
        );
        registerCompletion(monaco_editor, lang, false);
      });
      console.log(
        `[monaco-it client] connected to "${url}" and started the language client for ${lang}.`
      );
      registerCompletion(monaco_editor, lang, true);
      monaco_editor.onDidChangeModelContent((e) => {
        if (webSocket.readyState === WebSocket.CLOSED) {
          console.log("[monaco-it client] try to update file");
          updateFile(filename, monaco_editor.getModel().getValue());
        }
      });
    },
  });

  return webSocket;
}

export function getWorkspaceDirPath(success_cb, error_cb) {
  let url = "http://" + serverHost + "/file";
  $.ajax(url, {
    dataType: "json",
    type: "GET",
    success: success_cb,
    error: error_cb,
  });
}

export function updateFile(filename, code) {
  let url = "http://" + serverHost + "/file";
  $.ajax(url, {
    data: JSON.stringify({
      type: "update",
      filename,
      code,
    }),
    contentType: "application/json",
    type: "POST",
    success: () => {
      console.log("[monaco-it client] update file success:", filename);
    },
    error: () => {
      console.warn("[monaco-it client] update file error:", filename);
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
    maxRetries: 0,
    debug: true,
  };
  return new ReconnectingWebSocket(url, [], socketOptions);
}
