import { describe, test, expect, beforeAll, mock } from 'bun:test';

/**
 * Comprehensive theme.js tests without module cache clearing
 * This ensures coverage is properly tracked across all tests
 */

// Setup globals BEFORE loading the module
const storageData = {};
const eventListeners = {};
const mediaQueryListeners = [];

globalThis.localStorage = {
  data: storageData,
  getItem: (key) => storageData[key] || null,
  setItem: (key, value) => { storageData[key] = value; },
  clear: () => Object.keys(storageData).forEach(k => delete storageData[k]),
  removeItem: (key) => delete storageData[key]
};

const mediaQueryList = {
  matches: false,
  addEventListener: (type, handler) => mediaQueryListeners.push({ type, handler }),
  removeEventListener: () => {}
};
globalThis.matchMedia = () => mediaQueryList;

globalThis.document = {
  readyState: 'complete',
  documentElement: {
    dataset: {},
    setAttribute: function(name, value) { this[name] = value; },
    removeAttribute: function(name) {
      delete this[name];
      if (name === 'data-theme') delete this.dataset.theme;
    },
    getAttribute: function(name) { return this[name]; }
  },
  addEventListener: () => {},
  querySelectorAll: () => []
};

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

// Load module ONCE
const theme = require('../public/js/theme.js');

// Helper to trigger media query changes
function triggerMediaQueryChange(matches) {
  mediaQueryList.matches = matches;
  mediaQueryListeners
    .filter(l => l.type === 'change')
    .forEach(l => l.handler({ matches }));
}

// Helper to trigger storage events
function triggerStorageEvent(key, newValue) {
  const event = { type: 'storage', key, newValue, oldValue: storageData[key] };
  (eventListeners.storage || []).forEach(h => h(event));
}

