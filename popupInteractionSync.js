const storage = chrome.storage.sync;
const DEFAULT_SETTINGS = { enabled: false, multiplier: 1 };
let enableToggle, multiplierInput, multiplierDisplay;
let debounceSaveTimeout;

function getElementOrThrow(id) {
  const el = document.getElementById(id);
  if (!el) {
    console.error(`Element with id "${id}" not found`);
    throw new Error(`Element with id "${id}" not found`);
  }
  return el;
}

function loadSettings() {
  storage.get(DEFAULT_SETTINGS, (items) => {
    if (chrome.runtime.lastError) {
      console.error('Error loading settings:', chrome.runtime.lastError);
      return;
    }
    const { enabled, multiplier } = items;
    enableToggle.checked = enabled;
    multiplierInput.value = multiplier;
    multiplierDisplay.textContent = multiplier;
  });
}

function saveSettings(changes) {
  storage.set(changes, () => {
    if (chrome.runtime.lastError) {
      console.error('Error saving settings:', chrome.runtime.lastError);
      return;
    }
    chrome.runtime.sendMessage(
      { action: 'settingsUpdated', settings: changes },
      () => {
        if (chrome.runtime.lastError) {
          console.error('Error sending settingsUpdated message:', chrome.runtime.lastError);
        }
      }
    );
  });
}

function onToggleChange() {
  const enabled = enableToggle.checked;
  saveSettings({ enabled });
}

function onMultiplierChange() {
  let value = parseFloat(multiplierInput.value);
  if (isNaN(value) || value <= 0) {
    value = DEFAULT_SETTINGS.multiplier;
    multiplierInput.value = value;
  }
  multiplierDisplay.textContent = value;
  clearTimeout(debounceSaveTimeout);
  debounceSaveTimeout = setTimeout(() => {
    saveSettings({ multiplier: value });
  }, 500);
}

function reflectStorageChange(changes, area) {
  if (area !== 'sync') return;
  if (changes.enabled) {
    enableToggle.checked = changes.enabled.newValue;
  }
  if (changes.multiplier) {
    const m = changes.multiplier.newValue;
    multiplierInput.value = m;
    multiplierDisplay.textContent = m;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  enableToggle = getElementOrThrow('toggle-enable');
  multiplierInput = getElementOrThrow('multiplier-range');
  multiplierDisplay = getElementOrThrow('multiplier-value');

  loadSettings();

  enableToggle.addEventListener('change', onToggleChange);
  multiplierInput.addEventListener('input', onMultiplierChange);
  chrome.storage.onChanged.addListener(reflectStorageChange);
});