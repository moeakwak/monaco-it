"use strict";

import $ from "jquery";
import { getRootUri } from "./client";

export const defaultOptions = {
  languageServerUrl: "ws://127.0.0.1:3000",
  enableLanguageServer: false,
  editorLocale: "en_US",
  editorOptions: {
    theme: "dark-plus",
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

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(defaultOptions, function (options) {
    const App = {
      data() {
        return {
          options,
          editorOptionsText,
          save_status: "",
        };
      },
      created() {
        this.$watch(
          () => this.options.editorOptions,
          (newVal, oldVal) => {
            this.editorOptionsText = JSON.stringify(newVal, null, 4);
          }
        );
        this.$watch("editorOptionsText", (newVal, oldVal) => {
          let editorOptions = null;
          try {
            editorOptions = JSON.stringify(newVal, null, 4);
          } catch (error) {
            alert("Invalid options JSON content!" + error);
            this.editorOptionsText = oldVal;
            return;
          }
          this.options.editorOptions = editorOptions;
        });
      },
      methods: {
        reset() {
          this.options = defaultOptions;
        },
        save() {
          chrome.storage.local.set(this.options, function () {
            save_status = "<p>Options saved!</p>";
            console.log("save options", options);
          });
        },
        testServer() {
          let languageServerUrl = this.options.languageServerUrl;
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
        },
        checkLanguageServerUrl() {
          if (
            !this.options.languageServerUrl.startsWith("ws://") &&
            !this.options.languageServerUrl.startsWith("wss://")
          ) {
            $("#languageServerUrl").attr("aria-invalid", "true");
          } else {
            $("#languageServerUrl").attr("aria-invalid", "false");
          }
        }
      },
    };
    Vue.createApp(App).mount("#app");
  });
});

// $("textarea")
//   .each(function () {
//     this.setAttribute("style", `width: 100%; height: ${this.scrollHeight}px;"`);
//     this.style.height = this.scrollHeight + "px";
//   })
//   .on("input", function () {
//     this.style.height = "5px";
//     this.style.height = this.scrollHeight + "px";
//   });
