"use strict";

import $ from "jquery";
import { getRootUri } from "./client";

export const defaultOptions = {
  languageServerUrl: "ws://127.0.0.1:3000",
  enableLanguageServer: false,
  editorLocale: "en_US",
  editorOptions: {
    theme: "vs-dark", // vs or vs-dark
    fontSize: 14,
    quickSuggestionsDelay: 10,
    codeLens: false,
    minimap: false,
    scrollBeyondLastLine: false,
    wordWrap: "on",
    wrappingStrategy: "advanced",
    minimap: {
      enabled: false,
    },
    scrollbar: {
      alwaysConsumeMouseWheel: false,
    },
    automaticLayout: true,
    overviewRulerLanes: 0,
  },
};

// Saves options to chrome.storage
function save_options() {
  let editorOptions = null;
  try {
    editorOptions = JSON.parse($("#editor-options").val());
  } catch (error) {
    $("#save-status").html(`<p style="color:red">Saved error! ${error}</p>`);
    console.log("save options", options);
    return;
  }
  let options = {
    languageServerUrl: $("#languageServerUrl").val(),
    editorLocale: $("input[name='editorLocale']:checked").val(),
    enableLanguageServer:
      $("input[name='enableLanguageServer']:checked").val() == "true",
    editorOptions,
  };
  chrome.storage.local.set(options, function () {
    $("#save-status").html(`<p>Options saved! </p>`);
    console.log("save options", options);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.local.get(defaultOptions, function (items) {
    console.log(items);
    $("input[name='enableLanguageServer']")
      .filter("[value='" + items.enableLanguageServer + "']")
      .attr("checked", true);
    $("input[name='editorLocale']")
      .filter("[value='" + items.editorLocale + "']")
      .attr("checked", true);
    $("#languageServerUrl").val(items.languageServerUrl);
    $("#editor-options").val(JSON.stringify(items.editorOptions, null, 4));
  });
}

function testServer() {
  let languageServerUrl = $("#languageServerUrl").val();
  $("#test-status").html(`<p>Testing...</p>`);
  getRootUri(
    (res) => {
      $("#test-status").html(
        `<p style="color: green">Success! rootUri: ${res.data}</p>`
      );
    },
    (ev) => {
      $("#test-status").html(
        `<p style="color: red">Failed to connect server</p>`
      );
      console.error("test", ev);
    },
    languageServerUrl
  );
}

$("#save").on("click", save_options);
$("#test").on("click", testServer);
$("#reset").on("click", () => {
  chrome.storage.local.set(defaultOptions, restore_options);
});

document.addEventListener("DOMContentLoaded", restore_options);

// $("textarea")
//   .each(function () {
//     this.setAttribute("style", `width: 100%; height: ${this.scrollHeight}px;"`);
//     this.style.height = this.scrollHeight + "px";
//   })
//   .on("input", function () {
//     this.style.height = "5px";
//     this.style.height = this.scrollHeight + "px";
//   });
