"use strict";

__webpack_public_path__ = document.head.dataset.monacoItPublicPath;

import $ from "jquery";
// import * as monaco from "monaco-editor";
import { setLocaleData } from "monaco-editor-nls";
import zh_CN from "monaco-editor-nls/locale/zh-hans";

setLocaleData(zh_CN);
const monaco = require("monaco-editor");

let ace_editor_div = $(".ace_editor");
let ace_editor = ace.edit(ace_editor_div.attr("id"));

document.getMonacoItPublicPath = (p) => {
  return (
    $("head").attr("data-monaco-editor-public-path") +
    require("path").basename(p)
  );
};

// change code on receive
document.addEventListener("monaco-it-monaco-change", function (e) {
  var code = e.detail;
  ace_editor.setValue(code);
  // console.log("[monaco-it] worker: receive ace code change", editor);
});

initialize(ace_editor.getValue());

function initialize(init_code) {
  // avoid CROS
  function workerCros(url) {
    const iss = "importScripts('" + url + "');";
    return new Worker(URL.createObjectURL(new Blob([iss])));
  }
  let baseUrl = $("head").attr("data-monaco-editor-public-path");
  console.log(baseUrl);
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
  let monaco_div = ace_editor_div.after(
    `
      <div id="monaco-it-editor" style="position: relative; min-height: 400px; height: 100%; width: 100%; "></div>
    `
  );
  let monaco_language = "c";
  let monaco_model = monaco.editor.createModel(init_code, monaco_language);
  let monaco_editor = monaco.editor.create(
    document.getElementById("monaco-it-editor"),
    {
      model: monaco_model,
      automaticLayout: true,
      fontSize: 14,
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
}
