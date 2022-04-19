"use strict";

// use chrome-extension path for webpack chunks
__webpack_public_path__ = document.head.dataset.monacoItPublicPath;

import $ from "jquery";
// import * as monaco from "monaco-editor";
import { setLocaleData } from "monaco-editor-nls";
import zh_CN from "monaco-editor-nls/locale/zh-hans";
setLocaleData(zh_CN);
const monaco = require("monaco-editor");

let ace_editor_div = $(".ace_editor");
let ace_editor = ace.edit(ace_editor_div.attr("id"));

// change ace editor code when monaco editor change
document.addEventListener("monaco-it-monaco-change", function (e) {
  var code = e.detail;
  ace_editor.setValue(code);
});

// initialize
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
          style="position: relative; min-height: 100px; height: 100%; width: 100%; border: 1px solid #c2c7d0">
      </div>
    `
  );
  let monaco_div = $("#monaco-it-editor");
  let monaco_language = "c";
  let monaco_model = monaco.editor.createModel(init_code, monaco_language);
  let monaco_editor = monaco.editor.create(
    document.getElementById("monaco-it-editor"),
    {
      model: monaco_model,
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

  let ignoreEvent = false;
  const updateHeight = () => {
    let contentHeight = Math.min(1000, monaco_editor.getContentHeight());
    if (contentHeight < 400) contentHeight = 400;
    // container.style.height = `${contentHeight}px`;
    monaco_div.height(contentHeight);
    try {
      ignoreEvent = true;
      monaco_editor.layout({ width: 1000, height: contentHeight });
    } finally {
      ignoreEvent = false;
    }
  };
  monaco_editor.onDidContentSizeChange(updateHeight);
  updateHeight();
}
