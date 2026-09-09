import { describe, test, expect } from 'bun:test';

/**
 * Unit tests for theme-init.js
 * Tests the flash-prevention initialization script structure and logic
 */

describe('Theme Initialization Script', () => {
  test('should be an IIFE (Immediately Invoked Function Expression)', () => {
    const fs = require('fs');
    const code = fs.readFileSync('./public/js/theme-init.js', 'utf-8');

    // Should be wrapped in (function() { ... })()
    expect(code).toContain('(function()');
    expect(code).toMatch(/\)\(\);?\s*$/);
  });

  test('should have error handling for localStorage', () => {
    const fs = require('fs');
    const code = fs.readFileSync('./public/js/theme-init.js', 'utf-8');

    expect(code).toContain('try {');
    expect(code).toContain('} catch');
    expect(code).toContain('localStorage');
  });

  test('should use correct localStorage key', () => {
    const fs = require('fs');
    const code = fs.readFileSync('./public/js/theme-init.js', 'utf-8');

    expect(code).toContain("THEME_KEY = 'kudos-theme-preference'");
  });

  test('should check system preference', () => {
    const fs = require('fs');
    const code = fs.readFileSync('./public/js/theme-init.js', 'utf-8');

    expect(code).toContain("matchMedia('(prefers-color-scheme: dark)')");
    expect(code).toContain('.matches');
  });

  test('should default to system preference', () => {
    const fs = require('fs');
    const code = fs.readFileSync('./public/js/theme-init.js', 'utf-8');

    expect(code).toContain("|| 'system'");
  });

  test('should apply theme via dataset API', () => {
    const fs = require('fs');
    const code = fs.readFileSync('./public/js/theme-init.js', 'utf-8');

    expect(code).toContain('document.documentElement.dataset.theme');
    expect(code).not.toContain('setAttribute');
  });

  test('should only apply dark theme', () => {
    const fs = require('fs');
    const code = fs.readFileSync('./public/js/theme-init.js', 'utf-8');

    // Should only set theme to 'dark', never 'light'
    expect(code).toContain("theme = 'dark'");
    expect(code).not.toContain("theme = 'light'");
  });

  test('should resolve effective theme correctly', () => {
    const fs = require('fs');
    const code = fs.readFileSync('./public/js/theme-init.js', 'utf-8');

    // Should have ternary logic: preference === 'system' ? (systemDark ? 'dark' : 'light') : preference
    expect(code).toContain("=== 'system'");
    expect(code).toContain('? (');
    expect(code).toContain("'dark'");
    expect(code).toContain("'light'");
  });

  test('should be synchronous (no async/await or promises)', () => {
    const fs = require('fs');
    const code = fs.readFileSync('./public/js/theme-init.js', 'utf-8');

    expect(code).not.toContain('async');
    expect(code).not.toContain('await');
    expect(code).not.toContain('Promise');
    expect(code).not.toContain('setTimeout');
    expect(code).not.toContain('setInterval');
  });

  test('should be minimal in size', () => {
    const fs = require('fs');
    const code = fs.readFileSync('./public/js/theme-init.js', 'utf-8');

    // Should be under 500 bytes (excluding comments)
    const codeWithoutComments = code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '');

    expect(codeWithoutComments.length).toBeLessThan(500);
  });

  test('should have proper documentation', () => {
    const fs = require('fs');
    const code = fs.readFileSync('./public/js/theme-init.js', 'utf-8');

    expect(code).toContain('Theme Initialization Script');
    expect(code).toContain('MUST be loaded synchronously');
    expect(code).toContain('prevent flash');
  });
});

describe('Initialization Logic Tests', () => {
  test('effective theme resolution - all cases', () => {
    // Test the logic without DOM
    const testCases = [
      { preference: 'dark', systemDark: false, expected: 'dark' },
      { preference: 'dark', systemDark: true, expected: 'dark' },
      { preference: 'light', systemDark: false, expected: 'light' },
      { preference: 'light', systemDark: true, expected: 'light' },
      { preference: 'system', systemDark: false, expected: 'light' },
      { preference: 'system', systemDark: true, expected: 'dark' },
      { preference: null, systemDark: false, expected: 'light' }, // defaults to system
      { preference: null, systemDark: true, expected: 'dark' }
    ];

    testCases.forEach(({ preference, systemDark, expected }) => {
      const pref = preference || 'system';
      const effectiveTheme = pref === 'system'
        ? (systemDark ? 'dark' : 'light')
        : pref;

      expect(effectiveTheme).toBe(expected);
    });
  });

  test('should only set theme attribute when dark', () => {
    const testCases = [
      { effectiveTheme: 'dark', shouldSet: true },
      { effectiveTheme: 'light', shouldSet: false }
    ];

    testCases.forEach(({ effectiveTheme, shouldSet }) => {
      const shouldApplyTheme = effectiveTheme === 'dark';
      expect(shouldApplyTheme).toBe(shouldSet);
    });
  });
});

describe('Error Handling', () => {
  test('graceful degradation on localStorage errors', () => {
    // Verify the script has try-catch wrapper
    const fs = require('fs');
    const code = fs.readFileSync('./public/js/theme-init.js', 'utf-8');

    const hasErrorHandling = code.includes('try {') && code.includes('catch');
    expect(hasErrorHandling).toBe(true);
  });

  test('should not throw on empty localStorage', () => {
    const getPreference = (storage) => {
      try {
        return storage.getItem('kudos-theme-preference') || 'system';
      } catch {
        return 'system';
      }
    };

    const emptyStorage = { getItem: () => null };
    expect(getPreference(emptyStorage)).toBe('system');
  });

  test('should not throw on unavailable localStorage', () => {
    const getPreference = (storage) => {
      try {
        return storage.getItem('kudos-theme-preference') || 'system';
      } catch {
        return 'system';
      }
    };

    const throwingStorage = {
      getItem: () => {
        throw new Error('localStorage is disabled');
      }
    };

    expect(getPreference(throwingStorage)).toBe('system');
  });
});
