import { setSettings } from './settingsSyncManager.js';
import { defaultSettings } from './defaults.js';

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    setSettings(defaultSettings);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === 'complete' &&
    typeof tab.url === 'string' &&
    /^https:\/\/appsumo\.com\/.*$/.test(tab.url)
  ) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['currencyMultiplierTextManager.js']
    }).catch((error) => {
      console.error('Failed to inject content script into tab', tabId, error);
    });
  }
});