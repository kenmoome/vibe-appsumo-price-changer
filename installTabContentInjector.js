// Service worker for AppSumo Price Changer
// Initializes default settings on first install and injects the
// content script on eligible pages without using ES modules.

const DEFAULT_SETTINGS = {
  enabled: true,
  min: 500,
  max: 1000
};

// Set default values when the extension is installed
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.storage.sync.set(DEFAULT_SETTINGS);
  }
});

// Utility to check whether a tab URL is an AppSumo page
function isAppSumoUrl(url) {
  return typeof url === 'string' && /^https:\/\/appsumo\.com\/.*$/.test(url);
}

// Inject the content script after the tab finishes loading
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && isAppSumoUrl(tab.url)) {
    chrome.scripting
      .executeScript({ target: { tabId }, files: ['currencyMultiplierTextManager.js'] })
      .catch((error) => {
        console.error('Failed to inject content script into tab', tabId, error);
      });
  }
});

