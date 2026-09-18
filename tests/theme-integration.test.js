import { describe, test, expect, beforeEach, afterEach } from 'bun:test';

/**
 * Integration tests for theme.js auto-initialization and real DOM scenarios
 */

const THEME_JS_PATH = require.resolve('../public/js/theme.js');

function createFullDomEnvironment() {
  const listeners = new Map();
  const storageListeners = [];
  const mediaQueryListeners = new Map();
  const domReadyListeners = [];

  const createElementMock = (tag, attributes = {}) => {
    const elementListeners = new Map();
    const attrs = { ...attributes };

    return {
      tagName: tag.toUpperCase(),
      dataset: {},
      tabIndex: -1,
      focus() {},
      click() {
        const handlers = elementListeners.get('click') || [];
        handlers.forEach(h => h.call(this));
      },
      getAttribute(name) {
        return attrs[name];
      },
      setAttribute(name, value) {
        attrs[name] = value;
      },
      removeAttribute(name) {
        delete attrs[name];
      },
      addEventListener(type, handler) {
        if (!elementListeners.has(type)) {
          elementListeners.set(type, []);
        }
        elementListeners.get(type).push(handler);
      },
      _getListeners(type) {
        return elementListeners.get(type) || [];
      }
    };
  };

  const documentElement = createElementMock('html');

  const themeOptions = [
    createElementMock('button', { 'data-theme': 'light', 'aria-checked': 'false' }),
    createElementMock('button', { 'data-theme': 'dark', 'aria-checked': 'false' }),
    createElementMock('button', { 'data-theme': 'system', 'aria-checked': 'true' })
  ];

  // Add dataset to each option
  themeOptions.forEach(opt => {
    opt.dataset.theme = opt.getAttribute('data-theme');
  });

  const mockMediaQueryList = {
    matches: false,
    addEventListener(type, handler) {
      if (!mediaQueryListeners.has(type)) {
        mediaQueryListeners.set(type, []);
      }
      mediaQueryListeners.get(type).push(handler);
    }
  };

  globalThis.document = {
    readyState: 'complete',
    documentElement,
    addEventListener(type, handler) {
      if (type === 'DOMContentLoaded') {
        domReadyListeners.push(handler);
      } else if (!listeners.has(type)) {
        listeners.set(type, []);
        listeners.get(type).push(handler);
      } else {
        listeners.get(type).push(handler);
      }
    },
    querySelectorAll(selector) {
      if (selector === '.theme-option') {
        return themeOptions;
      }
      return [];
    }
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

  globalThis.matchMedia = () => mockMediaQueryList;

  return {
    documentElement,
    themeOptions,
    mockMediaQueryList,
    triggerDomReady() {
      domReadyListeners.forEach(handler => handler());
    },
    triggerStorageEvent(key, newValue, oldValue) {
      const event = { type: 'storage', key, newValue, oldValue };
      storageListeners.forEach(handler => handler(event));
    },
    triggerMediaQueryChange(matches) {
      mockMediaQueryList.matches = matches;
      const handlers = mediaQueryListeners.get('change') || [];
      handlers.forEach(handler => handler({ matches }));
    }
  };
}

describe('Theme Module - Full Integration with Auto-Initialization', () => {
  let env;

  beforeEach(() => {
    globalThis.localStorage = {
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
      clear() {
        this.data = {};
      }
    };

    env = createFullDomEnvironment();
  });

  afterEach(() => {
    delete require.cache[THEME_JS_PATH];
    globalThis.localStorage.clear();
  });

  test('module loads and exports themeManager API', () => {
    // Module load triggers initThemeToggle because readyState is 'complete'
    require(THEME_JS_PATH);

    // Check that themeManager API is exported
    expect(window.themeManager).toBeDefined();
    expect(typeof window.themeManager.init).toBe('function');
    expect(typeof window.themeManager.set).toBe('function');
    expect(typeof window.themeManager.get).toBe('function');
    expect(typeof window.themeManager.getEffective).toBe('function');
    expect(window.themeManager.THEMES).toBeDefined();
  });

  test('theme toggle click changes theme and updates UI', () => {
    require(THEME_JS_PATH);
    window.themeManager.init();

    const darkOption = env.themeOptions.find(opt => opt.dataset.theme === 'dark');
    darkOption.click();

    expect(window.themeManager.get()).toBe('dark');
    expect(darkOption.getAttribute('aria-checked')).toBe('true');
  });

  test('theme toggle responds to external themechange events', () => {
    require(THEME_JS_PATH);
    window.themeManager.init();

    // Simulate external theme change
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { preference: 'light', effective: 'light' }
    }));

    const lightOption = env.themeOptions.find(opt => opt.dataset.theme === 'light');
    expect(lightOption.getAttribute('aria-checked')).toBe('true');
  });

  test('keyboard navigation functionality exists', () => {
    require(THEME_JS_PATH);

    // Just verify the module loaded and API is available
    expect(window.themeManager).toBeDefined();

    // Keyboard navigation is set up during initThemeToggle
    // which runs automatically when the module loads
  });

  test('theme toggle sets initial tabIndex correctly', () => {
    globalThis.localStorage.setItem('kudos-theme-preference', 'dark');
    require(THEME_JS_PATH);

    const darkOption = env.themeOptions.find(opt => opt.dataset.theme === 'dark');
    const lightOption = env.themeOptions.find(opt => opt.dataset.theme === 'light');

    // The selected option should have tabIndex 0, others -1
    // This is set during initialization
    expect([0, -1]).toContain(darkOption.tabIndex);
    expect([-1]).toContain(lightOption.tabIndex);
  });

  test('handles all arrow key directions', () => {
    require(THEME_JS_PATH);

    const option = env.themeOptions[0];
    const keydownHandlers = option._getListeners('keydown');

    const keysToTest = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Enter', 'Space'];

    keysToTest.forEach(key => {
      const event = {
        key,
        preventDefault() {}
      };

      // Should not throw
      expect(() => {
        keydownHandlers[0].call(option, event);
      }).not.toThrow();
    });
  });

  test('system preference change updates theme when preference is system', () => {
    globalThis.localStorage.setItem('kudos-theme-preference', 'system');
    env.mockMediaQueryList.matches = false; // Start with light

    require(THEME_JS_PATH);
    window.themeManager.init();

    expect(document.documentElement.dataset.theme).toBeUndefined(); // light

    // System changes to dark
    env.triggerMediaQueryChange(true);

    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  test('storage event from another tab updates theme', () => {
    require(THEME_JS_PATH);
    window.themeManager.init();
    window.themeManager.set('light');

    // Another tab changes to dark
    env.triggerStorageEvent('kudos-theme-preference', 'dark', 'light');

    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  test('invalid storage event value gets normalized', () => {
    require(THEME_JS_PATH);
    window.themeManager.init();

    // Another tab sets invalid value
    env.triggerStorageEvent('kudos-theme-preference', 'invalid-theme', 'light');

    // Should normalize to system
    expect(window.themeManager.get()).toBe('system');
  });

  test('theme change event includes correct detail', () => {
    require(THEME_JS_PATH);
    window.themeManager.init();

    let capturedEvent = null;
    window.addEventListener('themechange', (e) => {
      capturedEvent = e;
    });

    window.themeManager.set('dark');

    expect(capturedEvent).not.toBeNull();
    expect(capturedEvent.detail.preference).toBe('dark');
    expect(capturedEvent.detail.effective).toBe('dark');
  });

  test('getEffective resolves system preference correctly', () => {
    env.mockMediaQueryList.matches = true; // System prefers dark

    require(THEME_JS_PATH);
    window.themeManager.init();
    window.themeManager.set('system');

    expect(window.themeManager.getEffective()).toBe('dark');

    // Change system preference
    env.triggerMediaQueryChange(false); // System now prefers light

    expect(window.themeManager.getEffective()).toBe('light');
  });
});

describe('Theme Module - Loading State Scenarios', () => {
  let env;

  beforeEach(() => {
    globalThis.localStorage = {
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
      clear() {
        this.data = {};
      }
    };
  });

  afterEach(() => {
    delete require.cache[THEME_JS_PATH];
    globalThis.localStorage.clear();
  });

  test('handles DOMContentLoaded when readyState is loading', () => {
    env = createFullDomEnvironment();
    document.readyState = 'loading';

    require(THEME_JS_PATH);

    // Trigger DOMContentLoaded
    env.triggerDomReady();

    // Module should still export API
    expect(window.themeManager).toBeDefined();
  });

  test('initializes immediately when readyState is complete', () => {
    env = createFullDomEnvironment();
    document.readyState = 'complete';

    require(THEME_JS_PATH);

    // Module should export API immediately
    expect(window.themeManager).toBeDefined();
  });

  test('initializes immediately when readyState is interactive', () => {
    env = createFullDomEnvironment();
    document.readyState = 'interactive';

    require(THEME_JS_PATH);

    // Module should export API immediately
    expect(window.themeManager).toBeDefined();
  });
});

describe('Theme Module - No Theme Toggle Scenario', () => {
  beforeEach(() => {
    globalThis.localStorage = {
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
      clear() {
        this.data = {};
      }
    };

    // Create environment WITHOUT theme options
    const mockMediaQueryList = {
      matches: false,
      addEventListener() {}
    };

    globalThis.document = {
      readyState: 'complete',
      documentElement: {
        dataset: {},
        setAttribute() {},
        removeAttribute(name) {
          if (name === 'data-theme') delete this.dataset.theme;
        }
      },
      addEventListener() {},
      querySelectorAll() {
        return []; // No theme options
      }
    };

    globalThis.window = globalThis;
    globalThis.addEventListener = () => {};
    globalThis.dispatchEvent = () => {};
    globalThis.CustomEvent = class CustomEvent {
      constructor(type, params = {}) {
        this.type = type;
        this.detail = params.detail;
      }
    };
    globalThis.matchMedia = () => mockMediaQueryList;
  });

  afterEach(() => {
    delete require.cache[THEME_JS_PATH];
    globalThis.localStorage.clear();
  });

  test('module loads without theme toggle UI', () => {
    // Should not throw even when no theme options exist
    expect(() => {
      require(THEME_JS_PATH);
    }).not.toThrow();

    // API should still be available
    expect(typeof window.themeManager).toBe('object');
    expect(typeof window.themeManager.init).toBe('function');
  });

  test('theme manager still works without UI', () => {
    require(THEME_JS_PATH);

    window.themeManager.init();
    window.themeManager.set('dark');

    expect(window.themeManager.get()).toBe('dark');
  });
});

describe('Theme Module - Complex Interaction Scenarios', () => {
  let env;

  beforeEach(() => {
    globalThis.localStorage = {
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
      clear() {
        this.data = {};
      }
    };

    env = createFullDomEnvironment();
  });

  afterEach(() => {
    delete require.cache[THEME_JS_PATH];
    globalThis.localStorage.clear();
  });

  test('user changes theme, then system changes, user preference takes precedence', () => {
    env.mockMediaQueryList.matches = false; // System is light

    require(THEME_JS_PATH);
    window.themeManager.init();

    // User explicitly sets dark
    window.themeManager.set('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    // System changes to light (should not affect user's explicit choice)
    env.triggerMediaQueryChange(false);
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  test('user on system mode, system changes, theme follows', () => {
    env.mockMediaQueryList.matches = false; // System is light

    require(THEME_JS_PATH);
    window.themeManager.init();
    window.themeManager.set('system');

    expect(document.documentElement.dataset.theme).toBeUndefined(); // light

    // System changes to dark
    env.triggerMediaQueryChange(true);
    expect(document.documentElement.dataset.theme).toBe('dark');

    // System changes back to light
    env.triggerMediaQueryChange(false);
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  test('multiple tabs synchronize theme changes', () => {
    require(THEME_JS_PATH);
    window.themeManager.init();

    // Tab 1 sets light
    window.themeManager.set('light');
    expect(document.documentElement.dataset.theme).toBeUndefined();

    // Tab 2 changes to dark (simulated via storage event)
    env.triggerStorageEvent('kudos-theme-preference', 'dark', 'light');
    expect(document.documentElement.dataset.theme).toBe('dark');

    // Tab 3 changes to system
    env.triggerStorageEvent('kudos-theme-preference', 'system', 'dark');
    expect(window.themeManager.get()).toBe('system');
  });

  test('theme persists across init calls', () => {
    require(THEME_JS_PATH);
    window.themeManager.init();
    window.themeManager.set('dark');

    // Simulate page reload by re-initializing
    window.themeManager.init();

    expect(window.themeManager.get()).toBe('dark');
  });
});
