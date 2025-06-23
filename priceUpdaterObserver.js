import { getSettings } from './settingsSyncManager.js';

const priceRegex = /\$([0-9]+(?:\.[0-9]{1,2})?)/g;
const priceDetectRegex = /\$[0-9]+(?:\.[0-9]{1,2})?/;

function formatPrice(value, decimals) {
  const dec = Number.isInteger(decimals) ? decimals : 2;
  return '$' + value.toFixed(dec);
}

function getRandomMultiplier(settings) {
  let defaultMult = parseFloat(settings.multiplier);
  if (isNaN(defaultMult)) defaultMult = 1;
  if (settings.minMultiplier != null && settings.maxMultiplier != null) {
    let min = parseFloat(settings.minMultiplier);
    let max = parseFloat(settings.maxMultiplier);
    if (isNaN(min) || isNaN(max)) {
      console.warn('Invalid multiplier range, falling back to default multiplier', defaultMult);
      return defaultMult;
    }
    if (min > max) [min, max] = [max, min];
    return Math.random() * (max - min) + min;
  }
  return defaultMult;
}

function scanPrices(settings) {
  if (!settings.enabled) return;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.parentElement) return NodeFilter.FILTER_REJECT;
      if (node.parentElement.closest('script,style')) return NodeFilter.FILTER_REJECT;
      if (!priceDetectRegex.test(node.textContent)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let node;
  while ((node = walker.nextNode())) {
    const originalText = node.textContent;
    let newText = originalText;
    priceRegex.lastIndex = 0;
    let match;
    while ((match = priceRegex.exec(originalText)) !== null) {
      const originalValue = parseFloat(match[1]);
      if (isNaN(originalValue)) continue;
      const multiplier = getRandomMultiplier(settings);
      const inflated = originalValue * multiplier;
      const formatted = formatPrice(inflated, settings.decimalPlaces != null ? settings.decimalPlaces : 2);
      newText = newText.replace(match[0], formatted);
    }
    if (newText !== originalText) {
      node.textContent = newText;
      node.parentElement.dataset.priceUpdated = 'true';
    }
  }
}

function debounce(fn, delay) {
  let timer;
  return function(...args) {
    const context = this;
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(context, args), delay);
  };
}

function observePageChanges(settings) {
  const debouncedScan = debounce(() => scanPrices(settings), 300);
  const observer = new MutationObserver(debouncedScan);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

getSettings()
  .then(settings => {
    scanPrices(settings);
    observePageChanges(settings);
  })
  .catch(error => {
    console.error('Failed to load settings:', error);
  });
})();