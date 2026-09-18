import { describe, test, expect, beforeEach } from 'bun:test';

/**
 * Direct execution tests for theme.js
 * Tests that directly execute code paths to ensure coverage
 */

const THEME_JS_PATH = require.resolve('../public/js/theme.js');

// Setup minimal but complete global environment
function setupGlobals() {
  const storageData = {};
  const eventListeners = {};
  const domEventListeners = {};
  const mediaQueryListeners = [];

  // localStorage
  globalThis.localStorage = {
    getItem: (key) => storageData[key] || null,
    setItem: (key, value) => { storageData[key] = value; },
    clear: () => Object.keys(storageData).forEach(k => delete storageData[k])
  };

  // matchMedia
  const mediaQueryList = {
    matches: false,
    addEventListener: (type, handler) => mediaQueryListeners.push({ type, handler }),
    _trigger: (matches) => {
      mediaQueryList.matches = matches;
      mediaQueryListeners
        .filter(l => l.type === 'change')
        .forEach(l => l.handler({ matches }));
    }
  };
  globalThis.matchMedia = () => mediaQueryList;

  // document
  globalThis.document = {
    readyState: 'complete',
    documentElement: {
      dataset: {},
      setAttribute: function(name, value) { this[name] = value; },
      removeAttribute: function(name) {
        delete this[name];
        if (name === 'data-theme') delete this.dataset.theme;
      }
    },
    addEventListener: (type, handler) => {
      domEventListeners[type] = domEventListeners[type] || [];
      domEventListeners[type].push(handler);
    },
    querySelectorAll: () => [] // No theme options
  };

  // window
  globalThis.window = globalThis;
  globalThis.addEventListener = (type, handler) => {
    eventListeners[type] = eventListeners[type] || [];
    eventListeners[type].push(handler);
  };
  globalThis.dispatchEvent = (event) => {
    (eventListeners[event.type] || []).forEach(h => h(event));
  };
  globalThis.CustomEvent = class {
    constructor(type, params = {}) {
      this.type = type;
      this.detail = params.detail;
    }
  };

  return {
    storageData,
    eventListeners,
    mediaQueryList,
    triggerStorage: (key, newValue) => {
      const event = { type: 'storage', key, newValue, oldValue: storageData[key] };
      storageData[key] = newValue;
      (eventListeners.storage || []).forEach(h => h(event));
    }
  };
}

