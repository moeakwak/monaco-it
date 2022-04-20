const monaco = require("monaco-editor");
const {
  MonacoLanguageClient,
  CloseAction,
  ErrorAction,
  MonacoServices,
  createConnection,
} = require("monaco-languageclient");

MonacoServices.install(monaco);

import ReconnectingWebSocket from "reconnecting-websocket";
import { listen } from "@codingame/monaco-jsonrpc";
import { supportedLanguages, registerCompletion } from "./languageLoader";

export function connectServer(monaco_editor, lang) {
  if (!supportedLanguages.includes(lang)) {
    return null;
  }

  let webSocket = null;

  // create the web socket
  const url = "ws://localhost:3000/" + lang;
  console.log("[monaco-it] try to connect language server at", url);
  webSocket = createWebSocket(url);

  webSocket.onclose = () => {
    console.log("[monaco-it] client webSocket closed, re-registerCompletion");
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
          "[monaco-it] client webSocket closed, re-registerCompletion"
        );
        registerCompletion(monaco_editor, lang, false);
      });
      console.log(
        `[monaco-it] client connected to "${url}" and started the language client for ${lang}.`
      );
      registerCompletion(monaco_editor, lang, true);
    },
  });

  return webSocket;
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
