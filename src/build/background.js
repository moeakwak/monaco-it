"use strict";

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: "editor_popup.html",
  });
});
