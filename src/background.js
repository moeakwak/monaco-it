"use strict";

chrome.runtime.onInstalled.addListener(() => {
    chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if ((message = "inject-script")) {
    console.log("inject to", sender.url);
    chrome.tabs.executeScript({
      file: "injectHelper.js"
    });
  }
});
