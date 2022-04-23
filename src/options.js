"use strict";

import $ from "jquery";
import { getRootUri } from "./client";

// Saves options to chrome.storage
function save_options() {
  let config = {
    enableLanguageServer:
      $("input[name='enableLanguageServer']:checked").val() == "true",
    languageServerAddress: $("#languageServerAddress").val(),
  };
  chrome.storage.local.set(config, function () {
    $("#status").html(`<p>Options saved</p>`);
    console.log("save options", config);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.local.get(
    {
      enableLanguageServer: false,
      languageServerAddress: "ws://localhost:3000/",
    },
    function (items) {
      console.log(items);
      $("input[name='enableLanguageServer']")
        .filter("[value='" + items.enableLanguageServer + "']")
        .attr("checked", true);
      $("#languageServerAddress").val(items.languageServerAddress);
    }
  );
}

function testServer() {
  let languageServerAddress = $("#languageServerAddress").val();
  $("#status").html(`<p>Testing...</p>`);
  getRootUri(
    (res) => {
      $("#status").html(
        `<p style="color: green">Success! rootUri: ${res.data}</p>`
      );
    },
    (ev) => {
      $("#status").html(`<p style="color: red">Failed to connect server</p>`);
      console.error("test", ev);
    },
    languageServerAddress
  );
}

$("#save").on("click", save_options);
$("#test").on("click", testServer);

document.addEventListener("DOMContentLoaded", restore_options);
