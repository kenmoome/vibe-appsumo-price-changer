# vibe-appsumo-price-changer

A Chrome Manifest V3 extension that inflates every USD price on AppSumo by a random multiplier to deter impulse purchases. All logic runs client-side, with zero external network calls. Includes a browser?action popup for quick toggling and multiplier adjustment, and a full options page for detailed settings persistence.

---

## Table of Contents

1. [Overview](#overview)  
2. [Features](#features)  
3. [Installation](#installation)  
4. [Usage](#usage)  
5. [File Structure & Components](#file-structure--components)  
6. [Dependencies](#dependencies)  
7. [Known Missing Assets](#known-missing-assets)  
8. [Contributing](#contributing)  
9. [License](#license)  

---

## Overview

When you browse `https://appsumo.com/*`, this extension will:

- Scan the page for USD?formatted prices (e.g. `$49.00`)  
- Generate a random multiplier within your configured range (default 500? ? 1000?)  
- Replace every price with the inflated value (e.g. `$49.00` ? `$24,500.00`)  
- Observe dynamic/Ajax/SPA content and re-inflate new prices automatically  
- Show ON/OFF status in the extension badge  
- Allow instant toggling and multiplier adjustment via the popup  
- Persist your settings (enabled state, min/max multiplier) in `chrome.storage.sync`  

All scripting is done client-side; no external APIs are contacted.

---

## Features

- **Auto-inflate** USD prices on AppSumo by a configurable random multiplier  
- **Dynamic updates** via `MutationObserver` for SPA/Ajax content  
- **Browser-action popup** for instant enable/disable and range adjustment  
- **Options page** for advanced settings, defaults reset, and descriptive tooltips  
- **Extension badge** displays current ON/OFF status  
- **Utility modules** for currency parsing/formatting, multiplier generation, and error handling  
- **Storage wrapper** simplifies working with `chrome.storage.sync`  
- **MV3-compliant** service worker (no persistent background page)  

---

## Installation

1. Clone or download this repository  
2. Open Chrome and navigate to `chrome://extensions/`  
3. Enable **Developer mode** (toggle in top right)  
4. Click **Load unpacked** and select the project?s root folder  
5. You should now see **?AppSumo Price Changer?** in your extensions list  

---

## Usage

1. Navigate to any page under `https://appsumo.com/`  
2. Observe inflated prices immediately replacing the originals  
3. Click the extension icon in the toolbar to open the **popup UI**  
   - Toggle ON/OFF  
   - Adjust minimum and maximum multiplier (`slider` or `number` inputs)  
   - See live badge update  
4. For advanced settings, click **?Options?** under the extension in `chrome://extensions/`  
   - Configure default multiplier range  
   - Enable/disable on load  
   - Reset to defaults  

### Example: Popup Interaction

```html
<!-- popup.html -->
<label>
  <input type="checkbox" id="toggle" /> Enable Price Inflation
</label>
<div>
  <label>Min ?</label>
  <input type="number" id="minMultiplier" min="1" />
</div>
<div>
  <label>Max ?</label>
  <input type="number" id="maxMultiplier" min="1" />
</div>
<button id="save">Save</button>
```

```js
// popuplogic.js (snippet)
document.addEventListener('DOMContentLoaded', async () => {
  const settings = await storageWrapper.getSettings();
  toggle.checked = settings.enabled;
  minMultiplier.value = settings.min;
  maxMultiplier.value = settings.max;
});

save.addEventListener('click', () => {
  const newSettings = {
    enabled: toggle.checked,
    min: parseInt(minMultiplier.value, 10),
    max: parseInt(maxMultiplier.value, 10)
  };
  storageWrapper.setSettings(newSettings);
  chrome.action.setBadgeText({ text: newSettings.enabled ? 'ON' : 'OFF' });
});
```

---

## File Structure & Components

src/  
?? manifest.json  
?? background/  
?  ?? serviceworker.js             ? Installation, activation, badge management, tab updates  
?? content/  
?  ?? contentscript.js             ? Scans & replaces prices, sets up DOM observer  
?? utils/  
?  ?? utils.js                     ? `parseCurrency`, `generateMultiplier`, `formatPrice`, etc.  
?  ?? storagewrapper.js            ? Wrapper for `chrome.storage.sync` (get, set, onChanged)  
popup/  
?? popup.html                      ? Browser-action popup markup  
?? popuplogic.js                   ? Popup logic and settings sync  
?? popupstyles.css                 ? Responsive popup styling  
options/  
?? optionsui.html                  ? Full options page markup  
?? optionsFormController.js       ? Options page controller
?? optionsstyles.css               ? Options page styling  
icons/  
?? 16.png, 32.png, 48.png, 128.png ? *(to be added)*  

### Component Purposes

- **manifest.json**  
  Defines metadata, permissions (`scripting`, `storage`), host permissions, service worker entry, action badge/popup.

- **serviceworker.js**  
  - `chrome.runtime.onInstalled`: initialize default settings  
  - `chrome.tabs.onUpdated`: inject `contentscript.js` on AppSumo pages  
  - Manage badge text (`ON`/`OFF`)  

- **contentscript.js**  
  - Fetch user settings via `storagewrapper.js`  
  - Find and replace all USD prices using `utils.js`  
  - Attach `MutationObserver` to handle dynamic content  

- **utils.js**  
  - `parseCurrency(text)` ? extract numeric value  
  - `generateMultiplier(min, max)` ? random integer multiplier  
  - `formatPrice(value)` ? format as `$XX,XXX.XX`  
  - `replaceNodeText(node, text)` ? safely update text nodes  

- **storagewrapper.js**  
  - `getSettings()`: returns a Promise of `{ enabled, min, max }` (with defaults)  
  - `setSettings(data)`: persists settings to `chrome.storage.sync`  
  - `onChange(listener)`: subscribe to storage changes  

- **popup.html / popuplogic.js / popupstyles.css**  
  Quick access UI for toggling the extension and adjusting multiplier range. Syncs with storage and updates badge.

- **optionsui.html / optionsFormController.js / optionsstyles.css**
  Full standalone options page with form controls, descriptions, tooltips, and ?Reset to Defaults? button.

---

## Dependencies

- Chrome 88+ with Manifest V3 support  
- No external NPM packages or network requests  
- Uses Chrome Extension APIs:  
  - `chrome.storage.sync`  
  - `chrome.scripting.executeScript`  
  - `chrome.tabs`  
  - `chrome.action`  

---

## Known Missing Assets

- **Icons** (`16?16`, `32?32`, `48?48`, `128?128`) should be placed in `icons/` and referenced in `manifest.json`.  
- **Global stylesheet or design tokens**; only per-component CSS exists.  
- No in-page dashboard beyond the popup and options page.

---

## Contributing

1. Fork the repository  
2. Create a feature branch (`git checkout -b feature/YourFeature`)  
3. Commit your changes (`git commit -m "Add your feature"`)  
4. Push to the branch (`git push origin feature/YourFeature`)  
5. Open a Pull Request describing your changes  

Please ensure code style consistency and document any new settings or UI changes.

---

## License

MIT ? Your Name or Organization