describe('Theme.js - Direct Execution Coverage', () => {
  let env;

  beforeEach(() => {
    delete require.cache[THEME_JS_PATH];
    env = setupGlobals();
  });

  test('loads module and exports API', () => {
    require(THEME_JS_PATH);
    expect(window.themeManager).toBeDefined();
  });

  test('initTheme with dark preference', () => {
    require(THEME_JS_PATH);
    localStorage.setItem('kudos-theme-preference', 'dark');
    window.themeManager.init();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  test('initTheme with light preference', () => {
    require(THEME_JS_PATH);
    localStorage.setItem('kudos-theme-preference', 'light');
    window.themeManager.init();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  test('initTheme with system preference (dark)', () => {
    env.mediaQueryList.matches = true;
    require(THEME_JS_PATH);
    localStorage.setItem('kudos-theme-preference', 'system');
    window.themeManager.init();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  test('initTheme with system preference (light)', () => {
    env.mediaQueryList.matches = false;
    require(THEME_JS_PATH);
    localStorage.setItem('kudos-theme-preference', 'system');
    window.themeManager.init();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  test('initTheme defaults to system when no stored preference', () => {
    env.mediaQueryList.matches = true;
    require(THEME_JS_PATH);
    window.themeManager.init();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  test('initTheme with invalid stored preference normalizes to system', () => {
    env.mediaQueryList.matches = false;
    localStorage.setItem('kudos-theme-preference', 'invalid');
    require(THEME_JS_PATH);
    window.themeManager.init();
    expect(window.themeManager.get()).toBe('system');
  });

  test('initTheme handles localStorage error', () => {
    require(THEME_JS_PATH);
    localStorage.getItem = () => { throw new Error('Access denied'); };
    expect(() => window.themeManager.init()).not.toThrow();
  });

  test('setTheme to dark', () => {
    require(THEME_JS_PATH);
    window.themeManager.init();
    window.themeManager.set('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('kudos-theme-preference')).toBe('dark');
  });

  test('setTheme to light', () => {
    require(THEME_JS_PATH);
    window.themeManager.init();
    window.themeManager.set('light');
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(localStorage.getItem('kudos-theme-preference')).toBe('light');
  });

  test('setTheme to system', () => {
    env.mediaQueryList.matches = true;
    require(THEME_JS_PATH);
    window.themeManager.init();
    window.themeManager.set('system');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('kudos-theme-preference')).toBe('system');
  });

  test('setTheme rejects invalid preference', () => {
    require(THEME_JS_PATH);
    window.themeManager.init();
    const originalConsoleError = console.error;
    let errorCalled = false;
    console.error = () => { errorCalled = true; };
    window.themeManager.set('invalid');
    console.error = originalConsoleError;
    expect(errorCalled).toBe(true);
  });

  test('setTheme handles localStorage save error', () => {
    require(THEME_JS_PATH);
    window.themeManager.init();
    localStorage.setItem = () => { throw new Error('Quota exceeded'); };
    expect(() => window.themeManager.set('dark')).not.toThrow();
  });

  test('setTheme dispatches themechange event', () => {
    require(THEME_JS_PATH);
    window.themeManager.init();
    let eventDetail = null;
    window.addEventListener('themechange', (e) => { eventDetail = e.detail; });
    window.themeManager.set('dark');
    expect(eventDetail).not.toBeNull();
    expect(eventDetail.preference).toBe('dark');
    expect(eventDetail.effective).toBe('dark');
  });

  test('getTheme returns current preference', () => {
    require(THEME_JS_PATH);
    window.themeManager.init();
    window.themeManager.set('dark');
    expect(window.themeManager.get()).toBe('dark');
  });

  test('getTheme returns system by default', () => {
    require(THEME_JS_PATH);
    window.themeManager.init();
    expect(window.themeManager.get()).toBe('system');
  });

  test('getEffective when preference is dark', () => {
    require(THEME_JS_PATH);
    window.themeManager.init();
    window.themeManager.set('dark');
    expect(window.themeManager.getEffective()).toBe('dark');
  });

  test('getEffective when preference is light', () => {
    require(THEME_JS_PATH);
    window.themeManager.init();
    window.themeManager.set('light');
    expect(window.themeManager.getEffective()).toBe('light');
  });

  test('getEffective when preference is system (dark)', () => {
    env.mediaQueryList.matches = true;
    require(THEME_JS_PATH);
    window.themeManager.init();
    window.themeManager.set('system');
    expect(window.themeManager.getEffective()).toBe('dark');
  });

  test('getEffective when preference is system (light)', () => {
    env.mediaQueryList.matches = false;
    require(THEME_JS_PATH);
    window.themeManager.init();
    window.themeManager.set('system');
    expect(window.themeManager.getEffective()).toBe('light');
  });

  test('system preference change updates theme when preference is system', () => {
    env.mediaQueryList.matches = false;
    require(THEME_JS_PATH);
    window.themeManager.init();
    window.themeManager.set('system');
    expect(document.documentElement.dataset.theme).toBeUndefined();

    env.mediaQueryList._trigger(true);
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  test('system preference change does not update when preference is explicit', () => {
    env.mediaQueryList.matches = false;
    require(THEME_JS_PATH);
    window.themeManager.init();
    window.themeManager.set('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    env.mediaQueryList._trigger(false);
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  test('system preference change dispatches themechange event', () => {
    env.mediaQueryList.matches = false;
    require(THEME_JS_PATH);
    window.themeManager.init();
    window.themeManager.set('system');

    let eventDetail = null;
    window.addEventListener('themechange', (e) => { eventDetail = e.detail; });

    env.mediaQueryList._trigger(true);
    expect(eventDetail).not.toBeNull();
    expect(eventDetail.preference).toBe('system');
    expect(eventDetail.effective).toBe('dark');
  });

  test('storage event updates theme', () => {
    require(THEME_JS_PATH);
    window.themeManager.init();
    window.themeManager.set('light');

    env.triggerStorage('kudos-theme-preference', 'dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  test('storage event with same value does not trigger change', () => {
    require(THEME_JS_PATH);
    window.themeManager.init();
    window.themeManager.set('dark');

    let eventFired = false;
    window.addEventListener('themechange', () => { eventFired = true; });

    env.triggerStorage('kudos-theme-preference', 'dark');
    expect(eventFired).toBe(false);
  });

  test('storage event for different key is ignored', () => {
    require(THEME_JS_PATH);
    window.themeManager.init();
    window.themeManager.set('light');

    const themeBefore = document.documentElement.dataset.theme;
    env.triggerStorage('other-key', 'some-value');
    expect(document.documentElement.dataset.theme).toBe(themeBefore);
  });

  test('storage event normalizes invalid value', () => {
    require(THEME_JS_PATH);
    window.themeManager.init();

    env.triggerStorage('kudos-theme-preference', 'invalid');
    expect(window.themeManager.get()).toBe('system');
  });

  test('THEMES constant is exported', () => {
    require(THEME_JS_PATH);
    expect(window.themeManager.THEMES).toBeDefined();
    expect(window.themeManager.THEMES.LIGHT).toBe('light');
    expect(window.themeManager.THEMES.DARK).toBe('dark');
    expect(window.themeManager.THEMES.SYSTEM).toBe('system');
  });
});
