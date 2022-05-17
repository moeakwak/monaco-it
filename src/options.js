"use strict";

import $ from "jquery";
import { getRootUri } from "./client";

export const defaultOptions = {
  clientId: null,
  languageServerUrl: "ws://127.0.0.1:3000",
  enableLanguageServer: false,
  editorLocale: "en_US",
  editorSubstitutionPolicy: "hide",  // or "overlay"
  editorMinHeight: 400,
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
    automaticLayout: false,
    overviewRulerLanes: 0,
  },
};

function getRandomToken() {
  var randomPool = new Uint8Array(4);
  crypto.getRandomValues(randomPool);
  var hex = '';
  for (var i = 0; i < randomPool.length; ++i)
      hex += randomPool[i].toString(16);
  return hex;
}

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(defaultOptions, (options) => {
    console.log(options);
    if (!options.clientId) {
      options.clientId = getRandomToken();
    }
    console.log(options);
    chrome.storage.local.set(options);
    const app = Vue.createApp({
      data() {
        return {
          options,
          isEditorOptionsTextInvalid: false,
          save_status: "",
          updateEditorOptions: true,
        };
      },
      computed: {
        editorOptionsText: {
          get() {
            return JSON.stringify(this.options.editorOptions, null, 4);
          },
          set(value) {
            try {
              let editorOptions = JSON.parse(value);
              this.isEditorOptionsTextInvalid = false;
              this.updateEditorOptions = false;
              this.options.editorOptions = editorOptions;
              this.$emit("update:modelValue", value);
            } catch (error) {
              this.isEditorOptionsTextInvalid = true;
            }
          },
        },
        isServerUrlInvalid() {
          return (
            !this.options.languageServerUrl.startsWith("ws://") &&
            !this.options.languageServerUrl.startsWith("wss://")
          );
        },
      },
      created() {
        this.$watch(
          () => this.options.editorOptions,
          (newVal, oldVal) => {
            if (this.updateEditorOptions)
              this.editorOptionsText = JSON.stringify(newVal, null, 4);
            else this.updateEditorOptions = true;
          }
        );
        this.$watch(() => this.options.editorSubstitutionPolicy,
          (newVal, oldVal) => {
            if (newVal == 'overlay') {
              this.options.editorOptions.scrollbar.alwaysConsumeMouseWheel = true;
            } else {
              this.options.editorOptions.scrollbar.alwaysConsumeMouseWheel = false;
            }
          }
        );
      },
      methods: {
        reset() {
          this.options = defaultOptions;
        },
        save() {
          chrome.storage.local.set(this.options, function () {
            console.log("save options", options);
            alert("Options saved!");
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
      },
    });
    app.config.compilerOptions.isCustomElement = (tag) => {
      return tag == "hgroup";
    };
    app.mount("#app");
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
