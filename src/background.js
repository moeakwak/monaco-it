"use strict";

chrome.runtime.onInstalled.addListener(() => {
    chrome.runtime.openOptionsPage();
});

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
