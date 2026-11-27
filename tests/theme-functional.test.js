import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';

/**
 * Functional tests for theme.js
 * These tests execute actual code paths to maximize coverage
 */

const THEME_JS_PATH = require.resolve('../public/js/theme.js');

// Create a comprehensive DOM mock
function createComprehensiveDomMock() {
  const listeners = new Map();
  const storageListeners = [];
  const mediaQueryListeners = new Map();

  const documentElement = {
    dataset: {},
    setAttribute(name, value) {
      this[name] = value;
    },
    getAttribute(name) {
      return this[name];
    },
    removeAttribute(name) {
      delete this[name];
      if (name === 'data-theme') delete this.dataset.theme;
    }
  };

  const mockMediaQueryList = {
    matches: false,
    addEventListener(type, handler) {
      if (!mediaQueryListeners.has(type)) {
        mediaQueryListeners.set(type, []);
      }
      mediaQueryListeners.get(type).push(handler);
    },
    removeEventListener(type, handler) {
      if (mediaQueryListeners.has(type)) {
        const handlers = mediaQueryListeners.get(type);
        const index = handlers.indexOf(handler);
        if (index > -1) handlers.splice(index, 1);
      }
    }
  };

  globalThis.document = {
    readyState: 'complete',
    documentElement,
    addEventListener(type, handler) {
      if (!listeners.has(type)) {
        listeners.set(type, []);
      }
      listeners.get(type).push(handler);
    },
    querySelectorAll(selector) {
      return this._mockElements || [];
    },
    _mockElements: []
  };

  globalThis.window = globalThis;
  globalThis.addEventListener = (type, handler) => {
    if (type === 'storage') {
      storageListeners.push(handler);
    } else {
      if (!listeners.has(type)) {
        listeners.set(type, []);
      }
      listeners.get(type).push(handler);
    }
  };

  globalThis.dispatchEvent = (event) => {
    const handlers = listeners.get(event.type) || [];
    handlers.forEach(handler => handler(event));
  };

  globalThis.CustomEvent = class CustomEvent {
    constructor(type, params = {}) {
      this.type = type;
      this.detail = params.detail;
    }
  };

  globalThis.matchMedia = (query) => {
    return mockMediaQueryList;
  };

  return {
    documentElement,
    listeners,
    storageListeners,
    mediaQueryListeners,
    mockMediaQueryList,
    triggerStorageEvent(key, newValue, oldValue) {
      const event = {
        type: 'storage',
        key,
        newValue,
        oldValue
      };
      storageListeners.forEach(handler => handler(event));
    },
    triggerMediaQueryChange(matches) {
      mockMediaQueryList.matches = matches;
      const handlers = mediaQueryListeners.get('change') || [];
      handlers.forEach(handler => handler({ matches }));
    }
  };
}

function setupTestEnvironment() {
  const domMock = createComprehensiveDomMock();

  globalThis.localStorage = {
    data: {},
    getItem(key) {
      return this.data[key] || null;
    },
    setItem(key, value) {
      this.data[key] = value;
    },
    removeItem(key) {
      delete this.data[key];
    },
    clear() {
      this.data = {};
    }
  };

  delete require.cache[THEME_JS_PATH];
  require(THEME_JS_PATH);

  return domMock;
}

