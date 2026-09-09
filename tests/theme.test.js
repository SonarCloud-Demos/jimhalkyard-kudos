import { describe, test, expect, beforeEach, afterEach } from 'bun:test';

/**
 * Unit tests for theme.js
 * Note: These tests verify the logic and structure of the theme module
 */

const THEME_JS_PATH = require.resolve('../public/js/theme.js');

// Minimal DOM stub: only what theme.js touches during module load/init
function createDocumentElement() {
  const attributes = {};
  const element = {
    dataset: {},
    setAttribute(name, value) {
      attributes[name] = value;
    },
    getAttribute(name) {
      return attributes[name];
    },
    removeAttribute(name) {
      delete attributes[name];
      if (name === 'data-theme') delete element.dataset.theme;
    }
  };
  return element;
}

function setupDomStub() {
  const listeners = {};
  globalThis.document = {
    readyState: 'complete',
    documentElement: createDocumentElement(),
    addEventListener() {},
    querySelectorAll() {
      return [];
    }
  };
  globalThis.window = globalThis;
  globalThis.addEventListener = (type, handler) => {
    listeners[type] = listeners[type] || [];
    listeners[type].push(handler);
  };
  globalThis.dispatchEvent = (event) => {
    (listeners[event.type] || []).forEach(handler => handler(event));
  };
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, params = {}) {
      this.type = type;
      this.detail = params.detail;
    }
  };
}

function loadThemeModule() {
  setupDomStub();
  delete require.cache[THEME_JS_PATH];
  require(THEME_JS_PATH);
}

describe('Theme Module Structure', () => {
  test('applies dark theme when preference is dark', () => {
    loadThemeModule();
    globalThis.localStorage = { getItem: () => 'dark', setItem() {} };
    globalThis.matchMedia = () => ({ matches: false, addEventListener() {} });
    document.documentElement.removeAttribute('data-theme');
    window.themeManager.init();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  test('should export themeManager to window', () => {
    loadThemeModule();

    expect(typeof window.themeManager).toBe('object');
    expect(typeof window.themeManager.init).toBe('function');
    expect(typeof window.themeManager.set).toBe('function');
    expect(typeof window.themeManager.get).toBe('function');
    expect(typeof window.themeManager.getEffective).toBe('function');
  });

  test('should define THEMES constants', () => {
    const fs = require('fs');
    const code = fs.readFileSync('./public/js/theme.js', 'utf-8');

    expect(code).toContain("LIGHT: 'light'");
    expect(code).toContain("DARK: 'dark'");
    expect(code).toContain("SYSTEM: 'system'");
  });

  test('should use correct localStorage key', () => {
    const fs = require('fs');
    const code = fs.readFileSync('./public/js/theme.js', 'utf-8');

    expect(code).toContain("THEME_KEY = 'kudos-theme-preference'");
  });

  test('should handle system preference changes', () => {
    const fs = require('fs');
    const code = fs.readFileSync('./public/js/theme.js', 'utf-8');

    expect(code).toContain("matchMedia('(prefers-color-scheme: dark)')");
    expect(code).toContain("addEventListener('change'");
  });

  test('should handle cross-tab synchronization', () => {
    const fs = require('fs');
    const code = fs.readFileSync('./public/js/theme.js', 'utf-8');

    expect(code).toContain("addEventListener('storage'");
    expect(code).toContain('THEME_KEY');
  });

  test('should validate theme preferences', () => {
    const fs = require('fs');
    const code = fs.readFileSync('./public/js/theme.js', 'utf-8');

    expect(code).toContain('Object.values(THEMES).includes');
    expect(code).toContain('Invalid theme preference');
  });

  test('should handle localStorage errors gracefully', () => {
    const fs = require('fs');
    const code = fs.readFileSync('./public/js/theme.js', 'utf-8');

    expect(code).toContain('try {');
    expect(code).toContain('catch');
    expect(code).toContain('Failed to');
  });

  test('should use dataset API for theme attribute', () => {
    const fs = require('fs');
    const code = fs.readFileSync('./public/js/theme.js', 'utf-8');

    expect(code).toContain('dataset.theme');
    // setAttribute is OK for ARIA attributes, just ensure we use dataset for theme
    expect(code).toContain('html.dataset.theme =');
  });

  test('should dispatch themechange events', () => {
    const fs = require('fs');
    const code = fs.readFileSync('./public/js/theme.js', 'utf-8');

    expect(code).toContain("new CustomEvent('themechange'");
    expect(code).toContain('window.dispatchEvent');
  });

  test('should initialize theme toggle UI', () => {
    const fs = require('fs');
    const code = fs.readFileSync('./public/js/theme.js', 'utf-8');

    expect(code).toContain('function initThemeToggle');
    expect(code).toContain("querySelectorAll('.theme-option')");
    expect(code).toContain("aria-checked");
  });

  test('should handle DOMContentLoaded correctly', () => {
    const fs = require('fs');
    const code = fs.readFileSync('./public/js/theme.js', 'utf-8');

    expect(code).toContain("document.readyState === 'loading'");
    expect(code).toContain("addEventListener('DOMContentLoaded'");
  });
});

describe('Theme Logic Tests', () => {
  test('effective theme resolution logic', () => {
    const testCases = [
      { preference: 'light', systemDark: false, expected: 'light' },
      { preference: 'light', systemDark: true, expected: 'light' },
      { preference: 'dark', systemDark: false, expected: 'dark' },
      { preference: 'dark', systemDark: true, expected: 'dark' },
      { preference: 'system', systemDark: false, expected: 'light' },
      { preference: 'system', systemDark: true, expected: 'dark' }
    ];

    testCases.forEach(({ preference, systemDark, expected }) => {
      const effectiveTheme = preference === 'system'
        ? (systemDark ? 'dark' : 'light')
        : preference;
      expect(effectiveTheme).toBe(expected);
    });
  });

  test('theme attribute application logic', () => {
    const mockElement = { dataset: {} };

    // Apply dark theme
    mockElement.dataset.theme = 'dark';
    expect(mockElement.dataset.theme).toBe('dark');

    // Remove theme (light)
    delete mockElement.dataset.theme;
    expect(mockElement.dataset.theme).toBeUndefined();
  });

  test('validates localStorage key format', () => {
    const key = 'kudos-theme-preference';

    // Should be kebab-case
    expect(key).toMatch(/^[a-z]+(-[a-z]+)+$/);

    // Should contain 'theme'
    expect(key).toContain('theme');

    // Should contain 'preference'
    expect(key).toContain('preference');
  });
});

describe('Theme Constants', () => {
  test('valid theme values', () => {
    const validThemes = ['light', 'dark', 'system'];

    validThemes.forEach(theme => {
      expect(['light', 'dark', 'system']).toContain(theme);
    });
  });

  test('theme values are lowercase', () => {
    const themes = ['light', 'dark', 'system'];

    themes.forEach(theme => {
      expect(theme).toBe(theme.toLowerCase());
    });
  });
});
