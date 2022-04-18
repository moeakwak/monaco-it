// import * as monaco from "monaco-editor";

// (() => {
//   self.MonacoEnvironment = {
//     baseUrl: chrome.runtime.getURL(""),
//     getWorkerUrl: function (moduleId, label) {
//       if (label === "json") {
//         return chrome.runtime.getURL("json.worker.js");
//       }
//       if (label === "css") {
//         return chrome.runtime.getURL("css.worker.js");
//       }
//       if (label === "html") {
//         return chrome.runtime.getURL("html.worker.js");
//       }
//       if (label === "typescript" || label === "javascript") {
//         return chrome.runtime.getURL("ts.worker.js");
//       }
//       return chrome.runtime.getURL("editor.worker.js");
//     },
//   };

//   let editor = monaco.editor.create(document.getElementById("editor"), {
//     value: ["function x() {", '\tconsole.log("Hello world!");', "}"].join("\n"),
//     quickSuggestions: false,
//     language: "c",
//     theme: "vs-dark",
//     contextmenu: false,
//   });

//   editor.addListener("didType", () => {
//     console.log(editor.getValue());
//   });
// })();

import loader from "@monaco-editor/loader";

loader.init().then((monaco) => {
  monaco.editor.create(document.body, {
    value: "// some comment",
    language: "javascript",
  });
});
