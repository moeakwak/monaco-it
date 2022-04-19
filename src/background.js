"use strict";
import $ from "jquery";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if ((message = "inject-script")) {
    console.log("inject to", sender.url);
    chrome.scripting.executeScript({
      files: ["inject.js"],
      world: "MAIN",
      target: { tabId: sender.tab.id },
    });
  }
});
