"use strict";

import $ from "jquery";

let ace_editor = $(".ace_editor");

if (ace_editor) {
  // reference: https://ace.c9.io/#nav=api&api=editor
  let editor = ace.edit(ace_editor.attr("id"));

  if (editor) {
    // send original code
    send("monaco-it-initialize", editor.getValue());

    // send code on change
    editor.on("change", () => {
      send("monaco-it-ace-change", editor);
      console.log("[monaco-it] worker: send ace code change", editor);
    });

    // change code on receive
    document.addEventListener("monaco-it-monaco-change", function (e) {
      var code = e.detail;
      editor.setValue(code);
      console.log("[monaco-it] worker: receive ace code change", editor);
    });
  }
}

// type == "ace-change" or "monaco-change"
function send(type, code) {
  document.dispatchEvent(new CustomEvent(type, { detail: code }));
}
