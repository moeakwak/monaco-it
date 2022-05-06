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
