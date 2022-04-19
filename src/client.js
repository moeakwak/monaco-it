// lang server
import { listen } from "@codingame/monaco-jsonrpc";

const {
  MonacoLanguageClient,
  CloseAction,
  ErrorAction,
  MonacoServices,
  createConnection,
} = require("monaco-languageclient");
import ReconnectingWebSocket from "reconnecting-websocket";

import { supportedLanguages } from "./language_loader";
import { registerCpp } from "./languages/cpp";

export function connectServer(monaco, monaco_editor, lang) {
  if (!lang in supportedLanguages) {
    console.log("[monaco-it] language autocompletion unsupported:", lang);
    return null;
  }

  let webSocket = null;

  if (lang == "cpp") {
    registerCpp(monaco, monaco_editor, false);
  } else if (lang == "python") {
    // install Monaco language client services
    MonacoServices.install(monaco);

    // create the web socket
    const url = "ws://localhost:3000/" + lang;
    console.log("[monaco-it] try to connect python language server at", url);
    webSocket = createWebSocket(url);

    // listen when the web socket is opened
    listen({
      webSocket,
      onConnection: (connection) => {
        // create and start the language client
        const languageClient = createLanguageClient(connection);
        const disposable = languageClient.start();
        connection.onClose(() => disposable.dispose());
        console.log(
          `[monaco-it] Connected to "${url}" and started the language client for ${lang}.`
        );
      },
    });
  }
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
    debug: false,
  };
  return new ReconnectingWebSocket(url, [], socketOptions);
}
