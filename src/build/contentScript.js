"use strict";

import $ from "jquery";
//  from "monaco-editor";
// const monaco = require("monaco-editor");
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
// import { setLocaleData } from "monaco-editor-nls";
// import zh_CN from "monaco-editor-nls/locale/zh-hans";

// setLocaleData(zh_CN);

let monaco_model = null;
let monaco_editor = null;
let monaco_language = "javascript";

let ace_editor = $(".ace_editor");

if (ace_editor) {
  console.log("ace detected! id:", ace_editor.attr("id"));

  // wait for initialize
  document.addEventListener("monaco-it-initialize", function (e) {
    var init_code = e.detail;
    console.log("cs received initial", init_code);
    initialize(init_code);
  });

  // inject worker.js
  console.log("cs inject script");
  var s = document.createElement("script");
  s.src = chrome.runtime.getURL("worker.js");
  s.onload = function () {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(s);
}

function initialize(init_code) {
  // self.MonacoEnvironment = {
  //   getWorkerUrl: function (workerId, label) {
  //     return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
  //       self.MonacoEnvironment = {
  //         baseUrl: '${chrome.runtime.getURL()}'
  //       };
  //       importScripts('${chrome.runtime.getURL("workerMain.js")}');`)}`;
  //   },
  // };

  // avoid CROS
  function workerCros(url) {
    const iss = "importScripts('" + url + "');";
    return new Worker(URL.createObjectURL(new Blob([iss])));
  }
  self.MonacoEnvironment = {
    baseUrl: chrome.runtime.getURL(""),
    getWorker: function (moduleId, label) {
      if (label === "json") {
        return workerCros(chrome.runtime.getURL("json.worker.js"));
      }
      if (label === "css") {
        return workerCros(chrome.runtime.getURL("css.worker.js"));
      }
      if (label === "html") {
        return workerCros(chrome.runtime.getURL("html.worker.js"));
      }
      if (label === "typescript" || label === "javascript") {
        return workerCros(chrome.runtime.getURL("ts.worker.js"));
      }
      return workerCros(chrome.runtime.getURL("editor.worker.js"));
    },
  };

  // create monaco editor
  let monaco_div = ace_editor.after(
    `
      <div id="monaco-it-editor" style="position: relative; min-height: 400px; height: 100%; width: 100%; overflow: hidden;"></div>
    `
  );

  monaco_model = monaco.editor.createModel(init_code, monaco_language);
  monaco_editor = monaco.editor.create(
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
  ace_editor.hide();

  // send code on change
  monaco_model.onDidChangeContent((event) => {
    document.dispatchEvent(
      new CustomEvent("monaco-it-monaco-change", {
        detail: monaco_model.getValue(),
      })
    );
    console.log("[monaco-it] cs: send monaco code change", monaco_model);
  });

  // listen for ace editor change
  document.addEventListener("monaco-it-ace-change", function (e) {
    var code = e.detail;
    monaco_model.setValue(code);
    console.log("[monaco-it] cs: receive ace code change", monaco_model);
  });
}
