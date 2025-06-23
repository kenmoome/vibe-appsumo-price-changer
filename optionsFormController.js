import * as storage from './settingsSyncManager.js';

document.addEventListener('DOMContentLoaded', optionsInit);

async function optionsInit() {
  const settings = await storage.getSettings();
  for (const [key, value] of Object.entries(settings)) {
    const el = document.getElementById(key);
    if (!el) continue;
    if (el.type === 'checkbox') {
      el.checked = Boolean(value);
    } else if (el.type === 'number') {
      el.value = value;
    } else if (el.tagName === 'TEXTAREA') {
      el.value = Array.isArray(value) ? value.join(', ') : value;
    } else if (el.tagName === 'SELECT' && el.multiple) {
      Array.from(el.options).forEach(opt => {
        opt.selected = Array.isArray(value) && value.includes(opt.value);
      });
    } else {
      el.value = value;
    }
  }
  const saveBtn = document.getElementById('save');
  if (saveBtn) {
    saveBtn.type = 'button';
    saveBtn.addEventListener('click', handleSave);
  }
  const form = document.getElementById('options-form');
  if (form) {
    form.addEventListener('submit', handleSave);
  }
}

async function handleSave(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }
  const elems = document.querySelectorAll(
    '#options-form input[id], #options-form select[id], #options-form textarea[id]'
  );
  const newSettings = {};
  for (const el of elems) {
    if (el.type === 'checkbox') {
      newSettings[el.id] = el.checked;
    } else if (el.tagName === 'SELECT' && el.multiple) {
      newSettings[el.id] = Array.from(el.selectedOptions).map(o => o.value);
    } else if (el.type === 'number') {
      const num = el.valueAsNumber;
      if (isNaN(num)) {
        const status = document.getElementById('status');
        if (status) status.textContent = `Invalid number for ${el.id}`;
        return;
      }
      newSettings[el.id] = num;
    } else if (el.tagName === 'TEXTAREA') {
      newSettings[el.id] = el.value
        .split(',')
        .map(s => s.trim())
        .filter(s => s);
    } else {
      newSettings[el.id] = el.value;
    }
  }
  await storage.setSettings(newSettings);
  const status = document.getElementById('status');
  if (status) {
    status.textContent = 'Options saved.';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  }
}
