const DEFAULT_SETTINGS = {
  enabled: true,
  min: 500,
  max: 1000
};

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.set(DEFAULT_SETTINGS);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === 'complete' &&
    tab.url && /^https:\/\/appsumo\.com\/.*$/.test(tab.url)
  ) {
    chrome.scripting
      .executeScript({ target: { tabId }, files: ['currencyMultiplierTextManager.js'] })
      .catch((err) => console.error('Failed to inject content script:', err));
  }
});

