import { getSettings } from "./lib/storage";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "score-candidate",
    title: "Score this candidate on OpJobHub",
    contexts: ["link"],
    targetUrlPatterns: ["https://www.linkedin.com/in/*"],
  });

  chrome.contextMenus.create({
    id: "save-candidate",
    title: "Save candidate to OpJobHub pipeline",
    contexts: ["link"],
    targetUrlPatterns: ["https://www.linkedin.com/in/*"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;
  if (info.menuItemId === "score-candidate" || info.menuItemId === "save-candidate") {
    const settings = await getSettings();
    const action = info.menuItemId === "score-candidate" ? "SCORE_PROFILE" : "SAVE_PROFILE";
    chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_PROFILE" }, (response) => {
      if (response?.profile) {
        chrome.storage.local.set({ pendingProfile: response.profile, pendingAction: action });
        chrome.action.openPopup();
      }
    });
  }
});

chrome.action.setBadgeText({ text: "" });