describe('Theme Module - Comprehensive Coverage', () => {

  beforeAll(() => {
    // Module is already loaded
  });

  test('Module exports themeManager API', () => {
    expect(window.themeManager).toBeDefined();
    expect(typeof window.themeManager.init).toBe('function');
    expect(typeof window.themeManager.set).toBe('function');
    expect(typeof window.themeManager.get).toBe('function');
    expect(typeof window.themeManager.getEffective).toBe('function');
    expect(window.themeManager.THEMES).toBeDefined();
    expect(window.themeManager.THEMES.LIGHT).toBe('light');
    expect(window.themeManager.THEMES.DARK).toBe('dark');
    expect(window.themeManager.THEMES.SYSTEM).toBe('system');
  });

  describe('init() function', () => {
    test('initializes with dark theme from localStorage', () => {
      localStorage.clear();
      localStorage.setItem('kudos-theme-preference', 'dark');
      mediaQueryList.matches = false;
      window.themeManager.init();
      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    test('initializes with light theme from localStorage', () => {
      localStorage.clear();
      localStorage.setItem('kudos-theme-preference', 'light');
      mediaQueryList.matches = true;
      window.themeManager.init();
      expect(document.documentElement.dataset.theme).toBeUndefined();
    });

    test('initializes with system theme (dark) from localStorage', () => {
      localStorage.clear();
      localStorage.setItem('kudos-theme-preference', 'system');
      mediaQueryList.matches = true;
      window.themeManager.init();
      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    test('initializes with system theme (light) from localStorage', () => {
      localStorage.clear();
      localStorage.setItem('kudos-theme-preference', 'system');
      mediaQueryList.matches = false;
      window.themeManager.init();
      expect(document.documentElement.dataset.theme).toBeUndefined();
    });

    test('defaults to system when localStorage is empty', () => {
      localStorage.clear();
      mediaQueryList.matches = true;
      window.themeManager.init();
      expect(window.themeManager.get()).toBe('system');
    });

    test('normalizes invalid localStorage value to system', () => {
      localStorage.clear();
      localStorage.setItem('kudos-theme-preference', 'invalid-value');
      mediaQueryList.matches = false;
      window.themeManager.init();
      expect(window.themeManager.get()).toBe('system');
    });

    test('handles localStorage.getItem error', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = () => { throw new Error('Access denied'); };
      expect(() => window.themeManager.init()).not.toThrow();
      localStorage.getItem = originalGetItem;
    });
  });

  describe('set() function', () => {
    test('sets theme to dark', () => {
      window.themeManager.set('dark');
      expect(document.documentElement.dataset.theme).toBe('dark');
      expect(localStorage.getItem('kudos-theme-preference')).toBe('dark');
      expect(window.themeManager.get()).toBe('dark');
    });

    test('sets theme to light', () => {
      window.themeManager.set('light');
      expect(document.documentElement.dataset.theme).toBeUndefined();
      expect(localStorage.getItem('kudos-theme-preference')).toBe('light');
      expect(window.themeManager.get()).toBe('light');
    });

    test('sets theme to system', () => {
      mediaQueryList.matches = true;
      window.themeManager.init(); // Re-init to pick up new system preference
      window.themeManager.set('system');
      expect(document.documentElement.dataset.theme).toBe('dark');
      expect(localStorage.getItem('kudos-theme-preference')).toBe('system');
      expect(window.themeManager.get()).toBe('system');
    });

    test('rejects invalid theme', () => {
      const consoleSpy = mock(() => {});
      const original = console.error;
      console.error = consoleSpy;

      window.themeManager.set('invalid-theme');
      expect(consoleSpy).toHaveBeenCalled();

      console.error = original;
    });

    test('handles localStorage.setItem error', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => { throw new Error('Quota exceeded'); };

      expect(() => window.themeManager.set('dark')).not.toThrow();

      localStorage.setItem = originalSetItem;
    });

    test('dispatches themechange event', () => {
      let capturedEvent = null;
      const handler = (e) => { capturedEvent = e; };
      window.addEventListener('themechange', handler);

      window.themeManager.set('dark');

      expect(capturedEvent).not.toBeNull();
      expect(capturedEvent.detail.preference).toBe('dark');
      expect(capturedEvent.detail.effective).toBe('dark');
    });

      test('themechange event has correct effective theme for system', () => {
      mediaQueryList.matches = false;
      window.themeManager.init(); // Re-init to pick up system preference

      let capturedEvent = null;
      const handler = (e) => { capturedEvent = e; };
      window.addEventListener('themechange', handler);

      window.themeManager.set('system');

      expect(capturedEvent.detail.preference).toBe('system');
      expect(capturedEvent.detail.effective).toBe('light');
    });
  });

  describe('get() and getEffective() functions', () => {
    test('get() returns current preference', () => {
      window.themeManager.set('dark');
      expect(window.themeManager.get()).toBe('dark');
    });

    test('get() returns system as default', () => {
      localStorage.clear();
      window.themeManager.init();
      expect(window.themeManager.get()).toBe('system');
    });

    test('getEffective() returns dark when preference is dark', () => {
      mediaQueryList.matches = false;
      window.themeManager.set('dark');
      expect(window.themeManager.getEffective()).toBe('dark');
    });

    test('getEffective() returns light when preference is light', () => {
      mediaQueryList.matches = true;
      window.themeManager.set('light');
      expect(window.themeManager.getEffective()).toBe('light');
    });

    test('getEffective() resolves system to dark', () => {
      mediaQueryList.matches = true;
      window.themeManager.init(); // Re-init to pick up new system preference
      window.themeManager.set('system');
      expect(window.themeManager.getEffective()).toBe('dark');
    });

    test('getEffective() resolves system to light', () => {
      mediaQueryList.matches = false;
      window.themeManager.init(); // Re-init to pick up new system preference
      window.themeManager.set('system');
      expect(window.themeManager.getEffective()).toBe('light');
    });
  });

  describe('System preference changes', () => {
    test('updates theme when preference is system and system changes to dark', () => {
      mediaQueryList.matches = false;
      window.themeManager.init(); // Re-init to pick up system preference
      window.themeManager.set('system');
      expect(document.documentElement.dataset.theme).toBeUndefined();

      triggerMediaQueryChange(true);

      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    test('updates theme when preference is system and system changes to light', () => {
      mediaQueryList.matches = true;
      window.themeManager.set('system');
      expect(document.documentElement.dataset.theme).toBe('dark');

      triggerMediaQueryChange(false);

      expect(document.documentElement.dataset.theme).toBeUndefined();
    });

    test('does not update when preference is explicit dark', () => {
      mediaQueryList.matches = false;
      window.themeManager.set('dark');
      expect(document.documentElement.dataset.theme).toBe('dark');

      triggerMediaQueryChange(false);

      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    test('does not update when preference is explicit light', () => {
      mediaQueryList.matches = true;
      window.themeManager.set('light');
      expect(document.documentElement.dataset.theme).toBeUndefined();

      triggerMediaQueryChange(true);

      expect(document.documentElement.dataset.theme).toBeUndefined();
    });

    test('dispatches themechange event on system change', () => {
      mediaQueryList.matches = false;
      window.themeManager.set('system');

      let capturedEvent = null;
      const handler = (e) => { capturedEvent = e; };
      window.addEventListener('themechange', handler);

      triggerMediaQueryChange(true);

      expect(capturedEvent).not.toBeNull();
      expect(capturedEvent.detail.preference).toBe('system');
      expect(capturedEvent.detail.effective).toBe('dark');
    });
  });

  describe('Cross-tab synchronization', () => {
    test('updates theme on storage event', () => {
      window.themeManager.set('light');
      expect(document.documentElement.dataset.theme).toBeUndefined();

      localStorage.setItem('kudos-theme-preference', 'dark');
      triggerStorageEvent('kudos-theme-preference', 'dark');

      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    test('ignores storage event for same value', () => {
      window.themeManager.set('dark');

      let eventFired = false;
      const handler = () => { eventFired = true; };
      window.addEventListener('themechange', handler);

      triggerStorageEvent('kudos-theme-preference', 'dark');

      expect(eventFired).toBe(false);
    });

    test('ignores storage event for different key', () => {
      window.themeManager.set('light');
      const themeBefore = document.documentElement.dataset.theme;

      triggerStorageEvent('other-key', 'some-value');

      expect(document.documentElement.dataset.theme).toBe(themeBefore);
    });

    test('normalizes invalid value from storage event', () => {
      triggerStorageEvent('kudos-theme-preference', 'invalid');
      expect(window.themeManager.get()).toBe('system');
    });

    test('dispatches themechange event on storage change', () => {
      window.themeManager.set('light');

      let capturedEvent = null;
      const handler = (e) => { capturedEvent = e; };
      window.addEventListener('themechange', handler);

      localStorage.setItem('kudos-theme-preference', 'dark');
      triggerStorageEvent('kudos-theme-preference', 'dark');

      expect(capturedEvent).not.toBeNull();
      expect(capturedEvent.detail.preference).toBe('dark');
      expect(capturedEvent.detail.effective).toBe('dark');
    });
  });

  describe('Complex scenarios', () => {
    test('user sets explicit theme, system changes ignored', () => {
      mediaQueryList.matches = false;
      window.themeManager.set('dark');
      expect(document.documentElement.dataset.theme).toBe('dark');

      triggerMediaQueryChange(true);
      triggerMediaQueryChange(false);

      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    test('user on system mode follows all system changes', () => {
      mediaQueryList.matches = false;
      window.themeManager.set('system');
      expect(document.documentElement.dataset.theme).toBeUndefined();

      triggerMediaQueryChange(true);
      expect(document.documentElement.dataset.theme).toBe('dark');

      triggerMediaQueryChange(false);
      expect(document.documentElement.dataset.theme).toBeUndefined();
    });

    test('multiple tabs sync correctly', () => {
      window.themeManager.set('light');

      localStorage.setItem('kudos-theme-preference', 'dark');
      triggerStorageEvent('kudos-theme-preference', 'dark');
      expect(document.documentElement.dataset.theme).toBe('dark');

      localStorage.setItem('kudos-theme-preference', 'system');
      triggerStorageEvent('kudos-theme-preference', 'system');
      expect(window.themeManager.get()).toBe('system');
    });
  });
});