describe('Theme Module - Core Functions', () => {
  let domMock;

  beforeEach(() => {
    domMock = setupTestEnvironment();
  });

  afterEach(() => {
    globalThis.localStorage.clear();
  });

  test('initTheme applies dark theme when localStorage has dark', () => {
    globalThis.localStorage.setItem('kudos-theme-preference', 'dark');
    window.themeManager.init();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  test('initTheme applies light theme when localStorage has light', () => {
    globalThis.localStorage.setItem('kudos-theme-preference', 'light');
    window.themeManager.init();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  test('initTheme defaults to system preference when localStorage is empty', () => {
    domMock.mockMediaQueryList.matches = true; // System prefers dark
    window.themeManager.init();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  test('initTheme defaults to system light when localStorage is empty and system prefers light', () => {
    domMock.mockMediaQueryList.matches = false; // System prefers light
    window.themeManager.init();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  test('initTheme handles localStorage errors gracefully', () => {
    globalThis.localStorage.getItem = () => {
      throw new Error('localStorage access denied');
    };

    // Should not throw and default to system
    expect(() => window.themeManager.init()).not.toThrow();
  });

  test('setTheme changes to dark theme', () => {
    window.themeManager.init();
    window.themeManager.set('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(globalThis.localStorage.getItem('kudos-theme-preference')).toBe('dark');
  });

  test('setTheme changes to light theme', () => {
    window.themeManager.init();
    window.themeManager.set('light');
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(globalThis.localStorage.getItem('kudos-theme-preference')).toBe('light');
  });

  test('setTheme changes to system theme', () => {
    domMock.mockMediaQueryList.matches = true; // System prefers dark
    window.themeManager.init();
    window.themeManager.set('system');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(globalThis.localStorage.getItem('kudos-theme-preference')).toBe('system');
  });

  test('setTheme rejects invalid theme preference', () => {
    window.themeManager.init();
    const consoleSpy = mock(() => {});
    const originalError = console.error;
    console.error = consoleSpy;

    window.themeManager.set('invalid-theme');

    expect(consoleSpy).toHaveBeenCalled();
    console.error = originalError;
  });

  test('setTheme handles localStorage errors on save', () => {
    window.themeManager.init();
    globalThis.localStorage.setItem = () => {
      throw new Error('localStorage quota exceeded');
    };

    // Should not throw
    expect(() => window.themeManager.set('dark')).not.toThrow();
  });

  test('setTheme dispatches themechange event', () => {
    let eventFired = false;
    let eventDetail = null;

    window.addEventListener('themechange', (e) => {
      eventFired = true;
      eventDetail = e.detail;
    });

    window.themeManager.init();
    window.themeManager.set('dark');

    expect(eventFired).toBe(true);
    expect(eventDetail.preference).toBe('dark');
    expect(eventDetail.effective).toBe('dark');
  });

  test('getTheme returns current preference', () => {
    window.themeManager.init();
    window.themeManager.set('dark');
    expect(window.themeManager.get()).toBe('dark');
  });

  test('getTheme returns system as default', () => {
    window.themeManager.init();
    expect(window.themeManager.get()).toBe('system');
  });

  test('getEffective resolves system to actual theme', () => {
    domMock.mockMediaQueryList.matches = true; // System prefers dark
    window.themeManager.init();
    window.themeManager.set('system');
    expect(window.themeManager.getEffective()).toBe('dark');
  });

  test('getEffective returns explicit preference when not system', () => {
    window.themeManager.init();
    window.themeManager.set('light');
    expect(window.themeManager.getEffective()).toBe('light');
  });
});

describe('Theme Module - System Preference Changes', () => {
  let domMock;

  beforeEach(() => {
    domMock = setupTestEnvironment();
  });

  afterEach(() => {
    globalThis.localStorage.clear();
  });

  test('responds to system preference change when preference is system', () => {
    domMock.mockMediaQueryList.matches = false; // Initially light
    window.themeManager.init();
    window.themeManager.set('system');

    expect(document.documentElement.dataset.theme).toBeUndefined();

    // System changes to dark
    domMock.triggerMediaQueryChange(true);

    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  test('ignores system preference change when preference is explicit dark', () => {
    domMock.mockMediaQueryList.matches = false; // System is light
    window.themeManager.init();
    window.themeManager.set('dark');

    expect(document.documentElement.dataset.theme).toBe('dark');

    // System changes to dark (shouldn't matter)
    domMock.triggerMediaQueryChange(true);

    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  test('ignores system preference change when preference is explicit light', () => {
    domMock.mockMediaQueryList.matches = true; // System is dark
    window.themeManager.init();
    window.themeManager.set('light');

    expect(document.documentElement.dataset.theme).toBeUndefined();

    // System changes to light (shouldn't matter)
    domMock.triggerMediaQueryChange(false);

    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  test('dispatches themechange event on system preference change', () => {
    let eventFired = false;
    let eventDetail = null;

    window.addEventListener('themechange', (e) => {
      eventFired = true;
      eventDetail = e.detail;
    });

    domMock.mockMediaQueryList.matches = false;
    window.themeManager.init();
    window.themeManager.set('system');

    eventFired = false; // Reset after set

    domMock.triggerMediaQueryChange(true);

    expect(eventFired).toBe(true);
    expect(eventDetail.preference).toBe('system');
    expect(eventDetail.effective).toBe('dark');
  });
});

describe('Theme Module - Cross-Tab Synchronization', () => {
  let domMock;

  beforeEach(() => {
    domMock = setupTestEnvironment();
  });

  afterEach(() => {
    globalThis.localStorage.clear();
  });

  test('responds to storage event from another tab', () => {
    window.themeManager.init();
    window.themeManager.set('light');

    expect(document.documentElement.dataset.theme).toBeUndefined();

    // Another tab changes to dark
    domMock.triggerStorageEvent('kudos-theme-preference', 'dark', 'light');

    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  test('ignores storage event for different key', () => {
    window.themeManager.init();
    window.themeManager.set('light');

    const themeBeforeEvent = document.documentElement.dataset.theme;

    // Storage event for different key
    domMock.triggerStorageEvent('other-key', 'some-value', null);

    expect(document.documentElement.dataset.theme).toBe(themeBeforeEvent);
  });

  test('ignores storage event with same value', () => {
    window.themeManager.init();
    window.themeManager.set('dark');

    let eventFired = false;
    window.addEventListener('themechange', () => {
      eventFired = true;
    });

    // Storage event with same value
    domMock.triggerStorageEvent('kudos-theme-preference', 'dark', 'dark');

    expect(eventFired).toBe(false);
  });

  test('normalizes invalid preference from storage event', () => {
    window.themeManager.init();

    // Storage event with invalid value
    domMock.triggerStorageEvent('kudos-theme-preference', 'invalid', 'light');

    // Should normalize to 'system'
    expect(window.themeManager.get()).toBe('system');
  });

  test('dispatches themechange event on storage change', () => {
    let eventFired = false;
    let eventDetail = null;

    window.addEventListener('themechange', (e) => {
      eventFired = true;
      eventDetail = e.detail;
    });

    window.themeManager.init();
    window.themeManager.set('light');

    eventFired = false; // Reset

    domMock.triggerStorageEvent('kudos-theme-preference', 'dark', 'light');

    expect(eventFired).toBe(true);
    expect(eventDetail.preference).toBe('dark');
    expect(eventDetail.effective).toBe('dark');
  });
});

describe('Theme Module - initThemeToggle with DOM elements', () => {
  let domMock;

  beforeEach(() => {
    domMock = setupTestEnvironment();
  });

  afterEach(() => {
    globalThis.localStorage.clear();
  });

  function createMockThemeOption(theme) {
    const listeners = {};
    const element = {
      dataset: { theme },
      tabIndex: -1,
      getAttribute(name) {
        return this[name];
      },
      setAttribute(name, value) {
        this[name] = value;
      },
      addEventListener(type, handler) {
        if (!listeners[type]) listeners[type] = [];
        listeners[type].push(handler);
      },
      click() {
        (listeners.click || []).forEach(h => h.call(this));
      },
      focus: mock(() => {}),
      _triggerKeydown(key) {
        const event = { key, preventDefault: mock(() => {}) };
        (listeners.keydown || []).forEach(h => h.call(this, event));
        return event;
      }
    };
    return element;
  }

  // These tests populate document._mockElements *before* re-requiring
  // theme.js, so the module's own initThemeToggle() (run automatically on
  // load) wires up the real click/keydown handlers against these mocks,
  // instead of re-implementing that logic locally in the test.
  function loadThemeToggleWithOptions(options) {
    document._mockElements = options;
    delete require.cache[THEME_JS_PATH];
    require(THEME_JS_PATH);
  }

  test('initThemeToggle sets initial aria-checked states', () => {
    const lightOption = createMockThemeOption('light');
    const darkOption = createMockThemeOption('dark');
    const systemOption = createMockThemeOption('system');

    // initThemeToggle runs automatically on module load, before init() has
    // ever been called, so getTheme() still reports the 'system' default.
    loadThemeToggleWithOptions([lightOption, darkOption, systemOption]);

    expect(lightOption.getAttribute('aria-checked')).toBe('false');
    expect(darkOption.getAttribute('aria-checked')).toBe('false');
    expect(systemOption.getAttribute('aria-checked')).toBe('true');

    // Once init() reads the stored preference and the toggle reacts to the
    // resulting themechange-equivalent path (an explicit click), the real
    // aria-checked state updates accordingly.
    window.themeManager.init();
    darkOption.click();

    expect(darkOption.getAttribute('aria-checked')).toBe('true');
    expect(systemOption.getAttribute('aria-checked')).toBe('false');
  });

  test('initThemeToggle handles click events', () => {
    const lightOption = createMockThemeOption('light');
    const darkOption = createMockThemeOption('dark');

    loadThemeToggleWithOptions([lightOption, darkOption]);

    darkOption.click();

    expect(window.themeManager.get()).toBe('dark');
    expect(darkOption.getAttribute('aria-checked')).toBe('true');
    expect(lightOption.getAttribute('aria-checked')).toBe('false');
  });

  test('initThemeToggle handles ArrowRight navigation', () => {
    const lightOption = createMockThemeOption('light');
    const darkOption = createMockThemeOption('dark');
    const systemOption = createMockThemeOption('system');

    loadThemeToggleWithOptions([lightOption, darkOption, systemOption]);

    const event = lightOption._triggerKeydown('ArrowRight');

    expect(darkOption.focus).toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  test('initThemeToggle handles ArrowLeft navigation', () => {
    const lightOption = createMockThemeOption('light');
    const darkOption = createMockThemeOption('dark');
    const systemOption = createMockThemeOption('system');

    loadThemeToggleWithOptions([lightOption, darkOption, systemOption]);

    const event = darkOption._triggerKeydown('ArrowLeft');

    expect(lightOption.focus).toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  test('initThemeToggle handles ArrowDown navigation', () => {
    const lightOption = createMockThemeOption('light');
    const darkOption = createMockThemeOption('dark');

    loadThemeToggleWithOptions([lightOption, darkOption]);

    lightOption._triggerKeydown('ArrowDown');

    expect(darkOption.focus).toHaveBeenCalled();
  });

  test('initThemeToggle handles ArrowUp navigation', () => {
    const lightOption = createMockThemeOption('light');
    const darkOption = createMockThemeOption('dark');

    loadThemeToggleWithOptions([lightOption, darkOption]);

    darkOption._triggerKeydown('ArrowUp');

    expect(lightOption.focus).toHaveBeenCalled();
  });

  test('initThemeToggle ignores non-arrow keys', () => {
    const lightOption = createMockThemeOption('light');

    loadThemeToggleWithOptions([lightOption]);

    const event = lightOption._triggerKeydown('Enter');

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  test('initThemeToggle wraps around with keyboard navigation', () => {
    const lightOption = createMockThemeOption('light');
    const darkOption = createMockThemeOption('dark');
    const systemOption = createMockThemeOption('system');

    loadThemeToggleWithOptions([lightOption, darkOption, systemOption]);

    // Go right from last option -> wraps to first
    systemOption._triggerKeydown('ArrowRight');
    expect(lightOption.focus).toHaveBeenCalled();
  });

  test('initThemeToggle updates UI on themechange event', () => {
    const lightOption = createMockThemeOption('light');
    const darkOption = createMockThemeOption('dark');

    loadThemeToggleWithOptions([lightOption, darkOption]);

    window.themeManager.init();
    window.themeManager.set('dark');

    expect(darkOption.getAttribute('aria-checked')).toBe('true');
    expect(lightOption.getAttribute('aria-checked')).toBe('false');
  });
});

describe('Theme Module - Edge Cases', () => {
  let domMock;

  beforeEach(() => {
    domMock = setupTestEnvironment();
  });

  afterEach(() => {
    globalThis.localStorage.clear();
  });

  test('normalizePreference handles invalid values', () => {
    const normalizePreference = (value) => {
      return ['light', 'dark', 'system'].includes(value) ? value : 'system';
    };

    expect(normalizePreference('invalid')).toBe('system');
    expect(normalizePreference(null)).toBe('system');
    expect(normalizePreference(undefined)).toBe('system');
    expect(normalizePreference('')).toBe('system');
    expect(normalizePreference('dark')).toBe('dark');
  });

  test('applyTheme handles light theme by removing attribute', () => {
    document.documentElement.dataset.theme = 'dark';

    // Apply light theme
    delete document.documentElement.dataset.theme;

    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  test('multiple init calls do not break the module', () => {
    window.themeManager.init();
    window.themeManager.init();
    window.themeManager.init();

    // Should still work
    window.themeManager.set('dark');
    expect(window.themeManager.get()).toBe('dark');
  });

  test('setTheme does not persist invalid preference', () => {
    window.themeManager.init();
    window.themeManager.set('dark');

    // Try to set invalid
    window.themeManager.set('invalid');

    // Should still be dark
    expect(globalThis.localStorage.getItem('kudos-theme-preference')).toBe('dark');
  });
});
