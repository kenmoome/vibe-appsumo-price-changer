const DEFAULTS = Object.freeze({
  enabled: true,
  min: 500,
  max: 1000
});

function sanitize({ enabled, min, max }) {
  const sanitized = {};
  sanitized.enabled = typeof enabled === 'boolean' ? enabled : DEFAULTS.enabled;
  const parsedMin = Number(min);
  const parsedMax = Number(max);
  sanitized.min = Number.isFinite(parsedMin) && parsedMin >= 0 ? Math.floor(parsedMin) : DEFAULTS.min;
  sanitized.max =
    Number.isFinite(parsedMax) && parsedMax >= sanitized.min
      ? Math.floor(parsedMax)
      : Math.max(sanitized.min, DEFAULTS.max);
  return sanitized;
}

export function getSettings() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(DEFAULTS, items => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(sanitize(items));
      }
    });
  });
}

export async function setSettings(data) {
  const current = await getSettings();
  const merged = { ...current, ...data };
  const toStore = sanitize(merged);
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(toStore, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

export function resetSettings() {
  return setSettings(DEFAULTS);
}

export function onSettingsChanged(callback) {
  const listener = (changes, areaName) => {
    if (areaName !== 'sync') return;
    getSettings()
      .then(settings => {
        callback(settings, changes);
      })
      .catch(error => {
        console.error('Error retrieving settings after change:', error);
      });
  };
  chrome.storage.onChanged.addListener(listener);
  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}

export { DEFAULTS };